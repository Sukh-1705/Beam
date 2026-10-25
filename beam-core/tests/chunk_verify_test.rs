use beam_core::chunking::{ChunkFileWriter, FileChunker};
use std::fs::File;
use std::io::Write;
use tempfile::tempdir;
use uuid::Uuid;

#[test]
fn test_zero_byte_file_integrity() {
    let dir = tempdir().unwrap();
    let src_path = dir.path().join("empty.txt");
    File::create(&src_path).unwrap();

    let meta = FileChunker::inspect_file(&src_path, "empty.txt".to_string(), 0, 1024).unwrap();
    assert_eq!(meta.size, 0);
    assert_eq!(meta.chunk_count, 0);

    let dst_path = dir.path().join("empty_received.txt");
    let writer = ChunkFileWriter::new(
        &dst_path,
        meta.size,
        meta.chunk_size,
        meta.blake3_hash.clone(),
        meta.mtime_secs,
    )
    .unwrap();

    assert!(writer.is_complete());
    let finalized = writer.finalize().unwrap();
    assert!(finalized);
    assert!(dst_path.exists());
    assert_eq!(dst_path.metadata().unwrap().len(), 0);
}

#[test]
fn test_multichunk_streaming_and_verification() {
    let dir = tempdir().unwrap();
    let src_path = dir.path().join("large_file.bin");

    // Generate 5MB of structured deterministic data
    let mut data = Vec::with_capacity(5 * 1024 * 1024);
    for i in 0..data.capacity() {
        data.push((i % 251) as u8);
    }
    {
        let mut f = File::create(&src_path).unwrap();
        f.write_all(&data).unwrap();
    }

    let chunk_size = 512 * 1024; // 512 KB chunks -> 10 chunks total
    let meta =
        FileChunker::inspect_file(&src_path, "large_file.bin".to_string(), 0, chunk_size).unwrap();
    assert_eq!(meta.size, 5 * 1024 * 1024);
    assert_eq!(meta.chunk_count, 10);

    let dst_path = dir.path().join("large_file_dest.bin");
    let mut writer = ChunkFileWriter::new(
        &dst_path,
        meta.size,
        meta.chunk_size,
        meta.blake3_hash.clone(),
        meta.mtime_secs,
    )
    .unwrap();

    let transfer_id = Uuid::new_v4();

    // Stream chunks one by one
    for c_idx in 0..meta.chunk_count {
        let (header, payload) = FileChunker::read_chunk(
            &src_path,
            transfer_id,
            0,
            c_idx,
            chunk_size,
            meta.size,
        )
        .unwrap();

        assert_eq!(header.chunk_index, c_idx);
        writer.write_chunk(&header, &payload).unwrap();
    }

    assert!(writer.is_complete());
    let verified = writer.finalize().unwrap();
    assert!(verified, "File must pass whole-file BLAKE3 verification");

    // Assert byte-for-byte identical
    let written_bytes = std::fs::read(&dst_path).unwrap();
    assert_eq!(written_bytes, data);
}

#[test]
fn test_corrupt_chunk_rejection() {
    let dir = tempdir().unwrap();
    let src_path = dir.path().join("test_corrupt.dat");
    let payload = b"Original pristine data for chunk corruption test";
    {
        let mut f = File::create(&src_path).unwrap();
        f.write_all(payload).unwrap();
    }

    let meta =
        FileChunker::inspect_file(&src_path, "test_corrupt.dat".to_string(), 0, 1024).unwrap();
    let dst_path = dir.path().join("test_corrupt_dest.dat");
    let mut writer = ChunkFileWriter::new(
        &dst_path,
        meta.size,
        meta.chunk_size,
        meta.blake3_hash.clone(),
        meta.mtime_secs,
    )
    .unwrap();

    let (header, mut chunk_data) = FileChunker::read_chunk(
        &src_path,
        Uuid::new_v4(),
        0,
        0,
        meta.chunk_size,
        meta.size,
    )
    .unwrap();

    // Simulate wire corruption (flip one byte)
    chunk_data[4] ^= 0xFF;

    let write_res = writer.write_chunk(&header, &chunk_data);
    assert!(
        write_res.is_err(),
        "Writer must reject chunk when payload does not match BLAKE3 hash"
    );
    assert_eq!(writer.received_chunks.len(), 0);
}
