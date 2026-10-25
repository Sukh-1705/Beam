use anyhow::Result;
use beam_core::client::BeamClient;
use beam_core::discovery::{DiscoveryService, PeerRegistry};
use beam_core::protocol::{DeviceInfo, DeviceType};
use beam_core::server::BeamServer;
use beam_core::storage::Storage;
use beam_core::transfer::TransferProgress;
use beam_core::ClipboardManager;
use clap::{Parser, Subcommand};
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;

#[derive(Parser)]
#[command(name = "beam")]
#[command(about = "Beam: Flagship lossless cross-device file transfer suite", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Send one or more files to a discovered device or IP:port
    Send {
        /// Files to send
        #[arg(required = true)]
        files: Vec<PathBuf>,

        /// Target peer address (e.g. 192.168.1.50:53318) or name
        #[arg(long, short)]
        to: String,

        /// Optional PIN for initial pairing
        #[arg(long)]
        pin: Option<String>,
    },

    /// Discover reachable Beam devices on the local network
    Discover {
        /// Scan duration in seconds
        #[arg(long, default_value = "3")]
        seconds: u64,
    },

    /// Pair with a device using PIN
    Pair {
        /// Target device address (IP:port)
        target: String,

        /// 6-digit PIN shown on destination device
        #[arg(long)]
        pin: String,
    },

    /// Browse files on a remote Beam device
    Browse {
        /// Remote device address (IP:port)
        target: String,

        /// Remote relative path
        #[arg(long, default_value = "")]
        path: String,
    },

    /// Display recent transfer history
    History {
        #[arg(long, default_value = "20")]
        limit: usize,
    },

    /// Run Beam background transfer service daemon
    Serve {
        /// Port to listen on
        #[arg(long, default_value = "53318")]
        port: u16,

        /// Directory to store received files
        #[arg(long)]
        dir: Option<PathBuf>,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let cli = Cli::parse();

    let local_id = uuid::Uuid::new_v4().to_string();
    let hostname = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "Beam PC".to_string());

    let local_info = DeviceInfo {
        id: local_id.clone(),
        name: hostname,
        device_type: DeviceType::Desktop,
        os: std::env::consts::OS.to_string(),
        addresses: vec!["127.0.0.1".to_string()],
        port: 53318,
        public_fingerprint: String::new(),
    };

    let home_dir = dirs_fallback();
    let storage_dir = home_dir.join(".beam");
    std::fs::create_dir_all(&storage_dir)?;
    let db_path = storage_dir.join("beam.db");
    let storage = Storage::init(&db_path)?;

    match cli.command {
        Commands::Discover { seconds } => {
            println!("🔍 Scanning local network for Beam devices ({}s)...", seconds);
            let registry = PeerRegistry::new();
            let (stop_tx, _) = tokio::sync::broadcast::channel(1);

            let reg_clone = registry.clone();
            let id_clone = local_id.clone();
            let stop_rx = stop_tx.subscribe();
            tokio::spawn(async move {
                DiscoveryService::run_receiver(reg_clone, id_clone, stop_rx).await;
            });

            let bcast_info = local_info.clone();
            let stop_rx2 = stop_tx.subscribe();
            tokio::spawn(async move {
                DiscoveryService::run_broadcaster(bcast_info, stop_rx2).await;
            });

            tokio::time::sleep(Duration::from_secs(seconds)).await;
            let peers = registry.list_active(Duration::from_secs(5));

            if peers.is_empty() {
                println!("No Beam devices discovered yet.");
                println!("Hint: Make sure Beam is open on your other device and on the same Wi-Fi.");
            } else {
                println!("\nFound {} device(s):", peers.len());
                for (i, p) in peers.iter().enumerate() {
                    let addr = p.addresses.first().cloned().unwrap_or_default();
                    println!(
                        "  [{}] {} ({:?}) - {}:{}",
                        i + 1,
                        p.name,
                        p.device_type,
                        addr,
                        p.port
                    );
                }
            }
        }

        Commands::Pair { target, pin } => {
            let addr: SocketAddr = target.parse()?;
            println!("🤝 Pairing with {} using PIN {}...", addr, pin);
            let resp = BeamClient::pair(addr, &local_info, &pin).await?;
            if resp.accepted {
                println!("✓ Paired successfully! Session token: {}", resp.session_token);
            } else {
                println!("✗ Pairing rejected: {}", resp.reason.unwrap_or_default());
            }
        }

        Commands::Send { files, to, pin } => {
            let addr: SocketAddr = if to.contains(':') {
                to.parse()?
            } else {
                format!("{}:53318", to).parse()?
            };

            // If PIN provided, pair first
            if let Some(p) = pin {
                println!("🔑 Pairing with {}...", addr);
                let resp = BeamClient::pair(addr, &local_info, &p).await?;
                if !resp.accepted {
                    println!("✗ Pairing failed: {}", resp.reason.unwrap_or_default());
                    return Ok(());
                }
            }

            println!("🚀 Sending {} file(s) to {}...", files.len(), addr);

            let progress_cb = Arc::new(|p: TransferProgress| {
                if p.percent >= 100.0 {
                    println!("\r[100%] {} ✓ Verified identical              ", p.current_file);
                } else {
                    print!(
                        "\r[{:3.1}%] {} ({:.1} Mbps) - {}/{} bytes   ",
                        p.percent, p.current_file, p.current_mbps, p.bytes_transferred, p.total_bytes
                    );
                    use std::io::Write;
                    let _ = std::io::stdout().flush();
                }
            });

            let cancel = Arc::new(AtomicBool::new(false));
            let done = BeamClient::send_files(addr, &local_info, files, progress_cb, cancel).await?;

            println!("\n🎉 Transfer completed in {} ms!", done.elapsed_millis);
            println!("✓ Verified identical with BLAKE3 cryptographic integrity");
        }

        Commands::Browse { target, path } => {
            let addr: SocketAddr = target.parse()?;
            println!("📂 Browsing remote files on {} at '{}'...", addr, path);
            let resp = BeamClient::query_remote_fs(addr, &path).await?;
            if let Some(err) = resp.error {
                println!("✗ Remote error: {}", err);
            } else {
                println!("\nFound {} items:", resp.entries.len());
                for e in resp.entries {
                    let kind = if e.is_dir { "<DIR>" } else { "FILE" };
                    println!("  {:6} {:10} bytes  {}", kind, e.size, e.name);
                }
            }
        }

        Commands::History { limit } => {
            let list = storage.list_history(limit)?;
            println!("📜 Transfer History (Last {} records):", limit);
            if list.is_empty() {
                println!("  No transfers recorded yet.");
            } else {
                for h in list {
                    println!(
                        "  #{} [{}] {} ({} bytes) -> {} ({}) BLAKE3: {}...",
                        h.id,
                        h.direction,
                        h.filename,
                        h.file_size,
                        h.status,
                        h.receiver_name,
                        &h.blake3_hash[..h.blake3_hash.len().min(12)]
                    );
                }
            }
        }

        Commands::Serve { port, dir } => {
            let save_dir = dir.unwrap_or_else(|| storage_dir.join("Received"));
            std::fs::create_dir_all(&save_dir)?;

            let clipboard = ClipboardManager::new();
            let mut server_info = local_info.clone();
            server_info.port = port;

            let (server, mut rx) = BeamServer::new(server_info.clone(), &save_dir, storage, clipboard);
            let pin = server.get_pin();

            println!("✨ Beam Server started on port {}", port);
            println!("📁 Saving files to: {}", save_dir.display());
            println!("🔑 Pairing PIN: {}", pin);

            // Spawn event logger
            tokio::spawn(async move {
                while let Ok(evt) = rx.recv().await {
                    match evt {
                        beam_core::ServerEvent::ClientConnected(addr) => {
                            println!("📡 Peer connected: {}", addr);
                        }
                        beam_core::ServerEvent::TransferStarted {
                            total_files,
                            total_bytes,
                            ..
                        } => {
                            println!(
                                "📥 Receiving {} files ({} bytes)...",
                                total_files, total_bytes
                            );
                        }
                        beam_core::ServerEvent::TransferProgress(p) => {
                            if p.percent >= 100.0 {
                                println!("\r📥 [100%] {} ✓ Verified identical", p.current_file);
                            }
                        }
                        beam_core::ServerEvent::TransferFinished { success, .. } => {
                            if success {
                                println!("\n✓ Transfer finished successfully and verified!");
                            } else {
                                println!("\n✗ Transfer failed!");
                            }
                        }
                        beam_core::ServerEvent::ClipboardReceived(c) => {
                            println!("📋 Clipboard received ({} bytes)", c.data.len());
                        }
                        _ => {}
                    }
                }
            });

            let arc_server = Arc::new(server);
            let bind_addr = format!("0.0.0.0:{}", port);
            arc_server.run(&bind_addr).await?;
        }
    }

    Ok(())
}

fn dirs_fallback() -> PathBuf {
    if let Ok(dir) = std::env::var("USERPROFILE") {
        PathBuf::from(dir)
    } else if let Ok(dir) = std::env::var("HOME") {
        PathBuf::from(dir)
    } else {
        std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
    }
}
