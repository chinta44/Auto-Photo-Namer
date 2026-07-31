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

// category -> accent color used throughout the "digital darkroom" theme
const CATEGORY_COLOR: Record<string, string> = {
  receipt: '#E8B04B',
  pet: '#7FDBCA',
  product: '#7FA6C9',
  document: '#B58BD1',
  other: '#9A9890',
};

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

  const accent = CATEGORY_COLOR[analysis.category] || CATEGORY_COLOR.other;

  const getCategoryIcon = (category: string) => {
    const style = { color: CATEGORY_COLOR[category] || CATEGORY_COLOR.other };
    switch (category) {
      case 'receipt':
        return <Receipt className="w-5 h-5" style={style} />;
      case 'pet':
        return <Dog className="w-5 h-5" style={style} />;
      case 'product':
        return <Package className="w-5 h-5" style={style} />;
      case 'document':
        return <FileText className="w-5 h-5" style={style} />;
      default:
        return <HelpCircle className="w-5 h-5" style={style} />;
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="p-4 bg-[#242424] border-b border-[#3A3A3A] text-[#F2F0EC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-[#7FDBCA]" />
            </div>
            <div>
              <h2 className="font-semibold text-sm tracking-tight text-[#F2F0EC]">AI解析＆自動命名結果</h2>
              <p className="text-[11px] text-[#9A9890] font-mono">Gemini Vision AI が画像を判別・命名しました</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] border border-[#3A3A3A] text-[#9A9890] transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Top Preview & Category Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-[#242424] p-4 rounded-xl border border-[#3A3A3A]">
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-black border border-[#3A3A3A] shrink-0">
              <img src={imageDataUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-2 text-left w-full">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide"
                  style={{ color: accent, border: `1px solid ${accent}55`, backgroundColor: `${accent}1A` }}
                >
                  {getCategoryIcon(analysis.category)}
                  {analysis.categoryLabel}
                </span>
                <span className="text-[11px] text-[#9A9890] font-mono">
                  確信度: {Math.round(analysis.confidence * 100)}%
                </span>
              </div>

              <h3 className="font-semibold text-base text-[#F2F0EC]">{analysis.detectedTitle}</h3>
              <p className="text-xs text-[#C9C7C1] bg-[#1A1A1A] p-3 rounded-lg border border-[#3A3A3A] leading-relaxed">
                {analysis.explanation}
              </p>

              {/* Detail Chips */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                {analysis.details.receiptStore && (
                  <span className="px-2 py-0.5 bg-[#242424] border border-[#3A3A3A] text-[#F2F0EC] rounded">
                    店舗: {analysis.details.receiptStore}
                  </span>
                )}
                {analysis.details.receiptAmount && (
                  <span className="px-2 py-0.5 bg-[#242424] border border-[#E8B04B]/40 text-[#E8B04B] rounded">
                    金額: {analysis.details.receiptAmount}
                  </span>
                )}
                {analysis.details.petBreed && (
                  <span className="px-2 py-0.5 bg-[#242424] border border-[#7FDBCA]/40 text-[#7FDBCA] rounded">
                    種類: {analysis.details.petBreed}
                  </span>
                )}
                {analysis.details.productBrand && (
                  <span className="px-2 py-0.5 bg-[#242424] border border-[#7FA6C9]/40 text-[#7FA6C9] rounded">
                    ブランド: {analysis.details.productBrand}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PET REGISTRATION SECTION if pet detected */}
          {analysis.category === 'pet' && (
            <div className="p-4 bg-[#7FDBCA]/[0.06] border border-[#7FDBCA]/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dog className="w-4.5 h-4.5 text-[#7FDBCA]" />
                  <span className="text-xs font-semibold text-[#F2F0EC] tracking-tight">
                    ペット写真認識
                  </span>
                </div>
                {!registeredPetSuccess && !showPetForm && (
                  <button
                    onClick={() => setShowPetForm(true)}
                    className="text-[11px] bg-[#7FDBCA] hover:brightness-110 text-[#0F1E1C] font-semibold px-3 py-1 rounded-lg transition-all"
                  >
                    このペットに名前をつける＋
                  </button>
                )}
              </div>

              {registeredPetSuccess && (
                <p className="text-[11px] text-[#7FDBCA] font-medium">
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
                    className="flex-1 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg px-3 py-1.5 text-xs text-[#F2F0EC] focus:outline-none focus:border-[#7FDBCA]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-[#7FDBCA] hover:brightness-110 text-[#0F1E1C] font-semibold px-3 py-1.5 rounded-lg text-xs transition-all"
                  >
                    登録する
                  </button>
                </form>
              )}
            </div>
          )}

          {/* MAIN FILENAME EDIT BOX */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-[#9A9890] tracking-wide flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5" />
              生成されたファイル名 (編集可能):
            </label>
            <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl p-2">
              <input
                type="text"
                value={selectedFilename}
                onChange={(e) => setSelectedFilename(e.target.value)}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm font-mono text-[#7FDBCA] focus:outline-none"
              />
              <button
                onClick={handleCopyFilename}
                className="px-3.5 py-1.5 bg-[#242424] hover:bg-[#2C2C2C] border border-[#3A3A3A] text-[#F2F0EC] rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#7FDBCA]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'コピー完了' : 'コピー'}
              </button>
            </div>
          </div>

          {/* AI ALTERNATIVE FILENAMES */}
          {analysis.alternativeNames && analysis.alternativeNames.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-[#9A9890] tracking-wide">その他の命名候補案 (タップで切替):</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.alternativeNames.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFilename(alt)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                      selectedFilename === alt
                        ? 'bg-[#7FDBCA] border-[#7FDBCA] text-[#0F1E1C] font-semibold'
                        : 'bg-[#242424] border-[#3A3A3A] text-[#C9C7C1] hover:border-[#7FDBCA]/50'
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
              <label className="text-[11px] font-medium text-[#9A9890] tracking-wide flex items-center gap-1">
                <Tag className="w-3 h-3" /> タグ (カンマ区切り):
              </label>
              <input
                type="text"
                placeholder="経費, 重要, メモ..."
                value={customTagsText}
                onChange={(e) => setCustomTagsText(e.target.value)}
                className="w-full bg-[#242424] border border-[#3A3A3A] rounded-lg px-3 py-1.5 text-xs text-[#F2F0EC] focus:outline-none focus:border-[#7FDBCA]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#9A9890] tracking-wide">備考・メモ:</label>
              <input
                type="text"
                placeholder="任意メモ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#242424] border border-[#3A3A3A] rounded-lg px-3 py-1.5 text-xs text-[#F2F0EC] focus:outline-none focus:border-[#7FDBCA]"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#242424] border-t border-[#3A3A3A] flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleDownloadImage}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#0F0F0F] border border-[#3A3A3A] text-[#F2F0EC] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            写真をこの名前でダウンロード
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-[#1A1A1A] text-[#7FDBCA] border border-[#7FDBCA]/40'
                : 'bg-[#7FDBCA] hover:brightness-110 text-[#0F1E1C]'
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
