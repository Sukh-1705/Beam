import React, { useState } from 'react';
import { X, Clipboard, Send, Check } from 'lucide-react';

interface MobileClipboardProps {
  isOpen: boolean;
  onClose: () => void;
  targetPCName: string;
}

export const MobileClipboard: React.FC<MobileClipboardProps> = ({
  isOpen,
  onClose,
  targetPCName,
}) => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendToPC = () => {
    if (!text.trim()) return;
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setText('');
      onClose();
    }, 1000);
  };

  const handlePasteFromDevice = async () => {
    if (navigator.clipboard) {
      const val = await navigator.clipboard.readText();
      setText(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-sm rounded-[32px] p-6 border border-white/10 shadow-2xl relative text-left flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center">
              <Clipboard className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Send to PC Clipboard</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 my-3">
          Type or paste any text, address, or link to mirror on <span className="text-purple-300 font-semibold">{targetPCName}</span>.
        </p>

        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste URL, text, or verification code..."
          className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 resize-none font-mono mb-3"
        />

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePasteFromDevice}
            className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
          >
            Paste Current
          </button>

          <button
            onClick={handleSendToPC}
            disabled={!text.trim()}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
          >
            {sentSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4" />}
            <span>{sentSuccess ? 'Beamed to PC!' : 'Beam to PC'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
