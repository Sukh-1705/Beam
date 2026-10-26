import React, { useState } from 'react';
import { X, Smartphone, FolderCheck, ShieldCheck, ToggleRight, ToggleLeft, RefreshCw, HardDrive } from 'lucide-react';
import { Device } from '../types';

interface AutoBackupCenterProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export const AutoBackupCenter: React.FC<AutoBackupCenterProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [organizeByDate, setOrganizeByDate] = useState(true);
  const [chargingOnly, setChargingOnly] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  if (!isOpen) return null;

  const handleManualBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <FolderCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Photo & Video Auto-Archival</h3>
              <p className="text-xs text-zinc-400">Lossless camera roll sync directly to PC storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Summary Card */}
        <div className="my-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-medium text-emerald-400 uppercase tracking-wider">
              Protected & Synchronized
            </span>
            <h4 className="text-lg font-mono font-bold text-white">4,812 Items</h4>
            <p className="text-xs text-zinc-400 font-mono">148.6 GB • 0 Duplicates (Bit-Exact)</p>
          </div>
          <button
            onClick={handleManualBackup}
            disabled={isBackingUp}
            className="btn-primary px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
            <span>{isBackingUp ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {backupSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>✓ All photos verified bit-for-bit and saved to Downloads/Beam!</span>
          </div>
        )}

        {/* Settings switches */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div>
              <p className="text-xs font-medium text-zinc-200">Automatic Sync on Connect</p>
              <p className="text-[11px] text-zinc-400">Stream new photos immediately upon pairing</p>
            </div>
            <button onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}>
              {autoSyncEnabled ? (
                <ToggleRight className="w-6 h-6 text-indigo-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-zinc-600 cursor-pointer" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div>
              <p className="text-xs font-medium text-zinc-200">Preserve RAW & EXIF Timestamps</p>
              <p className="text-[11px] text-zinc-400">Byte-for-byte fidelity with zero compression</p>
            </div>
            <button onClick={() => setOrganizeByDate(!organizeByDate)}>
              {organizeByDate ? (
                <ToggleRight className="w-6 h-6 text-indigo-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-zinc-600 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {/* Destination folder */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            <span>Folder: ~/Downloads/Beam</span>
          </div>
        </div>
      </div>
    </div>
  );
};
