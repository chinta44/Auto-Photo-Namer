import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
  Dog,
  Settings,
  HelpCircle,
  Zap,
  AlertCircle,
  Target,
  MapPin,
  Layers,
  X,
  Trash2,
  Utensils
} from 'lucide-react';
import { FocusPoint, LocationData, BatchPhotoItem } from '../types';
import { getCurrentLocationData } from '../utils/locationService';

interface CameraViewProps {
  onCaptureImage: (dataUrl: string, focusPoint?: FocusPoint, location?: LocationData | null) => void;
  onStartBatchAnalysis: (items: BatchPhotoItem[], location?: LocationData | null) => void;
  isAnalyzing: boolean;
  activeTab?: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide';
  setActiveTab?: (tab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide') => void;
  savedCount?: number;
  petCount?: number;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCaptureImage,
  onStartBatchAnalysis,
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

  // Mode: 'single' (1枚ずつすぐ命名) or 'multi' (複数枚撮ってから一括命名)
  const [shootMode, setShootMode] = useState<'single' | 'multi'>('single');
  const [queuedPhotos, setQueuedPhotos] = useState<BatchPhotoItem[]>([]);

  // Location / GPS Detection State
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Fetch Location when enabled
  const fetchLocation = async () => {
    setIsFetchingLocation(true);
    const loc = await getCurrentLocationData();
    setLocationData(loc);
    setIsFetchingLocation(false);
  };

  useEffect(() => {
    if (isLocationEnabled) {
      fetchLocation();
    } else {
      setLocationData(null);
    }
  }, [isLocationEnabled]);

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
    } catch (e) {}
  };

  const startCamera = async () => {
    setCameraError(null);
    setHasCameraAccess(null);

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

      if (shootMode === 'single') {
        onCaptureImage(dataUrl, selectedFocusPoint || undefined, locationData);
      } else {
        // Multi-shot mode: append to queued list
        const newItem: BatchPhotoItem = {
          id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          dataUrl,
          focusPoint: selectedFocusPoint || undefined,
        };
        setQueuedPhotos((prev) => [...prev, newItem]);
        setSelectedFocusPoint(null); // reset focus point for next shot
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: BatchPhotoItem[] = [];
    let processed = 0;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          if (shootMode === 'single' && files.length === 1) {
            onCaptureImage(dataUrl, undefined, locationData);
          } else {
            newItems.push({
              id: `batch-upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              dataUrl,
            });
            processed++;
            if (processed === files.length) {
              setQueuedPhotos((prev) => [...prev, ...newItems]);
              if (shootMode === 'single' && files.length > 1) {
                setShootMode('multi'); // Auto-switch to multi mode if multiple files uploaded
              }
            }
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveQueuedPhoto = (id: string) => {
    setQueuedPhotos((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTriggerBatchAnalysis = () => {
    if (queuedPhotos.length === 0) return;
    onStartBatchAnalysis(queuedPhotos, locationData);
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
          className={`relative w-full h-[60vh] sm:h-[68vh] min-h-[400px] max-h-[780px] bg-slate-950 flex items-center justify-center overflow-hidden ${
            hasCameraAccess ? 'cursor-crosshair' : ''
          }`}
        >
          {/* Top Overlay Navigation inside Camera Preview Frame */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
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

            {/* GPS Location Toggle Button */}
            <button
              onClick={() => setIsLocationEnabled(!isLocationEnabled)}
              title={isLocationEnabled ? '位置情報をAI命名に活用中 (クリックで無効化)' : '位置情報を取得する'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold backdrop-blur-xl border shadow-xl transition-all ${
                isLocationEnabled
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isLocationEnabled ? 'text-amber-400 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">
                {isLocationEnabled ? '位置情報: ON' : '位置情報: OFF'}
              </span>
            </button>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={hasCameraAccess ? 'w-full h-full object-cover' : 'hidden'}
          />

          {!hasCameraAccess && (
            <div className="p-6 text-center text-slate-400 space-y-4 z-10 pt-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-300 max-w-md mx-auto leading-relaxed">
                {cameraError || 'カメラを起動しています...'}
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

          {/* Location / Shop Badge Overlay */}
          {isLocationEnabled && (locationData?.placeName || locationData?.address) && (
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
              <div className="bg-slate-950/80 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-2xl text-xs font-bold text-amber-200 flex items-center gap-2 shadow-2xl">
                <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>
                  {locationData.placeName
                    ? `周辺スポット: ${locationData.placeName}`
                    : `現在地: ${locationData.address}`}
                </span>
              </div>
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
                  飲食店・店舗名特定・領収書OCR・ペット識別を実施しています
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mode Selector & Control Strip */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-center gap-2">
          <button
            onClick={() => setShootMode('single')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              shootMode === 'single'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            単射（1枚すぐ名付け）
          </button>
          <button
            onClick={() => setShootMode('multi')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              shootMode === 'multi'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            連写・複数枚撮影（撮影後に一括名付け）
            {queuedPhotos.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full font-mono text-[10px]">
                {queuedPhotos.length}
              </span>
            )}
          </button>
        </div>

        {/* Queued Photos Tray (Multi-Shot Mode) */}
        {shootMode === 'multi' && queuedPhotos.length > 0 && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                撮影・選択済みの写真 ({queuedPhotos.length}枚)
              </span>
              <button
                onClick={() => setQueuedPhotos([])}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                全消去
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {queuedPhotos.map((item, index) => (
                <div key={item.id} className="relative group shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                  <img src={item.dataUrl} alt={`Queued ${index}`} className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-slate-950/80 border border-slate-700 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveQueuedPhoto(item.id)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleTriggerBatchAnalysis}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs rounded-2xl transition shadow-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>選択した{queuedPhotos.length}枚の写真を一括AI名付け解析する</span>
            </button>
          </div>
        )}

        {/* Camera Control Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-semibold transition-all disabled:opacity-40"
            title="アルバムから選択 (複数可)"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">
              {shootMode === 'multi' ? '複数ファイル選択' : 'ファイル選択'}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={shootMode === 'multi'}
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
              <div className="w-12 h-12 rounded-full bg-white group-hover:scale-90 transition-transform shadow-inner flex items-center justify-center">
                {shootMode === 'multi' && (
                  <span className="text-[10px] font-black text-slate-900 font-mono">
                    +{queuedPhotos.length}
                  </span>
                )}
              </div>
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
