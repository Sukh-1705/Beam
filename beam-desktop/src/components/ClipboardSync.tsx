import React, { useState } from 'react';
import { X, Clipboard, Send, Check, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';

interface ClipboardItem {
  id: string;
  type: 'text' | 'link';
  content: string;
  timestamp: string;
  source: string;
}

interface ClipboardSyncProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSendText: (text: string) => void;
}

const INITIAL_CLIPBOARD_ITEMS: ClipboardItem[] = [
  {
    id: '1',
    type: 'link',
    content: 'https://github.com/google/beam-transfer-spec',
    timestamp: '2 mins ago',
    source: 'Pixel 9 Pro',
  },
  {
    id: '2',
    type: 'text',
    content: 'Wi-Fi 6 AP Credentials: BeamHQ-Guest / highspeed-lossless-2026',
    timestamp: '14 mins ago',
    source: 'Workstation',
  },
];

export const ClipboardSync: React.FC<ClipboardSyncProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onToggle,
  onSendText,
}) => {
  const [items, setItems] = useState<ClipboardItem[]>(INITIAL_CLIPBOARD_ITEMS);
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (item: ClipboardItem) => {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const isUrl = inputText.startsWith('http://') || inputText.startsWith('https://');
    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      type: isUrl ? 'link' : 'text',
      content: inputText,
      timestamp: 'Just now',
      source: 'Workstation',
    };
    setItems([newItem, ...items]);
    onSendText(inputText);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl relative flex flex-col h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Shared Clipboard</h3>
              <p className="text-xs text-slate-400">Copy on PC, paste on phone instantly</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggle(!isEnabled)}
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white"
            >
              {isEnabled ? (
                <ToggleRight className="w-7 h-7 text-purple-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 cursor-pointer" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Input to send note/link */}
        <div className="py-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Paste or type text, link, code snippet to beam..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              onClick={handleSend}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
              title="Beam to mobile"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mirrored Clipboard List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-start justify-between group"
            >
              <div className="flex-1 pr-3 overflow-hidden">
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1">
                  <span className="font-semibold text-purple-300">{item.source}</span>
                  <span>•</span>
                  <span>{item.timestamp}</span>
                </div>
                <p className="text-xs font-mono text-slate-200 break-all select-all">
                  {item.content}
                </p>
              </div>

              <div className="flex items-center space-x-1 shrink-0 pt-1">
                {item.type === 'link' && (
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleCopy(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Clipboard className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
