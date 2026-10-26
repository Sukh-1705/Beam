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
  linkSpeed: string;
  avatarColor: string;
}

export interface MobileMediaItem {
  id: string;
  name: string;
  size: number;
  type: 'photo' | 'video' | 'doc' | 'archive';
  uri: string;
  mimeType: string;
  dateAdded: string;
}

export interface MobileTransferProgress {
  fileName: string;
  fileIndex: number;
  totalFiles: number;
  transferredBytes: number;
  totalBytes: number;
  speedMbps: number;
  percent: number;
  status: 'connecting' | 'chunking' | 'transferring' | 'verifying' | 'completed' | 'corrupted_retry' | 'failed';
  verifiedIdentical: boolean;
  blake3Hash: string;
  errorMessage?: string;
}
