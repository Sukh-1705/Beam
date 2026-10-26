import React, { useState } from 'react';
import { X, QrCode, KeyRound, Smartphone, ShieldCheck, Copy, Check, Usb, Wifi, Flame, HelpCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: string;
  ipAddress: string;
  port: number;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  pin,
  ipAddress,
  port,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'pin'>('qr');

  if (!isOpen) return null;

  const qrData = JSON.stringify({
    app: 'beam',
    id: 'beam-desktop-pc',
    name: 'Windows Workstation',
    ip: ipAddress,
    port: port,
    pin: pin,
  });

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`http://${ipAddress}:${port}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-semibold text-white tracking-tight mb-1">
          Connect Mobile Peer
        </h3>
        <p className="text-xs text-zinc-400 mb-5">
          Scan the QR or enter the connection details into Beam Mobile.
        </p>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-zinc-900 p-1 border border-white/[0.06] mb-5">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'qr'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'pin'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN / Manual IP</span>
          </button>
        </div>

        {/* Tab 1: QR Code */}
        {activeTab === 'qr' ? (
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-xl shadow-lg mb-4">
              <QRCodeSVG
                value={qrData}
                size={170}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-zinc-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06] mb-3">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>http://{ipAddress}:{port}</span>
              <button
                onClick={handleCopyUrl}
                className="ml-1 text-zinc-400 hover:text-white"
                title="Copy URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* University / Hotspot Tip Box */}
            <div className="w-full text-left p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
              <div className="flex items-center space-x-1.5 font-medium text-amber-300">
                <Flame className="w-3.5 h-3.5" />
                <span>On Campus or Public Wi-Fi?</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Campus networks block direct device-to-device streaming. Simply turn on your phone's <strong className="text-zinc-200">Personal Hotspot</strong>, connect this laptop, and Beam will work with zero barriers.
              </p>
            </div>
          </div>
        ) : (
          /* Tab 2: 6-Digit PIN & Manual Setup */
          <div className="flex flex-col items-center py-2 space-y-4">
            <div>
              <p className="text-xs text-zinc-400 mb-2">Enter this 6-digit PIN in your mobile app:</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-2xl font-mono font-bold tracking-widest text-white shadow-inner">
                  {pin.slice(0, 3)} {pin.slice(3, 6)}
                </div>
                <button
                  onClick={handleCopyPin}
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors"
                  title="Copy PIN"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="w-full text-left p-3 rounded-xl bg-black/30 border border-white/[0.06] space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Direct IP Address:</span>
                <span className="text-zinc-200 font-semibold">{ipAddress}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Port:</span>
                <span className="text-zinc-200 font-semibold">{port}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
