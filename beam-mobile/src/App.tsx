import React, { useState, useEffect } from 'react';
import { HeaderMobile } from './components/HeaderMobile';
import { SendReceiveHero } from './components/SendReceiveHero';
import { AvatarRadar } from './components/AvatarRadar';
import { MobileFilePicker } from './components/MobileFilePicker';
import { MobileTransferModal } from './components/MobileTransferModal';
import { QRScannerModal } from './components/QRScannerModal';
import { ReceiveModeModal } from './components/ReceiveModeModal';
import { MobilePhotoBackup } from './components/MobilePhotoBackup';
import { MobileClipboard } from './components/MobileClipboard';
import { Device, MobileMediaItem, MobileTransferProgress } from './types';
import { ShieldCheck, ArrowDownLeft, ArrowUpRight, FolderCheck, HardDrive, Smartphone, Sparkles, Folder } from 'lucide-react';

const NEARBY_DEVICES: Device[] = [
  {
    id: 'pc-workstation-1',
    name: 'Workstation PC',
    type: 'desktop',
    model: 'Windows 11 Workstation',
    os: 'Windows',
    ip: '192.168.1.100',
    port: 53318,
    isTrusted: true,
    linkSpeed: 'Wi-Fi 6 · 860 Mbps',
    avatarColor: 'purple',
  },
  {
    id: 'macbook-pro-1',
    name: "Alex's MacBook",
    type: 'desktop',
    model: 'MacBook Pro M3',
    os: 'macOS',
    ip: '192.168.1.112',
    port: 53318,
    isTrusted: true,
    linkSpeed: 'Wi-Fi 6 · 810 Mbps',
    avatarColor: 'emerald',
  },
];

interface MobileRecentTransfer {
  id: string;
  name: string;
  size: string;
  target: string;
  direction: 'outgoing' | 'incoming';
  time: string;
  verified: boolean;
}

const INITIAL_RECENTS: MobileRecentTransfer[] = [
  {
    id: 'r1',
    name: 'DSC_4812_PRORES_4K.mov',
    size: '680 MB',
    target: 'Workstation PC',
    direction: 'outgoing',
    time: '12 mins ago',
    verified: true,
  },
  {
    id: 'r2',
    name: 'Architectural_Diagrams.pdf',
    size: '14.2 MB',
    target: 'Workstation PC',
    direction: 'incoming',
    time: '2 hours ago',
    verified: true,
  },
];

export const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>(NEARBY_DEVICES);
  const [selectedTarget, setSelectedTarget] = useState<Device>(NEARBY_DEVICES[0]);
  const [recents, setRecents] = useState<MobileRecentTransfer[]>(INITIAL_RECENTS);

  // Modals state
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);

  // Active Transfer State
  const [activeTransfer, setActiveTransfer] = useState<MobileTransferProgress | null>(null);

  const handleStartSend = () => {
    setIsFilePickerOpen(true);
  };

  const handleStartReceive = () => {
    setIsReceiveOpen(true);
  };

  const handleSendItems = (items: MobileMediaItem[]) => {
    setIsFilePickerOpen(false);

    const totalBytes = items.reduce((acc, it) => acc + it.size, 0);
    const firstName = items.length === 1 ? items[0].name : `${items.length} Files Bundle`;

    const progress: MobileTransferProgress = {
      fileName: firstName,
      fileIndex: 0,
      totalFiles: items.length,
      transferredBytes: 0,
      totalBytes,
      speedMbps: 840,
      percent: 0,
      status: 'transferring',
      verifiedIdentical: false,
      blake3Hash: 'blake3_' + Math.random().toString(36).slice(2, 12),
    };

    setActiveTransfer(progress);
  };

  // Simulate streaming transfer
  useEffect(() => {
    if (!activeTransfer || activeTransfer.status !== 'transferring') return;

    const interval = setInterval(() => {
      setActiveTransfer((prev) => {
        if (!prev || prev.status !== 'transferring') return prev;

        const nextTransferred = prev.transferredBytes + Math.max(prev.totalBytes * 0.15, 600_000);
        const nextPercent = Math.min(100, (nextTransferred / prev.totalBytes) * 100);
        const currentSpeed = 780 + Math.random() * 140;

        if (nextPercent >= 100) {
          clearInterval(interval);

          // Add to recents
          const newRecent: MobileRecentTransfer = {
            id: Date.now().toString(),
            name: prev.fileName,
            size: `${(prev.totalBytes / (1024 * 1024)).toFixed(1)} MB`,
            target: selectedTarget.name,
            direction: 'outgoing',
            time: 'Just now',
            verified: true,
          };
          setRecents((r) => [newRecent, ...r]);

          return {
            ...prev,
            transferredBytes: prev.totalBytes,
            percent: 100,
            status: 'completed',
            verifiedIdentical: true,
            speedMbps: currentSpeed,
          };
        }

        return {
          ...prev,
          transferredBytes: nextTransferred,
          percent: nextPercent,
          speedMbps: currentSpeed,
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [activeTransfer?.status]);

  const handlePairedNewPC = (info: { name: string; ip: string }) => {
    const newDev: Device = {
      id: `pc-${Date.now()}`,
      name: info.name,
      type: 'desktop',
      model: 'PC Workstation',
      os: 'Windows/macOS',
      ip: info.ip,
      port: 53318,
      isTrusted: true,
      linkSpeed: 'Wi-Fi 6 · 860 Mbps',
      avatarColor: 'purple',
    };
    setDevices([newDev, ...devices]);
    setSelectedTarget(newDev);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0d14] text-slate-100 max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      {/* Top Header */}
      <HeaderMobile
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenClipboard={() => setIsClipboardOpen(true)}
        isPaired={true}
        linkSpeed="Wi-Fi 6 · 860 Mbps"
      />

      <div className="flex-1 pb-20 space-y-4">
        {/* Giant Hero Action Buttons: SEND & RECEIVE */}
        <SendReceiveHero
          onSendClick={handleStartSend}
          onReceiveClick={handleStartReceive}
          isReceiveActive={isReceiveOpen}
        />

        {/* Nearby Devices Avatar Radar */}
        <AvatarRadar
          devices={devices}
          onSelectDevice={(d) => {
            setSelectedTarget(d);
            setIsFilePickerOpen(true);
          }}
          isScanning={false}
        />

        {/* Feature Cards Row */}
        <div className="px-5 grid grid-cols-2 gap-3">
          <div
            onClick={() => setIsBackupOpen(true)}
            className="p-3.5 rounded-2xl glass-panel-subtle border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2">
              <FolderCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">Auto-Backup</h4>
            <p className="text-[10px] text-slate-400">Archived to {selectedTarget.name}</p>
          </div>

          <div
            onClick={() => setIsClipboardOpen(true)}
            className="p-3.5 rounded-2xl glass-panel-subtle border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">Shared Clipboard</h4>
            <p className="text-[10px] text-slate-400">Copy here, paste on PC</p>
          </div>
        </div>

        {/* Recent Transfers List */}
        <div className="px-5 pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recent Transfers
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Lossless & Verified</span>
          </div>

          <div className="space-y-2">
            {recents.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 overflow-hidden pr-2">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    {item.direction === 'outgoing' ? (
                      <ArrowUpRight className="w-4 h-4 text-purple-400" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {item.size} • to {item.target} • {item.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-panel border-t border-white/10 px-6 py-3 flex items-center justify-around z-20">
        <button
          onClick={handleStartSend}
          className="flex flex-col items-center space-y-1 text-purple-400"
        >
          <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] font-bold">Send</span>
        </button>

        <button
          onClick={handleStartReceive}
          className="flex flex-col items-center space-y-1 text-slate-400 hover:text-white"
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span className="text-[10px] font-medium">Receive</span>
        </button>

        <button
          onClick={() => setIsBackupOpen(true)}
          className="flex flex-col items-center space-y-1 text-slate-400 hover:text-white"
        >
          <FolderCheck className="w-5 h-5" />
          <span className="text-[10px] font-medium">Backup</span>
        </button>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex flex-col items-center space-y-1 text-slate-400 hover:text-white"
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-[10px] font-medium">Pair PC</span>
        </button>
      </nav>

      {/* Modals & Dialogs */}
      <MobileFilePicker
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        onSendItems={handleSendItems}
        targetDeviceName={selectedTarget.name}
      />

      <MobileTransferModal
        isOpen={Boolean(activeTransfer)}
        onClose={() => setActiveTransfer(null)}
        progress={activeTransfer}
        targetDeviceName={selectedTarget.name}
      />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onPaired={handlePairedNewPC}
      />

      <ReceiveModeModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        deviceName="Pixel 9 Pro"
      />

      <MobilePhotoBackup
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        targetPCName={selectedTarget.name}
      />

      <MobileClipboard
        isOpen={isClipboardOpen}
        onClose={() => setIsClipboardOpen(false)}
        targetPCName={selectedTarget.name}
      />
    </div>
  );
};
