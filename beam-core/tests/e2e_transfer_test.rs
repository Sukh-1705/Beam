use beam_core::client::BeamClient;
use beam_core::hasher::FileHasher;
use beam_core::protocol::{DeviceInfo, DeviceType};
use beam_core::server::BeamServer;
use beam_core::storage::Storage;
use beam_core::transfer::TransferProgress;
use beam_core::ClipboardManager;
use std::fs::File;
use std::io::Write;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tempfile::tempdir;

#[tokio::test]
async fn test_end_to_end_file_transfer() {
    let src_dir = tempdir().unwrap();
    let dst_dir = tempdir().unwrap();

    // Create 3 diverse files to test:
    // 1. Text file with metadata
    let file1_path = src_dir.path().join("document.txt");
    {
        let mut f = File::create(&file1_path).unwrap();
        f.write_all(b"Lossless document content from Beam client\n").unwrap();
    }

    // 2. Binary multi-chunk file (3 MB)
    let file2_path = src_dir.path().join("photo_raw.dng");
    let mut raw_data = vec![0u8; 3 * 1024 * 1024];
    for (i, b) in raw_data.iter_mut().enumerate() {
        *b = (i % 255) as u8;
    }
    {
        let mut f = File::create(&file2_path).unwrap();
        f.write_all(&raw_data).unwrap();
    }

    // 3. 0-byte file
    let file3_path = src_dir.path().join("empty.log");
    File::create(&file3_path).unwrap();

    // Record original hashes
    let hash1 = FileHasher::hash_file(&file1_path).unwrap();
    let hash2 = FileHasher::hash_file(&file2_path).unwrap();
    let hash3 = FileHasher::hash_file(&file3_path).unwrap();

    // Setup Server
    let server_db = dst_dir.path().join("server.db");
    let server_storage = Storage::init(&server_db).unwrap();
    let clipboard = ClipboardManager::new();

    let server_info = DeviceInfo {
        id: "server-pc-1".to_string(),
        name: "Desktop PC".to_string(),
        device_type: DeviceType::Desktop,
        os: "windows".to_string(),
        addresses: vec!["127.0.0.1".to_string()],
        port: 53320,
        public_fingerprint: String::new(),
    };

    let (server, _rx) = BeamServer::new(
        server_info.clone(),
        dst_dir.path(),
        server_storage,
        clipboard,
    );
    let server_pin = server.get_pin();
    let arc_server = Arc::new(server);

    // Spawn server in background
    tokio::spawn(async move {
        let _ = arc_server.run("127.0.0.1:53320").await;
    });

    // Brief yield to ensure socket is listening
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;

    // Setup Client
    let client_info = DeviceInfo {
        id: "client-phone-1".to_string(),
        name: "Pixel 9 Pro".to_string(),
        device_type: DeviceType::Android,
        os: "android".to_string(),
        addresses: vec!["127.0.0.1".to_string()],
        port: 53321,
        public_fingerprint: String::new(),
    };

    let server_addr: SocketAddr = "127.0.0.1:53320".parse().unwrap();

    // 1. Pair with Server
    let pair_resp = BeamClient::pair(server_addr, &client_info, &server_pin)
        .await
        .expect("Pairing failed");
    assert!(pair_resp.accepted, "PIN pairing must succeed");

    // 2. Transfer all 3 files
    let progress_history = Arc::new(std::sync::Mutex::new(Vec::new()));
    let progress_cb = {
        let h = progress_history.clone();
        Arc::new(move |p: TransferProgress| {
            h.lock().unwrap().push(p);
        })
    };

    let cancel = Arc::new(AtomicBool::new(false));
    let files_to_send: Vec<PathBuf> = vec![file1_path, file2_path, file3_path];

    let done = BeamClient::send_files(
        server_addr,
        &client_info,
        files_to_send,
        progress_cb,
        cancel,
    )
    .await
    .expect("File transfer failed");

    assert!(done.all_verified, "All files must be verified identical");

    // 3. Verify files on destination disk
    let recv1 = dst_dir.path().join("document.txt");
    let recv2 = dst_dir.path().join("photo_raw.dng");
    let recv3 = dst_dir.path().join("empty.log");

    assert!(recv1.exists());
    assert!(recv2.exists());
    assert!(recv3.exists());

    let recv_hash1 = FileHasher::hash_file(&recv1).unwrap();
    let recv_hash2 = FileHasher::hash_file(&recv2).unwrap();
    let recv_hash3 = FileHasher::hash_file(&recv3).unwrap();

    assert_eq!(recv_hash1, hash1, "Document hash must be identical");
    assert_eq!(recv_hash2, hash2, "3MB RAW image hash must be identical");
    assert_eq!(recv_hash3, hash3, "Empty file hash must be identical");

    // Check progress events
    let events = progress_history.lock().unwrap();
    assert!(!events.is_empty(), "Must have emitted progress updates");
    let last_event = events.last().unwrap();
    assert_eq!(last_event.status, "completed");
    assert!(last_event.verified_identical);
}
