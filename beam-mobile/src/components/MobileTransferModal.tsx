import React, { useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Activity, ArrowUpRight, ArrowDownLeft, X, Smartphone, Monitor } from 'lucide-react';
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
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#10b981', '#38bdf8'],
      });
      // Trigger mobile vibration if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-sm rounded-[32px] p-6 border border-white/10 shadow-2xl relative text-center flex flex-col items-center">
        {/* Close Button if complete */}
        {isCompleted && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Cinematic flying file animation */}
        <div className="relative my-6 w-36 h-28 flex items-center justify-between px-3">
          {/* Source Mobile */}
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>

          {/* Flying particle packet stream */}
          <div className="flex-1 flex justify-center relative">
            <div
              className={`w-4 h-4 rounded-full shadow-lg ${
                isCompleted
                  ? 'bg-emerald-400 shadow-emerald-400/50'
                  : 'bg-gradient-to-r from-purple-400 to-cyan-400 animate-ping shadow-purple-500/50'
              }`}
            />
          </div>

          {/* Destination PC */}
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-lg">
            <Monitor className="w-6 h-6" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-extrabold text-white tracking-tight mb-1">
          {isCompleted ? 'Beam Successful!' : `Beaming to ${targetDeviceName}`}
        </h3>
        <p className="text-xs text-slate-400 font-mono truncate max-w-[240px] mb-4">
          {progress.fileName}
        </p>

        {/* Main Radial / Bar Progress */}
        <div className="w-full bg-white/5 rounded-full h-3.5 p-[2px] border border-white/10 mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400'
            }`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* Progress Stats */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 px-1 mb-5">
          <span>{formatBytes(progress.transferredBytes)} / {formatBytes(progress.totalBytes)}</span>
          <span className="text-purple-300 font-bold">{progress.percent.toFixed(0)}%</span>
        </div>

        {/* Speedometer Badge */}
        <div className="w-full p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Speed</span>
          </div>
          <span className="text-xs font-mono font-bold text-white">
            {progress.speedMbps.toFixed(0)} Mbps (Wi-Fi 6)
          </span>
        </div>

        {/* Verified Identical Badge */}
        {isCompleted ? (
          <div className="w-full p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 mb-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>✓ Verified identical (BLAKE3)</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            Keep Beam open for maximum link throughput
          </p>
        )}

        {isCompleted && (
          <button
            onClick={onClose}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};
