import React, { useState, useEffect } from 'react';
import { X, Clipboard, Send, Check, Download, ArrowDown, Copy } from 'lucide-react';

interface MobileClipboardProps {
  isOpen: boolean;
  onClose: () => void;
  targetPCName: string;
  pcIp: string;
  pcPort: string;
}

export const MobileClipboard: React.FC<MobileClipboardProps> = ({
  isOpen,
  onClose,
  targetPCName,
  pcIp,
  pcPort,
}) => {
  const [text, setText] = useState('');
  const [pcClipboardText, setPcClipboardText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Fetch PC's active clipboard when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchPcClip = async () => {
      try {
        const res = await fetch(`http://${pcIp}:${pcPort}/api/beam/clipboard`);
        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            setPcClipboardText(data.text);
          }
        }
      } catch (e) {}
    };
    fetchPcClip();
  }, [isOpen, pcIp, pcPort]);

  if (!isOpen) return null;

  // 1. Send text to PC clipboard
  const handleSendToPC = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`http://${pcIp}:${pcPort}/api/beam/clipboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), source: 'Android Phone' }),
      });
      if (res.ok) {
        setSentSuccess(true);
        setTimeout(() => {
          setSentSuccess(false);
          setText('');
        }, 1200);
      } else {
        alert('Could not sync to PC. Check Wi-Fi connection.');
      }
    } catch (e) {
      alert(`Network error beaming to http://${pcIp}:${pcPort}`);
    } finally {
      setIsSending(false);
    }
  };

  // 2. Copy PC's clipboard text onto this Android phone
  const handleCopyPcToPhone = () => {
    if (!pcClipboardText) return;

    // Use native Android clipboard bridge if in APK
    if ((window as any).BeamNative?.copyToClipboard) {
      (window as any).BeamNative.copyToClipboard(pcClipboardText);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 1500);
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(pcClipboardText).then(() => {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 1500);
      }).catch(() => {
        setText(pcClipboardText);
        alert('Copied into edit box below!');
      });
    } else {
      setText(pcClipboardText);
      alert('Copied into edit box below!');
    }
  };

  // 3. Paste current phone clipboard into the input field
  const handlePasteFromDevice = async () => {
    if ((window as any).BeamNative?.getClipboard) {
      const nativeClip = (window as any).BeamNative.getClipboard();
      if (nativeClip) {
        setText(nativeClip);
        return;
      }
    }

    if (navigator.clipboard) {
      try {
        const val = await navigator.clipboard.readText();
        setText(val);
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-sm rounded-2xl p-5 border border-white/10 shadow-2xl relative text-left flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 flex items-center justify-center">
              <Clipboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Shared Clipboard</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Mirror with {targetPCName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: PC's Active Clipboard */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-300 flex items-center space-x-1">
              <span>PC Clipboard Snippet</span>
            </span>
            <button
              onClick={handleCopyPcToPhone}
              disabled={!pcClipboardText}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium transition-all disabled:opacity-40"
            >
              {copiedSuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSuccess ? 'Copied to Phone!' : 'Copy to Phone'}</span>
            </button>
          </div>
          <p className="text-xs font-mono text-zinc-200 bg-black/40 p-2.5 rounded-lg border border-white/5 break-all select-all max-h-24 overflow-y-auto">
            {pcClipboardText || 'No text copied on PC yet.'}
          </p>
        </div>

        {/* Section 2: Send from Phone to PC Clipboard */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-zinc-300 block">
            Beam Phone Text to {targetPCName}
          </label>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste link, verification code, notes..."
            className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 resize-none font-mono"
          />

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handlePasteFromDevice}
              className="btn-secondary px-3 py-2 rounded-xl text-xs"
            >
              Paste Phone
            </button>

            <button
              onClick={handleSendToPC}
              disabled={!text.trim() || isSending}
              className="btn-primary flex-1 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {sentSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Beamed to Windows!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Beaming...' : 'Beam to PC'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
