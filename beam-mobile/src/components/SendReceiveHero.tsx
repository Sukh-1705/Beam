import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Sparkles, Radio } from 'lucide-react';

interface SendReceiveHeroProps {
  onSendClick: () => void;
  onReceiveClick: () => void;
  isReceiveActive: boolean;
}

export const SendReceiveHero: React.FC<SendReceiveHeroProps> = ({
  onSendClick,
  onReceiveClick,
  isReceiveActive,
}) => {
  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Giant SEND Button */}
        <button
          onClick={onSendClick}
          className="relative group overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-left shadow-xl shadow-purple-600/30 active:scale-[0.97] transition-all duration-200 border border-purple-400/30 flex flex-col justify-between h-44"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          {/* Icon Circle */}
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
            <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="text-xl font-extrabold text-white tracking-tight">SEND</span>
              <Sparkles className="w-4 h-4 text-purple-200" />
            </div>
            <p className="text-xs text-purple-100/80 font-medium">
              Photos, RAW, 4K, Folders
            </p>
          </div>
        </button>

        {/* Giant RECEIVE Button */}
        <button
          onClick={onReceiveClick}
          className="relative group overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-800 text-left shadow-xl shadow-emerald-600/25 active:scale-[0.97] transition-all duration-200 border border-emerald-400/30 flex flex-col justify-between h-44"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          {/* Icon Circle */}
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner relative">
            <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="text-xl font-extrabold text-white tracking-tight">RECEIVE</span>
              <Radio className="w-4 h-4 text-emerald-200 animate-pulse" />
            </div>
            <p className="text-xs text-emerald-100/80 font-medium">
              Discoverable on Wi-Fi
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
