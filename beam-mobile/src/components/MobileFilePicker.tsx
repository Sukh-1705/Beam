import React, { useState } from 'react';
import { X, Image, Film, FileText, Check, Send, Sparkles, Folder } from 'lucide-react';
import { MobileMediaItem } from '../types';

interface MobileFilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendItems: (items: MobileMediaItem[]) => void;
  targetDeviceName: string;
}

const SAMPLE_MEDIA: MobileMediaItem[] = [
  {
    id: 'm1',
    name: 'IMG_20261026_RAW_091.dng',
    size: 48_200_000,
    type: 'photo',
    uri: 'content://media/external/images/media/1001',
    mimeType: 'image/x-raw',
    dateAdded: '10 mins ago',
  },
  {
    id: 'm2',
    name: 'DSC_4812_PRORES_4K.mov',
    size: 680_000_000,
    type: 'video',
    uri: 'content://media/external/video/media/1002',
    mimeType: 'video/quicktime',
    dateAdded: '1 hour ago',
  },
  {
    id: 'm3',
    name: 'PORTRAIT_HEIC_LIVE.heic',
    size: 5_200_000,
    type: 'photo',
    uri: 'content://media/external/images/media/1003',
    mimeType: 'image/heic',
    dateAdded: 'Yesterday',
  },
  {
    id: 'm4',
    name: 'Project_Beam_Presentation.pdf',
    size: 14_800_000,
    type: 'doc',
    uri: 'content://media/external/documents/1004',
    mimeType: 'application/pdf',
    dateAdded: 'Oct 24',
  },
  {
    id: 'm5',
    name: 'Beam_Desktop_v2.0_x64.zip',
    size: 124_000_000,
    type: 'archive',
    uri: 'content://media/external/download/1005',
    mimeType: 'application/zip',
    dateAdded: 'Oct 22',
  },
];

export const MobileFilePicker: React.FC<MobileFilePickerProps> = ({
  isOpen,
  onClose,
  onSendItems,
  targetDeviceName,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'docs'>('photos');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['m1', 'm2']));

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const filteredMedia = SAMPLE_MEDIA.filter((item) => {
    if (activeTab === 'photos') return item.type === 'photo';
    if (activeTab === 'videos') return item.type === 'video';
    return item.type === 'doc' || item.type === 'archive';
  });

  const selectedItems = SAMPLE_MEDIA.filter((m) => selectedIds.has(m.id));
  const totalBytes = selectedItems.reduce((acc, m) => acc + m.size, 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSend = () => {
    onSendItems(selectedItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full rounded-t-[32px] p-6 border-t border-white/10 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Select Files to Beam</h3>
            <p className="text-xs text-slate-400">
              Sending to <span className="text-purple-300 font-semibold">{targetDeviceName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-4 border border-white/5">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'photos' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Photos & RAW</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'videos' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>4K Videos</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'docs' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents</span>
          </button>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {filteredMedia.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500/50 shadow-md'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden pr-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    {item.type === 'photo' && <Image className="w-5 h-5 text-purple-400" />}
                    {item.type === 'video' && <Film className="w-5 h-5 text-indigo-400" />}
                    {item.type === 'doc' && <FileText className="w-5 h-5 text-cyan-400" />}
                    {item.type === 'archive' && <Folder className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {formatBytes(item.size)} • {item.dateAdded}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : 'border-white/20'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Bar */}
        <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">
              {selectedIds.size} item{selectedIds.size === 1 ? '' : 's'} selected
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Total: {formatBytes(totalBytes)} (Lossless)
            </span>
          </div>

          <button
            onClick={handleSend}
            disabled={selectedIds.size === 0}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            <span>Beam Now</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
