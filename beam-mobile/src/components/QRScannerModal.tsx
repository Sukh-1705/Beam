import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Wifi, Camera, Image, AlertCircle, ArrowRight, RefreshCw, HelpCircle, Flame } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaired: (deviceInfo: { name: string; ip: string; port: string }) => void;
  currentPcIp: string;
  currentPcPort?: string;
}

// Rock-solid connection test using XMLHttpRequest (100% Android WebView compatible)
function testBeamConnection(
  ip: string,
  port: string,
  timeoutMs: number = 4000
): Promise<{ ok: boolean; info?: any; error?: string }> {
  return new Promise((resolve) => {
    const cleanIp = ip.trim().replace(/^https?:\/\//, '').replace(/:.*$/, '');
    const cleanPort = port.trim() || '53317';
    const targetUrl = `http://${cleanIp}:${cleanPort}/api/beam/info`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', targetUrl, true);
    xhr.timeout = timeoutMs;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ ok: true, info: data });
        } catch (e) {
          resolve({ ok: true, info: { status: 'ready', pcName: 'Desktop PC' } });
        }
      } else {
        resolve({
          ok: false,
          error: `PC replied with HTTP status ${xhr.status}. Please check Beam Desktop.`
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        ok: false,
        error: `Could not reach http://${cleanIp}:${cleanPort}.\n\n` +
          `• Make sure Beam Desktop is open on your PC.\n` +
          `• Check that Phone and PC are on the same Wi-Fi.\n` +
          `• If using University Wi-Fi, turn on Phone Hotspot and connect your PC to it.`
      });
    };

    xhr.ontimeout = () => {
      resolve({
        ok: false,
        error: `Connection to http://${cleanIp}:${cleanPort} timed out.\n\n` +
          `Verify that the PC IP matches the header on Beam Desktop.`
      });
    };

    try {
      xhr.send();
    } catch (err: any) {
      resolve({ ok: false, error: err?.message || 'Failed to dispatch network request.' });
    }
  });
}

// Send pairing handshake to register mobile device on desktop
function registerWithDesktop(ip: string, port: string): Promise<boolean> {
  return new Promise((resolve) => {
    const cleanIp = ip.trim().replace(/^https?:\/\//, '').replace(/:.*$/, '');
    const cleanPort = port.trim() || '53317';
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${cleanIp}:${cleanPort}/api/beam/pair`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 3500;
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.ontimeout = () => resolve(false);

    try {
      xhr.send(
        JSON.stringify({
          id: 'android-phone-real',
          name: navigator.userAgent.includes('Android') ? 'Android Phone' : 'Mobile Phone',
          type: 'android',
          model: navigator.userAgent.includes('Android') ? 'Android Device' : 'Mobile Phone',
          os: 'Android',
          port: 53318,
        })
      );
    } catch (e) {
      resolve(false);
    }
  });
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onPaired,
  currentPcIp,
  currentPcPort = '53317',
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'camera'>('manual');
  const [ipInput, setIpInput] = useState(currentPcIp || '10.50.0.136');
  const [portInput, setPortInput] = useState(currentPcPort || '53317');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [pairedSuccess, setPairedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);

  // Sync inputs with props when opened
  useEffect(() => {
    if (isOpen) {
      if (currentPcIp) setIpInput(currentPcIp);
      if (currentPcPort) setPortInput(currentPcPort);
      setErrorMessage('');
      setPairedSuccess(false);
    }
  }, [isOpen, currentPcIp, currentPcPort]);

  // Safely stop scanner without crashing
  const safeStopScanner = async () => {
    if (qrScannerRef.current) {
      const scanner = qrScannerRef.current;
      qrScannerRef.current = null;
      try {
        if (isScanningRef.current) {
          isScanningRef.current = false;
          await scanner.stop();
        }
      } catch (e) {}
      try {
        scanner.clear();
      } catch (e) {}
    }
  };

  // Camera QR scanner lifecycle
  useEffect(() => {
    let isCancelled = false;

    if (isOpen && activeTab === 'camera' && !pairedSuccess) {
      setCameraError('');
      const startScanner = async () => {
        try {
          const scannerId = 'beam-qr-scanner-view';
          const element = document.getElementById(scannerId);
          if (!element || isCancelled) return;

          await safeStopScanner();
          if (isCancelled) return;

          const scanner = new Html5Qrcode(scannerId);
          qrScannerRef.current = scanner;

          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              if (!isCancelled) handleScannedText(decodedText);
            },
            () => {}
          );
          if (!isCancelled) {
            isScanningRef.current = true;
          }
        } catch (err: any) {
          if (!isCancelled) {
            setCameraError(
              'Camera preview unavailable. Please enter the IP manually or select a QR photo below.'
            );
          }
        }
      };

      const timer = setTimeout(startScanner, 200);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        safeStopScanner();
      };
    } else {
      safeStopScanner();
    }
  }, [isOpen, activeTab, pairedSuccess]);

  if (!isOpen) return null;

  const handleScannedText = (text: string) => {
    try {
      if (text.startsWith('{') && text.endsWith('}')) {
        const data = JSON.parse(text);
        const targetIp = data.ip || '';
        const targetPort = data.port ? String(data.port) : portInput;
        if (targetIp) {
          setIpInput(targetIp);
          setPortInput(targetPort);
          handleConnect(targetIp, targetPort);
          return;
        }
      }

      if (text.startsWith('http://') || text.startsWith('https://')) {
        const u = new URL(text);
        const targetIp = u.hostname;
        const targetPort = u.port || portInput;
        setIpInput(targetIp);
        setPortInput(targetPort);
        handleConnect(targetIp, targetPort);
        return;
      }

      if (text.includes(':')) {
        const [ip, port] = text.split(':');
        setIpInput(ip.trim());
        setPortInput(port.trim());
        handleConnect(ip.trim(), port.trim());
        return;
      }

      setIpInput(text.trim());
      handleConnect(text.trim(), portInput);
    } catch (e: any) {
      setErrorMessage('Unrecognized QR content: ' + text);
    }
  };

  const handleScanImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const tempScanner = new Html5Qrcode('beam-qr-temp-scanner');
        const decodedText = await tempScanner.scanFile(file, true);
        handleScannedText(decodedText);
        try { tempScanner.clear(); } catch (err) {}
      } catch (err: any) {
        setErrorMessage('No valid QR code found in that photo. Please enter IP manually.');
      }
    }
  };

  const handleIpChange = (val: string) => {
    if (val.includes(':')) {
      const [ip, port] = val.split(':');
      setIpInput(ip.trim());
      if (port && port.trim()) setPortInput(port.trim());
    } else {
      setIpInput(val);
    }
  };

  const handleConnect = async (targetIp: string, targetPort: string) => {
    const cleanIp = targetIp.trim().replace(/^https?:\/\//, '').replace(/:.*$/, '');
    const cleanPort = targetPort.trim() || '53317';

    if (!cleanIp) {
      setErrorMessage('Please enter a valid PC IP address.');
      return;
    }

    setIsConnecting(true);
    setErrorMessage('');

    await safeStopScanner();

    const result = await testBeamConnection(cleanIp, cleanPort, 4500);

    if (result.ok) {
      await registerWithDesktop(cleanIp, cleanPort);
      setPairedSuccess(true);
      setTimeout(() => {
        onPaired({
          name: result.info?.pcName || 'Desktop PC',
          ip: cleanIp,
          port: cleanPort,
        });
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.error || `Could not connect to http://${cleanIp}:${cleanPort}`);
    }

    setIsConnecting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-card w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative text-center flex flex-col items-center max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-semibold text-white tracking-tight mb-1">
          Connect to Workstation
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Direct local stream. 100% loss-free, zero cloud.
        </p>

        {pairedSuccess ? (
          <div className="flex flex-col items-center space-y-3 py-8 animate-in zoom-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>
            <span className="text-xs font-semibold text-emerald-300">Connected to PC!</span>
          </div>
        ) : (
          <div className="w-full space-y-3.5">
            {/* Tab Switcher: Manual vs Camera */}
            <div className="flex rounded-lg bg-zinc-900 p-1 border border-white/[0.06]">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Manual IP & Port</span>
              </button>

              <button
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'camera'
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>
            </div>

            {/* TAB 1: Manual IP & Port Config */}
            <div className={activeTab === 'manual' ? 'w-full space-y-3' : 'hidden'}>
              {/* Quick Connect Button */}
              <button
                onClick={() => handleConnect(ipInput || '10.50.0.136', portInput || '53317')}
                disabled={isConnecting}
                className="btn-primary w-full py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting to {ipInput}:{portInput}...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Connect to {ipInput || '10.50.0.136'}:{portInput || '53317'}</span>
                  </>
                )}
              </button>

              {/* Form */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                    PC IP Address:
                  </label>
                  <input
                    type="text"
                    value={ipInput}
                    onChange={(e) => handleIpChange(e.target.value)}
                    placeholder="10.50.0.136"
                    className="w-full font-mono text-xs py-2 px-3 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                    Transfer Port:
                  </label>
                  <input
                    type="number"
                    value={portInput}
                    onChange={(e) => setPortInput(e.target.value)}
                    placeholder="53317"
                    className="w-full font-mono text-xs py-2 px-3 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Default is <span className="font-mono text-zinc-300">53317</span>. Matches your PC header.
                  </p>
                </div>
              </div>

              {/* Campus Hotspot Hint Card */}
              <div className="p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-left text-[11px] text-amber-200/90 space-y-1">
                <div className="flex items-center space-x-1.5 font-medium text-amber-300">
                  <Flame className="w-3.5 h-3.5" />
                  <span>On University Wi-Fi?</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[10px]">
                  Campus routers isolate devices from each other. Simply turn on your phone's <strong className="text-zinc-200">Personal Hotspot</strong>, connect your laptop to it, and Beam works seamlessly!
                </p>
              </div>
            </div>

            {/* TAB 2: Camera QR Scanner */}
            <div className={activeTab === 'camera' ? 'flex flex-col items-center w-full' : 'hidden'}>
              <div className="relative w-full aspect-square max-w-[220px] rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
                <div id="beam-qr-scanner-view" className="w-full h-full" />
                <div className="absolute inset-4 pointer-events-none">
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/60" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/60" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/60" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/60" />
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 mt-3 font-medium">
                Point camera at the QR code on your PC screen
              </p>

              {cameraError && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[10px] text-amber-300 text-left">
                  <p>{cameraError}</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleScanImageFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 py-2 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              >
                <Image className="w-3.5 h-3.5 text-zinc-400" />
                <span>Scan from Photo / Screenshot</span>
              </button>

              <div id="beam-qr-temp-scanner" className="hidden" />
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-left flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300 whitespace-pre-line leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
