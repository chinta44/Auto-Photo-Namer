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
  Target,
  MapPin,
  Layers,
  X,
  Trash2,
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

  // Fetch Location asynchronously without blocking camera load
  const fetchLocation = async () => {
    try {
      const loc = await getCurrentLocationData();
      setLocationData(loc);
    } catch (e) {
      console.warn('Location fetch skipped:', e);
    }
  };

  useEffect(() => {
    if (isLocationEnabled) {
      // Delay location request slightly so camera video initializes instantly first
      const timer = setTimeout(() => {
        fetchLocation();
      }, 500);
      return () => clearTimeout(timer);
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

    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("カメラ機能がこのブラウザまたは通信環境でサポートされていません。");
      }

      // Request the highest resolution the device's camera can provide.
      // Without explicit width/height constraints, browsers (especially
      // Android WebView) tend to default to a conservative low resolution
      // (e.g. 640x480) rather than the camera's actual capability.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          // @ts-ignore — focusMode is supported by some Chromium-based
          // browsers (incl. Android) even though it's not in the
          // standard TS lib.dom types yet.
          focusMode: 'continuous',
        },
        audio: false,
      });

      if (stream) {
        // Some WebViews (notably Android's System WebView used by the
        // Capacitor app) largely ignore "ideal" width/height hints in the
        // initial getUserMedia() call and hand back a low default
        // resolution (e.g. 480x640) regardless. As a second pass, ask the
        // track what it's actually capable of and explicitly request its
        // reported maximum — this is respected much more reliably.
        const [videoTrack] = stream.getVideoTracks();
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
          try {
            const caps = videoTrack.getCapabilities();
            if (caps.width?.max && caps.height?.max) {
              await videoTrack.applyConstraints({
                width: { ideal: caps.width.max },
                height: { ideal: caps.height.max },
              });
            }
          } catch (capErr) {
            console.warn('Could not apply max-resolution constraints:', capErr);
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Autoplay was prevented or failed:", playErr);
          }
          videoRef.current.addEventListener('loadedmetadata', () => {
            console.log(
              `[SmartName][Camera] Actual video resolution: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`
            );
          }, { once: true });
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
    // Prevent setting focus point behind bottom shutter bar or top nav bar
    if (y > 80 || y < 12) return;
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
        setSelectedFocusPoint(null); // reset focus point
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[SmartName][Upload] onChange fired', e.target.files);
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('[SmartName][Upload] no files selected, aborting');
      return;
    }

    const fileCount = files.length;
    console.log('[SmartName][Upload] fileCount =', fileCount);

    // Uploading a single file should always kick off immediate AI analysis,
    // regardless of the current shoot mode (single/multi). Previously this
    // depended on shootMode, so a single upload made while in "連写" (multi)
    // mode was silently queued instead of analyzed, looking like it "did nothing".
    if (fileCount === 1) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('[SmartName][Upload] FileReader onload, result length =', (event.target?.result as string)?.length);
        if (event.target?.result) {
          console.log('[SmartName][Upload] calling onCaptureImage...');
          onCaptureImage(event.target.result as string, undefined, locationData);
        }
      };
      reader.onerror = () => {
        console.error('[SmartName][Upload] FileReader error:', reader.error);
        window.alert('写真ファイルの読み込みに失敗しました。別の写真でお試しください。');
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Multiple files: queue them for batch analysis (triggered via "一括AI名付け開始")
    const newItems: BatchPhotoItem[] = [];
    let processed = 0;
    let failed = 0;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newItems.push({
            id: `batch-upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            dataUrl: event.target.result as string,
          });
        }
        processed++;
        if (processed === fileCount) {
          setQueuedPhotos((prev) => [...prev, ...newItems]);
          if (shootMode === 'single') {
            setShootMode('multi');
          }
          if (failed > 0) {
            window.alert(`${failed}枚の写真の読み込みに失敗しました。残りの写真はキューに追加されています。`);
          }
        }
      };
      reader.onerror = () => {
        console.error('Failed to read uploaded file:', file.name, reader.error);
        failed++;
        processed++;
        if (processed === fileCount) {
          setQueuedPhotos((prev) => [...prev, ...newItems]);
          if (shootMode === 'single') {
            setShootMode('multi');
          }
          if (failed > 0) {
            window.alert(`${failed}枚の写真の読み込みに失敗しました。残りの写真はキューに追加されています。`);
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
    <div className="w-full max-w-5xl mx-auto space-y-3">
      {/* Hidden canvas for taking snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Camera Frame */}
      <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl">
        {/* Shutter Flash Overlay */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
        )}

        {/* Viewport Box (Responsive height) */}
        <div
          onClick={hasCameraAccess ? handleVideoClick : undefined}
          className={`relative w-full h-[65vh] sm:h-[72vh] min-h-[460px] max-h-[820px] bg-slate-950 flex items-center justify-center overflow-hidden ${
            hasCameraAccess ? 'cursor-crosshair' : ''
          }`}
        >
          {/* Top Overlay Bar */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-end pointer-events-auto">
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
                  onClick={() => { console.log('[SmartName][Upload] button clicked, fileInputRef=', fileInputRef.current); fileInputRef.current?.click(); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  写真ファイルを選択
                </button>
              </div>
            </div>
          )}

          {/* User Tap-to-Focus Point Indicator */}
          {selectedFocusPoint && (
            <div
              className={`absolute z-35 transform -translate-x-1/2 -translate-y-1/2 flex items-center ${
                selectedFocusPoint.y > 55 ? 'flex-col-reverse mb-2' : 'flex-col mt-2'
              }`}
              style={{ left: `${selectedFocusPoint.x}%`, top: `${selectedFocusPoint.y}%` }}
            >
              <div className="w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center animate-pulse shadow-2xl">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="bg-slate-900/95 backdrop-blur-md text-emerald-300 border border-emerald-500/50 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xl whitespace-nowrap flex items-center gap-1.5 pointer-events-auto my-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>指定オブジェクト命名</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFocusPoint(null);
                  }}
                  className="ml-1 p-0.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition"
                  title="解除"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Location / Shop Badge Overlay (Top Left below nav) */}
          {isLocationEnabled && (locationData?.placeName || locationData?.address) && (
            <div className="absolute top-16 left-3 z-20 pointer-events-none">
              <div className="bg-slate-950/80 backdrop-blur-md border border-amber-500/40 px-3 py-1 rounded-xl text-xs font-bold text-amber-200 flex items-center gap-1.5 shadow-2xl">
                <MapPin className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>
                  {locationData.placeName
                    ? `店舗候補: ${locationData.placeName}`
                    : `現在地: ${locationData.address}`}
                </span>
              </div>
            </div>
          )}

          {/* AI Reticle Target Frame */}
          {hasCameraAccess && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center pb-12">
              <div className="w-64 h-64 sm:w-80 sm:h-80 border border-dashed border-cyan-400/40 rounded-3xl flex items-center justify-center relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg"></div>

                {!selectedFocusPoint && (
                  <div className="bg-slate-900/80 backdrop-blur-md text-cyan-300 text-xs font-medium px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-lg pointer-events-auto cursor-pointer hover:bg-slate-800/90 transition flex items-center gap-1.5">
                    <span>タップで対象を指定</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analyzing Overlay */}
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
                  店舗・グルメ・領収書OCR・ペット自動命名を実施しています
                </p>
              </div>
            </div>
          )}

          {/* Queued Photos Floating Tray (Multi-Shot Mode) — Positioned clearly ABOVE the shutter bar */}
          {shootMode === 'multi' && queuedPhotos.length > 0 && (
            <div className="absolute bottom-28 left-3 right-3 z-40 p-3 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl space-y-2.5 shadow-2xl animate-fade-in pointer-events-auto">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  撮影・選択済み ({queuedPhotos.length}枚)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQueuedPhotos([])}
                    className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-800/40"
                  >
                    <Trash2 className="w-3 h-3" />
                    全消去
                  </button>
                  <button
                    onClick={handleTriggerBatchAnalysis}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>一括AI名付け開始 ({queuedPhotos.length}枚)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {queuedPhotos.map((item, index) => (
                  <div key={item.id} className="relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-indigo-500/30 bg-slate-950 shadow-md">
                    <img src={item.dataUrl} alt={`Queued ${index}`} className="w-full h-full object-cover" />
                    <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-950/90 border border-slate-700 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveQueuedPhoto(item.id)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full opacity-90 hover:bg-rose-500 transition shadow"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floating Camera Control Bar Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-30 px-2 py-1 bg-transparent border-0 flex items-center justify-between pointer-events-auto">
            {/* Left: Mode Switch & Upload */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { console.log('[SmartName][Upload] button clicked, fileInputRef=', fileInputRef.current); fileInputRef.current?.click(); }}
                disabled={isAnalyzing}
                title="写真ファイルを選択・取り込み"
                className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition disabled:opacity-40 shadow-md"
              >
                <Upload className="w-5 h-5 text-slate-300" />
              </button>

              <button
                onClick={() => setShootMode((prev) => (prev === 'single' ? 'multi' : 'single'))}
                title={shootMode === 'multi' ? '連写モード: 複数枚撮って一括判定' : '単射モード: 1枚ずつ判定'}
                className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border shadow-md ${
                  shootMode === 'multi'
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">{shootMode === 'multi' ? '連写' : '単射'}</span>
                {shootMode === 'multi' && queuedPhotos.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full font-mono text-[10px] font-black">
                    {queuedPhotos.length}
                  </span>
                )}
              </button>
            </div>

            {/* Center: WHITE RING SHUTTER BUTTON */}
            <div className="flex flex-col items-center">
              <button
                id="shutter-button"
                onClick={handleCapture}
                disabled={isAnalyzing}
                className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/90 p-1 bg-transparent hover:scale-105 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50 shadow-2xl"
              >
                <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-white group-hover:bg-slate-100 transition-colors shadow-inner flex items-center justify-center">
                  {shootMode === 'multi' && queuedPhotos.length > 0 && (
                    <span className="text-[11px] font-black text-slate-900 font-mono">
                      +{queuedPhotos.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Right: Camera Switch Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                disabled={isAnalyzing || !hasCameraAccess}
                title="インカメラ / アウトカメラ切替"
                className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition disabled:opacity-40 shadow-md"
              >
                <RefreshCw className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
