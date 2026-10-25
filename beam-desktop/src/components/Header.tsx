import React from 'react';
import { Wifi, Usb, Zap, QrCode, Clipboard, History, Settings, Smartphone, Monitor } from 'lucide-react';
import { Device } from '../types';

interface HeaderProps {
  activeDevice: Device | null;
  onOpenPairing: () => void;
  onOpenClipboard: () => void;
  onOpenHistory: () => void;
  onOpenBackup: () => void;
  clipboardCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeDevice,
  onOpenPairing,
  onOpenClipboard,
  onOpenHistory,
  onOpenBackup,
  clipboardCount,
}) => {
  return (
    <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between glass-panel-subtle sticky top-0 z-30">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
          <div className="w-full h-full bg-[#0d0f17] rounded-[11px] flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400 fill-purple-400/20" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
              BEAM
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Desktop Pro
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Zero-Loss Local Stream</p>
        </div>
      </div>

      {/* Live Link Status Pill */}
      <div className="hidden md:flex items-center space-x-3">
        {activeDevice ? (
          <div className="glass-pill px-3.5 py-1.5 rounded-full flex items-center space-x-2.5 text-xs text-slate-200 border border-emerald-500/30 bg-emerald-950/20 shadow-sm">
            {activeDevice.connectionType === 'usb' ? (
              <Usb className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            )}
            <span className="font-medium text-emerald-300">
              Connected to <span className="text-white font-semibold">{activeDevice.name}</span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-[11px] text-emerald-400/90 font-semibold">{activeDevice.linkSpeed}</span>
          </div>
        ) : (
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
            <span>LAN Standby · Awaiting peer</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenPairing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 transition-all hover:scale-105 active:scale-95"
          title="Pair New Device via QR or PIN"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Pair Device</span>
        </button>

        <button
          onClick={onOpenClipboard}
          className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
          title="Shared Clipboard Mirror"
        >
          <Clipboard className="w-4 h-4" />
          {clipboardCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={onOpenBackup}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
          title="Photo & Video Auto-Backup"
        >
          <Smartphone className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenHistory}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
          title="Transfer History & Hashes"
        >
          <History className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
