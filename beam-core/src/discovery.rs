use crate::protocol::{DeviceInfo, DeviceType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::net::UdpSocket;
use tracing::{debug, error};

pub const BEAM_DISCOVERY_PORT: u16 = 53317;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveryBeacon {
    pub id: String,
    pub name: String,
    pub device_type: DeviceType,
    pub os: String,
    pub port: u16,
    pub version: String,
}

#[derive(Debug, Clone)]
pub struct DiscoveredPeer {
    pub info: DeviceInfo,
    pub last_seen: Instant,
    pub socket_addr: SocketAddr,
}

#[derive(Clone)]
pub struct PeerRegistry {
    peers: Arc<Mutex<HashMap<String, DiscoveredPeer>>>,
}

impl PeerRegistry {
    pub fn new() -> Self {
        Self {
            peers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn insert_or_update(&self, beacon: DiscoveryBeacon, src_addr: SocketAddr) {
        let mut lock = self.peers.lock().unwrap();
        let ip = src_addr.ip().to_string();
        let info = DeviceInfo {
            id: beacon.id.clone(),
            name: beacon.name,
            device_type: beacon.device_type,
            os: beacon.os,
            addresses: vec![ip],
            port: beacon.port,
            public_fingerprint: String::new(),
        };

        lock.insert(
            beacon.id,
            DiscoveredPeer {
                info,
                last_seen: Instant::now(),
                socket_addr: src_addr,
            },
        );
    }

    pub fn list_active(&self, timeout: Duration) -> Vec<DeviceInfo> {
        let mut lock = self.peers.lock().unwrap();
        let now = Instant::now();
        // Prune stale peers
        lock.retain(|_, peer| now.duration_since(peer.last_seen) < timeout);
        lock.values().map(|p| p.info.clone()).collect()
    }
}

#[allow(dead_code)]
pub struct DiscoveryService {
    local_info: DeviceInfo,
    registry: PeerRegistry,
}

impl DiscoveryService {
    pub fn new(local_info: DeviceInfo, registry: PeerRegistry) -> Self {
        Self {
            local_info,
            registry,
        }
    }

    /// Run the discovery broadcaster loop in the background
    pub async fn run_broadcaster(
        local_info: DeviceInfo,
        mut stop_rx: tokio::sync::broadcast::Receiver<()>,
    ) {
        let bind_addr = "0.0.0.0:0";
        let socket = match UdpSocket::bind(bind_addr).await {
            Ok(s) => s,
            Err(e) => {
                error!("Failed to bind UDP discovery sender: {}", e);
                return;
            }
        };

        if let Err(e) = socket.set_broadcast(true) {
            error!("Failed to set UDP broadcast: {}", e);
            return;
        }

        let beacon = DiscoveryBeacon {
            id: local_info.id.clone(),
            name: local_info.name.clone(),
            device_type: local_info.device_type,
            os: local_info.os.clone(),
            port: local_info.port,
            version: "1.0.0".to_string(),
        };

        let beacon_bytes = match serde_json::to_vec(&beacon) {
            Ok(b) => b,
            Err(_) => return,
        };

        let broadcast_target = format!("255.255.255.255:{}", BEAM_DISCOVERY_PORT);
        let mut interval = tokio::time::interval(Duration::from_millis(1500));

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    let _ = socket.send_to(&beacon_bytes, &broadcast_target).await;
                }
                _ = stop_rx.recv() => {
                    break;
                }
            }
        }
    }

    /// Run the discovery receiver loop in the background
    pub async fn run_receiver(
        registry: PeerRegistry,
        local_id: String,
        mut stop_rx: tokio::sync::broadcast::Receiver<()>,
    ) {
        let listen_addr = format!("0.0.0.0:{}", BEAM_DISCOVERY_PORT);
        let socket = match UdpSocket::bind(&listen_addr).await {
            Ok(s) => s,
            Err(e) => {
                error!("Failed to bind UDP discovery receiver on {}: {}", listen_addr, e);
                return;
            }
        };

        let mut buf = [0u8; 4096];

        loop {
            tokio::select! {
                res = socket.recv_from(&mut buf) => {
                    match res {
                        Ok((len, src)) => {
                            if let Ok(beacon) = serde_json::from_slice::<DiscoveryBeacon>(&buf[..len]) {
                                if beacon.id != local_id {
                                    registry.insert_or_update(beacon, src);
                                }
                            }
                        }
                        Err(e) => {
                            debug!("UDP recv error: {}", e);
                        }
                    }
                }
                _ = stop_rx.recv() => {
                    break;
                }
            }
        }
    }
}
