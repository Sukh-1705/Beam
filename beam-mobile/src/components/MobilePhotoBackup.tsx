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
  const [chargingOnly, setChargingOnly] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  if (!isOpen) return null;

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative text-left flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 flex items-center justify-center">
              <FolderCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Camera Roll Archival</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-medium text-emerald-400">Streamed to {targetPCName}</span>
            <h4 className="text-base font-mono font-bold text-white mt-0.5">4,812 Photos</h4>
            <p className="text-[11px] text-zinc-400">Byte-for-byte lossless</p>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {syncDone && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>✓ Verified identical to PC storage</span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div>
              <p className="text-xs font-medium text-zinc-200">Auto-Backup on Connect</p>
              <p className="text-[10px] text-zinc-400">Syncs when paired to workstation</p>
            </div>
            <button onClick={() => setEnabled(!enabled)}>
              {enabled ? (
                <ToggleRight className="w-6 h-6 text-indigo-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-zinc-600 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full btn-secondary py-2.5 rounded-xl text-xs"
        >
          Close
        </button>
      </div>
    </div>
  );
};
