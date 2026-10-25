use beam_core::protocol::*;
use uuid::Uuid;

#[test]
fn test_packet_serialization_roundtrip() {
    let dev = DeviceInfo {
        id: Uuid::new_v4().to_string(),
        name: "Test MacBook Pro".to_string(),
        device_type: DeviceType::Desktop,
        os: "macos".to_string(),
        addresses: vec!["192.168.1.100".to_string()],
        port: 53318,
        public_fingerprint: "ed25519_test_fingerprint".to_string(),
    };

    let hello_pkt = Packet::Hello(dev);
    let bytes = serialize_packet(&hello_pkt).expect("Serialization failed");
    assert_eq!(&bytes[0..5], MAGIC_HEADER);

    let deserialized = deserialize_packet(&bytes).expect("Deserialization failed");
    match deserialized {
        Packet::Hello(info) => {
            assert_eq!(info.name, "Test MacBook Pro");
            assert_eq!(info.device_type, DeviceType::Desktop);
        }
        _ => panic!("Expected Hello packet"),
    }
}

#[test]
fn test_manifest_serialization() {
    let dev = DeviceInfo {
        id: "dev-1".to_string(),
        name: "Sender Phone".to_string(),
        device_type: DeviceType::Android,
        os: "android".to_string(),
        addresses: vec!["192.168.43.1".to_string()],
        port: 53318,
        public_fingerprint: String::new(),
    };

    let manifest = TransferManifest {
        transfer_id: Uuid::new_v4(),
        sender: dev,
        files: vec![
            FileMeta {
                file_index: 0,
                relative_path: "DCIM/Camera/IMG_20261026_010203.jpg".to_string(),
                size: 4_520_100,
                mtime_secs: 1792900000,
                blake3_hash: "a3b5c7d9e1f2030405060708090a0b0c0d0e0f101112131415161718191a1b1c"
                    .to_string(),
                chunk_size: 1024 * 1024,
                chunk_count: 5,
            },
            FileMeta {
                file_index: 1,
                relative_path: "Documents/Report.pdf".to_string(),
                size: 1_200_000,
                mtime_secs: 1792900100,
                blake3_hash: "b3c5d7e9f1a2030405060708090a0b0c0d0e0f101112131415161718191a1b1d"
                    .to_string(),
                chunk_size: 1024 * 1024,
                chunk_count: 2,
            },
        ],
        total_bytes: 5_720_100,
    };

    let pkt = Packet::Manifest(manifest);
    let bytes = serialize_packet(&pkt).unwrap();
    let decoded = deserialize_packet(&bytes).unwrap();

    match decoded {
        Packet::Manifest(m) => {
            assert_eq!(m.files.len(), 2);
            assert_eq!(m.total_bytes, 5_720_100);
            assert_eq!(
                m.files[0].relative_path,
                "DCIM/Camera/IMG_20261026_010203.jpg"
            );
        }
        _ => panic!("Expected Manifest packet"),
    }
}

#[test]
fn test_invalid_header_rejection() {
    let invalid_bytes = b"WRONG\x01\x00\x00\x00\x04test";
    let res = deserialize_packet(invalid_bytes);
    assert!(res.is_err(), "Must reject non-BEAM magic header");
}
