import React, { useState, useRef } from 'react';
import { X, Image, Film, FileText, Check, Send, Sparkles, Folder, Plus, Trash2 } from 'lucide-react';
import { MobileMediaItem } from '../types';

interface MobileFilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendRealFiles: (files: File[]) => void;
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
    name: 'Project_Beam_Presentation.pdf',
    size: 14_800_000,
    type: 'doc',
    uri: 'content://media/external/documents/1004',
    mimeType: 'application/pdf',
    dateAdded: 'Oct 24',
  },
];

export const MobileFilePicker: React.FC<MobileFilePickerProps> = ({
  isOpen,
  onClose,
  onSendRealFiles,
  targetDeviceName,
}) => {
  const [selectedRealFiles, setSelectedRealFiles] = useState<File[]>([]);
  const [selectedSampleIds, setSelectedSampleIds] = useState<Set<string>>(new Set());
  const anyFileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedRealFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeRealFile = (index: number) => {
    setSelectedRealFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSampleSelect = (id: string) => {
    const next = new Set(selectedSampleIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSampleIds(next);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalRealBytes = selectedRealFiles.reduce((acc, f) => acc + f.size, 0);
  const selectedSamples = SAMPLE_MEDIA.filter(s => selectedSampleIds.has(s.id));
  const totalSampleBytes = selectedSamples.reduce((acc, s) => acc + s.size, 0);
  const totalBytes = totalRealBytes + totalSampleBytes;
  const totalCount = selectedRealFiles.length + selectedSamples.length;

  const handleSend = () => {
    let filesToSend: File[] = [...selectedRealFiles];

    // If user also picked demo samples, turn them into mock File blobs
    if (selectedSamples.length > 0) {
      for (const s of selectedSamples) {
        const dummyBlob = new Blob([new Uint8Array(1024 * 64)], { type: s.mimeType });
        const mockFile = new File([dummyBlob], s.name, { type: s.mimeType });
        filesToSend.push(mockFile);
      }
    }

    if (filesToSend.length === 0) {
      alert('Please select at least one file from your device.');
      return;
    }

    onSendRealFiles(filesToSend);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        ref={anyFileInputRef}
        onChange={handleNativeFileChange}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={mediaFileInputRef}
        onChange={handleNativeFileChange}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />

      <div className="glass-panel w-full rounded-t-[32px] p-6 border-t border-white/10 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Select Real Files to Beam</h3>
            <p className="text-xs text-slate-400">
              Direct transfer to <span className="text-purple-300 font-semibold">{targetDeviceName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Pickers (Browse Phone) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => mediaFileInputRef.current?.click()}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/30 hover:border-purple-400 flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-lg shadow-purple-500/10"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 mb-2">
              <Image className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Photos & Videos</span>
            <span className="text-[10px] text-slate-400">Camera / Gallery</span>
          </button>

          <button
            onClick={() => anyFileInputRef.current?.click()}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-cyan-600/20 border border-indigo-500/30 hover:border-cyan-400 flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-lg shadow-cyan-500/10"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-2">
              <Folder className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Any File / Storage</span>
            <span className="text-[10px] text-slate-400">APKs, ZIPs, Docs</span>
          </button>
        </div>

        {/* Selected Real Files List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 min-h-[140px] max-h-[220px]">
          {selectedRealFiles.length > 0 ? (
            selectedRealFiles.map((f, i) => (
              <div
                key={`real-${i}`}
                className="p-3 rounded-xl bg-white/5 border border-purple-500/30 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{f.name}</p>
                    <p className="text-[10px] font-mono text-purple-300">{formatBytes(f.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeRealFile(i)}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500 border border-dashed border-white/10 rounded-2xl">
              <p className="text-xs">No files selected yet</p>
              <p className="text-[10px] text-slate-600 mt-1">Tap a button above to choose real files from this device</p>
            </div>
          )}

          {/* Quick Demo Samples */}
          <div className="pt-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Or quick test samples:
            </p>
            <div className="space-y-1.5">
              {SAMPLE_MEDIA.map(s => {
                const isSelected = selectedSampleIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSampleSelect(s.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500/40 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                        {s.type === 'photo' ? <Image className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs truncate">{s.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{formatBytes(s.size)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">
              {totalCount} {totalCount === 1 ? 'file' : 'files'} selected
            </p>
            <p className="text-[10px] font-mono text-purple-300">
              {formatBytes(totalBytes)} · Lossless BLAKE3
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={totalCount === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-lg ${
              totalCount > 0
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110 active:scale-95 shadow-purple-500/25'
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>Beam to PC</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
