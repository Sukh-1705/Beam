import React from 'react';
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, Wifi, Flame, Image, FileText, Download, CheckCircle2 } from 'lucide-react';

interface SendReceiveHeroProps {
  onSendClick: () => void;
  onReceiveClick: () => void;
  isReceiveActive: boolean;
  isPaired: boolean;
  pcName: string;
  pcIp: string;
  pcPort: string;
  onOpenScanner: () => void;
  pendingCount?: number;
}

export const SendReceiveHero: React.FC<SendReceiveHeroProps> = ({
  onSendClick,
  onReceiveClick,
  isReceiveActive,
  isPaired,
  pcName,
  pcIp,
  pcPort,
  onOpenScanner,
  pendingCount = 0,
}) => {
  return (
    <div className="px-5 py-3 space-y-3">
      {/* Peer Connection Status Banner */}
      <div 
        onClick={onOpenScanner}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
          isPaired
            ? 'surface-card border-emerald-500/20 bg-emerald-500/[0.03]'
            : 'surface-card border-white/[0.08] hover:border-white/[0.14]'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            isPaired 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-zinc-900 text-zinc-400 border border-white/10'
          }`}>
            {isPaired ? '✓' : '●'}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-white tracking-tight">
                {isPaired ? pcName : 'Connect to PC'}
              </span>
              {isPaired && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Lossless Link
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              {isPaired ? `${pcIp}:${pcPort}` : 'Tap to scan QR or enter IP'}
            </p>
          </div>
        </div>

        <button className="text-[11px] font-medium text-zinc-300 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08]">
          {isPaired ? 'Config' : 'Pair'}
        </button>
      </div>

      {/* Main Send & Receive Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Clean SEND Card */}
        <div
          onClick={onSendClick}
          className="surface-card rounded-2xl p-4 border border-white/[0.08] hover:border-white/[0.16] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between h-40 group"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm">
              <ArrowUpRight className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Send</span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight mb-0.5">
              Send to PC
            </h3>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Photos, 4K, RAW, APKs
            </p>
          </div>
        </div>

        {/* Clean RECEIVE Card */}
        <div
          onClick={onReceiveClick}
          className="surface-card rounded-2xl p-4 border border-white/[0.08] hover:border-white/[0.16] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between h-40 group relative"
        >
          {pendingCount > 0 && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[10px] animate-pulse">
              {pendingCount} ready
            </span>
          )}

          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm">
              <ArrowDownLeft className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Receive</span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight mb-0.5">
              Receive Mode
            </h3>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Auto-saves to storage
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
