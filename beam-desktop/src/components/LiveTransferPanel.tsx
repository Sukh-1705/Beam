import React, { useEffect } from 'react';
import { CheckCircle2, Pause, Play, X, ShieldCheck, Activity, Clock, HardDrive, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TransferSession } from '../types';

interface LiveTransferPanelProps {
  session: TransferSession;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export const LiveTransferPanel: React.FC<LiveTransferPanelProps> = ({
  session,
  onPause,
  onResume,
  onCancel,
  onDismiss,
}) => {
  useEffect(() => {
    if (session.status === 'completed') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#10b981', '#6366f1'],
      });
    }
  }, [session.status]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatEta = (seconds: number) => {
    if (seconds <= 0 || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="surface-card rounded-2xl p-6 border border-white/[0.08] shadow-2xl relative overflow-hidden">
      {/* Top Session Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className={`w-2 h-2 rounded-full ${
              session.status === 'completed'
                ? 'bg-emerald-400'
                : session.status === 'paused'
                ? 'bg-amber-400'
                : 'bg-indigo-400 animate-pulse'
            }`} />
            <h3 className="text-base font-semibold text-white tracking-tight">
              {session.status === 'completed'
                ? 'Transfer Complete & Lossless Verified'
                : session.direction === 'outgoing'
                ? `Streaming to ${session.targetDevice.name}`
                : `Receiving from ${session.targetDevice.name}`}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.06]">
              {session.files.length} {session.files.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          <p className="text-xs text-zinc-400 mt-1 flex items-center space-x-2 font-mono">
            <span>{formatBytes(session.transferredBytes)} / {formatBytes(session.totalBytes)}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-white font-semibold">{session.overallPercent.toFixed(1)}%</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">ETA: {formatEta(session.etaSeconds)}</span>
          </p>
        </div>

        {/* Speedometer & Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] font-mono text-xs">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-400">Rate:</span>
            <span className="text-white font-semibold">{session.currentSpeedMbps.toFixed(1)} Mbps</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1.5">
            {session.status === 'active' && (
              <button
                onClick={onPause}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors"
                title="Pause transfer"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {session.status === 'paused' && (
              <button
                onClick={onResume}
                className="p-2 rounded-lg bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors"
                title="Resume transfer"
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            {session.status !== 'completed' ? (
              <button
                onClick={onCancel}
                className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-300 border border-red-500/20 transition-colors"
                title="Cancel transfer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onDismiss}
                className="btn-primary px-4 py-1.5 rounded-lg text-xs"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="relative w-full h-2 bg-zinc-900 rounded-full overflow-hidden mb-5 border border-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            session.status === 'completed'
              ? 'bg-emerald-400'
              : 'bg-indigo-500'
          }`}
          style={{ width: `${session.overallPercent}%` }}
        />
      </div>

      {/* Individual File Items List */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {session.files.map((file) => (
          <div
            key={file.id}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 overflow-hidden pr-4">
              <div className="w-7 h-7 rounded-md bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                {file.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">{file.name}</p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {formatBytes(file.size)}
                  {file.blake3Hash && (
                    <span className="ml-2 text-zinc-500">
                      SHA-256: {file.blake3Hash.slice(0, 8)}...
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Status / Verified Badge */}
            <div className="shrink-0 flex items-center space-x-2">
              {file.status === 'completed' ? (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✓ Verified Identical</span>
                </div>
              ) : file.status === 'transferring' ? (
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-zinc-200">{file.progress.toFixed(0)}%</span>
                  <div className="w-16 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 font-medium capitalize">{file.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
