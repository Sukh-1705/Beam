import React, { useState } from 'react';
import { Smartphone, Monitor, Wifi, Usb, BatteryCharging, Battery, ShieldCheck, RefreshCw, Radio, QrCode, Copy, Check, Flame } from 'lucide-react';
import { Device } from '../types';

interface DeviceSidebarProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  onRefresh: () => void;
  isScanning: boolean;
  onOpenPairing?: () => void;
  localIp?: string;
  port?: number;
}

export const DeviceSidebar: React.FC<DeviceSidebarProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onRefresh,
  isScanning,
  onOpenPairing,
  localIp = '10.50.0.136',
  port = 53317,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`http://${localIp}:${port}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-80 border-r border-white/[0.06] bg-[#0b0c13]/50 p-5 flex flex-col justify-between h-[calc(100vh-4rem)]">
      <div>
        {/* Title & Refresh */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Connected Peers
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.06] text-zinc-300">
              {devices.length}
            </span>
          </div>
          <button
            onClick={onRefresh}
            className={`p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all ${
              isScanning ? 'animate-spin text-indigo-400' : ''
            }`}
            title="Scan for nearby devices"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Device Cards List */}
        <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-17rem)] pr-1">
          {devices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            const isHotspot = device.linkSpeed?.toLowerCase().includes('hotspot') || device.ip?.startsWith('192.168.43.') || device.ip?.startsWith('172.20.10.');

            return (
              <div
                key={device.id}
                onClick={() => onSelectDevice(device)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border relative ${
                  isSelected
                    ? 'bg-zinc-800/60 border-zinc-700 shadow-sm'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white text-zinc-950 font-bold'
                          : 'bg-zinc-900 border border-white/10 text-zinc-300'
                      }`}
                    >
                      {device.type === 'desktop' ? (
                        <Monitor className="w-4 h-4" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-semibold text-white tracking-tight">
                          {device.name}
                        </h4>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {device.ip || 'Local Peer'}
                      </p>
                    </div>
                  </div>

                  {device.batteryLevel !== undefined && (
                    <div className="flex items-center space-x-1 text-[10px] font-mono text-zinc-400">
                      {device.isCharging ? (
                        <BatteryCharging className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Battery className="w-3 h-3 text-zinc-400" />
                      )}
                      <span>{device.batteryLevel}%</span>
                    </div>
                  )}
                </div>

                {/* Connection Meta */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <div className="flex items-center space-x-1.5">
                    {isHotspot ? (
                      <span className="text-amber-400 flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>Hotspot Link</span>
                      </span>
                    ) : (
                      <span className="text-indigo-400 flex items-center space-x-1">
                        <Wifi className="w-3 h-3" />
                        <span>Direct Wi-Fi</span>
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-300">{device.linkSpeed || 'Lossless P2P'}</span>
                </div>
              </div>
            );
          })}

          {devices.length === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] text-left space-y-3">
              <div className="flex items-center space-x-2 text-zinc-300">
                <Radio className="w-4 h-4 text-zinc-400 animate-pulse" />
                <span className="text-xs font-medium">Ready for Pairing</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Open <strong className="text-zinc-200">Beam</strong> on your phone. If on campus Wi-Fi, turn on Phone Hotspot for direct transfer.
              </p>
              {onOpenPairing && (
                <button
                  onClick={onOpenPairing}
                  className="w-full py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-zinc-200 border border-white/[0.08] flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Show QR / PIN</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Local Station Identity Footer */}
      <div className="pt-4 border-t border-white/[0.06]">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Local Station</span>
            <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              <span>Lossless BLAKE3</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300 bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
            <span className="truncate">{localIp}:{port}</span>
            <button
              onClick={handleCopyAddress}
              className="ml-2 text-zinc-400 hover:text-white transition-colors"
              title="Copy IP:Port"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
