import React, { useState } from 'react';
import { X, QrCode, KeyRound, Smartphone, ShieldCheck, Copy, Check, Usb, Wifi } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: string;
  ipAddress: string;
  port: number;
  onSimulatePair?: (phoneName: string) => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  pin,
  ipAddress,
  port,
  onSimulatePair,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-300">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Pair with Mobile in 15 Seconds</h2>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end encrypted direct connection. Zero cloud, zero accounts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-6 border border-white/5">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'qr'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'pin'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Enter 6-Digit PIN</span>
          </button>
        </div>

        {/* Tab 1: QR Code */}
        {activeTab === 'qr' ? (
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-2xl shadow-xl shadow-purple-500/10 mb-4">
              <QRCodeSVG
                value={qrData}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Open <span className="text-purple-300 font-semibold">Beam</span> on your phone and tap the scanner
            </p>
            <div className="flex items-center space-x-2 mt-2 text-[11px] font-mono text-slate-400">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>IP: {ipAddress}:{port}</span>
            </div>
          </div>
        ) : (
          /* Tab 2: 6-Digit PIN */
          <div className="flex flex-col items-center py-4">
            <p className="text-xs text-slate-400 mb-3">Enter this code into Beam on your mobile device:</p>
            <div className="flex items-center space-x-3 mb-4">
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-purple-500/40 text-3xl font-mono font-extrabold tracking-widest text-purple-300 shadow-inner">
                {pin.slice(0, 3)} {pin.slice(3, 6)}
              </div>
              <button
                onClick={handleCopyPin}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                title="Copy PIN"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">PIN expires every 10 minutes for your security</p>
          </div>
        )}

        {/* 3 Steps Guide Footer */}
        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-3 text-center text-[11px] text-slate-400">
          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="font-bold text-white block mb-0.5">1. Open Beam</span>
            <span>Android / iOS App</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="font-bold text-white block mb-0.5">2. Scan / PIN</span>
            <span>Instant Pair</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="font-bold text-white block mb-0.5">3. Done</span>
            <span>Trusted Forever</span>
          </div>
        </div>

        {/* Demo Pairing simulator button */}
        {onSimulatePair && (
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-center">
            <button
              onClick={() => onSimulatePair('Pixel 9 Pro (Simulated)')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium underline"
            >
              Simulate Instant Mobile Pairing Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
