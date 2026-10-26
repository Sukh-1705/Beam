import React from 'react';
import { Monitor, Smartphone, ShieldCheck, Wifi } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
          Nearby Workstations
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
          {devices.length > 0 ? `${devices.length} Found` : 'LAN Broadcast'}
        </span>
      </div>

      {/* Clean Horizontal Peer List */}
      <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 no-scrollbar -mx-5 px-5">
        {devices.map((device) => (
          <div
            key={device.id}
            onClick={() => onSelectDevice(device)}
            className="flex-shrink-0 p-3 rounded-xl surface-card border border-white/[0.08] hover:border-white/[0.16] cursor-pointer flex items-center space-x-2.5 active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-white shrink-0">
              {device.type === 'desktop' ? (
                <Monitor className="w-4 h-4" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
            </div>
            <div className="text-left pr-1">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[100px]">
                  {device.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block">
                {device.linkSpeed?.split('·')[0].trim() || 'Direct Link'}
              </span>
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="w-full py-4 px-3 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] text-center text-xs text-zinc-500">
            Scanning for PCs on same network...
          </div>
        )}
      </div>
    </div>
  );
};
