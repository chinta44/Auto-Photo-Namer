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
      <div className="relative bg-[#0F0F0F] rounded-2xl overflow-hidden border border-[#3A3A3A]">
        {/* Shutter Flash Animation overlay */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
        )}

        {/* Video Viewport */}
        <div className="relative aspect-[4/3] md:aspect-[16/9] bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
          {/* Top Overlay Navigation inside Camera Preview Frame (desktop only, mobile uses bottom bar) */}
          <div className="hidden md:flex absolute top-2.5 left-2 right-2 z-20 items-center justify-center pointer-events-auto">
            <nav className="flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-md border border-[#3A3A3A] rounded-xl shadow-lg max-w-full overflow-x-auto">
              <button
                onClick={() => setActiveTab?.('camera')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === 'camera'
                    ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold'
                    : 'text-[#F2F0EC] hover:bg-white/10'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                カメラ
              </button>

              <button
                onClick={() => setActiveTab?.('gallery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === 'gallery'
                    ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold'
                    : 'text-[#F2F0EC] hover:bg-white/10'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                保存画像
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-black/30 text-[10px] font-mono rounded-full">
                    {savedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab?.('pets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === 'pets'
                    ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold'
                    : 'text-[#F2F0EC] hover:bg-white/10'
                }`}
              >
                <Dog className="w-3.5 h-3.5" />
                ペット
                {petCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-black/30 text-[10px] font-mono rounded-full">
                    {petCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab?.('rules')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === 'rules'
                    ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold'
                    : 'text-[#F2F0EC] hover:bg-white/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                ルール
              </button>

              <button
                onClick={() => setActiveTab?.('guide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === 'guide'
                    ? 'bg-[#E8B04B] text-[#1A1A1A] font-semibold'
                    : 'text-[#E8B04B]/80 hover:bg-white/10'
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
            <div className="p-6 text-center text-[#9A9890] space-y-3 z-10 pt-16">
              <div className="w-14 h-14 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] flex items-center justify-center mx-auto text-[#7FDBCA]">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium text-[#F2F0EC] max-w-md mx-auto">
                {cameraError || "カメラを起動しています..."}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-[#242424] hover:bg-[#2C2C2C] border border-[#3A3A3A] text-[#F2F0EC] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  カメラを再起動
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#7FDBCA] hover:brightness-110 text-[#0F1E1C] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
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
              <div className="w-64 h-64 border border-dashed border-[#7FDBCA]/70 rounded-xl flex items-center justify-center relative">
                <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#7FDBCA]"></div>
                <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#7FDBCA]"></div>
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#7FDBCA]"></div>
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#7FDBCA]"></div>
                <span className="bg-[#0F0F0F]/85 text-[#7FDBCA] text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-[#7FDBCA]/40 backdrop-blur-sm">
                  target detected
                </span>
              </div>
            </div>
          )}

          {/* Analyzing Spinner Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-[#0A0A0A]/92 backdrop-blur-md z-30 flex flex-col items-center justify-center text-[#F2F0EC] space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-[#7FDBCA]/20 border-t-[#7FDBCA] animate-spin"></div>
                <Sparkles className="w-5 h-5 text-[#7FDBCA] absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono text-sm text-[#7FDBCA] tracking-wide">
                  Gemini AI 解析中...
                </p>
                <p className="text-xs text-[#9A9890]">
                  領収書OCR・ペット顔識別・自動判定を実施しています
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Control Bar */}
        <div className="p-4 bg-[#1A1A1A] border-t border-[#3A3A3A] flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#242424] hover:bg-[#2C2C2C] border border-[#3A3A3A] text-[#9A9890] text-xs font-medium transition-colors"
            title="アルバムから選択"
          >
            <Upload className="w-4 h-4" />
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
            className="group relative p-1 rounded-full border-2 border-[#F2F0EC] hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
          >
            <div className="w-14 h-14 rounded-full bg-[#F2F0EC] group-hover:brightness-90 transition-all"></div>
          </button>

          {/* Camera Switch button */}
          <button
            onClick={() =>
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
            }
            disabled={isAnalyzing || !hasCameraAccess}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#242424] hover:bg-[#2C2C2C] border border-[#3A3A3A] text-[#9A9890] text-xs font-medium transition-colors disabled:opacity-40"
            title="カメラ切り替え"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">カメラ切替</span>
          </button>
        </div>
      </div>
    </div>
  );
};
