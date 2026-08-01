import React, { useState } from 'react';
import { SavedPhoto, PhotoCategory } from '../types';
import { Download, Copy, Trash2, Search, Filter, FileSpreadsheet, Tag, Receipt, Dog, Package, FileText, HelpCircle, Check, FolderDown } from 'lucide-react';
import { downloadImageWithPicker } from '../utils/fileSaveUtils';

interface PhotoGalleryProps {
  photos: SavedPhoto[];
  onDeletePhoto: (id: string) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onDeletePhoto }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadedPhotoIds, setDownloadedPhotoIds] = useState<string[]>([]);

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

  const handleDownload = async (photo: SavedPhoto) => {
    const success = await downloadImageWithPicker(photo.dataUrl, photo.filename);
    if (success) {
      setDownloadedPhotoIds((prev) => (prev.includes(photo.id) ? prev : [...prev, photo.id]));
    }
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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xl">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ファイル名・店舗名・タグで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter & CSV Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setSelectedCategory('receipt')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedCategory === 'receipt' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              領収書
            </button>
            <button
              onClick={() => setSelectedCategory('pet')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedCategory === 'pet' ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ペット
            </button>
            <button
              onClick={() => setSelectedCategory('product')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedCategory === 'product' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              商品
            </button>
          </div>

          <button
            onClick={handleExportReceiptsCSV}
            className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="領収書の金額データをCSV出力"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">領収書CSV出力</span>
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 shadow-md">
            <Filter className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium text-slate-400">
            {photos.length === 0
              ? '保存された写真はまだありません。カメラで写真を撮るとAIが自動命名して保存されます。'
              : '該当する写真が見つかりませんでした。'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xl"
            >
              <div className="space-y-3">
                {/* Photo Thumbnail */}
                <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
                  <img
                    src={photo.dataUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-200 shadow-lg flex items-center gap-1.5">
                    {getCategoryIcon(photo.category)}
                    {photo.analysis.categoryLabel}
                  </span>
                </div>

                {/* Info Section */}
                <div className="px-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-bold text-indigo-300 break-all line-clamp-2">
                      {photo.filename}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                    {photo.analysis.detectedTitle} {photo.analysis.details.receiptAmount && `(${photo.analysis.details.receiptAmount})`}
                  </p>

                  {photo.customTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {photo.customTags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-300 rounded-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {photo.notes && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-1">
                      メモ: {photo.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 mt-3 flex items-center justify-between gap-1 text-xs">
                <span className="text-[10px] font-medium text-slate-500">{photo.timestamp.split(' ')[0]}</span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(photo.id, photo.filename)}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl transition-all font-bold"
                    title="ファイル名をコピー"
                  >
                    {copiedId === photo.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDownload(photo)}
                    className={`px-2.5 py-1.5 rounded-xl transition-all font-bold text-xs flex items-center gap-1 shadow-md ${
                      downloadedPhotoIds.includes(photo.id)
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 hover:bg-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    }`}
                    title={downloadedPhotoIds.includes(photo.id) ? '保存済み (フォルダを選択して再保存可能)' : 'フォルダを選択してダウンロード'}
                  >
                    {downloadedPhotoIds.includes(photo.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px]">保存済み</span>
                      </>
                    ) : (
                      <>
                        <FolderDown className="w-3.5 h-3.5" />
                        <span className="text-[11px]">ダウンロード</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onDeletePhoto(photo.id)}
                    className="p-2 bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all"
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
