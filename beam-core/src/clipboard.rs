use crate::protocol::ClipboardPayload;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone)]
pub struct ClipboardManager {
    latest: Arc<Mutex<Option<ClipboardPayload>>>,
}

impl ClipboardManager {
    pub fn new() -> Self {
        Self {
            latest: Arc::new(Mutex::new(None)),
        }
    }

    pub fn set_text(&self, text: &str) -> ClipboardPayload {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        let payload = ClipboardPayload {
            content_type: "text/plain".to_string(),
            data: text.as_bytes().to_vec(),
            timestamp: now,
        };

        let mut lock = self.latest.lock().unwrap();
        *lock = Some(payload.clone());
        payload
    }

    pub fn set_image(&self, png_bytes: Vec<u8>) -> ClipboardPayload {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        let payload = ClipboardPayload {
            content_type: "image/png".to_string(),
            data: png_bytes,
            timestamp: now,
        };

        let mut lock = self.latest.lock().unwrap();
        *lock = Some(payload.clone());
        payload
    }

    pub fn get_latest(&self) -> Option<ClipboardPayload> {
        let lock = self.latest.lock().unwrap();
        lock.clone()
    }
}
