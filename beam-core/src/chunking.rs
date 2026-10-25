use crate::hasher::FileHasher;
use crate::protocol::{ChunkHeader, FileMeta};
use std::collections::HashSet;
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use uuid::Uuid;

pub struct FileChunker;

impl FileChunker {
    /// Calculate total chunks required for a given file size
    pub fn calculate_chunk_count(size: u64, chunk_size: usize) -> u32 {
        if size == 0 {
            return 0;
        }
        let cs = chunk_size as u64;
        ((size + cs - 1) / cs) as u32
    }

    /// Read a single chunk from a file by chunk index
    pub fn read_chunk<P: AsRef<Path>>(
        path: P,
        transfer_id: Uuid,
        file_index: usize,
        chunk_index: u32,
        chunk_size: usize,
        total_size: u64,
    ) -> io::Result<(ChunkHeader, Vec<u8>)> {
        let offset = (chunk_index as u64) * (chunk_size as u64);
        if offset >= total_size && total_size > 0 {
            return Err(io::Error::new(
                io::ErrorKind::UnexpectedEof,
                format!("Offset {} exceeds total file size {}", offset, total_size),
            ));
        }

        let mut file = File::open(path)?;
        file.seek(SeekFrom::Start(offset))?;

        let bytes_to_read = if total_size == 0 {
            0
        } else {
            let remaining = total_size - offset;
            (remaining.min(chunk_size as u64)) as usize
        };

        let mut buffer = vec![0u8; bytes_to_read];
        if bytes_to_read > 0 {
            file.read_exact(&mut buffer)?;
        }

        let chunk_blake3 = FileHasher::hash_bytes(&buffer);

        let header = ChunkHeader {
            transfer_id,
            file_index,
            chunk_index,
            offset,
            length: bytes_to_read as u32,
            chunk_blake3,
        };

        Ok((header, buffer))
    }

    /// Inspect a file and build its FileMeta including total BLAKE3 hash
    pub fn inspect_file<P: AsRef<Path>>(
        full_path: P,
        relative_path: String,
        file_index: usize,
        chunk_size: usize,
    ) -> io::Result<FileMeta> {
        let meta = std::fs::metadata(&full_path)?;
        let size = meta.len();
        let mtime_secs = meta
            .modified()?
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        let blake3_hash = FileHasher::hash_file(&full_path)?;
        let chunk_count = Self::calculate_chunk_count(size, chunk_size);

        Ok(FileMeta {
            file_index,
            relative_path,
            size,
            mtime_secs,
            blake3_hash,
            chunk_size,
            chunk_count,
        })
    }
}

pub struct ChunkFileWriter {
    pub target_path: PathBuf,
    pub temp_path: PathBuf,
    pub total_size: u64,
    pub chunk_size: usize,
    pub total_chunks: u32,
    pub received_chunks: HashSet<u32>,
    pub expected_blake3: String,
    pub mtime_secs: i64,
}

impl ChunkFileWriter {
    pub fn new<P: AsRef<Path>>(
        target_path: P,
        total_size: u64,
        chunk_size: usize,
        expected_blake3: String,
        mtime_secs: i64,
    ) -> io::Result<Self> {
        let target_buf = target_path.as_ref().to_path_buf();
        if let Some(parent) = target_buf.parent() {
            std::fs::create_dir_all(parent)?;
        }

        // Temporary file holds chunks until final BLAKE3 verification
        let file_name = target_buf.file_name().unwrap_or_default().to_string_lossy();
        let temp_name = format!(".{}.beam_part", file_name);
        let temp_path = target_buf.with_file_name(temp_name);

        let total_chunks = FileChunker::calculate_chunk_count(total_size, chunk_size);

        // Pre-allocate or create the file
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(&temp_path)?;

        if total_size > 0 {
            file.set_len(total_size)?;
        }

        Ok(Self {
            target_path: target_buf,
            temp_path,
            total_size,
            chunk_size,
            total_chunks,
            received_chunks: HashSet::new(),
            expected_blake3,
            mtime_secs,
        })
    }

    /// Write a verified chunk to disk at its designated offset
    pub fn write_chunk(&mut self, header: &ChunkHeader, payload: &[u8]) -> io::Result<bool> {
        // First verify chunk payload hash matches header
        let calculated_hash = FileHasher::hash_bytes(payload);
        if !calculated_hash.eq_ignore_ascii_case(&header.chunk_blake3) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!(
                    "Chunk {} hash mismatch. Expected {}, got {}",
                    header.chunk_index, header.chunk_blake3, calculated_hash
                ),
            ));
        }

        // Write directly at file offset
        let mut file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(&self.temp_path)?;
        file.seek(SeekFrom::Start(header.offset))?;
        file.write_all(payload)?;
        file.flush()?;

        self.received_chunks.insert(header.chunk_index);
        Ok(true)
    }

    /// Check if all chunks have been received
    pub fn is_complete(&self) -> bool {
        if self.total_size == 0 {
            return true;
        }
        self.received_chunks.len() as u32 >= self.total_chunks
    }

    /// Return list of missing chunk indexes for resuming
    pub fn missing_chunks(&self) -> Vec<u32> {
        let mut missing = Vec::new();
        for i in 0..self.total_chunks {
            if !self.received_chunks.contains(&i) {
                missing.push(i);
            }
        }
        missing
    }

    /// Verify final file on disk and atomically rename from .part to final destination.
    /// Also restores original timestamp byte-for-byte.
    pub fn finalize(&self) -> io::Result<bool> {
        // If 0-byte file, just create target directly
        if self.total_size == 0 {
            File::create(&self.target_path)?;
            if self.temp_path.exists() {
                let _ = std::fs::remove_file(&self.temp_path);
            }
            return Ok(true);
        }

        // Compute whole file BLAKE3 from disk
        let disk_hash = FileHasher::hash_file(&self.temp_path)?;
        if !disk_hash.eq_ignore_ascii_case(&self.expected_blake3) {
            return Ok(false);
        }

        // Atomically move/rename
        if self.target_path.exists() {
            let _ = std::fs::remove_file(&self.target_path);
        }
        std::fs::rename(&self.temp_path, &self.target_path)?;

        // Restore original modification time
        if self.mtime_secs > 0 {
            let ft = filetime::FileTime::from_unix_time(self.mtime_secs, 0);
            let _ = filetime::set_file_mtime(&self.target_path, ft);
        }

        Ok(true)
    }
}
