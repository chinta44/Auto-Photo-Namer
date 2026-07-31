import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, Image as ImageIcon, Dog, Settings, HelpCircle, Zap, AlertCircle, Target, MapPin } from 'lucide-react';
import { FocusPoint } from '../types';

interface CameraViewProps {
  onCaptureImage: (dataUrl: string, focusPoint?: FocusPoint) => void;
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

  const [selectedFocusPoint, setSelectedFocusPoint] = useState<FocusPoint | null>(null);

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSelectedFocusPoint({ x: Math.round(x), y: Math.round(y) });
  };

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
      onCaptureImage(dataUrl, selectedFocusPoint || undefined);
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
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Hidden canvas for taking snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Camera / Preview Frame */}
      <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Shutter Flash Animation overlay */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
        )}

        {/* Video Viewport - Maximized to screen height */}
        <div
          onClick={hasCameraAccess ? handleVideoClick : undefined}
          className={`relative w-full h-[62vh] sm:h-[72vh] min-h-[420px] max-h-[800px] bg-slate-950 flex items-center justify-center overflow-hidden ${hasCameraAccess ? 'cursor-crosshair' : ''}`}
        >
          {/* Top Overlay Navigation inside Camera Preview Frame */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-center pointer-events-auto">
            <nav className="flex items-center gap-1 p-1.5 bg-slate-950/80 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl max-w-full overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab?.('camera')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'camera'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                カメラ
              </button>

              <button
                onClick={() => setActiveTab?.('gallery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'gallery'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                ギャラリー
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-slate-900 text-indigo-300 text-[10px] font-extrabold rounded-full border border-indigo-500/30">
                    {savedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab?.('pets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'pets'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Dog className="w-3.5 h-3.5" />
                ペット
                {petCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-slate-900 text-pink-300 text-[10px] font-extrabold rounded-full border border-pink-500/30">
                    {petCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab?.('rules')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'rules'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                ルール
              </button>

              <button
                onClick={() => setActiveTab?.('guide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'guide'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20'
                    : 'text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                ガイド
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
            <div className="p-6 text-center text-slate-400 space-y-4 z-10 pt-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-300 max-w-md mx-auto leading-relaxed">
                {cameraError || "カメラを起動しています..."}
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                  カメラを再起動
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  写真ファイルを選択
                </button>
              </div>
            </div>
          )}

          {/* User Tap-to-Focus Point Indicator Overlay */}
          {selectedFocusPoint && (
            <div
              className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${selectedFocusPoint.x}%`, top: `${selectedFocusPoint.y}%` }}
            >
              <div className="w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center animate-pulse shadow-2xl">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="bg-slate-900/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                指定オブジェクト命名
              </span>
            </div>
          )}

          {/* Target Reticle Overlay for AI Camera feel */}
          {hasCameraAccess && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center pt-8">
              <div className="w-64 h-64 border border-dashed border-indigo-400/40 rounded-2xl flex items-center justify-center relative">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>
                <span className="bg-slate-950/80 text-indigo-300 text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI TARGET READY
                </span>
              </div>
            </div>
          )}

          {/* Analyzing Spinner Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-30 flex flex-col items-center justify-center text-white space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-base text-white tracking-wide flex items-center justify-center gap-2">
                  Gemini AI 解析中...
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  領収書OCR・ペット顔識別・自動判定を実施しています
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Control Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-semibold transition-all disabled:opacity-40"
            title="アルバムから選択"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
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
            className="group relative p-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-white/80 flex items-center justify-center group-hover:border-indigo-300 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white group-hover:scale-90 transition-transform shadow-inner"></div>
            </div>
          </button>

          {/* Camera Switch button */}
          <button
            onClick={() =>
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
            }
            disabled={isAnalyzing || !hasCameraAccess}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-semibold transition-all disabled:opacity-40"
            title="カメラ切り替え"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">カメラ切替</span>
          </button>
        </div>
      </div>
    </div>
  );
};
