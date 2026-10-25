import React from 'react';
import { Zap, QrCode, Wifi, BatteryCharging, ShieldCheck, Clipboard } from 'lucide-react';

interface HeaderMobileProps {
  onOpenScanner: () => void;
  onOpenClipboard: () => void;
  isPaired: boolean;
  linkSpeed: string;
}

export const HeaderMobile: React.FC<HeaderMobileProps> = ({
  onOpenScanner,
  onOpenClipboard,
  isPaired,
  linkSpeed,
}) => {
  return (
    <header className="px-5 pt-4 pb-3 flex items-center justify-between glass-panel-subtle sticky top-0 z-30">
      {/* Brand */}
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-md shadow-purple-600/30">
          <div className="w-full h-full bg-[#0d0f17] rounded-[11px] flex items-center justify-center">
            <Zap className="w-4 h-4 text-purple-400 fill-purple-400/20" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="font-extrabold tracking-tight text-base text-white">BEAM</h1>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
              Mobile
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
            <Wifi className="w-2.5 h-2.5 animate-pulse" />
            <span>{linkSpeed}</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenClipboard}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
          title="Shared Clipboard"
        >
          <Clipboard className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenScanner}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-purple-600/30 active:scale-95 transition-all"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Pair PC</span>
        </button>
      </div>
    </header>
  );
};
