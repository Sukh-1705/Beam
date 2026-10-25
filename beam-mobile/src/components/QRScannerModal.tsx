import React, { useState } from 'react';
import { X, Camera, QrCode, Sparkles, Check, KeyRound } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaired: (deviceInfo: { name: string; ip: string }) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onPaired,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [pairedSuccess, setPairedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setIsScanning(false);
    setPairedSuccess(true);
    setTimeout(() => {
      onPaired({ name: 'Windows Workstation', ip: '192.168.1.100' });
      onClose();
    }, 1200);
  };

  const handlePinSubmit = () => {
    if (pinInput.length >= 6) {
      handleSimulateScan();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-sm rounded-[32px] p-6 border border-white/10 shadow-2xl relative text-center flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white tracking-tight mb-1">
          Scan Desktop QR Code
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Point camera at the QR code on your PC screen
        </p>

        {/* Viewfinder Frame */}
        <div className="relative w-56 h-56 rounded-3xl bg-black/50 border-2 border-purple-500/50 p-4 flex flex-col items-center justify-center overflow-hidden mb-6 shadow-2xl shadow-purple-500/20">
          {/* Laser Scanner Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-400 shadow-lg shadow-cyan-400/80 animate-bounce" />

          {pairedSuccess ? (
            <div className="flex flex-col items-center space-y-2 animate-in zoom-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <span className="text-xs font-bold text-emerald-300">Paired with PC!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <Camera className="w-10 h-10 text-slate-400 animate-pulse" />
              <button
                onClick={handleSimulateScan}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-400/40 text-xs font-semibold text-purple-200 hover:text-white transition-all"
              >
                Simulate Camera Scan
              </button>
            </div>
          )}

          {/* Corner Guides */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-400" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-400" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-400" />
        </div>

        {/* PIN Fallback Input */}
        <div className="w-full pt-4 border-t border-white/5">
          <p className="text-xs text-slate-400 mb-2">Or enter 6-digit PC PIN:</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="839204"
              className="flex-1 text-center font-mono tracking-widest text-base py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handlePinSubmit}
              disabled={pinInput.length < 6}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs"
            >
              Pair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
