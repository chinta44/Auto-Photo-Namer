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
      <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] text-[#7FDBCA] flex items-center justify-center">
            <Dog className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-[#F2F0EC] tracking-tight">ペット登録・AI顔識別モデル</h2>
            <p className="text-xs text-[#9A9890] leading-relaxed">
              一度ペットの名前と特徴を登録すると、Gemini Vision AIが写真から個体を識別して「ポチ_日付.jpg」のように自動命名してくれます。
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#7FDBCA]/[0.06] border border-[#7FDBCA]/25 rounded-lg text-xs text-[#C9C7C1] flex items-start gap-2">
          <Info className="w-4 h-4 text-[#7FDBCA] shrink-0 mt-0.5" />
          <span>
            初回撮影時に写真から「このペットに名前をつける」を押すだけでも自動的にここに登録されます！
          </span>
        </div>
      </div>

      {/* Add New Pet Form */}
      <form onSubmit={handleSubmit} className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-sm text-[#F2F0EC] tracking-tight flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#7FDBCA]" />
          新しいペットを追加登録
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#9A9890]">ペットの名前 (必須):</label>
            <input
              type="text"
              placeholder="例: ポチ, タマ, モコ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-xs text-[#F2F0EC] focus:outline-none focus:border-[#7FDBCA]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#9A9890]">ペットの種類:</label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value as any)}
              className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-xs text-[#F2F0EC] focus:outline-none focus:border-[#7FDBCA]"
            >
              <option value="dog">犬 (Dog)</option>
              <option value="cat">猫 (Cat)</option>
              <option value="bird">鳥 (Bird)</option>
              <option value="other">その他 (Other)</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-[#9A9890]">犬種/毛色/見た目の特徴:</label>
            <input
              type="text"
              placeholder="例: 茶色の柴犬、鼻の横に黒いブチがある白猫、オカメインコ"
              value={breedOrDescription}
              onChange={(e) => setBreedOrDescription(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-xs text-[#F2F0EC] focus:outline-none focus:border-[#7FDBCA]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-[#7FDBCA] hover:brightness-110 text-[#0F1E1C] font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          ペットを登録する
        </button>
      </form>

      {/* Registered Pets List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-[#F2F0EC] tracking-tight flex items-center justify-between">
          <span>登録済みペット ({petProfiles.length}匹)</span>
        </h3>

        {petProfiles.length === 0 ? (
          <div className="text-center py-8 bg-[#242424] rounded-2xl border border-[#3A3A3A] text-[#9A9890] text-xs">
            まだ登録されたペットはありません。「ペット写真」を撮影して命名すると自動追加されます。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {petProfiles.map((pet) => (
              <div
                key={pet.id}
                className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#7FDBCA]/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] overflow-hidden flex items-center justify-center text-[#7FDBCA] shrink-0">
                    {pet.avatarUrl ? (
                      <img src={pet.avatarUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dog className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#F2F0EC] flex items-center gap-1.5">
                      {pet.name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7FDBCA]" />
                    </h4>
                    <p className="text-xs text-[#C9C7C1]">{pet.breedOrDescription}</p>
                    <p className="text-[10px] text-[#9A9890] font-mono">登録日: {pet.registeredAt}</p>
                  </div>
                </div>

                <button
                  onClick={() => onDeletePet(pet.id)}
                  className="p-2 text-[#9A9890] hover:text-[#F0B8B8] hover:bg-[#1A1A1A] rounded-lg transition-colors"
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
