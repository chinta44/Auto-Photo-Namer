import React, { useState } from 'react';
import { SavedPhoto, PhotoCategory } from '../types';
import { Download, Copy, Trash2, Search, Filter, FileSpreadsheet, Tag, Receipt, Dog, Package, FileText, HelpCircle, Check } from 'lucide-react';

interface PhotoGalleryProps {
  photos: SavedPhoto[];
  onDeletePhoto: (id: string) => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  receipt: '#E8B04B',
  pet: '#7FDBCA',
  product: '#7FA6C9',
  document: '#B58BD1',
  other: '#9A9890',
};

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onDeletePhoto }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPhotos = photos.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.analysis.detectedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: PhotoCategory) => {
    const style = { color: CATEGORY_COLOR[category] || CATEGORY_COLOR.other };
    switch (category) {
      case 'receipt':
        return <Receipt className="w-3.5 h-3.5" style={style} />;
      case 'pet':
        return <Dog className="w-3.5 h-3.5" style={style} />;
      case 'product':
        return <Package className="w-3.5 h-3.5" style={style} />;
      case 'document':
        return <FileText className="w-3.5 h-3.5" style={style} />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" style={style} />;
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (photo: SavedPhoto) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReceiptsCSV = () => {
    const receiptPhotos = photos.filter((p) => p.category === 'receipt');
    if (receiptPhotos.length === 0) {
      alert('保存された領収書写真がありません。');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // BOM for Excel
    csvContent += '日時,店舗名,金額,ファイル名,メモ\n';

    receiptPhotos.forEach((p) => {
      const store = p.analysis.details.receiptStore || p.analysis.detectedTitle || '不明';
      const amount = p.analysis.details.receiptAmount || '0円';
      csvContent += `"${p.timestamp}","${store}","${amount}","${p.filename}","${p.notes || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `領収書一覧_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Controls Bar */}
      <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9890]" />
          <input
            type="text"
            placeholder="ファイル名・店舗名・タグで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F2F0EC] focus:outline-none focus:border-[#7FDBCA]"
          />
        </div>

        {/* Filter & CSV Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-lg border border-[#3A3A3A] text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedCategory === 'all' ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold' : 'text-[#9A9890] hover:text-[#F2F0EC]'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setSelectedCategory('receipt')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedCategory === 'receipt' ? 'bg-[#E8B04B] text-[#1A1A1A] font-semibold' : 'text-[#9A9890] hover:text-[#F2F0EC]'
              }`}
            >
              領収書
            </button>
            <button
              onClick={() => setSelectedCategory('pet')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedCategory === 'pet' ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold' : 'text-[#9A9890] hover:text-[#F2F0EC]'
              }`}
            >
              ペット
            </button>
            <button
              onClick={() => setSelectedCategory('product')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedCategory === 'product' ? 'bg-[#7FA6C9] text-[#0F1E1C] font-semibold' : 'text-[#9A9890] hover:text-[#F2F0EC]'
              }`}
            >
              商品
            </button>
          </div>

          <button
            onClick={handleExportReceiptsCSV}
            className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#0F0F0F] border border-[#3A3A3A] text-[#E8B04B] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="領収書の金額データをCSV出力"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden md:inline">領収書CSV出力</span>
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12 bg-[#242424] rounded-2xl border border-[#3A3A3A] p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#3A3A3A] flex items-center justify-center mx-auto text-[#9A9890]">
            <Filter className="w-5 h-5" />
          </div>
          <p className="text-xs text-[#9A9890]">
            {photos.length === 0
              ? '保存された写真はまだありません。カメラで写真を撮るとAIが命名して保存できます。'
              : '該当する写真が見つかりませんでした。'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredPhotos.map((photo) => {
            const accent = CATEGORY_COLOR[photo.category] || CATEGORY_COLOR.other;
            return (
              <div
                key={photo.id}
                className="bg-[#242424] border border-[#3A3A3A] rounded-xl overflow-hidden hover:border-[#7FDBCA]/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="aspect-square bg-[#1A1A1A] relative overflow-hidden">
                    <img
                      src={photo.dataUrl}
                      alt={photo.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Info Section */}
                  <div className="p-2.5 space-y-1.5">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide"
                      style={{ color: accent, border: `1px solid ${accent}55`, backgroundColor: `${accent}1A` }}
                    >
                      {getCategoryIcon(photo.category)}
                      {photo.analysis.categoryLabel}
                    </span>

                    <p className="font-mono text-[11px] text-[#F2F0EC] break-all leading-snug line-clamp-2">
                      {photo.filename}
                    </p>

                    {photo.customTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {photo.customTags.map((tag, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-[#1A1A1A] border border-[#3A3A3A] text-[10px] text-[#9A9890] rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-2 bg-[#1A1A1A] border-t border-[#3A3A3A] flex items-center justify-between gap-1 text-xs">
                  <span className="text-[10px] text-[#9A9890] font-mono">{photo.timestamp.split(' ')[0]}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(photo.id, photo.filename)}
                      className="p-1.5 bg-[#242424] hover:bg-[#2C2C2C] text-[#9A9890] rounded-md transition-colors"
                      title="ファイル名をコピー"
                    >
                      {copiedId === photo.id ? (
                        <Check className="w-3.5 h-3.5 text-[#7FDBCA]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDownload(photo)}
                      className="p-1.5 bg-[#7FDBCA] hover:brightness-110 text-[#0F1E1C] rounded-md transition-colors"
                      title="この名前でダウンロード"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeletePhoto(photo.id)}
                      className="p-1.5 bg-[#242424] hover:bg-[#2C1414] hover:text-[#F0B8B8] text-[#9A9890] rounded-md transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
