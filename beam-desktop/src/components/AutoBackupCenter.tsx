import React, { useState } from 'react';
import { X, Smartphone, FolderCheck, ShieldCheck, ToggleRight, ToggleLeft, RefreshCw, HardDrive, Calendar } from 'lucide-react';
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
  const [wifiOnly, setWifiOnly] = useState(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Photo & Video Auto-Backup</h3>
              <p className="text-xs text-slate-400">Lossless archival directly to your PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Card */}
        <div className="my-5 p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Protected & Synchronized
            </span>
            <h4 className="text-xl font-mono font-extrabold text-white">4,812 Items</h4>
            <p className="text-xs text-slate-400 font-mono">148.6 GB • 0 Duplicates (BLAKE3)</p>
          </div>
          <button
            onClick={handleManualBackup}
            disabled={isBackingUp}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
            <span>{isBackingUp ? 'Backing Up...' : 'Sync Now'}</span>
          </button>
        </div>

        {backupSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>✓ All new photos verified and saved to ~/Pictures/BeamBackup!</span>
          </div>
        )}

        {/* Settings switches */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-xs font-semibold text-slate-200">Automatic Sync on Arrival</p>
              <p className="text-[11px] text-slate-400">Sync when phone connects to home network</p>
            </div>
            <button onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}>
              {autoSyncEnabled ? (
                <ToggleRight className="w-7 h-7 text-emerald-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 cursor-pointer" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-xs font-semibold text-slate-200">Organize by Date & Album</p>
              <p className="text-[11px] text-slate-400">Save into Year/Month structure with original EXIF</p>
            </div>
            <button onClick={() => setOrganizeByDate(!organizeByDate)}>
              {organizeByDate ? (
                <ToggleRight className="w-7 h-7 text-emerald-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 cursor-pointer" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-xs font-semibold text-slate-200">Only While Charging</p>
              <p className="text-[11px] text-slate-400">Conserves mobile phone battery during large transfers</p>
            </div>
            <button onClick={() => setChargingOnly(!chargingOnly)}>
              {chargingOnly ? (
                <ToggleRight className="w-7 h-7 text-emerald-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {/* Destination folder */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>Destination: C:\Users\User\Pictures\Beam</span>
          </div>
          <button className="text-purple-300 hover:text-purple-200 underline font-sans text-xs">
            Change
          </button>
        </div>
      </div>
    </div>
  );
};
