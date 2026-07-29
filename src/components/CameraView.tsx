import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, Image as ImageIcon, Dog, Settings, HelpCircle, Zap, AlertCircle } from 'lucide-react';

interface CameraViewProps {
  onCaptureImage: (dataUrl: string) => void;
  isAnalyzing: boolean;
  activeTab?: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide';
  setActiveTab?: (tab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide') => void;
  savedCount?: number;
  petCount?: number;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCaptureImage,
  isAnalyzing,
  activeTab = 'camera',
  setActiveTab,
  savedCount = 0,
  petCount = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);

  // Play shutter sound effect via Web Audio API
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setHasCameraAccess(null); // loading state

    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("カメラ機能がこのブラウザまたは通信環境でサポートされていません。");
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (e1) {
        // Fallback constraint for devices that fail with width/height ideal constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: false,
        });
      }

      if (stream) {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Autoplay was prevented or failed:", playErr);
          }
        }
        setHasCameraAccess(true);
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setHasCameraAccess(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          "カメラ権限が拒否されているか許可待ちです。ブラウザのアドレスバー横のアイコンからカメラ利用を許可してください。"
        );
      } else {
        setCameraError(
          "カメラの起動に失敗しました。新しいタブで開くか、下記の「写真ファイルを選択」をお試しください。"
        );
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    playShutterSound();
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCaptureImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCaptureImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Hidden canvas for taking snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Camera / Preview Frame */}
      <div className="relative bg-slate-900 rounded-3xl overflow-hidden border-4 border-indigo-600 shadow-2xl">
        {/* Shutter Flash Animation overlay */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
        )}

        {/* Video Viewport */}
        <div className="relative aspect-[4/3] md:aspect-[16/9] bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Top Overlay Navigation inside Camera Preview Frame */}
          <div className="absolute top-2.5 left-2 right-2 z-20 flex items-center justify-center pointer-events-auto">
            <nav className="flex items-center gap-1 p-1 bg-indigo-950/85 backdrop-blur-md border-2 border-indigo-500/50 rounded-2xl shadow-2xl max-w-full overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab?.('camera')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
                  activeTab === 'camera'
                    ? 'bg-yellow-400 text-indigo-950 shadow-md scale-105 font-black'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                カメラ
              </button>

              <button
                onClick={() => setActiveTab?.('gallery')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
                  activeTab === 'gallery'
                    ? 'bg-yellow-400 text-indigo-950 shadow-md scale-105 font-black'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                保存画像
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-900 text-yellow-300 text-[10px] font-black rounded-full">
                    {savedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab?.('pets')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
                  activeTab === 'pets'
                    ? 'bg-yellow-400 text-indigo-950 shadow-md scale-105 font-black'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                <Dog className="w-3.5 h-3.5" />
                ペット
                {petCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-pink-500 text-white text-[10px] font-black rounded-full">
                    {petCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab?.('rules')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
                  activeTab === 'rules'
                    ? 'bg-yellow-400 text-indigo-950 shadow-md scale-105 font-black'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                ルール
              </button>

              <button
                onClick={() => setActiveTab?.('guide')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
                  activeTab === 'guide'
                    ? 'bg-yellow-400 text-indigo-950 shadow-md scale-105 font-black'
                    : 'text-yellow-300 hover:bg-white/15'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Q&A
              </button>
            </nav>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={hasCameraAccess ? "w-full h-full object-cover" : "hidden"}
          />

          {!hasCameraAccess && (
            <div className="p-6 text-center text-slate-400 space-y-3 z-10 pt-16">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center mx-auto text-yellow-400">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-200 max-w-md mx-auto">
                {cameraError || "カメラを起動しています..."}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  カメラを再起動
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  写真ファイルを選択
                </button>
              </div>
            </div>
          )}

          {/* Target Reticle Overlay for AI Camera feel */}
          {hasCameraAccess && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center pt-8">
              <div className="w-64 h-64 border-2 border-dashed border-yellow-400/80 rounded-2xl flex items-center justify-center relative">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-400"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-400"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-400"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-400"></div>
                <span className="bg-indigo-900/90 text-yellow-400 text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-yellow-400/50 backdrop-blur-sm">
                  TARGET DETECTED
                </span>
              </div>
            </div>
          )}

          {/* Analyzing Spinner Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-indigo-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-white space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-yellow-400/20 border-t-yellow-400 animate-spin"></div>
                <Sparkles className="w-6 h-6 text-yellow-400 absolute inset-0 m-auto animate-bounce" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-black text-lg text-yellow-400 uppercase tracking-wide">
                  Gemini AI 解析中...
                </p>
                <p className="text-xs text-indigo-200 font-medium">
                  領収書OCR・ペット顔識別・自動判定を実施しています
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Control Bar */}
        <div className="p-4 bg-indigo-950 border-t border-indigo-900 flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 text-xs font-bold transition-colors"
            title="アルバムから選択"
          >
            <Upload className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">ファイル選択</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Shutter Button */}
          <button
            id="shutter-button"
            onClick={handleCapture}
            disabled={isAnalyzing}
            className="group relative p-1 rounded-full bg-indigo-600 shadow-2xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-400 border-4 border-indigo-600 shadow-lg flex items-center justify-center group-hover:bg-yellow-300 transition-colors">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-900 group-hover:scale-90 transition-transform"></div>
            </div>
          </button>

          {/* Camera Switch button */}
          <button
            onClick={() =>
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
            }
            disabled={isAnalyzing || !hasCameraAccess}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 text-xs font-bold transition-colors disabled:opacity-40"
            title="カメラ切り替え"
          >
            <RefreshCw className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">カメラ切替</span>
          </button>
        </div>
      </div>
    </div>
  );
};
