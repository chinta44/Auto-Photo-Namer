import React, { useState } from 'react';
import { AnalysisResult, PetProfile, SavedPhoto } from '../types';
import { Download, Copy, Check, Save, Sparkles, X, Dog, Receipt, Package, FileText, HelpCircle, Edit2, Tag } from 'lucide-react';

interface AnalysisModalProps {
  imageDataUrl: string;
  analysis: AnalysisResult;
  petProfiles: PetProfile[];
  onSaveToGallery: (photo: SavedPhoto) => void;
  onRegisterPet: (newPet: PetProfile) => void;
  onClose: () => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  imageDataUrl,
  analysis,
  petProfiles,
  onSaveToGallery,
  onRegisterPet,
  onClose,
}) => {
  const [selectedFilename, setSelectedFilename] = useState(analysis.suggestedFilename);
  const [customTagsText, setCustomTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = selectedFilename.endsWith('.jpg') || selectedFilename.endsWith('.png')
      ? selectedFilename
      : `${selectedFilename}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="fixed inset-0 z-50 bg-indigo-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-4 border-indigo-600 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center text-indigo-950 font-black shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base uppercase tracking-tight text-white">AI解析＆自動命名結果</h2>
              <p className="text-xs text-indigo-100 font-medium">Gemini Vision AI が画像を判別・命名しました</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-indigo-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Top Preview & Category Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-indigo-50/70 p-4 rounded-2xl border-2 border-indigo-100">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-200 shrink-0 shadow-sm">
              <img src={imageDataUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-2 text-left w-full">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-900 text-yellow-400 shadow-sm">
                  {getCategoryIcon(analysis.category)}
                  {analysis.categoryLabel}
                </span>
                <span className="text-xs text-indigo-700 font-mono font-black bg-yellow-200 px-2 py-0.5 rounded">
                  確信度: {Math.round(analysis.confidence * 100)}%
                </span>
              </div>

              <h3 className="font-black text-lg text-indigo-950">{analysis.detectedTitle}</h3>
              <p className="text-xs text-indigo-900 font-medium bg-white p-3 rounded-xl border border-indigo-100 leading-relaxed shadow-xs">
                {analysis.explanation}
              </p>

              {/* Detail Chips */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                {analysis.details.receiptStore && (
                  <span className="px-2.5 py-0.5 bg-yellow-400 text-indigo-950 font-bold rounded-lg">
                    店舗: {analysis.details.receiptStore}
                  </span>
                )}
                {analysis.details.receiptAmount && (
                  <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-black rounded-lg">
                    金額: {analysis.details.receiptAmount}
                  </span>
                )}
                {analysis.details.petBreed && (
                  <span className="px-2.5 py-0.5 bg-pink-400 text-white font-bold rounded-lg">
                    種類: {analysis.details.petBreed}
                  </span>
                )}
                {analysis.details.productBrand && (
                  <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-bold rounded-lg">
                    ブランド: {analysis.details.productBrand}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PET REGISTRATION SECTION if pet detected */}
          {analysis.category === 'pet' && (
            <div className="p-4 bg-pink-50 border-2 border-pink-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dog className="w-5 h-5 text-pink-600" />
                  <span className="text-xs font-black text-pink-950 uppercase tracking-tight">
                    ペット写真認識
                  </span>
                </div>
                {!registeredPetSuccess && !showPetForm && (
                  <button
                    onClick={() => setShowPetForm(true)}
                    className="text-xs bg-pink-500 hover:bg-pink-600 text-white font-black px-3 py-1 rounded-xl transition-colors shadow-sm"
                  >
                    このペットに名前をつける＋
                  </button>
                )}
              </div>

              {registeredPetSuccess && (
                <p className="text-xs text-emerald-700 font-black">
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
                    className="flex-1 bg-white border-2 border-pink-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-pink-500 hover:bg-pink-600 text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-sm"
                  >
                    登録する
                  </button>
                </form>
              )}
            </div>
          )}

          {/* MAIN FILENAME EDIT BOX */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
              生成されたファイル名 (編集可能):
            </label>
            <div className="flex items-center gap-2 bg-indigo-950 border-2 border-indigo-600 rounded-2xl p-2 shadow-sm">
              <input
                type="text"
                value={selectedFilename}
                onChange={(e) => setSelectedFilename(e.target.value)}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm font-mono text-yellow-400 font-black focus:outline-none"
              />
              <button
                onClick={handleCopyFilename}
                className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 rounded-xl text-xs font-black flex items-center gap-1 transition-colors shrink-0 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-indigo-950" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'コピー完了' : 'コピー'}
              </button>
            </div>
          </div>

          {/* AI ALTERNATIVE FILENAMES */}
          {analysis.alternativeNames && analysis.alternativeNames.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">その他の命名候補案 (タップで切替):</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.alternativeNames.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFilename(alt)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono transition-all border-2 ${
                      selectedFilename === alt
                        ? 'bg-indigo-600 border-indigo-600 text-white font-black shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-indigo-300 font-bold'
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
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-600" /> タグ (カンマ区切り):
              </label>
              <input
                type="text"
                placeholder="経費, 重要, メモ..."
                value={customTagsText}
                onChange={(e) => setCustomTagsText(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">備考・メモ:</label>
              <input
                type="text"
                placeholder="任意メモ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-100 border-t-2 border-slate-200 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleDownloadImage}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            写真の自動名前保存 (ダウンロード)
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-slate-200 text-emerald-700 border-2 border-emerald-400'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'アプリに保存済み' : 'アプリに保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
