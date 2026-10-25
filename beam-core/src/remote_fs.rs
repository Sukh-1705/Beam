use crate::protocol::{RemoteFsEntry, RemoteFsResponse};
use std::fs;
use std::path::{Path, PathBuf};

pub struct RemoteFs {
    base_dir: PathBuf,
}

impl RemoteFs {
    pub fn new<P: AsRef<Path>>(base_dir: P) -> Self {
        Self {
            base_dir: base_dir.as_ref().to_path_buf(),
        }
    }

    /// List directory contents safely within the sandbox
    pub fn list(&self, requested_rel: &str) -> RemoteFsResponse {
        let clean_rel = requested_rel.trim_start_matches(['/', '\\']);
        let full_path = self.base_dir.join(clean_rel);

        // Security check: ensure path stays within base_dir
        if let Ok(canonical_base) = self.base_dir.canonicalize() {
            if let Ok(canonical_target) = full_path.canonicalize() {
                if !canonical_target.starts_with(&canonical_base) {
                    return RemoteFsResponse {
                        path: requested_rel.to_string(),
                        entries: Vec::new(),
                        error: Some("Access denied: path traversal detected".to_string()),
                    };
                }
            }
        }

        if !full_path.exists() {
            return RemoteFsResponse {
                path: requested_rel.to_string(),
                entries: Vec::new(),
                error: Some("Path does not exist".to_string()),
            };
        }

        let read_dir = match fs::read_dir(&full_path) {
            Ok(rd) => rd,
            Err(e) => {
                return RemoteFsResponse {
                    path: requested_rel.to_string(),
                    entries: Vec::new(),
                    error: Some(e.to_string()),
                }
            }
        };

        let mut entries = Vec::new();
        for item in read_dir.flatten() {
            let name = item.file_name().to_string_lossy().to_string();
            // Skip hidden dotfiles
            if name.starts_with('.') {
                continue;
            }

            let meta = match item.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };

            let is_dir = meta.is_dir();
            let size = if is_dir { 0 } else { meta.len() };
            let mtime = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);

            let rel_item = if clean_rel.is_empty() {
                name.clone()
            } else {
                format!("{}/{}", clean_rel.replace('\\', "/"), name)
            };

            let mime_type = Self::guess_mime(&name, is_dir);

            entries.push(RemoteFsEntry {
                name,
                relative_path: rel_item,
                is_dir,
                size,
                mtime,
                mime_type,
            });
        }

        // Sort: directories first, then alphabetically
        entries.sort_by(|a, b| {
            if a.is_dir == b.is_dir {
                a.name.to_lowercase().cmp(&b.name.to_lowercase())
            } else if a.is_dir {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        });

        RemoteFsResponse {
            path: requested_rel.to_string(),
            entries,
            error: None,
        }
    }

    fn guess_mime(name: &str, is_dir: bool) -> String {
        if is_dir {
            return "inode/directory".to_string();
        }

        let lower = name.to_lowercase();
        if lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
            "image/jpeg".to_string()
        } else if lower.ends_with(".png") {
            "image/png".to_string()
        } else if lower.ends_with(".heic") {
            "image/heic".to_string()
        } else if lower.ends_with(".raw") || lower.ends_with(".dng") || lower.ends_with(".cr2") {
            "image/x-raw".to_string()
        } else if lower.ends_with(".mp4") || lower.ends_with(".mov") {
            "video/mp4".to_string()
        } else if lower.ends_with(".pdf") {
            "application/pdf".to_string()
        } else if lower.ends_with(".zip") || lower.ends_with(".tar.gz") {
            "application/zip".to_string()
        } else if lower.ends_with(".apk") {
            "application/vnd.android.package-archive".to_string()
        } else {
            "application/octet-stream".to_string()
        }
    }
}
