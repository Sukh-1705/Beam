use crate::chunking::FileChunker;
use crate::protocol::*;
use crate::transfer::{TransferEngine, TransferProgress};
use anyhow::{anyhow, Result};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tokio::net::TcpStream;
use uuid::Uuid;

pub struct BeamClient;

impl BeamClient {
    /// Connect to a peer and exchange Hello
    pub async fn handshake(addr: SocketAddr, local_info: &DeviceInfo) -> Result<DeviceInfo> {
        let mut stream = TcpStream::connect(addr).await?;
        write_packet(&mut stream, &Packet::Hello(local_info.clone())).await?;
        let resp = read_packet(&mut stream).await?;
        match resp {
            Packet::Hello(peer_info) => Ok(peer_info),
            _ => Err(anyhow!("Unexpected response to Hello handshake")),
        }
    }

    /// Attempt to pair with a peer using PIN or QR token
    pub async fn pair(addr: SocketAddr, local_info: &DeviceInfo, pin: &str) -> Result<PairResponse> {
        let mut stream = TcpStream::connect(addr).await?;
        let req = PairRequest {
            sender: local_info.clone(),
            pin_or_token: pin.to_string(),
        };
        write_packet(&mut stream, &Packet::PairRequest(req)).await?;
        let resp = read_packet(&mut stream).await?;
        match resp {
            Packet::PairResponse(pair_resp) => Ok(pair_resp),
            _ => Err(anyhow!("Unexpected response to PairRequest")),
        }
    }

    /// Query remote device file system
    pub async fn query_remote_fs(addr: SocketAddr, path: &str) -> Result<RemoteFsResponse> {
        let mut stream = TcpStream::connect(addr).await?;
        write_packet(
            &mut stream,
            &Packet::RemoteFsReq(RemoteFsRequest {
                path: path.to_string(),
            }),
        )
        .await?;
        let resp = read_packet(&mut stream).await?;
        match resp {
            Packet::RemoteFsResp(fs_resp) => Ok(fs_resp),
            _ => Err(anyhow!("Unexpected response to RemoteFsReq")),
        }
    }

    /// Send files to remote peer
    pub async fn send_files<P: AsRef<Path>>(
        addr: SocketAddr,
        local_info: &DeviceInfo,
        files: Vec<P>,
        progress_cb: Arc<dyn Fn(TransferProgress) + Send + Sync>,
        cancel_flag: Arc<AtomicBool>,
    ) -> Result<TransferDone> {
        let mut stream = TcpStream::connect(addr).await?;

        let mut file_metas = Vec::new();
        let mut base_paths = HashMap::new();
        let mut total_bytes = 0u64;

        for (idx, p) in files.iter().enumerate() {
            let path_buf = p.as_ref().to_path_buf();
            let file_name = path_buf
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let meta = FileChunker::inspect_file(
                &path_buf,
                file_name,
                idx,
                DEFAULT_CHUNK_SIZE,
            )?;
            total_bytes += meta.size;
            file_metas.push(meta);
            base_paths.insert(idx, path_buf);
        }

        let manifest = TransferManifest {
            transfer_id: Uuid::new_v4(),
            sender: local_info.clone(),
            files: file_metas,
            total_bytes,
        };

        TransferEngine::send_manifest_and_files(
            &mut stream,
            manifest,
            base_paths,
            progress_cb,
            cancel_flag,
        )
        .await
    }

    /// Send clipboard payload
    pub async fn sync_clipboard(addr: SocketAddr, payload: ClipboardPayload) -> Result<()> {
        let mut stream = TcpStream::connect(addr).await?;
        write_packet(&mut stream, &Packet::Clipboard(payload)).await?;
        Ok(())
    }
}
