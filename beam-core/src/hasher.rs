use std::fs::File;
use std::io::{self, BufReader, Read};
use std::path::Path;

pub struct FileHasher;

impl FileHasher {
    /// Compute the BLAKE3 hash of an in-memory slice of bytes
    pub fn hash_bytes(data: &[u8]) -> String {
        let hash = blake3::hash(data);
        hash.to_hex().to_string()
    }

    /// Stream a file from disk with a fixed 64KB buffer and compute its BLAKE3 hash.
    /// Memory usage is strictly O(1) regardless of whether the file is 1 byte or 100GB+.
    pub fn hash_file<P: AsRef<Path>>(path: P) -> io::Result<String> {
        let file = File::open(path)?;
        let mut reader = BufReader::with_capacity(64 * 1024, file);
        let mut hasher = blake3::Hasher::new();

        let mut buffer = [0u8; 64 * 1024];
        loop {
            let bytes_read = reader.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }

        let hash = hasher.finalize();
        Ok(hash.to_hex().to_string())
    }

    /// Verify whether a file's disk contents match the expected BLAKE3 hash byte-for-byte.
    pub fn verify_file<P: AsRef<Path>>(path: P, expected_hex: &str) -> io::Result<bool> {
        let calculated = Self::hash_file(path)?;
        Ok(calculated.eq_ignore_ascii_case(expected_hex))
    }

    /// Compute SHA-256 fallback hash for compatibility if requested
    pub fn hash_file_sha256<P: AsRef<Path>>(path: P) -> io::Result<String> {
        use sha2::{Digest, Sha256};
        let file = File::open(path)?;
        let mut reader = BufReader::with_capacity(64 * 1024, file);
        let mut hasher = Sha256::new();

        let mut buffer = [0u8; 64 * 1024];
        loop {
            let bytes_read = reader.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }

        let result = hasher.finalize();
        Ok(hex::encode(result))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_hash_bytes() {
        let data = b"Hello Beam Lossless Transfer!";
        let hash = FileHasher::hash_bytes(data);
        assert_eq!(hash.len(), 64); // 256 bits = 64 hex chars
    }

    #[test]
    fn test_hash_and_verify_file() {
        let mut tmp = NamedTempFile::new().unwrap();
        let payload = b"Test payload for disk stream BLAKE3 verification with zero RAM overflow";
        tmp.write_all(payload).unwrap();
        tmp.flush().unwrap();

        let hash = FileHasher::hash_file(tmp.path()).unwrap();
        let verified = FileHasher::verify_file(tmp.path(), &hash).unwrap();
        assert!(verified);

        let corrupt_verified = FileHasher::verify_file(tmp.path(), "0000000000000000000000000000000000000000000000000000000000000000").unwrap();
        assert!(!corrupt_verified);
    }
}
