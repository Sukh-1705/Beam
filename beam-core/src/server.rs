use crate::clipboard::ClipboardManager;
use crate::protocol::*;
use crate::remote_fs::RemoteFs;
use crate::storage::Storage;
use crate::transfer::TransferProgress;
use anyhow::Result;
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::broadcast;
use tracing::{error, info, warn};

#[derive(Debug, Clone)]
pub enum ServerEvent {
    ClientConnected(SocketAddr),
    PairRequested {
        sender: DeviceInfo,
        pin: String,
    },
    TransferStarted {
        transfer_id: uuid::Uuid,
        total_files: usize,
        total_bytes: u64,
    },
    TransferProgress(TransferProgress),
    TransferFinished {
        transfer_id: uuid::Uuid,
        success: bool,
    },
    ClipboardReceived(ClipboardPayload),
}

pub struct BeamServer {
    local_info: DeviceInfo,
    save_directory: PathBuf,
    storage: Storage,
    clipboard: ClipboardManager,
    remote_fs: RemoteFs,
    current_pin: Arc<std::sync::Mutex<String>>,
    event_tx: broadcast::Sender<ServerEvent>,
}

impl BeamServer {
    pub fn new<P: AsRef<Path>>(
        local_info: DeviceInfo,
        save_directory: P,
        storage: Storage,
        clipboard: ClipboardManager,
    ) -> (Self, broadcast::Receiver<ServerEvent>) {
        let (event_tx, rx) = broadcast::channel(128);
        let save_buf = save_directory.as_ref().to_path_buf();
        let remote_fs = RemoteFs::new(&save_buf);

        let server = Self {
            local_info,
            save_directory: save_buf,
            storage,
            clipboard,
            remote_fs,
            current_pin: Arc::new(std::sync::Mutex::new(format!("{:06}", rand_pin()))),
            event_tx,
        };

        (server, rx)
    }

    pub fn get_pin(&self) -> String {
        self.current_pin.lock().unwrap().clone()
    }

    pub fn refresh_pin(&self) -> String {
        let new_pin = format!("{:06}", rand_pin());
        let mut lock = self.current_pin.lock().unwrap();
        *lock = new_pin.clone();
        new_pin
    }

    pub async fn run(self: Arc<Self>, bind_addr: &str) -> Result<()> {
        let listener = TcpListener::bind(bind_addr).await?;
        info!("Beam server listening on {}", bind_addr);

        loop {
            match listener.accept().await {
                Ok((stream, addr)) => {
                    let server_clone = Arc::clone(&self);
                    tokio::spawn(async move {
                        if let Err(e) = server_clone.handle_connection(stream, addr).await {
                            warn!("Connection error from {}: {}", addr, e);
                        }
                    });
                }
                Err(e) => {
                    error!("TCP Accept error: {}", e);
                }
            }
        }
    }

    async fn handle_connection(&self, mut stream: TcpStream, addr: SocketAddr) -> Result<()> {
        let _ = self.event_tx.send(ServerEvent::ClientConnected(addr));

        // Read initial packet
        let initial_pkt = read_packet(&mut stream).await?;
        match initial_pkt {
            Packet::Hello(_peer_info) => {
                // Respond with our Hello
                write_packet(&mut stream, &Packet::Hello(self.local_info.clone())).await?;
            }
            Packet::PairRequest(pair_req) => {
                let pin = self.current_pin.lock().unwrap().clone();
                let is_trusted = self.storage.is_device_trusted(&pair_req.sender.id)?;
                let pin_matched = pair_req.pin_or_token == pin;

                if is_trusted || pin_matched {
                    let token = uuid::Uuid::new_v4().to_string();
                    let dev = crate::storage::TrustedDevice {
                        id: pair_req.sender.id.clone(),
                        name: pair_req.sender.name.clone(),
                        device_type: pair_req.sender.device_type.to_string(),
                        paired_at: chrono::Utc::now().timestamp(),
                        session_token: token.clone(),
                        auto_accept: true,
                    };
                    self.storage.save_trusted_device(&dev)?;

                    write_packet(
                        &mut stream,
                        &Packet::PairResponse(PairResponse {
                            accepted: true,
                            session_token: token,
                            reason: None,
                        }),
                    )
                    .await?;
                } else {
                    write_packet(
                        &mut stream,
                        &Packet::PairResponse(PairResponse {
                            accepted: false,
                            session_token: String::new(),
                            reason: Some("PIN does not match".to_string()),
                        }),
                    )
                    .await?;
                }
                return Ok(());
            }
            Packet::RemoteFsReq(req) => {
                let resp = self.remote_fs.list(&req.path);
                write_packet(&mut stream, &Packet::RemoteFsResp(resp)).await?;
                return Ok(());
            }
            Packet::Clipboard(clip) => {
                self.clipboard.set_text(&String::from_utf8_lossy(&clip.data));
                let _ = self.event_tx.send(ServerEvent::ClipboardReceived(clip));
                return Ok(());
            }
            Packet::Manifest(manifest) => {
                let transfer_id = manifest.transfer_id;
                let _ = self.event_tx.send(ServerEvent::TransferStarted {
                    transfer_id,
                    total_files: manifest.files.len(),
                    total_bytes: manifest.total_bytes,
                });

                // Process manifest directly
                let total_bytes = manifest.total_bytes;
                let total_files = manifest.files.len();

                let mut writers = std::collections::HashMap::new();
                for (idx, file_meta) in manifest.files.iter().enumerate() {
                    let target_path = self.save_directory.join(&file_meta.relative_path);
                    let writer = crate::chunking::ChunkFileWriter::new(
                        target_path,
                        file_meta.size,
                        file_meta.chunk_size,
                        file_meta.blake3_hash.clone(),
                        file_meta.mtime_secs,
                    )?;
                    writers.insert(idx, writer);
                }

                let ack = ManifestAck {
                    transfer_id,
                    accepted: true,
                    existing_chunks: std::collections::HashMap::new(),
                    reject_reason: None,
                };
                write_packet(&mut stream, &Packet::ManifestAck(ack)).await?;

                let start_time = std::time::Instant::now();
                let mut bytes_recv = 0u64;

                for (f_idx, file_meta) in manifest.files.iter().enumerate() {
                    let writer = writers.get_mut(&f_idx).unwrap();
                    if file_meta.size == 0 {
                        writer.finalize()?;
                        write_packet(
                            &mut stream,
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
                        let h_pkt = read_packet(&mut stream).await?;
                        let header = match h_pkt {
                            Packet::ChunkHeader(h) => h,
                            _ => return Err(anyhow::anyhow!("Expected ChunkHeader")),
                        };

                        use tokio::io::AsyncReadExt;
                        let mut payload = vec![0u8; header.length as usize];
                        stream.read_exact(&mut payload).await?;

                        writer.write_chunk(&header, &payload)?;
                        write_packet(
                            &mut stream,
                            &Packet::ChunkAck(ChunkAck {
                                transfer_id,
                                file_index: f_idx,
                                chunk_index: header.chunk_index,
                                valid: true,
                                error_msg: None,
                            }),
                        )
                        .await?;

                        bytes_recv += header.length as u64;
                        let p = TransferProgress {
                            transfer_id,
                            current_file: file_meta.relative_path.clone(),
                            file_index: f_idx,
                            total_files,
                            bytes_transferred: bytes_recv,
                            total_bytes,
                            current_mbps: 0.0,
                            percent: (bytes_recv as f32 / total_bytes as f32) * 100.0,
                            status: "transferring".to_string(),
                            verified_identical: false,
                        };
                        let _ = self.event_tx.send(ServerEvent::TransferProgress(p));
                    }

                    let verified = writer.finalize()?;
                    write_packet(
                        &mut stream,
                        &Packet::FileVerified(FileVerified {
                            transfer_id,
                            file_index: f_idx,
                            final_hash: file_meta.blake3_hash.clone(),
                            verified_identical: verified,
                        }),
                    )
                    .await?;

                    // Record in SQLite transfer history
                    let hist = crate::storage::HistoryRecord {
                        id: 0,
                        transfer_id: transfer_id.to_string(),
                        filename: file_meta.relative_path.clone(),
                        file_size: file_meta.size,
                        sender_name: manifest.sender.name.clone(),
                        receiver_name: self.local_info.name.clone(),
                        direction: "incoming".to_string(),
                        status: if verified { "verified".to_string() } else { "failed".to_string() },
                        blake3_hash: file_meta.blake3_hash.clone(),
                        duration_ms: start_time.elapsed().as_millis() as u64,
                        created_at: chrono::Utc::now().timestamp(),
                    };
                    let _ = self.storage.add_history(&hist);
                }

                let done = TransferDone {
                    transfer_id,
                    all_verified: true,
                    elapsed_millis: start_time.elapsed().as_millis() as u64,
                    average_mbps: 0.0,
                };
                write_packet(&mut stream, &Packet::TransferDone(done)).await?;
                let _ = self.event_tx.send(ServerEvent::TransferFinished {
                    transfer_id,
                    success: true,
                });
                return Ok(());
            }
            _ => {}
        }

        Ok(())
    }
}

fn rand_pin() -> u32 {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    ((now % 900000) + 100000) as u32
}
