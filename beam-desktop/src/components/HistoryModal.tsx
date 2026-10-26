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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-2xl rounded-2xl p-6 border border-white/10 shadow-2xl relative flex flex-col h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Transfer History & Integrity</h3>
            <p className="text-xs text-zinc-400">Cryptographically verified logs with SHA-256 / BLAKE3 hashes</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="py-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name, device, or hash..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 overflow-hidden pr-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  entry.direction === 'incoming'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {entry.direction === 'incoming' ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-medium text-white truncate">{entry.fileName}</h4>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {formatBytes(entry.fileSize)} • {entry.deviceName} • {entry.timestamp}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-3 text-right">
                <div className="hidden sm:block">
                  <span className="text-[10px] font-mono text-zinc-400 block">{entry.speedAverage}</span>
                  <span className="text-[9px] font-mono text-zinc-500 block truncate max-w-[130px]">
                    {entry.blake3Hash}
                  </span>
                </div>
                {entry.verified && (
                  <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-xs text-zinc-500">
              No transfers logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
