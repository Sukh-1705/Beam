use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
use uuid::Uuid;

pub const MAGIC_HEADER: &[u8; 5] = b"BEAM\x01";
pub const DEFAULT_CHUNK_SIZE: usize = 1024 * 1024; // 1 MB
pub const SMALL_LINK_CHUNK_SIZE: usize = 64 * 1024; // 64 KB
pub const MAX_PACKET_SIZE: usize = 64 * 1024 * 1024; // 64 MB frame cap

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeviceType {
    Desktop,
    Android,
    Ios,
}

impl std::fmt::Display for DeviceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DeviceType::Desktop => write!(f, "Desktop"),
            DeviceType::Android => write!(f, "Android"),
            DeviceType::Ios => write!(f, "iOS"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub device_type: DeviceType,
    pub os: String,
    pub addresses: Vec<String>,
    pub port: u16,
    pub public_fingerprint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairRequest {
    pub sender: DeviceInfo,
    pub pin_or_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairResponse {
    pub accepted: bool,
    pub session_token: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMeta {
    pub file_index: usize,
    pub relative_path: String,
    pub size: u64,
    pub mtime_secs: i64,
    pub blake3_hash: String,
    pub chunk_size: usize,
    pub chunk_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferManifest {
    pub transfer_id: Uuid,
    pub sender: DeviceInfo,
    pub files: Vec<FileMeta>,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestAck {
    pub transfer_id: Uuid,
    pub accepted: bool,
    /// Already completed chunk indexes per file_index for resume
    pub existing_chunks: HashMap<usize, Vec<u32>>,
    pub reject_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkHeader {
    pub transfer_id: Uuid,
    pub file_index: usize,
    pub chunk_index: u32,
    pub offset: u64,
    pub length: u32,
    pub chunk_blake3: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkAck {
    pub transfer_id: Uuid,
    pub file_index: usize,
    pub chunk_index: u32,
    pub valid: bool,
    pub error_msg: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileVerified {
    pub transfer_id: Uuid,
    pub file_index: usize,
    pub final_hash: String,
    pub verified_identical: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferDone {
    pub transfer_id: Uuid,
    pub all_verified: bool,
    pub elapsed_millis: u64,
    pub average_mbps: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteFsEntry {
    pub name: String,
    pub relative_path: String,
    pub is_dir: bool,
    pub size: u64,
    pub mtime: u64,
    pub mime_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteFsRequest {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteFsResponse {
    pub path: String,
    pub entries: Vec<RemoteFsEntry>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardPayload {
    pub content_type: String, // e.g. "text/plain", "image/png", "text/uri-list"
    pub data: Vec<u8>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Packet {
    Hello(DeviceInfo),
    PairRequest(PairRequest),
    PairResponse(PairResponse),
    Manifest(TransferManifest),
    ManifestAck(ManifestAck),
    ChunkHeader(ChunkHeader),
    ChunkAck(ChunkAck),
    FileVerified(FileVerified),
    TransferDone(TransferDone),
    RemoteFsReq(RemoteFsRequest),
    RemoteFsResp(RemoteFsResponse),
    Clipboard(ClipboardPayload),
    Ping,
    Pong,
}

pub async fn write_packet<W: AsyncWrite + Unpin>(writer: &mut W, packet: &Packet) -> io::Result<()> {
    let payload = bincode::serialize(packet)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;
    let len = payload.len() as u32;

    writer.write_all(MAGIC_HEADER).await?;
    writer.write_u32(len).await?;
    writer.write_all(&payload).await?;
    writer.flush().await?;
    Ok(())
}

pub async fn read_packet<R: AsyncRead + Unpin>(reader: &mut R) -> io::Result<Packet> {
    let mut header = [0u8; 5];
    reader.read_exact(&mut header).await?;
    if &header != MAGIC_HEADER {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "Invalid Beam packet magic header",
        ));
    }

    let len = reader.read_u32().await? as usize;
    if len > MAX_PACKET_SIZE {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Packet length {} exceeds maximum limit {}", len, MAX_PACKET_SIZE),
        ));
    }

    let mut buf = vec![0u8; len];
    reader.read_exact(&mut buf).await?;

    let packet: Packet = bincode::deserialize(&buf)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;
    Ok(packet)
}

pub fn serialize_packet(packet: &Packet) -> Result<Vec<u8>, bincode::Error> {
    let mut buf = Vec::with_capacity(128);
    buf.extend_from_slice(MAGIC_HEADER);
    let payload = bincode::serialize(packet)?;
    let len = (payload.len() as u32).to_be_bytes();
    buf.extend_from_slice(&len);
    buf.extend_from_slice(&payload);
    Ok(buf)
}

pub fn deserialize_packet(bytes: &[u8]) -> Result<Packet, io::Error> {
    if bytes.len() < 9 {
        return Err(io::Error::new(io::ErrorKind::UnexpectedEof, "Too few bytes for packet"));
    }
    if &bytes[0..5] != MAGIC_HEADER {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "Invalid header magic"));
    }
    let len = u32::from_be_bytes([bytes[5], bytes[6], bytes[7], bytes[8]]) as usize;
    if bytes.len() < 9 + len {
        return Err(io::Error::new(io::ErrorKind::UnexpectedEof, "Incomplete packet payload"));
    }
    bincode::deserialize(&bytes[9..9 + len])
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))
}
