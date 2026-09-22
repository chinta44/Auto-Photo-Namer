import React, { useEffect, useRef, useState } from 'react';
import { Check, X, Crop, AlertTriangle, RefreshCw, ScanLine } from 'lucide-react';
import {
  detectDocumentQuad,
  warpToRectangle,
  defaultQuad,
  isUsableQuad,
  Quad,
  Point,
} from '../utils/documentScan';

interface DocumentScanModalProps {
  imageDataUrl: string;
  onApply: (straightenedDataUrl: string) => void;
  onCancel: () => void;
}

const HANDLE_RADIUS = 14;

/** Corner-adjustment UI for straightening a photographed document (receipt, paper, etc.).
 * Detects the document automatically; the four corners can always be dragged to fix it up. */
export const DocumentScanModal: React.FC<DocumentScanModalProps> = ({ imageDataUrl, onApply, onCancel }) => {
  const [quad, setQuad] = useState<Quad | null>(null);
  const [wasAutoDetected, setWasAutoDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  const [isWarping, setIsWarping] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const imgWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsDetecting(true);
    detectDocumentQuad(imageDataUrl)
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setQuad(found);
          setWasAutoDetected(true);
        } else {
          setQuad(defaultQuad());
          setWasAutoDetected(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQuad(defaultQuad());
          setWasAutoDetected(false);
        }
      })
      .finally(() => {
        if (!cancelled) setIsDetecting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [imageDataUrl]);

  const pointFromEvent = (e: React.PointerEvent): Point | null => {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragIndex(index);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragIndex === null || !quad) return;
    const p = pointFromEvent(e);
    if (!p) return;
    const next = quad.slice() as Quad;
    next[dragIndex] = p;
    setQuad(next);
  };

  const endDrag = () => setDragIndex(null);

  const handleReset = () => {
    setQuad(defaultQuad());
    setWasAutoDetected(false);
  };

  const handleRedetect = () => {
    setIsDetecting(true);
    detectDocumentQuad(imageDataUrl)
      .then((found) => {
        setQuad(found ?? defaultQuad());
        setWasAutoDetected(!!found);
      })
      .finally(() => setIsDetecting(false));
  };

  const handleApply = async () => {
    if (!quad) return;
    setIsWarping(true);
    try {
      const straightened = await warpToRectangle(imageDataUrl, quad);
      onApply(straightened);
    } catch (e) {
      console.error('Document warp failed:', e);
      window.alert('補正処理に失敗しました。角の位置を調整してもう一度お試しください。');
    } finally {
      setIsWarping(false);
    }
  };

  const usable = quad ? isUsableQuad(quad) : false;
  const labels = ['左上', '右上', '右下', '左下'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Crop className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">文書をまっすぐ補正</h3>
              <p className="text-[11px] text-slate-400">四隅の丸をドラッグして紙の角に合わせてください</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {!wasAutoDetected && !isDetecting && (
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-200 text-[11px] font-semibold flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              自動検出できませんでした。手動で4つの角を紙の端に合わせてください。
            </div>
          )}

          <div
            ref={imgWrapRef}
            className="relative w-full select-none rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={imageDataUrl} draggable={false} className="w-full h-auto block pointer-events-none" alt="" />

            {isDetecting && (
              <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-slate-200">
                  <ScanLine className="w-8 h-8 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold">文書の輪郭を検出しています...</span>
                </div>
              </div>
            )}

            {quad && !isDetecting && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon
                  points={quad.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                  fill={usable ? 'rgba(99,102,241,0.22)' : 'rgba(244,63,94,0.22)'}
                  stroke={usable ? '#818cf8' : '#fb7185'}
                  strokeWidth={0.6}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}

            {quad &&
              !isDetecting &&
              quad.map((p, i) => (
                <div
                  key={i}
                  onPointerDown={handlePointerDown(i)}
                  title={labels[i]}
                  className="absolute rounded-full bg-white border-4 border-indigo-500 shadow-xl cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${p.x * 100}%`,
                    top: `${p.y * 100}%`,
                    width: HANDLE_RADIUS * 2,
                    height: HANDLE_RADIUS * 2,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none',
                  }}
                />
              ))}
          </div>

          {!usable && !isDetecting && (
            <p className="text-[11px] text-rose-300 font-semibold">
              角の並びが交差しているか、範囲が小さすぎます。四隅を紙の外周に沿って配置し直してください。
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRedetect}
              disabled={isDetecting}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              自動検出をやり直す
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              角をリセット
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleApply}
            disabled={!usable || isDetecting || isWarping}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-40"
          >
            {isWarping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{isWarping ? '補正中...' : 'この形で補正する'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
