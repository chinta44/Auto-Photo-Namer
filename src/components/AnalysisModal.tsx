import React, { useState } from 'react';
import { AnalysisResult, PetProfile, SavedPhoto, FocusPoint } from '../types';
import { Download, Copy, Check, Save, Sparkles, X, Dog, Receipt, Package, FileText, HelpCircle, Edit2, Tag, Target, MapPin, RefreshCw, FolderDown } from 'lucide-react';
import { downloadImageWithPicker } from '../utils/fileSaveUtils';

interface AnalysisModalProps {
  imageDataUrl: string;
  analysis: AnalysisResult;
  petProfiles: PetProfile[];
  onSaveToGallery: (photo: SavedPhoto) => void;
  onRegisterPet: (newPet: PetProfile) => void;
  onClose: () => void;
  onReAnalyzeWithFocus?: (dataUrl: string, focusPoint: FocusPoint) => void;
  isAnalyzing?: boolean;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  imageDataUrl,
  analysis,
  petProfiles,
  onSaveToGallery,
  onRegisterPet,
  onClose,
  onReAnalyzeWithFocus,
  isAnalyzing,
}) => {
  const [selectedFilename, setSelectedFilename] = useState(analysis.suggestedFilename);
  const [customTagsText, setCustomTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [focusPin, setFocusPin] = useState<FocusPoint | null>(null);

  const handlePreviewImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocusPin({ x: Math.round(x), y: Math.round(y) });
  };

  // New Pet Registration inline state
  const [newPetName, setNewPetName] = useState('');
  const [showPetForm, setShowPetForm] = useState(false);
  const [registeredPetSuccess, setRegisteredPetSuccess] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'receipt':
        return <Receipt className="w-5 h-5 text-emerald-400" />;
      case 'pet':
        return <Dog className="w-5 h-5 text-amber-400" />;
      case 'product':
        return <Package className="w-5 h-5 text-indigo-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleCopyFilename = () => {
    navigator.clipboard.writeText(selectedFilename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const success = await downloadImageWithPicker(imageDataUrl, selectedFilename);
      if (success) {
        setIsDownloaded(true);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = () => {
    const tags = customTagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const photoRecord: SavedPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl: imageDataUrl,
      filename: selectedFilename,
      category: analysis.category,
      analysis: {
        ...analysis,
        suggestedFilename: selectedFilename,
      },
      timestamp: new Date().toLocaleString('ja-JP'),
      customTags: tags,
      notes: notes,
    };

    onSaveToGallery(photoRecord);
    setIsSaved(true);
  };

  const handleCreatePetProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim()) return;

    const newPet: PetProfile = {
      id: `pet-${Date.now()}`,
      name: newPetName.trim(),
      species: 'dog',
      breedOrDescription: analysis.details.petBreed || '画像認識されたペット',
      registeredAt: new Date().toLocaleDateString('ja-JP'),
      avatarUrl: imageDataUrl,
    };

    onRegisterPet(newPet);
    setRegisteredPetSuccess(true);
    setShowPetForm(false);

    // Update filename with pet name
    const ext = selectedFilename.substring(selectedFilename.lastIndexOf('.'));
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setSelectedFilename(`${newPet.name}_${dateStr}${ext}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-white">AI解析＆自動命名結果</h2>
              <p className="text-xs text-slate-400 font-medium">Gemini Vision AI が画像を判別・命名しました</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Top Preview & Category Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                onClick={handlePreviewImageClick}
                className="relative w-36 h-36 rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500/40 hover:border-indigo-400 cursor-crosshair shadow-xl group"
              >
                <img src={imageDataUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-transparent transition-colors flex items-end p-1.5 pointer-events-none">
                  <span className="text-[9px] font-bold bg-slate-950/80 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 backdrop-blur-xs flex items-center gap-1">
                    <Target className="w-2.5 h-2.5" />
                    画像内の対象をタップ
                  </span>
                </div>

                {focusPin && (
                  <div
                    className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: `${focusPin.x}%`, top: `${focusPin.y}%` }}
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-emerald-400 bg-emerald-500/30 flex items-center justify-center animate-pulse shadow-lg">
                      <Target className="w-4 h-4 text-emerald-300" />
                    </div>
                  </div>
                )}
              </div>

              {focusPin && onReAnalyzeWithFocus && (
                <button
                  onClick={() => onReAnalyzeWithFocus(imageDataUrl, focusPin)}
                  disabled={isAnalyzing}
                  className="w-full px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  📍 タップ位置でAI指定命名
                </button>
              )}
            </div>

            <div className="flex-1 space-y-2 text-left w-full">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-sm">
                  {getCategoryIcon(analysis.category)}
                  {analysis.categoryLabel}
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  確信度: {Math.round(analysis.confidence * 100)}%
                </span>
              </div>

              <h3 className="font-bold text-lg text-white">{analysis.detectedTitle}</h3>
              <p className="text-xs text-slate-300 font-medium bg-slate-900 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                {analysis.explanation}
              </p>

              {/* Detail Chips */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                {analysis.details.receiptStore && (
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium rounded-lg">
                    店舗: {analysis.details.receiptStore}
                  </span>
                )}
                {analysis.details.receiptAmount && (
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold rounded-lg">
                    金額: {analysis.details.receiptAmount}
                  </span>
                )}
                {analysis.details.petBreed && (
                  <span className="px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-300 font-medium rounded-lg">
                    種類: {analysis.details.petBreed}
                  </span>
                )}
                {analysis.details.productBrand && (
                  <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium rounded-lg">
                    ブランド: {analysis.details.productBrand}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PET REGISTRATION SECTION if pet detected */}
          {analysis.category === 'pet' && (
            <div className="p-4 bg-pink-950/30 border border-pink-800/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dog className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-bold text-pink-200">
                    ペット写真認識
                  </span>
                </div>
                {!registeredPetSuccess && !showPetForm && (
                  <button
                    onClick={() => setShowPetForm(true)}
                    className="text-xs bg-pink-600 hover:bg-pink-500 text-white font-bold px-3 py-1 rounded-xl transition-colors shadow-sm"
                  >
                    このペットに名前をつける＋
                  </button>
                )}
              </div>

              {registeredPetSuccess && (
                <p className="text-xs text-emerald-400 font-semibold">
                  ✓ ペット名を登録しました！次回からこの特徴のペットを撮影すると自動命名されます。
                </p>
              )}

              {showPetForm && (
                <form onSubmit={handleCreatePetProfile} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="ペットの名前 (例: ポチ, タマ)"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-pink-500/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-pink-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm"
                  >
                    登録する
                  </button>
                </form>
              )}
            </div>
          )}

          {/* MAIN FILENAME EDIT BOX */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
              生成されたファイル名 (編集可能):
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-inner">
              <input
                type="text"
                value={selectedFilename}
                onChange={(e) => setSelectedFilename(e.target.value)}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm font-mono text-indigo-300 font-bold focus:outline-none"
              />
              <button
                onClick={handleCopyFilename}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-md shadow-indigo-600/30"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'コピー完了' : 'コピー'}
              </button>
            </div>
          </div>

          {/* AI ALTERNATIVE FILENAMES */}
          {analysis.alternativeNames && analysis.alternativeNames.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">その他の命名候補案 (タップで切替):</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.alternativeNames.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFilename(alt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                      selectedFilename === alt
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAGS AND NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-400" /> タグ (カンマ区切り):
              </label>
              <input
                type="text"
                placeholder="経費, 重要, メモ..."
                value={customTagsText}
                onChange={(e) => setCustomTagsText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">備考・メモ:</label>
              <input
                type="text"
                placeholder="任意メモ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              isDownloaded
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 hover:bg-slate-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
            title="保存先のフォルダ・ダイアログを選択してダウンロードします"
          >
            {isDownloaded ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <FolderDown className="w-4 h-4" />
            )}
            <span>{isDownloaded ? '保存済み (再ダウンロード可)' : 'フォルダ選択してダウンロード'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isSaved
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'アプリ内に保存済み' : 'アプリギャラリーに保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
