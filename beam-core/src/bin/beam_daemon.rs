use anyhow::Result;
use beam_core::discovery::{DiscoveryService, PeerRegistry};
use beam_core::protocol::{DeviceInfo, DeviceType};
use beam_core::server::BeamServer;
use beam_core::storage::Storage;
use beam_core::ClipboardManager;
use std::path::PathBuf;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let local_id = uuid::Uuid::new_v4().to_string();
    let hostname = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "Beam Service".to_string());

    let port: u16 = 53318;
    let local_info = DeviceInfo {
        id: local_id.clone(),
        name: hostname,
        device_type: DeviceType::Desktop,
        os: std::env::consts::OS.to_string(),
        addresses: vec!["127.0.0.1".to_string()],
        port,
        public_fingerprint: String::new(),
    };

    let home = if let Ok(d) = std::env::var("USERPROFILE") {
        PathBuf::from(d)
    } else {
        PathBuf::from(".")
    };

    let base_dir = home.join(".beam");
    let save_dir = base_dir.join("Received");
    std::fs::create_dir_all(&save_dir)?;

    let db_path = base_dir.join("beam.db");
    let storage = Storage::init(&db_path)?;
    let clipboard = ClipboardManager::new();

    let (server, mut rx) = BeamServer::new(local_info.clone(), &save_dir, storage, clipboard);
    let pin = server.get_pin();

    println!("Beam Daemon active on port {}. Pairing PIN: {}", port, pin);

    let (stop_tx, _) = tokio::sync::broadcast::channel(1);
    let reg = PeerRegistry::new();

    let reg_c = reg.clone();
    let id_c = local_id.clone();
    let stop_rx1 = stop_tx.subscribe();
    tokio::spawn(async move {
        DiscoveryService::run_receiver(reg_c, id_c, stop_rx1).await;
    });

    let info_c = local_info.clone();
    let stop_rx2 = stop_tx.subscribe();
    tokio::spawn(async move {
        DiscoveryService::run_broadcaster(info_c, stop_rx2).await;
    });

    tokio::spawn(async move {
        while let Ok(evt) = rx.recv().await {
            match evt {
                beam_core::ServerEvent::TransferFinished { transfer_id, success } => {
                    println!("Transfer {} finished with success: {}", transfer_id, success);
                }
                _ => {}
            }
        }
    });

    let arc = Arc::new(server);
    arc.run(&format!("0.0.0.0:{}", port)).await?;

    Ok(())
}
