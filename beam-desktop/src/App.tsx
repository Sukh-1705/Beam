import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { DeviceSidebar } from './components/DeviceSidebar';
import { LiveTransferPanel } from './components/LiveTransferPanel';
import { PairingModal } from './components/PairingModal';
import { RemoteExplorer } from './components/RemoteExplorer';
import { ClipboardSync } from './components/ClipboardSync';
import { AutoBackupCenter } from './components/AutoBackupCenter';
import { HistoryModal } from './components/HistoryModal';
import { Device, TransferSession, HistoryEntry, RemoteFileEntry } from './types';
import { Zap, ShieldAlert, Sparkles } from 'lucide-react';

const INITIAL_DEVICES: Device[] = [
  {
    id: 'phone-android-1',
    name: 'Pixel 9 Pro',
    type: 'android',
    model: 'Google Pixel 9 Pro',
    os: 'Android 15',
    ip: '192.168.1.142',
    port: 53318,
    isTrusted: true,
    isPaired: true,
    connectionType: 'wifi',
    linkSpeed: 'Wi-Fi 6 · 860 Mbps',
    batteryLevel: 88,
    isCharging: true,
  },
  {
    id: 'phone-ios-1',
    name: "Alex's iPhone",
    type: 'ios',
    model: 'iPhone 16 Pro',
    os: 'iOS 18.2',
    ip: '192.168.1.185',
    port: 53318,
    isTrusted: true,
    isPaired: true,
    connectionType: 'wifi',
    linkSpeed: 'Wi-Fi 6 · 780 Mbps',
    batteryLevel: 72,
    isCharging: false,
  },
];

const INITIAL_HISTORY: HistoryEntry[] = [
  {
    id: '1',
    fileName: 'DSC_4901_RAW.dng',
    fileSize: 84_500_000,
    deviceName: 'Pixel 9 Pro',
    deviceType: 'android',
    direction: 'incoming',
    timestamp: 'Today at 01:14 AM',
    blake3Hash: 'c7e8a1d2f3b405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e',
    verified: true,
    speedAverage: '840 Mbps',
    durationMs: 810,
  },
  {
    id: '2',
    fileName: 'Project_Assets_v4.zip',
    fileSize: 420_000_000,
    deviceName: "Alex's iPhone",
    deviceType: 'ios',
    direction: 'outgoing',
    timestamp: 'Yesterday at 11:20 PM',
    blake3Hash: 'f4e3d2c1b0a9876543210fedcba9876543210fedcba9876543210fedcba98765',
    verified: true,
    speedAverage: '790 Mbps',
    durationMs: 4250,
  },
];

export const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(INITIAL_DEVICES[0]);
  const [isScanning, setIsScanning] = useState(false);

  // Modals
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Clipboard & Settings
  const [clipboardEnabled, setClipboardEnabled] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);
  const [activeSession, setActiveSession] = useState<TransferSession | null>(null);

  // PIN for desktop pairing
  const [currentPin] = useState('839 204');

  // Handle files dropped / selected
  const handleFilesSelected = (files: File[]) => {
    if (!selectedDevice) {
      alert('Please select a destination device from the sidebar first.');
      return;
    }

    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

    const fileItems = files.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      name: f.name,
      path: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      progress: 0,
      status: 'transferring' as const,
      blake3Hash: 'blake3_' + Math.random().toString(36).substring(2, 14),
      verifiedIdentical: false,
    }));

    const session: TransferSession = {
      id: `transfer-${Date.now()}`,
      targetDevice: selectedDevice,
      direction: 'outgoing',
      files: fileItems,
      totalBytes,
      transferredBytes: 0,
      overallPercent: 0,
      currentSpeedMbps: 680,
      speedHistory: [420, 560, 680, 790, 840, 860],
      etaSeconds: Math.max(1, Math.ceil(totalBytes / (860 * 1024 * 1024 / 8))),
      status: 'active',
      startTime: Date.now(),
    };

    setActiveSession(session);
  };

  // Simulate link-saturating streaming transfer with BLAKE3 verification
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || prev.status !== 'active') return prev;

        const nextTransferred = prev.transferredBytes + Math.max(prev.totalBytes * 0.12, 500_000);
        const percent = Math.min(100, (nextTransferred / prev.totalBytes) * 100);
        const speed = 750 + Math.random() * 180; // Link saturation: 750-930 Mbps
        const nextSpeedHistory = [...prev.speedHistory.slice(-10), speed];

        const updatedFiles = prev.files.map((f) => ({
          ...f,
          progress: percent,
          status: (percent >= 100 ? 'completed' : 'transferring') as any,
          verifiedIdentical: percent >= 100,
        }));

        if (percent >= 100) {
          clearInterval(interval);
          // Add to history
          const newHistoryItem: HistoryEntry = {
            id: Date.now().toString(),
            fileName: prev.files.length === 1 ? prev.files[0].name : `${prev.files.length} Files Batch`,
            fileSize: prev.totalBytes,
            deviceName: prev.targetDevice.name,
            deviceType: prev.targetDevice.type,
            direction: 'outgoing',
            timestamp: 'Just now',
            blake3Hash: prev.files[0]?.blake3Hash || 'verified_blake3_hash',
            verified: true,
            speedAverage: `${speed.toFixed(0)} Mbps`,
            durationMs: Date.now() - prev.startTime,
          };
          setHistory((h) => [newHistoryItem, ...h]);

          return {
            ...prev,
            transferredBytes: prev.totalBytes,
            overallPercent: 100,
            currentSpeedMbps: speed,
            speedHistory: nextSpeedHistory,
            files: updatedFiles,
            etaSeconds: 0,
            status: 'completed',
          };
        }

        const remainingBytes = prev.totalBytes - nextTransferred;
        const eta = Math.ceil(remainingBytes / (speed * 1024 * 1024 / 8));

        return {
          ...prev,
          transferredBytes: nextTransferred,
          overallPercent: percent,
          currentSpeedMbps: speed,
          speedHistory: nextSpeedHistory,
          files: updatedFiles,
          etaSeconds: Math.max(0, eta),
        };
      });
    }, 250);

    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const handleRefreshDevices = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };

  const handleSimulatePair = (phoneName: string) => {
    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      name: phoneName,
      type: 'android',
      model: 'Android Flagship',
      os: 'Android 15',
      ip: '192.168.1.199',
      port: 53318,
      isTrusted: true,
      isPaired: true,
      connectionType: 'wifi',
      linkSpeed: 'Wi-Fi 6 · 840 Mbps',
      batteryLevel: 95,
      isCharging: true,
    };
    setDevices([newDevice, ...devices]);
    setSelectedDevice(newDevice);
    setIsPairingOpen(false);
  };

  const handleDownloadRemoteFile = (remoteFile: RemoteFileEntry) => {
    // Initiate incoming transfer from phone
    const session: TransferSession = {
      id: `download-${Date.now()}`,
      targetDevice: selectedDevice!,
      direction: 'incoming',
      files: [
        {
          id: `file-${Date.now()}`,
          name: remoteFile.name,
          path: remoteFile.path,
          size: remoteFile.size,
          type: remoteFile.mimeType,
          progress: 0,
          status: 'transferring',
          blake3Hash: 'blake3_verified_' + Math.random().toString(36).slice(2, 8),
          verifiedIdentical: false,
        },
      ],
      totalBytes: remoteFile.size,
      transferredBytes: 0,
      overallPercent: 0,
      currentSpeedMbps: 820,
      speedHistory: [500, 680, 820],
      etaSeconds: Math.max(1, Math.ceil(remoteFile.size / (820 * 1024 * 1024 / 8))),
      status: 'active',
      startTime: Date.now(),
    };
    setActiveSession(session);
    setIsExplorerOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0d14] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200">
      {/* Top Header */}
      <Header
        activeDevice={selectedDevice}
        onOpenPairing={() => setIsPairingOpen(true)}
        onOpenClipboard={() => setIsClipboardOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        clipboardCount={clipboardEnabled ? 2 : 0}
      />

      {/* Main Workspace: Sidebar + Dropzone + Live Transfer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Discovered Devices Sidebar */}
        <DeviceSidebar
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={(d) => setSelectedDevice(d)}
          onRefresh={handleRefreshDevices}
          isScanning={isScanning}
        />

        {/* Central Workspace */}
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-6">
          {/* Active Live Transfer Monitor */}
          {activeSession && (
            <LiveTransferPanel
              session={activeSession}
              onPause={() => setActiveSession({ ...activeSession, status: 'paused' })}
              onResume={() => setActiveSession({ ...activeSession, status: 'active' })}
              onCancel={() => setActiveSession(null)}
              onDismiss={() => setActiveSession(null)}
            />
          )}

          {/* Hero Drag & Drop Zone */}
          <DropZone
            onFilesSelected={handleFilesSelected}
            targetDevice={selectedDevice}
            onOpenExplorer={() => setIsExplorerOpen(true)}
          />

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div
              onClick={() => setIsExplorerOpen(true)}
              className="p-5 rounded-2xl glass-panel-subtle hover:border-purple-500/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Browse Phone Remotely</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore camera photos, downloads, and scoped storage directly from PC with 1-click download.
              </p>
            </div>

            <div
              onClick={() => setIsBackupOpen(true)}
              className="p-5 rounded-2xl glass-panel-subtle hover:border-emerald-500/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Photo Auto-Backup</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lossless camera roll sync over Wi-Fi when plugged in. Zero duplicates via BLAKE3 hashes.
              </p>
            </div>

            <div
              onClick={() => setIsClipboardOpen(true)}
              className="p-5 rounded-2xl glass-panel-subtle hover:border-cyan-500/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Mirrored Clipboard</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant sync of copied text, links, or screenshots. End-to-end encrypted over LAN.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Modals & Drawers */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        pin={currentPin}
        ipAddress={selectedDevice?.ip || '192.168.1.100'}
        port={53318}
        onSimulatePair={handleSimulatePair}
      />

      <RemoteExplorer
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        device={selectedDevice}
        onDownloadFile={handleDownloadRemoteFile}
      />

      <ClipboardSync
        isOpen={isClipboardOpen}
        onClose={() => setIsClipboardOpen(false)}
        isEnabled={clipboardEnabled}
        onToggle={setClipboardEnabled}
        onSendText={(t) => console.log('Sent clipboard text:', t)}
      />

      <AutoBackupCenter
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        device={selectedDevice}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={history}
      />
    </div>
  );
};
