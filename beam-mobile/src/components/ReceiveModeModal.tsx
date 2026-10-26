import React from 'react';
import { X, ArrowDownLeft, ShieldCheck, Wifi, Folder } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative text-center flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Clean Icon */}
        <div className="my-6 w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white shadow-sm">
          <ArrowDownLeft className="w-6 h-6 stroke-[2]" />
        </div>

        <h3 className="text-base font-semibold text-white tracking-tight mb-1">
          Receive Mode Active
        </h3>
        <p className="text-xs text-zinc-400 mb-5">
          Ready to receive files from paired desktop or phone
        </p>

        <div className="w-full space-y-2 mb-6 text-left">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-zinc-400">Device Identity</span>
            <span className="font-medium text-white">{deviceName}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-zinc-400">Save Destination</span>
            <span className="font-mono text-zinc-200">Downloads/Beam</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-zinc-400">Security</span>
            <div className="flex items-center space-x-1 text-emerald-400 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Lossless SHA-256</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full btn-secondary py-2.5 rounded-xl text-xs"
        >
          Keep Listening in Background
        </button>
      </div>
    </div>
  );
};
