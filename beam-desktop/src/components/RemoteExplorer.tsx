import React, { useState } from 'react';
import { X, Folder, FileText, Image, Film, FileArchive, Download, ArrowLeft, Smartphone } from 'lucide-react';
import { Device, RemoteFileEntry } from '../types';

interface RemoteExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onDownloadFile: (file: RemoteFileEntry) => void;
}

const MOCK_PHONE_FILES: Record<string, RemoteFileEntry[]> = {
  '': [
    { name: 'DCIM', path: 'DCIM', isDir: true, size: 0, mtime: 1792900000, mimeType: 'inode/directory' },
    { name: 'Downloads', path: 'Downloads', isDir: true, size: 0, mtime: 1792905000, mimeType: 'inode/directory' },
    { name: 'Documents', path: 'Documents', isDir: true, size: 0, mtime: 1792910000, mimeType: 'inode/directory' },
    { name: 'AudioRecords', path: 'AudioRecords', isDir: true, size: 0, mtime: 1792912000, mimeType: 'inode/directory' },
  ],
  'DCIM': [
    { name: 'Camera', path: 'DCIM/Camera', isDir: true, size: 0, mtime: 1792900100, mimeType: 'inode/directory' },
    { name: 'Screenshots', path: 'DCIM/Screenshots', isDir: true, size: 0, mtime: 1792900200, mimeType: 'inode/directory' },
  ],
  'DCIM/Camera': [
    { name: 'DSC_0921_PRO_RES.dng', path: 'DCIM/Camera/DSC_0921_PRO_RES.dng', isDir: false, size: 75_420_000, mtime: 1792900300, mimeType: 'image/x-raw' },
    { name: 'IMG_20261025_4K60.mov', path: 'DCIM/Camera/IMG_20261025_4K60.mov', isDir: false, size: 840_120_000, mtime: 1792900400, mimeType: 'video/mp4' },
    { name: 'PORTRAIT_HEIC_LIVE.heic', path: 'DCIM/Camera/PORTRAIT_HEIC_LIVE.heic', isDir: false, size: 4_210_000, mtime: 1792900500, mimeType: 'image/heic' },
  ],
  'Downloads': [
    { name: 'Beam_Android_v2.0.apk', path: 'Downloads/Beam_Android_v2.0.apk', isDir: false, size: 18_900_000, mtime: 1792906000, mimeType: 'application/vnd.android.package-archive' },
    { name: 'Project_Archive_Lossless.zip', path: 'Downloads/Project_Archive_Lossless.zip', isDir: false, size: 142_500_000, mtime: 1792906500, mimeType: 'application/zip' },
  ],
  'Documents': [
    { name: 'System_Architecture_Whitepaper.pdf', path: 'Documents/System_Architecture_Whitepaper.pdf', isDir: false, size: 8_420_000, mtime: 1792911000, mimeType: 'application/pdf' },
  ],
};

export const RemoteExplorer: React.FC<RemoteExplorerProps> = ({
  isOpen,
  onClose,
  device,
  onDownloadFile,
}) => {
  const [currentPath, setCurrentPath] = useState('');
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  if (!isOpen || !device) return null;

  const entries = MOCK_PHONE_FILES[currentPath] || [];

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleDownload = (file: RemoteFileEntry) => {
    setDownloadingFile(file.name);
    setTimeout(() => {
      onDownloadFile(file);
      setDownloadingFile(null);
    }, 700);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: RemoteFileEntry) => {
    if (file.isDir) return <Folder className="w-4 h-4 text-amber-400" />;
    if (file.mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-zinc-300" />;
    if (file.mimeType.startsWith('video/')) return <Film className="w-4 h-4 text-indigo-400" />;
    if (file.mimeType.includes('zip') || file.mimeType.includes('archive'))
      return <FileArchive className="w-4 h-4 text-cyan-400" />;
    return <FileText className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-3xl rounded-2xl p-6 border border-white/10 shadow-2xl relative flex flex-col h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Remote Storage · {device.name}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Scoped Direct VFS • Path: /{currentPath || 'Root'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Breadcrumbs */}
        <div className="py-2.5 flex items-center space-x-2 text-xs text-zinc-400 font-mono border-b border-white/[0.04]">
          {currentPath && (
            <button
              onClick={handleBack}
              className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <span
            onClick={() => setCurrentPath('')}
            className="cursor-pointer hover:text-white transition-colors font-medium text-zinc-300"
          >
            Root
          </span>
          {currentPath.split('/').filter(Boolean).map((part, idx, arr) => {
            const pathSoFar = arr.slice(0, idx + 1).join('/');
            return (
              <React.Fragment key={pathSoFar}>
                <span className="text-zinc-600">/</span>
                <span
                  onClick={() => setCurrentPath(pathSoFar)}
                  className="cursor-pointer hover:text-white transition-colors text-zinc-200"
                >
                  {part}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* Files Grid */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pt-3 pr-1">
          {entries.map((entry) => (
            <div
              key={entry.path}
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] transition-colors flex items-center justify-between group"
            >
              <div
                onClick={() => entry.isDir && handleNavigate(entry.path)}
                className={`flex items-center space-x-3 flex-1 overflow-hidden pr-4 ${
                  entry.isDir ? 'cursor-pointer' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                  {getFileIcon(entry)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-white truncate group-hover:text-zinc-100 transition-colors">
                    {entry.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {formatBytes(entry.size)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div>
                {!entry.isDir ? (
                  <button
                    onClick={() => handleDownload(entry)}
                    disabled={downloadingFile === entry.name}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white text-zinc-300 hover:text-zinc-950 font-medium text-xs transition-all"
                  >
                    <Download className={`w-3.5 h-3.5 ${downloadingFile === entry.name ? 'animate-bounce' : ''}`} />
                    <span>{downloadingFile === entry.name ? 'Pulling...' : 'Download'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500 font-mono mr-2">Folder</span>
                )}
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-16 text-zinc-500 text-xs">
              Folder is empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
