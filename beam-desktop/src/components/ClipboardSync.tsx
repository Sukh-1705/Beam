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
    source: 'Mobile Phone',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl relative flex flex-col h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <Clipboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Shared Clipboard</h3>
              <p className="text-xs text-zinc-400">Instant bidirectional mirror between PC & Phone</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggle(!isEnabled)}
              className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white"
            >
              {isEnabled ? (
                <ToggleRight className="w-6 h-6 text-indigo-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-zinc-600 cursor-pointer" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input to send note/link */}
        <div className="py-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type or paste text, note, URL to beam..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={handleSend}
              className="btn-primary p-2 rounded-xl text-xs"
              title="Beam to mobile"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mirrored Clipboard List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-colors flex items-start justify-between group"
            >
              <div className="flex-1 pr-3 overflow-hidden">
                <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mb-1 font-mono">
                  <span className="font-semibold text-zinc-300">{item.source}</span>
                  <span>•</span>
                  <span>{item.timestamp}</span>
                </div>
                <p className="text-xs font-mono text-zinc-200 break-all select-all">
                  {item.content}
                </p>
              </div>

              <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                {item.type === 'link' && (
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleCopy(item)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
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
