import React, { useState, useRef } from 'react';
import { UploadCloud, FolderUp, FileText, Image, Film, FileArchive, Plus, ArrowUpRight } from 'lucide-react';
import { Device } from '../types';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  targetDevice: Device | null;
  onOpenExplorer: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  targetDevice,
  onOpenExplorer,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center overflow-hidden ${
          isDragOver
            ? 'border-purple-400 bg-purple-950/20 scale-[1.01] shadow-2xl shadow-purple-500/20'
            : 'border-white/10 hover:border-purple-500/40 bg-gradient-to-b from-white/[0.03] to-transparent hover:bg-white/[0.04]'
        }`}
      >
        {/* Glow ambient background light */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero animated icon */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600/30 via-indigo-500/20 to-cyan-500/30 border border-purple-500/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="w-10 h-10 text-purple-300 group-hover:text-purple-200 transition-colors" />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-indigo-600 text-white shadow-md">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        </div>

        {/* Heading & Subtext */}
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          Drop files or folders to beam instantly
        </h3>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Transfer any file type with zero loss: 50GB+ 4K video, RAW photos, documents, whole folders.
          Verified with <span className="text-purple-300 font-semibold font-mono">BLAKE3</span>.
        </p>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Select Files</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
          >
            <FolderUp className="w-4 h-4 text-purple-400" />
            <span>Select Folder</span>
          </button>

          {targetDevice && (
            <button
              onClick={onOpenExplorer}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Browse {targetDevice.name}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Supported Types Badges */}
        <div className="mt-8 flex items-center space-x-4 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Image className="w-3.5 h-3.5 text-purple-400" />
            <span>RAW / HEIC / JPG</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>ProRes / 4K MP4</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <FileArchive className="w-3.5 h-3.5 text-cyan-400" />
            <span>ZIP / APK</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Documents</span>
          </div>
        </div>

        {/* Hidden native inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
