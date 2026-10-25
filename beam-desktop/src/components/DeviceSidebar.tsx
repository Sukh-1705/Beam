import React from 'react';
import { Smartphone, Monitor, Wifi, Usb, BatteryCharging, Battery, ShieldCheck, RefreshCw, Radio } from 'lucide-react';
import { Device } from '../types';

interface DeviceSidebarProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  onRefresh: () => void;
  isScanning: boolean;
}

export const DeviceSidebar: React.FC<DeviceSidebarProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onRefresh,
  isScanning,
}) => {
  return (
    <aside className="w-80 border-r border-white/5 p-5 flex flex-col justify-between glass-panel-subtle h-[calc(100vh-4rem)]">
      <div>
        {/* Title & Refresh */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Nearby Devices ({devices.length})
            </h2>
          </div>
          <button
            onClick={onRefresh}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all ${
              isScanning ? 'animate-spin text-purple-400' : ''
            }`}
            title="Scan network for devices"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Device Cards List */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-16rem)] pr-1">
          {devices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            return (
              <div
                key={device.id}
                onClick={() => onSelectDevice(device)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border relative group ${
                  isSelected
                    ? 'bg-purple-900/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-white/5 text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {device.type === 'desktop' ? (
                        <Monitor className="w-5 h-5" />
                      ) : (
                        <Smartphone className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-sm font-semibold text-white tracking-tight">
                          {device.name}
                        </h4>
                        {device.isTrusted && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {device.model} • {device.os}
                      </p>
                    </div>
                  </div>

                  {/* Battery Indicator if mobile */}
                  {device.batteryLevel !== undefined && (
                    <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                      {device.isCharging ? (
                        <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Battery className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{device.batteryLevel}%</span>
                    </div>
                  )}
                </div>

                {/* Connection & Speed Badge */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    {device.connectionType === 'usb' ? (
                      <Usb className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Wifi className="w-3 h-3 text-purple-400" />
                    )}
                    <span className="capitalize">{device.connectionType}</span>
                  </div>
                  <span className="font-mono text-slate-300 font-medium">{device.linkSpeed}</span>
                </div>
              </div>
            );
          })}

          {devices.length === 0 && (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-white/10">
              <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-slate-400 font-medium">No Beam devices found yet</p>
              <p className="text-[11px] text-slate-500 mt-1">Open Beam on your phone or PC on the same Wi-Fi</p>
            </div>
          )}
        </div>
      </div>

      {/* Local Device Identity Badge at Bottom */}
      <div className="pt-4 border-t border-white/5">
        <div className="glass-panel-subtle p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="text-xs font-semibold text-slate-200">This PC is Discoverable</p>
              <p className="text-[10px] text-slate-400 font-mono">LAN Port: 53318 • E2EE On</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
