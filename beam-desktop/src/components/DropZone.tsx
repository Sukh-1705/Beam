import React, { useState, useRef } from 'react';
import { UploadCloud, FolderUp, FileText, Image, Film, FileArchive, Plus, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

  const traverseEntry = async (entry: any, currentPath = ''): Promise<File[]> => {
    const collected: File[] = [];
    if (entry.isFile) {
      await new Promise<void>((resolve) => {
        entry.file((file: File) => {
          const relPath = currentPath ? `${currentPath}/${file.name}` : file.name;
          Object.defineProperty(file, 'webkitRelativePath', {
            value: relPath,
            writable: true,
            configurable: true,
          });
          collected.push(file);
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries: any[] = await new Promise((resolve) => {
        reader.readEntries((ents: any[]) => resolve(ents || []));
      });
      const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      for (const child of entries) {
        const subFiles = await traverseEntry(child, newPath);
        collected.push(...subFiles);
      }
    }
    return collected;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const allFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          const files = await traverseEntry(entry);
          allFiles.push(...files);
        } else {
          const f = item.getAsFile();
          if (f) allFiles.push(f);
        }
      }
      if (allFiles.length > 0) {
        onFilesSelected(allFiles);
        return;
      }
    }

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
        className={`relative group rounded-2xl border transition-all duration-200 p-10 flex flex-col items-center justify-center text-center overflow-hidden ${
          isDragOver
            ? 'border-indigo-500/80 bg-indigo-500/[0.04] scale-[1.005] shadow-xl'
            : 'border-white/[0.08] hover:border-white/[0.16] bg-white/[0.015] hover:bg-white/[0.03]'
        }`}
      >
        {/* Minimalist icon container */}
        <div className="mb-5 relative">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors shadow-sm">
            <UploadCloud className="w-6 h-6 stroke-[1.75]" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow">
            <Plus className="w-3 h-3 stroke-[2.5]" />
          </span>
        </div>

        {/* Heading & Subtext */}
        <h3 className="text-lg font-semibold text-white mb-1.5 tracking-tight">
          Drop files or folders to beam
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
          Stream any file type or size directly. Zero recompression, exact timestamps, and cryptographic integrity check.
        </p>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 relative z-10">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Select Files</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="btn-secondary flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs"
          >
            <FolderUp className="w-3.5 h-3.5 text-zinc-400" />
            <span>Select Folder</span>
          </button>

          {targetDevice && (
            <button
              onClick={onOpenExplorer}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
            >
              <span>Explore {targetDevice.name}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Supported Types Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[11px] text-zinc-400 font-mono">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <Image className="w-3 h-3 text-zinc-400" />
            <span>RAW / DNG / HEIC</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <Film className="w-3 h-3 text-zinc-400" />
            <span>4K ProRes / MP4</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <FileArchive className="w-3 h-3 text-zinc-400" />
            <span>APK / ZIP / ISO</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="text-zinc-300">100% Lossless</span>
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
