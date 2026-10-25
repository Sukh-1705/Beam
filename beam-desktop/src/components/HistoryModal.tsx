import React, { useState } from 'react';
import { X, Search, ShieldCheck, ArrowDownLeft, ArrowUpRight, FolderOpen, Smartphone, Monitor } from 'lucide-react';
import { HistoryEntry } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = entries.filter((e) =>
    e.fileName.toLowerCase().includes(search.toLowerCase()) ||
    e.deviceName.toLowerCase().includes(search.toLowerCase()) ||
    e.blake3Hash.toLowerCase().includes(search.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/10 shadow-2xl relative flex flex-col h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Transfer History & Verification</h3>
            <p className="text-xs text-slate-400">Cryptographically verified logs with BLAKE3 hashes</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="py-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name, device, or hash..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 overflow-hidden pr-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {item.direction === 'incoming' ? (
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-semibold text-white truncate">{item.fileName}</p>
                    {item.verified && (
                      <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>{formatBytes(item.fileSize)}</span>
                    <span>•</span>
                    <span>{item.deviceName}</span>
                    <span>•</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                    BLAKE3: {item.blake3Hash}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-2">
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-slate-200 block">{item.speedAverage}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.durationMs}ms</span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500 text-xs">
              No matching transfer records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
