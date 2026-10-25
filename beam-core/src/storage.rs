use anyhow::Result;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustedDevice {
    pub id: String,
    pub name: String,
    pub device_type: String,
    pub paired_at: i64,
    pub session_token: String,
    pub auto_accept: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryRecord {
    pub id: i64,
    pub transfer_id: String,
    pub filename: String,
    pub file_size: u64,
    pub sender_name: String,
    pub receiver_name: String,
    pub direction: String, // "incoming" or "outgoing"
    pub status: String,    // "completed", "failed", "verified"
    pub blake3_hash: String,
    pub duration_ms: u64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub device_id: String,
    pub device_name: String,
    pub default_save_dir: String,
    pub auto_accept_trusted: bool,
    pub clipboard_sync_enabled: bool,
    pub photo_backup_dir: String,
}

pub struct Storage {
    conn: Arc<Mutex<Connection>>,
}

impl Storage {
    pub fn init<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let storage = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        storage.migrate()?;
        Ok(storage)
    }

    pub fn in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let storage = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        storage.migrate()?;
        Ok(storage)
    }

    fn migrate(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS trusted_devices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                device_type TEXT NOT NULL,
                paired_at INTEGER NOT NULL,
                session_token TEXT NOT NULL,
                auto_accept INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS transfer_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transfer_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                sender_name TEXT NOT NULL,
                receiver_name TEXT NOT NULL,
                direction TEXT NOT NULL,
                status TEXT NOT NULL,
                blake3_hash TEXT NOT NULL,
                duration_ms INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            "#,
        )?;
        Ok(())
    }

    pub fn save_trusted_device(&self, device: &TrustedDevice) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            r#"
            INSERT OR REPLACE INTO trusted_devices (id, name, device_type, paired_at, session_token, auto_accept)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
            params![
                device.id,
                device.name,
                device.device_type,
                device.paired_at,
                device.session_token,
                if device.auto_accept { 1 } else { 0 },
            ],
        )?;
        Ok(())
    }

    pub fn is_device_trusted(&self, device_id: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM trusted_devices WHERE id = ?1",
            params![device_id],
            |row| row.get(0),
        )?;
        Ok(count > 0)
    }

    pub fn list_trusted_devices(&self) -> Result<Vec<TrustedDevice>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, device_type, paired_at, session_token, auto_accept FROM trusted_devices ORDER BY paired_at DESC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(TrustedDevice {
                id: row.get(0)?,
                name: row.get(1)?,
                device_type: row.get(2)?,
                paired_at: row.get(3)?,
                session_token: row.get(4)?,
                auto_accept: row.get::<_, i64>(5)? == 1,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn remove_trusted_device(&self, device_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM trusted_devices WHERE id = ?1",
            params![device_id],
        )?;
        Ok(())
    }

    pub fn add_history(&self, record: &HistoryRecord) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            r#"
            INSERT INTO transfer_history (
                transfer_id, filename, file_size, sender_name, receiver_name,
                direction, status, blake3_hash, duration_ms, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            "#,
            params![
                record.transfer_id,
                record.filename,
                record.file_size,
                record.sender_name,
                record.receiver_name,
                record.direction,
                record.status,
                record.blake3_hash,
                record.duration_ms,
                record.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn list_history(&self, limit: usize) -> Result<Vec<HistoryRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT id, transfer_id, filename, file_size, sender_name, receiver_name,
                   direction, status, blake3_hash, duration_ms, created_at
            FROM transfer_history
            ORDER BY id DESC
            LIMIT ?1
            "#,
        )?;
        let rows = stmt.query_map(params![limit as i64], |row| {
            Ok(HistoryRecord {
                id: row.get(0)?,
                transfer_id: row.get(1)?,
                filename: row.get(2)?,
                file_size: row.get(3)?,
                sender_name: row.get(4)?,
                receiver_name: row.get(5)?,
                direction: row.get(6)?,
                status: row.get(7)?,
                blake3_hash: row.get(8)?,
                duration_ms: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            let val: String = row.get(0)?;
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }
}
