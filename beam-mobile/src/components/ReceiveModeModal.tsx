import React from 'react';
import { X, Radio, ArrowDownLeft, ShieldCheck, Wifi } from 'lucide-react';

interface ReceiveModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceName: string;
}

export const ReceiveModeModal: React.FC<ReceiveModeModalProps> = ({
  isOpen,
  onClose,
  deviceName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-sm rounded-[32px] p-6 border border-white/10 shadow-2xl relative text-center flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Radar Ripple Circles */}
        <div className="relative my-8 w-44 h-44 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping duration-1000" />
          <div className="absolute inset-4 rounded-full border border-teal-500/30 animate-pulse" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/50">
            <ArrowDownLeft className="w-10 h-10 stroke-[2.5]" />
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight mb-1">
          Ready to Receive
        </h3>
        <p className="text-xs text-emerald-300 font-semibold mb-4">
          Visible to PC & nearby Beam devices
        </p>

        <div className="w-full space-y-2.5 mb-6 text-left">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Device Name</span>
            <span className="text-xs font-bold text-white">{deviceName}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Auto-Accept</span>
            <div className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Trusted Devices</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Connection</span>
            <span className="text-xs font-mono text-purple-300">Wi-Fi 6 · Port 53318</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
        >
          Hide to Background Service
        </button>
      </div>
    </div>
  );
};
