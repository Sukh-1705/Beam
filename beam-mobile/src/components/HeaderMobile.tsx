import React from 'react';
import { Zap, QrCode, Wifi, Flame, Clipboard } from 'lucide-react';

interface HeaderMobileProps {
  onOpenScanner: () => void;
  onOpenClipboard: () => void;
  isPaired: boolean;
  linkSpeed: string;
  pcName?: string;
}

export const HeaderMobile: React.FC<HeaderMobileProps> = ({
  onOpenScanner,
  onOpenClipboard,
  isPaired,
  linkSpeed,
  pcName = 'Desktop PC',
}) => {
  const isHotspot = linkSpeed?.toLowerCase().includes('hotspot');

  return (
    <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.06] bg-[#08090d]/80 backdrop-blur-xl sticky top-0 z-30">
      {/* Brand & Connection State */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold tracking-tight text-sm text-white">BEAM</span>
            <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400">
              MOBILE
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isPaired ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className={isPaired ? 'text-zinc-300' : 'text-zinc-400'}>
              {isPaired ? pcName : 'Ready to Connect'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenClipboard}
          className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          title="Shared Clipboard"
        >
          <Clipboard className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenScanner}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isPaired
              ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08]'
              : 'bg-white text-zinc-950 font-semibold shadow-sm'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>{isPaired ? 'Configure' : 'Connect'}</span>
        </button>
      </div>
    </header>
  );
};
