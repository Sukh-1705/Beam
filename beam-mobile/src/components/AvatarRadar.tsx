import React from 'react';
import { Monitor, Smartphone, ShieldCheck, Radio, Sparkles } from 'lucide-react';
import { Device } from '../types';

interface AvatarRadarProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  isScanning: boolean;
}

export const AvatarRadar: React.FC<AvatarRadarProps> = ({
  devices,
  onSelectDevice,
  isScanning,
}) => {
  return (
    <div className="px-5 py-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Nearby Devices ({devices.length})
          </h2>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Tap to quick-beam</span>
      </div>

      {/* Horizontal Avatar Scroll List */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none">
        {devices.map((device) => (
          <div
            key={device.id}
            onClick={() => onSelectDevice(device)}
            className="flex-shrink-0 flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
          >
            {/* Avatar Circle with Glow */}
            <div className="relative mb-2">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center p-[2px] shadow-lg transition-transform group-hover:scale-105 ${
                  device.avatarColor === 'purple'
                    ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 shadow-purple-600/30'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/30'
                }`}
              >
                <div className="w-full h-full bg-[#141824] rounded-[14px] flex items-center justify-center text-white">
                  {device.type === 'desktop' ? (
                    <Monitor className="w-7 h-7 text-purple-300" />
                  ) : (
                    <Smartphone className="w-7 h-7 text-emerald-300" />
                  )}
                </div>
              </div>

              {/* Verified Shield Badge */}
              {device.isTrusted && (
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Name & Speed */}
            <span className="text-xs font-bold text-white tracking-tight max-w-[80px] truncate text-center">
              {device.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {device.linkSpeed.split('·')[0].trim()}
            </span>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="w-full py-8 text-center text-xs text-slate-500">
            Scanning for devices on Wi-Fi...
          </div>
        )}
      </div>
    </div>
  );
};
