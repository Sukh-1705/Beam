use crate::chunking::{ChunkFileWriter, FileChunker};
use crate::protocol::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tokio::io::{AsyncRead, AsyncWrite};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferProgress {
    pub transfer_id: Uuid,
    pub current_file: String,
    pub file_index: usize,
    pub total_files: usize,
    pub bytes_transferred: u64,
    pub total_bytes: u64,
    pub current_mbps: f64,
    pub percent: f32,
    pub status: String,
    pub verified_identical: bool,
}

pub struct TransferEngine;

impl TransferEngine {
    /// Send files to a remote peer over an open streaming connection
    pub async fn send_manifest_and_files<S>(
        stream: &mut S,
        manifest: TransferManifest,
        base_paths: HashMap<usize, PathBuf>,
        progress_cb: Arc<dyn Fn(TransferProgress) + Send + Sync>,
        cancel_flag: Arc<AtomicBool>,
    ) -> Result<TransferDone, anyhow::Error>
    where
        S: AsyncRead + AsyncWrite + Unpin,
    {
        let transfer_id = manifest.transfer_id;
        let total_bytes = manifest.total_bytes;
        let total_files = manifest.files.len();

        // 1. Send Manifest
        write_packet(stream, &Packet::Manifest(manifest.clone())).await?;

        // 2. Await ManifestAck
        let ack_packet = read_packet(stream).await?;
        let ack = match ack_packet {
            Packet::ManifestAck(ack) => {
                if !ack.accepted {
                    return Err(anyhow::anyhow!(
                        "Transfer rejected by recipient: {}",
                        ack.reject_reason.unwrap_or_else(|| "Unknown".to_string())
                    ));
                }
                ack
            }
            _ => return Err(anyhow::anyhow!("Expected ManifestAck, got unexpected packet")),
        };

        let _start_time = Instant::now();
        let mut bytes_sent: u64 = 0;
        let mut last_speed_calc = Instant::now();
        let mut last_bytes = 0u64;
        let mut current_mbps = 0.0;

        // 3. Send Chunks for each file
        for (f_idx, file_meta) in manifest.files.iter().enumerate() {
            if cancel_flag.load(Ordering::Relaxed) {
                return Err(anyhow::anyhow!("Transfer cancelled by user"));
            }

            let file_path = base_paths
                .get(&f_idx)
                .ok_or_else(|| anyhow::anyhow!("Local path for file {} not found", f_idx))?;

            let already_completed: std::collections::HashSet<u32> = ack
                .existing_chunks
                .get(&f_idx)
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .collect();

            // Account for already completed chunks in progress
            for chunk_idx in &already_completed {
                let offset = (*chunk_idx as u64) * (file_meta.chunk_size as u64);
                let remaining = file_meta.size.saturating_sub(offset);
                let c_size = (file_meta.chunk_size as u64).min(remaining);
                bytes_sent += c_size;
            }

            for chunk_idx in 0..file_meta.chunk_count {
                if cancel_flag.load(Ordering::Relaxed) {
                    return Err(anyhow::anyhow!("Transfer cancelled by user"));
                }

                // Skip if receiver already has this chunk (zero-redundancy resume!)
                if already_completed.contains(&chunk_idx) {
                    continue;
                }

                let (header, payload) = FileChunker::read_chunk(
                    file_path,
                    transfer_id,
                    f_idx,
                    chunk_idx,
                    file_meta.chunk_size,
                    file_meta.size,
                )?;

                let payload_len = payload.len() as u64;

                // Send ChunkHeader packet
                write_packet(stream, &Packet::ChunkHeader(header)).await?;

                // Send raw payload bytes immediately following
                use tokio::io::AsyncWriteExt;
                stream.write_all(&payload).await?;
                stream.flush().await?;

                // Await ChunkAck
                let ack_pkt = read_packet(stream).await?;
                match ack_pkt {
                    Packet::ChunkAck(c_ack) => {
                        if !c_ack.valid {
                            return Err(anyhow::anyhow!(
                                "Receiver rejected chunk {}: {:?}",
                                chunk_idx,
                                c_ack.error_msg
                            ));
                        }
                    }
                    _ => return Err(anyhow::anyhow!("Expected ChunkAck")),
                }

                bytes_sent += payload_len;

                // Update speed calculation every 250ms
                let elapsed_speed = last_speed_calc.elapsed().as_secs_f64();
                if elapsed_speed >= 0.25 {
                    let delta_bytes = bytes_sent - last_bytes;
                    current_mbps = (delta_bytes as f64 * 8.0) / (elapsed_speed * 1_000_000.0);
                    last_bytes = bytes_sent;
                    last_speed_calc = Instant::now();
                }

                let percent = if total_bytes > 0 {
                    (bytes_sent as f32 / total_bytes as f32) * 100.0
                } else {
                    100.0
                };

                progress_cb(TransferProgress {
                    transfer_id,
                    current_file: file_meta.relative_path.clone(),
                    file_index: f_idx,
                    total_files,
                    bytes_transferred: bytes_sent,
                    total_bytes,
                    current_mbps,
                    percent,
                    status: "transferring".to_string(),
                    verified_identical: false,
                });
            }

            // Await FileVerified packet from receiver
            let verify_pkt = read_packet(stream).await?;
            match verify_pkt {
                Packet::FileVerified(v) => {
                    if !v.verified_identical {
                        return Err(anyhow::anyhow!(
                            "File {} failed BLAKE3 verification! Possible data corruption on wire",
                            file_meta.relative_path
                        ));
                    }
                }
                _ => return Err(anyhow::anyhow!("Expected FileVerified")),
            }
        }

        // Await final TransferDone
        let done_pkt = read_packet(stream).await?;
        let done = match done_pkt {
            Packet::TransferDone(d) => d,
            _ => return Err(anyhow::anyhow!("Expected TransferDone")),
        };

        progress_cb(TransferProgress {
            transfer_id,
            current_file: "Completed".to_string(),
            file_index: total_files,
            total_files,
            bytes_transferred: total_bytes,
            total_bytes,
            current_mbps: done.average_mbps,
            percent: 100.0,
            status: "completed".to_string(),
            verified_identical: done.all_verified,
        });

        Ok(done)
    }

    /// Receive files over an incoming connection
    pub async fn receive_manifest_and_files<S>(
        stream: &mut S,
        destination_root: &Path,
        progress_cb: Arc<dyn Fn(TransferProgress) + Send + Sync>,
        cancel_flag: Arc<AtomicBool>,
    ) -> Result<TransferDone, anyhow::Error>
    where
        S: AsyncRead + AsyncWrite + Unpin,
    {
        // 1. Read Manifest
        let pkt = read_packet(stream).await?;
        let manifest = match pkt {
            Packet::Manifest(m) => m,
            _ => return Err(anyhow::anyhow!("Expected Manifest packet")),
        };

        let transfer_id = manifest.transfer_id;
        let total_bytes = manifest.total_bytes;
        let total_files = manifest.files.len();

        let mut writers: HashMap<usize, ChunkFileWriter> = HashMap::new();
        let mut existing_chunks: HashMap<usize, Vec<u32>> = HashMap::new();

        // 2. Prepare destination files & check for resumable chunks
        for (idx, file_meta) in manifest.files.iter().enumerate() {
            let target_path = destination_root.join(&file_meta.relative_path);
            let writer = ChunkFileWriter::new(
                target_path,
                file_meta.size,
                file_meta.chunk_size,
                file_meta.blake3_hash.clone(),
                file_meta.mtime_secs,
            )?;
            writers.insert(idx, writer);
            existing_chunks.insert(idx, Vec::new());
        }

        // 3. Send ManifestAck
        let ack = ManifestAck {
            transfer_id,
            accepted: true,
            existing_chunks,
            reject_reason: None,
        };
        write_packet(stream, &Packet::ManifestAck(ack)).await?;

        let start_time = Instant::now();
        let mut bytes_received = 0u64;
        let mut last_speed_calc = Instant::now();
        let mut last_bytes = 0u64;
        let mut current_mbps = 0.0;

        // 4. Receive chunks for all files
        for (f_idx, file_meta) in manifest.files.iter().enumerate() {
            let writer = writers
                .get_mut(&f_idx)
                .ok_or_else(|| anyhow::anyhow!("Writer for file {} not found", f_idx))?;

            // If 0-byte file, finalize immediately
            if file_meta.size == 0 {
                writer.finalize()?;
                write_packet(
                    stream,
                    &Packet::FileVerified(FileVerified {
                        transfer_id,
                        file_index: f_idx,
                        final_hash: file_meta.blake3_hash.clone(),
                        verified_identical: true,
                    }),
                )
                .await?;
                continue;
            }

            for _ in 0..file_meta.chunk_count {
                if cancel_flag.load(Ordering::Relaxed) {
                    return Err(anyhow::anyhow!("Transfer cancelled by user"));
                }

                // Read ChunkHeader
                let header_pkt = read_packet(stream).await?;
                let header = match header_pkt {
                    Packet::ChunkHeader(h) => h,
                    _ => return Err(anyhow::anyhow!("Expected ChunkHeader")),
                };

                // Read exact chunk payload bytes
                use tokio::io::AsyncReadExt;
                let mut payload = vec![0u8; header.length as usize];
                stream.read_exact(&mut payload).await?;

                // Write chunk to disk and verify chunk BLAKE3
                let write_res = writer.write_chunk(&header, &payload);
                match write_res {
                    Ok(_) => {
                        write_packet(
                            stream,
                            &Packet::ChunkAck(ChunkAck {
                                transfer_id,
                                file_index: f_idx,
                                chunk_index: header.chunk_index,
                                valid: true,
                                error_msg: None,
                            }),
                        )
                        .await?;
                    }
                    Err(e) => {
                        write_packet(
                            stream,
                            &Packet::ChunkAck(ChunkAck {
                                transfer_id,
                                file_index: f_idx,
                                chunk_index: header.chunk_index,
                                valid: false,
                                error_msg: Some(e.to_string()),
                            }),
                        )
                        .await?;
                        return Err(anyhow::anyhow!("Chunk hash verification failed: {}", e));
                    }
                }

                bytes_received += header.length as u64;

                let elapsed_speed = last_speed_calc.elapsed().as_secs_f64();
                if elapsed_speed >= 0.25 {
                    let delta_bytes = bytes_received - last_bytes;
                    current_mbps = (delta_bytes as f64 * 8.0) / (elapsed_speed * 1_000_000.0);
                    last_bytes = bytes_received;
                    last_speed_calc = Instant::now();
                }

                let percent = if total_bytes > 0 {
                    (bytes_received as f32 / total_bytes as f32) * 100.0
                } else {
                    100.0
                };

                progress_cb(TransferProgress {
                    transfer_id,
                    current_file: file_meta.relative_path.clone(),
                    file_index: f_idx,
                    total_files,
                    bytes_transferred: bytes_received,
                    total_bytes,
                    current_mbps,
                    percent,
                    status: "transferring".to_string(),
                    verified_identical: false,
                });
            }

            // Finalize file and perform whole-file BLAKE3 verification
            let verified = writer.finalize()?;
            if !verified {
                write_packet(
                    stream,
                    &Packet::FileVerified(FileVerified {
                        transfer_id,
                        file_index: f_idx,
                        final_hash: String::new(),
                        verified_identical: false,
                    }),
                )
                .await?;
                return Err(anyhow::anyhow!(
                    "Whole-file verification failed for {}",
                    file_meta.relative_path
                ));
            }

            write_packet(
                stream,
                &Packet::FileVerified(FileVerified {
                    transfer_id,
                    file_index: f_idx,
                    final_hash: file_meta.blake3_hash.clone(),
                    verified_identical: true,
                }),
            )
            .await?;
        }

        let total_elapsed = start_time.elapsed().as_millis() as u64;
        let avg_mbps = if total_elapsed > 0 {
            (total_bytes as f64 * 8.0) / (total_elapsed as f64 / 1000.0 * 1_000_000.0)
        } else {
            0.0
        };

        let done = TransferDone {
            transfer_id,
            all_verified: true,
            elapsed_millis: total_elapsed,
            average_mbps: avg_mbps,
        };

        write_packet(stream, &Packet::TransferDone(done.clone())).await?;

        progress_cb(TransferProgress {
            transfer_id,
            current_file: "Completed".to_string(),
            file_index: total_files,
            total_files,
            bytes_transferred: total_bytes,
            total_bytes,
            current_mbps: avg_mbps,
            percent: 100.0,
            status: "completed".to_string(),
            verified_identical: true,
        });

        Ok(done)
    }
}
