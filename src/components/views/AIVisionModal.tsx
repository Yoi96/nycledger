import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Layers,
  CheckCircle2,
  Scan,
  Zap,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  AIScanResult,
  SampleScanItem,
  SAMPLE_SCAN_ITEMS,
  scanReceiptOrItem,
} from '../../services/aiVision';

interface AIVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (result: AIScanResult, previewImage?: string) => void;
}

export const AIVisionModal: React.FC<AIVisionModalProps> = ({
  isOpen,
  onClose,
  onApplyResult,
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'camera' | 'upload'>('samples');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<AIScanResult | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleScanItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>('Running offline OCR recognition...');
  const [ocrProgress, setOcrProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when closing or changing tabs
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
    }
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to open camera (permission restricted). Please use NYC Samples or Photo Upload.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleCaptureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewImage(dataUrl);
    stopCamera();

    runScanProcess(dataUrl, 'camera photo receipt');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      runScanProcess(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SampleScanItem) => {
    setSelectedSample(sample);
    setPreviewImage(sample.previewUrl);
    setIsScanning(true);
    setScannedResult(null);
    setOcrProgress(0.5);
    setOcrStatus(`Locally analyzing "${sample.name}"...`);

    // Simulate smart recognition delay
    setTimeout(() => {
      setIsScanning(false);
      setScannedResult(sample.expectedResult);
    }, 600);
  };

  const runScanProcess = async (base64Img: string, hint: string) => {
    setIsScanning(true);
    setScannedResult(null);
    setOcrProgress(0.15);
    setOcrStatus('Starting on-device OCR neural network...');
    try {
      const result = await scanReceiptOrItem(base64Img, hint, (status, progress) => {
        setOcrStatus(status);
        setOcrProgress(progress);
      });
      setScannedResult(result);
    } catch (e) {
      console.error('OCR process error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmApply = () => {
    if (!scannedResult) return;
    onApplyResult(scannedResult, previewImage || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FDFBF5] rounded-3xl border-3 border-[#1E293B] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-[#FEEED4]/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FCCE4C] border border-[#1E293B] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#1E293B]" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#1E293B] text-base" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Offline AI Receipt Scanner
              </h2>
              <p className="text-[10px] text-stone-500 font-semibold">
                Smart receipt & item recognition with automatic ledger entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors border border-stone-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Offline Privacy Guarantee Pill */}
        <div className="px-4 py-1.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            100% Offline Local Privacy • Financial data never leaves device
          </span>
          <span className="text-[10px] bg-emerald-200/60 px-1.5 py-0.5 rounded text-emerald-900 font-bold">
            On-Device
          </span>
        </div>

        {/* Source Segmented Tabs */}
        <div className="p-3 bg-stone-100/60 border-b border-stone-200 flex gap-1.5">
          <button
            onClick={() => {
              setActiveTab('samples');
              setCameraError(null);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'samples'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            NYC Samples
          </button>

          <button
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Camera
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
              fileInputRef.current?.click();
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Photo Upload
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tab 1: Samples List */}
          {activeTab === 'samples' && !scannedResult && !isScanning && (
            <div className="space-y-2.5">
              <div className="text-xs text-stone-600 font-semibold px-1">
                Select any common NYC receipt to test instant offline AI scanning:
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {SAMPLE_SCAN_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSample(item)}
                    className="group p-3 rounded-2xl bg-white border-2 border-stone-200 hover:border-[#FCCE4C] hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative flex-shrink-0 flex items-center justify-center text-xl">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-0 right-0 bg-white/90 rounded-tl px-1 text-xs">
                          {item.emoji}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#1E293B] group-hover:text-amber-800">
                          {item.name}
                        </div>
                        <div className="text-xs text-stone-500 font-medium">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-extrabold text-[#1E293B]">
                        ${item.expectedResult.amount.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 mt-0.5 font-bold">
                        Tap to scan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Camera Viewfinder */}
          {activeTab === 'camera' && !previewImage && (
            <div className="relative rounded-2xl overflow-hidden bg-stone-900 border-2 border-stone-800 aspect-[4/3] flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Viewfinder reticle overlay */}
              {cameraActive && (
                <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-[#FCCE4C]/70 rounded-xl flex items-center justify-center">
                  <div className="text-center bg-stone-900/60 backdrop-blur-xs text-[#FCCE4C] px-3 py-1.5 rounded-full text-xs font-bold border border-[#FCCE4C]/40">
                    Align receipt or item within frame
                  </div>
                  {/* Four Corner Marks */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#FCCE4C]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#FCCE4C]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#FCCE4C]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#FCCE4C]" />
                </div>
              )}

              {/* If camera cannot load or error */}
              {!cameraActive && (
                <div className="p-4 text-center text-white space-y-2">
                  <Camera className="w-10 h-10 mx-auto text-stone-400" />
                  <p className="text-xs text-stone-300">
                    {cameraError || 'Initializing camera device...'}
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-xl bg-[#FCCE4C] text-stone-900 text-xs font-bold shadow-sm"
                  >
                    Retry Camera
                  </button>
                </div>
              )}

              {cameraActive && (
                <div className="absolute bottom-3 inset-x-0 flex justify-center">
                  <button
                    onClick={handleCaptureFromCamera}
                    className="w-14 h-14 rounded-full bg-white border-4 border-[#FCCE4C] shadow-lg flex items-center justify-center active:scale-90 transition-transform"
                    title="Snap photo now"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center">
                      <Scan className="w-5 h-5 text-white" />
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas for capture processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Animation State with Real Local Progress */}
          {isScanning && (
            <div className="p-6 rounded-2xl bg-white border-2 border-[#1E293B]/20 text-center space-y-4">
              <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400 bg-stone-100 flex items-center justify-center">
                {previewImage ? (
                  <img src={previewImage} alt="Scanning" className="w-full h-full object-cover" />
                ) : (
                  <Scan className="w-12 h-12 text-stone-400" />
                )}
                {/* Moving Laser Beam */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-bounce" />
              </div>
              <div className="space-y-2">
                <div className="font-extrabold text-sm text-[#1E293B] flex items-center justify-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" />
                  <span className="truncate">{ocrStatus}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
                  <div
                    className="h-full bg-amber-400 transition-all duration-200"
                    style={{ width: `${Math.round(Math.max(0.15, ocrProgress) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  100% on-device offline OCR processing without cloud transfer
                </p>
              </div>
            </div>
          )}

          {/* Scanned Result Card */}
          {scannedResult && !isScanning && (
            <div className="space-y-3 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Offline Scan Complete ({Math.round(scannedResult.confidence * 100)}% Confidence)
                </div>

                <div className="flex items-start gap-3 mt-1">
                  {previewImage && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-stone-300 flex-shrink-0 bg-stone-50 shadow-2xs">
                      <img src={previewImage} alt="Receipt" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Detected Merchant / Item
                    </span>
                    <h3 className="font-extrabold text-lg text-[#1E293B] leading-tight">
                      {scannedResult.merchant}
                    </h3>
                    <div className="text-2xl font-black text-rose-600 mt-0.5" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      ${scannedResult.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 text-xs">
                  <div className="bg-stone-50 p-2 rounded-xl">
                    <span className="text-stone-400 block text-[10px] font-bold">Category</span>
                    <span className="font-black text-stone-800">{scannedResult.categoryName}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl">
                    <span className="text-stone-400 block text-[10px] font-bold">Payment Method</span>
                    <span className="font-black text-stone-800">{scannedResult.paymentMethod}</span>
                  </div>
                </div>

                {/* Itemized list if detected */}
                {scannedResult.items && scannedResult.items.length > 0 && (
                  <div className="mt-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1.5">
                      Detected Line Items ({scannedResult.items.length} items automatically filled into Item 1, Item 2...)
                    </span>
                    <ul className="text-xs space-y-1.5 text-stone-700 max-h-36 overflow-y-auto pr-1">
                      {scannedResult.items.map((it: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-stone-200 shadow-2xs">
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex-shrink-0">
                            Item {idx + 1}
                          </span>
                          <span className="font-bold text-[#1E293B] truncate">{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scannedResult.note && (
                  <div className="mt-2 text-xs text-stone-500 italic">
                    "{scannedResult.note}"
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setScannedResult(null);
                    setPreviewImage(null);
                    setSelectedSample(null);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs border border-stone-300 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Scan Another
                </button>

                <button
                  onClick={handleConfirmApply}
                  className="flex-[2] py-2.5 rounded-2xl bg-[#FCCE4C] hover:bg-[#FBBF24] text-[#1E293B] font-extrabold text-sm border-2 border-[#1E293B] shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply to Transaction Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
