import React, { useState } from 'react';
import { SavedPhoto, PhotoCategory } from '../types';
import { Download, Copy, Trash2, Search, Filter, FileSpreadsheet, Tag, Receipt, Dog, Package, FileText, HelpCircle, Check } from 'lucide-react';

interface PhotoGalleryProps {
  photos: SavedPhoto[];
  onDeletePhoto: (id: string) => void;
}

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
    switch (category) {
      case 'receipt':
        return <Receipt className="w-4 h-4 text-emerald-400" />;
      case 'pet':
        return <Dog className="w-4 h-4 text-amber-400" />;
      case 'product':
        return <Package className="w-4 h-4 text-indigo-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
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
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ファイル名・店舗名・タグで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
          />
        </div>

        {/* Filter & CSV Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-black">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                selectedCategory === 'all' ? 'bg-indigo-600 text-white font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setSelectedCategory('receipt')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                selectedCategory === 'receipt' ? 'bg-yellow-400 text-indigo-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              領収書
            </button>
            <button
              onClick={() => setSelectedCategory('pet')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                selectedCategory === 'pet' ? 'bg-pink-400 text-white font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ペット
            </button>
            <button
              onClick={() => setSelectedCategory('product')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                selectedCategory === 'product' ? 'bg-emerald-500 text-white font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              商品
            </button>
          </div>

          <button
            onClick={handleExportReceiptsCSV}
            className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm"
            title="領収書の金額データをCSV出力"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-950" />
            <span className="hidden md:inline">領収書CSV出力</span>
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-slate-200 p-6 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-500">
            {photos.length === 0
              ? '保存された写真はまだありません。カメラで写真を撮るとAIが命名して保存できます。'
              : '該当する写真が見つかりませんでした。'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-500 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div className="space-y-3">
                {/* Photo Thumbnail */}
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img
                    src={photo.dataUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-900 text-yellow-400 shadow-md flex items-center gap-1">
                    {getCategoryIcon(photo.category)}
                    {photo.analysis.categoryLabel}
                  </span>
                </div>

                {/* Info Section */}
                <div className="px-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-black text-indigo-900 break-all line-clamp-2">
                      {photo.filename}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-600 font-bold line-clamp-1">
                    {photo.analysis.detectedTitle} {photo.analysis.details.receiptAmount && `(${photo.analysis.details.receiptAmount})`}
                  </p>

                  {photo.customTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {photo.customTags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-yellow-100 text-[10px] font-bold text-indigo-900 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {photo.notes && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-1">
                      メモ: {photo.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 mt-3 flex items-center justify-between gap-1 text-xs">
                <span className="text-[10px] font-bold text-slate-500">{photo.timestamp.split(' ')[0]}</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(photo.id, photo.filename)}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-bold"
                    title="ファイル名をコピー"
                  >
                    {copiedId === photo.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDownload(photo)}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-bold shadow-sm"
                    title="この名前でダウンロード"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeletePhoto(photo.id)}
                    className="p-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-500 rounded-lg transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
