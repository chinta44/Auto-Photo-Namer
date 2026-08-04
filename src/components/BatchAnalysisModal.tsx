import React, { useState, useEffect } from 'react';
import { BatchPhotoItem, AnalysisResult, SavedPhoto, PetProfile, NamingRuleConfig, LocationData } from '../types';
import {
  Download,
  Save,
  Check,
  X,
  Sparkles,
  FolderDown,
  CheckCircle2,
  AlertTriangle,
  Dog,
  Receipt,
  Package,
  FileText,
  HelpCircle,
  MapPin,
  Utensils,
  Edit2,
  RefreshCw
} from 'lucide-react';
import { downloadImageWithPicker } from '../utils/fileSaveUtils';
import { convertToJpegBase64 } from '../utils/imageUtils';
import { apiUrl } from '../utils/apiConfig';

interface BatchAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  queuedItems: BatchPhotoItem[];
  petProfiles: PetProfile[];
  namingConfig: NamingRuleConfig;
  userApiKey: string;
  onSaveToGallery: (photos: SavedPhoto[]) => void;
  locationData: LocationData | null;
}

export const BatchAnalysisModal: React.FC<BatchAnalysisModalProps> = ({
  isOpen,
  onClose,
  queuedItems: initialItems,
  petProfiles,
  namingConfig,
  userApiKey,
  onSaveToGallery,
  locationData,
}) => {
  const [items, setItems] = useState<BatchPhotoItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [globalStatusMessage, setGlobalStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialItems.length > 0) {
      setItems(
        initialItems.map((item) => ({
          ...item,
          isAnalyzing: false,
          isSaved: false,
          isDownloaded: false,
        }))
      );
      startBatchAnalysis(initialItems);
    }
  }, [isOpen]);

  const startBatchAnalysis = async (batchList: BatchPhotoItem[]) => {
    setIsProcessing(true);
    setProgress({ current: 0, total: batchList.length });
    setGlobalStatusMessage(`全${batchList.length}枚の写真をGemini AIで解析しています...`);

    const updated = [...batchList];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      setProgress({ current: i + 1, total: updated.length });

      // Mark current item as analyzing
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isAnalyzing: true } : it))
      );

      try {
        const converted = await convertToJpegBase64(item.dataUrl);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (userApiKey) {
          headers['x-gemini-api-key'] = userApiKey;
        }

        const res = await fetch(apiUrl('/api/analyze-photo'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            imageBase64: converted.base64Data,
            mimeType: converted.mimeType,
            petProfiles,
            namingConfig,
            focusPoint: item.focusPoint,
            location: locationData,
            customApiKey: userApiKey,
          }),
        });

        const data: AnalysisResult = await res.json();
        const suggestedName = data.suggestedFilename || `photo_${i + 1}.jpg`;

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  analysis: data,
                  selectedFilename: suggestedName,
                  isAnalyzing: false,
                }
              : it
          )
        );
      } catch (err: any) {
        console.error(`Error analyzing item ${i}:`, err);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  isAnalyzing: false,
                  error: err.message || 'AI解析エラー',
                }
              : it
          )
        );
      }
    }

    setIsProcessing(false);
    setGlobalStatusMessage(`解析完了！それぞれのファイル名を確認して保存・ダウンロードできます。`);
  };

  const handleFilenameChange = (id: string, newName: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selectedFilename: newName } : it))
    );
  };

  const handleSingleDownload = async (item: BatchPhotoItem) => {
    const filename = item.selectedFilename || item.analysis?.suggestedFilename || 'photo.jpg';
    const success = await downloadImageWithPicker(item.dataUrl, filename);
    if (success) {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isDownloaded: true } : it))
      );
    }
  };

  const handleSingleSave = (item: BatchPhotoItem) => {
    if (!item.analysis) return;
    const filename = item.selectedFilename || item.analysis.suggestedFilename;
    const savedPhoto: SavedPhoto = {
      id: item.id,
      dataUrl: item.dataUrl,
      filename,
      category: item.analysis.category,
      analysis: {
        ...item.analysis,
        suggestedFilename: filename,
      },
      timestamp: new Date().toLocaleString('ja-JP'),
      customTags: [],
      notes: '',
      location: locationData || undefined,
    };

    onSaveToGallery([savedPhoto]);
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isSaved: true } : it))
    );
  };

  const handleBulkDownload = async () => {
    for (const item of items) {
      const filename = item.selectedFilename || item.analysis?.suggestedFilename || 'photo.jpg';
      await downloadImageWithPicker(item.dataUrl, filename);
    }
    setItems((prev) => prev.map((it) => ({ ...it, isDownloaded: true })));
  };

  const handleBulkSave = () => {
    const toSave: SavedPhoto[] = items
      .filter((it) => it.analysis)
      .map((item) => {
        const filename = item.selectedFilename || item.analysis!.suggestedFilename;
        return {
          id: item.id,
          dataUrl: item.dataUrl,
          filename,
          category: item.analysis!.category,
          analysis: {
            ...item.analysis!,
            suggestedFilename: filename,
          },
          timestamp: new Date().toLocaleString('ja-JP'),
          customTags: [],
          notes: '',
          location: locationData || undefined,
        };
      });

    if (toSave.length > 0) {
      onSaveToGallery(toSave);
      setItems((prev) => prev.map((it) => ({ ...it, isSaved: true })));
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'food':
        return (
          <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-bold flex items-center gap-1">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            料理・グルメ
          </span>
        );
      case 'receipt':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            領収書
          </span>
        );
      case 'pet':
        return (
          <span className="px-2.5 py-1 bg-pink-500/20 border border-pink-500/40 text-pink-300 rounded-full text-xs font-bold flex items-center gap-1">
            <Dog className="w-3.5 h-3.5 text-pink-400" />
            ペット
          </span>
        );
      case 'product':
        return (
          <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-full text-xs font-bold flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-blue-400" />
            商品・物品
          </span>
        );
      case 'document':
        return (
          <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-full text-xs font-bold flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            書類・メモ
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-xs font-bold flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            その他
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                複数写真の一括AI名付け解析結果
                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-mono font-bold">
                  {items.length}枚
                </span>
              </h3>
              {locationData?.placeName || locationData?.address ? (
                <p className="text-xs text-amber-300/90 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  位置情報適用中: {locationData.placeName || locationData.address}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">
                  すべての写真をAIが自動識別・自動命名しました
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Progress Banner */}
        {isProcessing && (
          <div className="p-4 bg-indigo-950/60 border-b border-indigo-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                {globalStatusMessage}
              </span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-slate-700 transition"
            >
              {/* Image Preview & Index */}
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                <img
                  src={item.dataUrl}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white font-mono font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                {item.isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Analysis Details & Filename Input */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  {getCategoryBadge(item.analysis?.category)}
                  <span className="font-bold text-white text-sm">
                    {item.analysis?.detectedTitle || (item.isAnalyzing ? '解析中...' : '未解析')}
                  </span>
                  {item.analysis?.details?.restaurantName && (
                    <span className="text-xs text-amber-300 bg-amber-950/60 border border-amber-700/60 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      {item.analysis.details.restaurantName}
                    </span>
                  )}
                </div>

                {/* Editable Filename Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
                    <Edit2 className="w-3 h-3 text-indigo-400" />
                    AI命名ファイル名 (編集可能)
                  </label>
                  <input
                    type="text"
                    value={item.selectedFilename || ''}
                    onChange={(e) => handleFilenameChange(item.id, e.target.value)}
                    placeholder="ファイル名を入力..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold text-indigo-200 outline-none transition"
                  />
                </div>

                {/* AI Explanation Summary */}
                {item.analysis?.explanation && (
                  <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    💡 {item.analysis.explanation}
                  </p>
                )}
              </div>

              {/* Individual Action Buttons */}
              <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto justify-end">
                <button
                  onClick={() => handleSingleDownload(item)}
                  className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    item.isDownloaded
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {item.isDownloaded ? <Check className="w-3.5 h-3.5" /> : <FolderDown className="w-3.5 h-3.5" />}
                  <span>{item.isDownloaded ? '保存済み' : 'ダウンロード'}</span>
                </button>

                <button
                  onClick={() => handleSingleSave(item)}
                  disabled={!item.analysis}
                  className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    item.isSaved
                      ? 'bg-slate-800 text-indigo-400 border border-indigo-500/40'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40'
                  }`}
                >
                  {item.isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{item.isSaved ? 'アプリ保存済み' : 'アプリに保存'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer Bulk Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium">
            全 <span className="font-bold text-white">{items.length}</span> 枚中{' '}
            <span className="text-emerald-400 font-bold">
              {items.filter((i) => i.isDownloaded).length}
            </span>{' '}
            枚をダウンロード保存済み
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBulkDownload}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-40"
            >
              <FolderDown className="w-4 h-4" />
              <span>全ファイルを一括ダウンロード</span>
            </button>

            <button
              onClick={handleBulkSave}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              <span>全ファイルをアプリに保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
