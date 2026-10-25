import React, { useState } from 'react';
import { X, FolderCheck, ToggleRight, ToggleLeft, ShieldCheck, HardDrive, RefreshCw } from 'lucide-react';

interface MobilePhotoBackupProps {
  isOpen: boolean;
  onClose: () => void;
  targetPCName: string;
}

export const MobilePhotoBackup: React.FC<MobilePhotoBackupProps> = ({
  isOpen,
  onClose,
  targetPCName,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [chargingOnly, setChargingOnly] = useState(true);
  const [freeUpSpace, setFreeUpSpace] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  if (!isOpen) return null;

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-sm rounded-[32px] p-6 border border-white/10 shadow-2xl relative text-left flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <FolderCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Camera Roll Backup</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400">Archived to {targetPCName}</span>
            <h4 className="text-lg font-mono font-bold text-white">4,812 Photos</h4>
            <p className="text-[11px] text-slate-400">Byte-for-byte original quality</p>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {syncDone && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4" />
            <span>✓ Verified identical backup complete!</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-xs font-semibold text-slate-200">Auto-Backup on Home Wi-Fi</p>
              <p className="text-[10px] text-slate-400">Runs silently via Background Service</p>
            </div>
            <button onClick={() => setEnabled(!enabled)}>
              {enabled ? (
                <ToggleRight className="w-7 h-7 text-emerald-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 cursor-pointer" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-xs font-semibold text-slate-200">Only While Charging</p>
              <p className="text-[10px] text-slate-400">Prevents mobile battery drain</p>
            </div>
            <button onClick={() => setChargingOnly(!chargingOnly)}>
              {chargingOnly ? (
                <ToggleRight className="w-7 h-7 text-emerald-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 cursor-pointer" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
            <div>
              <p className="text-xs font-semibold text-slate-200">Free Up Space (Opt-in)</p>
              <p className="text-[10px] text-slate-400">Delete phone copy after verified backup</p>
            </div>
            <button onClick={() => setFreeUpSpace(!freeUpSpace)}>
              {freeUpSpace ? (
                <ToggleRight className="w-7 h-7 text-red-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};
