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
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendToPC = () => {
    if (!text.trim()) return;
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setText('');
      onClose();
    }, 800);
  };

  const handlePasteFromDevice = async () => {
    if (navigator.clipboard) {
      try {
        const val = await navigator.clipboard.readText();
        setText(val);
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative text-left flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 flex items-center justify-center">
              <Clipboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Send to PC Clipboard</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 my-3">
          Type or paste any text or link to beam directly to <span className="text-white font-medium">{targetPCName}</span>.
        </p>

        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste URL, verification code, or notes..."
          className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 resize-none font-mono mb-3"
        />

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePasteFromDevice}
            className="btn-secondary px-3 py-2.5 rounded-xl text-xs"
          >
            Paste Current
          </button>

          <button
            onClick={handleSendToPC}
            disabled={!text.trim()}
            className="btn-primary flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {sentSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Send className="w-3.5 h-3.5" />}
            <span>{sentSuccess ? 'Beamed to PC!' : 'Beam to PC'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
