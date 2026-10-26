import React, { useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Activity, X, Smartphone, Monitor, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MobileTransferProgress } from '../types';

interface MobileTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: MobileTransferProgress | null;
  targetDeviceName: string;
}

export const MobileTransferModal: React.FC<MobileTransferModalProps> = ({
  isOpen,
  onClose,
  progress,
  targetDeviceName,
}) => {
  useEffect(() => {
    if (progress?.status === 'completed') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#10b981', '#6366f1'],
      });
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 40, 30]);
      }
    }
  }, [progress?.status]);

  if (!isOpen || !progress) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isCompleted = progress.status === 'completed';
  const isFailed = progress.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative text-center flex flex-col items-center">
        {/* Close Button if complete or failed */}
        {(isCompleted || isFailed) && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Status Graphic */}
        {isCompleted ? (
          <div className="my-5 w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
        ) : isFailed ? (
          <div className="my-5 w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <X className="w-7 h-7 stroke-[2.5]" />
          </div>
        ) : (
          <div className="my-5 w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
            <Activity className="w-6 h-6 animate-pulse text-indigo-400" />
          </div>
        )}

        {/* Headline */}
        <h3 className="text-base font-semibold text-white tracking-tight mb-1">
          {isCompleted
            ? 'Transfer Complete'
            : isFailed
            ? 'Transfer Interrupted'
            : `Streaming to ${targetDeviceName}`}
        </h3>
        <p className="text-xs text-zinc-400 truncate max-w-[240px] font-medium mb-4">
          {progress.fileName}
        </p>

        {/* Progress Bar & Numerical Percentage */}
        <div className="w-full space-y-2 mb-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-400">
              {formatBytes(progress.transferredBytes)} / {formatBytes(progress.totalBytes)}
            </span>
            <span className="font-semibold text-white">{progress.percent}%</span>
          </div>

          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/[0.06]">
            <div
              className={`h-full transition-all duration-200 ${
                isCompleted ? 'bg-emerald-400' : 'bg-indigo-500'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="w-full grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-left text-[11px] font-mono mb-4">
          <div>
            <span className="text-zinc-500 block text-[10px]">Speed</span>
            <span className="text-zinc-200 font-semibold">{progress.speedMbps} Mbps</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Integrity</span>
            <span className={progress.verifiedIdentical ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
              {progress.verifiedIdentical ? '✓ Verified' : 'In Transit'}
            </span>
          </div>
        </div>

        {/* Hash or Error Info */}
        {progress.blake3Hash && (
          <p className="text-[10px] font-mono text-zinc-500 truncate max-w-full mb-4">
            Hash: {progress.blake3Hash}
          </p>
        )}

        {isFailed && (
          <p className="text-xs text-red-400 mb-4">
            {progress.errorMessage || 'Connection lost. Please verify Wi-Fi / Hotspot link.'}
          </p>
        )}

        {/* Dismiss Button */}
        {(isCompleted || isFailed) && (
          <button
            onClick={onClose}
            className="w-full btn-primary py-2.5 rounded-xl text-xs"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};
