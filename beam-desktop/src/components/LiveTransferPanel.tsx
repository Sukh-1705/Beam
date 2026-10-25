import React, { useEffect } from 'react';
import { CheckCircle2, Pause, Play, X, ShieldCheck, Activity, Clock, HardDrive, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TransferSession, FileItem } from '../types';

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
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#10b981', '#38bdf8'],
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

  // Generate SVG path for speed history graph
  const renderSpeedGraph = () => {
    const history = session.speedHistory;
    if (history.length < 2) return null;

    const maxSpeed = Math.max(...history, 100);
    const width = 240;
    const height = 48;
    const step = width / (history.length - 1);

    const points = history.map((val, idx) => {
      const x = idx * step;
      const y = height - (val / maxSpeed) * (height - 6) - 3;
      return `${x},${y}`;
    });

    const d = `M ${points.join(' L ')}`;

    return (
      <svg className="w-full h-12 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="speedGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d={`${d} L ${width},${height} L 0,${height} Z`}
          fill="url(#speedGlow)"
        />
        <path
          d={d}
          fill="none"
          stroke="#c084fc"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Ambient header glow */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        session.status === 'completed'
          ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
          : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 animate-pulse'
      }`} />

      {/* Top Session Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${
              session.status === 'completed'
                ? 'bg-emerald-400'
                : session.status === 'paused'
                ? 'bg-amber-400'
                : 'bg-purple-400 animate-ping'
            }`} />
            <h3 className="text-lg font-bold text-white tracking-tight">
              {session.status === 'completed'
                ? 'Transfer Complete & Verified Identical'
                : session.direction === 'outgoing'
                ? `Sending to ${session.targetDevice.name}`
                : `Receiving from ${session.targetDevice.name}`}
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
              {session.files.length} {session.files.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2 font-mono">
            <span>{formatBytes(session.transferredBytes)} / {formatBytes(session.totalBytes)}</span>
            <span>•</span>
            <span className="text-purple-300 font-semibold">{session.overallPercent.toFixed(1)}%</span>
            <span>•</span>
            <span className="text-slate-400">ETA: {formatEta(session.etaSeconds)}</span>
          </p>
        </div>

        {/* Speedometer & Metric Graph */}
        <div className="flex items-center space-x-6">
          <div className="w-48 hidden lg:block">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center space-x-1">
                <Activity className="w-3 h-3 text-purple-400" />
                <span>Link Speed</span>
              </span>
              <span className="font-bold text-white text-xs">{session.currentSpeedMbps.toFixed(1)} Mbps</span>
            </div>
            {renderSpeedGraph()}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {session.status === 'active' && (
              <button
                onClick={onPause}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Pause transfer"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {session.status === 'paused' && (
              <button
                onClick={onResume}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-colors"
                title="Resume transfer"
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            {session.status !== 'completed' ? (
              <button
                onClick={onCancel}
                className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-500/20 transition-colors"
                title="Cancel transfer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onDismiss}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6 p-[2px] border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            session.status === 'completed'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50'
              : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 shadow-lg shadow-purple-500/50'
          }`}
          style={{ width: `${session.overallPercent}%` }}
        />
      </div>

      {/* Individual File Items List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {session.files.map((file) => (
          <div
            key={file.id}
            className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 overflow-hidden pr-4">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                {file.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <HardDrive className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatBytes(file.size)}
                  {file.blake3Hash && (
                    <span className="ml-2 text-slate-500">
                      BLAKE3: {file.blake3Hash.slice(0, 10)}...
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Status / Verified Badge */}
            <div className="shrink-0 flex items-center space-x-2">
              {file.status === 'completed' ? (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✓ Verified identical</span>
                </div>
              ) : file.status === 'transferring' ? (
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-purple-300">{file.progress.toFixed(0)}%</span>
                  <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              ) : file.status === 'corrupt_retry' ? (
                <div className="flex items-center space-x-1 text-xs text-amber-300">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Re-sending chunk...</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium capitalize">{file.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
