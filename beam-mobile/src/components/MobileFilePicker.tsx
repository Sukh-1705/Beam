import React, { useState, useRef } from 'react';
import { X, Image, FileText, Send, Folder, Trash2, ShieldCheck, Film, Plus } from 'lucide-react';

interface MobileFilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendRealFiles: (files: File[]) => void;
  targetDeviceName: string;
}

export const MobileFilePicker: React.FC<MobileFilePickerProps> = ({
  isOpen,
  onClose,
  onSendRealFiles,
  targetDeviceName,
}) => {
  const [selectedRealFiles, setSelectedRealFiles] = useState<File[]>([]);
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalBytes = selectedRealFiles.reduce((acc, f) => acc + f.size, 0);

  const handleSend = () => {
    if (selectedRealFiles.length === 0) {
      alert('Please select at least one file from your phone.');
      return;
    }
    onSendRealFiles(selectedRealFiles);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
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

      <div className="surface-card w-full rounded-t-[28px] p-6 border-t border-white/10 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Select Files to Beam</h3>
            <p className="text-xs text-zinc-400">
              Direct transfer to <span className="text-white font-medium">{targetDeviceName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Pickers (Browse Real Phone Storage) */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <button
            onClick={() => mediaFileInputRef.current?.click()}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] flex flex-col items-center justify-center text-center transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 mb-2">
              <Image className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">Photos & Videos</span>
            <span className="text-[10px] text-zinc-400 mt-0.5">Original RAW & 4K</span>
          </button>

          <button
            onClick={() => anyFileInputRef.current?.click()}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] flex flex-col items-center justify-center text-center transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 mb-2">
              <Folder className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">Files & Documents</span>
            <span className="text-[10px] text-zinc-400 mt-0.5">APKs, ZIPs, PDFs</span>
          </button>
        </div>

        {/* Selected Real Files List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 min-h-[120px] max-h-[240px]">
          {selectedRealFiles.length > 0 ? (
            selectedRealFiles.map((f, i) => (
              <div
                key={`real-${i}`}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 overflow-hidden pr-2">
                  <div className="w-7 h-7 rounded-md bg-zinc-900 border border-white/10 text-zinc-300 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-white truncate">{f.name}</p>
                    <p className="text-[10px] font-mono text-zinc-400">{formatBytes(f.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeRealFile(i)}
                  className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-400 border border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center">
              <Folder className="w-6 h-6 text-zinc-600 mb-1.5" />
              <p className="text-xs font-medium">No files selected</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Tap above to select photos, videos, or documents</p>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">
              {selectedRealFiles.length} {selectedRealFiles.length === 1 ? 'file' : 'files'} selected
            </p>
            <p className="text-[10px] font-mono text-zinc-400">
              {formatBytes(totalBytes)} • Lossless
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={selectedRealFiles.length === 0}
            className={`btn-primary px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all ${
              selectedRealFiles.length > 0
                ? 'opacity-100'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span>Beam to PC</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
