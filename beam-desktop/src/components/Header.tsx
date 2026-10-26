import React, { useState } from 'react';
import { Wifi, Usb, Zap, QrCode, Clipboard, History, Settings, Folder, Copy, Check, Radio, HelpCircle, ArrowUpRight } from 'lucide-react';
import { Device } from '../types';

interface HeaderProps {
  activeDevice: Device | null;
  onOpenPairing: () => void;
  onOpenClipboard: () => void;
  onOpenHistory: () => void;
  onOpenBackup: () => void;
  onOpenFolder?: () => void;
  clipboardCount: number;
  localIp?: string;
  port?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeDevice,
  onOpenPairing,
  onOpenClipboard,
  onOpenHistory,
  onOpenBackup,
  onOpenFolder,
  clipboardCount,
  localIp = '10.50.0.136',
  port = 53317,
}) => {
  const [copiedIp, setCopiedIp] = useState(false);

  const handleCopyIp = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`http://${localIp}:${port}`);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  return (
    <header className="h-16 px-6 border-b border-white/[0.06] bg-[#08090d]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3.5">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-tight text-sm text-white">BEAM</span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
            PRO
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-xs text-zinc-400 font-normal">Lossless Direct Stream</span>
        </div>
      </div>

      {/* Network & Live Peer Indicator */}
      <div className="hidden lg:flex items-center space-x-3">
        {activeDevice ? (
          <div 
            onClick={onOpenPairing}
            className="cursor-pointer surface-pill px-3.5 py-1.5 rounded-full flex items-center space-x-2.5 text-xs border border-emerald-500/20 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-300 font-medium">
              Linked to <strong className="text-white font-semibold">{activeDevice.name}</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-mono text-[11px]">{activeDevice.linkSpeed || 'Direct Wi-Fi Link'}</span>
          </div>
        ) : (
          <div 
            onClick={onOpenPairing}
            className="cursor-pointer surface-pill px-3.5 py-1.5 rounded-full flex items-center space-x-2.5 text-xs border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-zinc-400">
              LAN Ready: <span className="text-zinc-200 font-mono font-medium">{localIp}:{port}</span>
            </span>
            <button
              onClick={handleCopyIp}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy connection address"
            >
              {copiedIp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center space-x-2">
        {onOpenFolder && (
          <button
            onClick={onOpenFolder}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            title="Open Received Files Folder (Downloads/Beam)"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Received Files</span>
          </button>
        )}

        <button
          onClick={onOpenClipboard}
          className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
          title="Universal Clipboard Mirror"
        >
          <Clipboard className="w-4 h-4" />
          {clipboardCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
          )}
        </button>

        <button
          onClick={onOpenHistory}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
          title="Transfer History & Verification Logs"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenPairing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Pair Device</span>
        </button>
      </div>
    </header>
  );
};
