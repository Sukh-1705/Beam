export type DeviceType = 'desktop' | 'android' | 'ios';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  os: string;
  ip: string;
  port: number;
  isTrusted: boolean;
  isPaired: boolean;
  connectionType: 'wifi' | 'hotspot' | 'usb' | 'relay';
  linkSpeed: string; // e.g. "Wi-Fi 6 · 860 Mbps" or "USB 3.2 · 5.0 Gbps"
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  progress: number;
  status: 'queued' | 'chunking' | 'transferring' | 'verifying' | 'completed' | 'corrupt_retry' | 'failed';
  blake3Hash?: string;
  verifiedIdentical?: boolean;
  speedMbps?: number;
}

export interface TransferSession {
  id: string;
  targetDevice: Device;
  direction: 'outgoing' | 'incoming';
  files: FileItem[];
  totalBytes: number;
  transferredBytes: number;
  overallPercent: number;
  currentSpeedMbps: number;
  speedHistory: number[];
  etaSeconds: number;
  status: 'idle' | 'active' | 'paused' | 'completed' | 'failed';
  startTime: number;
}

export interface RemoteFileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  mtime: number;
  mimeType: string;
}

export interface HistoryEntry {
  id: string;
  fileName: string;
  fileSize: number;
  deviceName: string;
  deviceType: DeviceType;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  blake3Hash: string;
  verified: boolean;
  speedAverage: string;
  durationMs: number;
}
