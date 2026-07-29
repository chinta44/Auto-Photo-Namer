import React, { useState } from 'react';
import { PetProfile } from '../types';
import { Dog, Plus, Trash2, CheckCircle2, Info } from 'lucide-react';

interface PetManagerProps {
  petProfiles: PetProfile[];
  onAddPet: (pet: PetProfile) => void;
  onDeletePet: (id: string) => void;
}

export const PetManagerModal: React.FC<PetManagerProps> = ({
  petProfiles,
  onAddPet,
  onDeletePet,
}) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'dog' | 'cat' | 'bird' | 'other'>('dog');
  const [breedOrDescription, setBreedOrDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPet: PetProfile = {
      id: `pet-${Date.now()}`,
      name: name.trim(),
      species,
      breedOrDescription: breedOrDescription.trim() || 'ペットの顔立ち・特徴',
      registeredAt: new Date().toLocaleDateString('ja-JP'),
      avatarUrl: avatarUrl || undefined,
    };

    onAddPet(newPet);
    setName('');
    setBreedOrDescription('');
    setAvatarUrl('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-400 text-white flex items-center justify-center font-black shadow-md">
            <Dog className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-lg text-slate-900 uppercase tracking-tight">ペット登録・AI顔識別モデル</h2>
            <p className="text-xs text-slate-600 font-medium">
              一度ペットの名前と特徴を登録すると、Gemini Vision AIが写真から個体を識別して「ポチ_日付.jpg」のように自動命名してくれます。
            </p>
          </div>
        </div>

        <div className="p-3 bg-pink-50 border-2 border-pink-200 rounded-xl text-xs text-pink-950 font-bold flex items-start gap-2">
          <Info className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
          <span>
            初回撮影時に写真から「このペットに名前をつける」を押すだけでも自動的にここに登録されます！
          </span>
        </div>
      </div>

      {/* Add New Pet Form */}
      <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <Plus className="w-4 h-4 text-pink-600" />
          新しいペットを追加登録
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">ペットの名前 (必須):</label>
            <input
              type="text"
              placeholder="例: ポチ, タマ, モコ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">ペットの種類:</label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value as any)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-pink-500"
            >
              <option value="dog">犬 (Dog)</option>
              <option value="cat">猫 (Cat)</option>
              <option value="bird">鳥 (Bird)</option>
              <option value="other">その他 (Other)</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700">犬種/毛色/見た目の特徴:</label>
            <input
              type="text"
              placeholder="例: 茶色の柴犬、鼻の横に黒いブチがある白猫、オカメインコ"
              value={breedOrDescription}
              onChange={(e) => setBreedOrDescription(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          ペットを登録する
        </button>
      </form>

      {/* Registered Pets List */}
      <div className="space-y-3">
        <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight flex items-center justify-between">
          <span>登録済みペット ({petProfiles.length}匹)</span>
        </h3>

        {petProfiles.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border-2 border-slate-200 text-slate-500 text-xs font-medium">
            まだ登録されたペットはありません。「ペット写真」を撮影して命名すると自動追加されます。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {petProfiles.map((pet) => (
              <div
                key={pet.id}
                className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-pink-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 border-2 border-pink-200 overflow-hidden flex items-center justify-center text-pink-600 shrink-0">
                    {pet.avatarUrl ? (
                      <img src={pet.avatarUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dog className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                      {pet.name}
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </h4>
                    <p className="text-xs font-bold text-slate-600">{pet.breedOrDescription}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">登録日: {pet.registeredAt}</p>
                  </div>
                </div>

                <button
                  onClick={() => onDeletePet(pet.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
