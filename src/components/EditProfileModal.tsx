import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const AVATAR_PRESETS = [
  { id: 'neon-flame', label: 'Flame', bg: 'from-orange-500 to-amber-600', icon: 'local_fire_department' },
  { id: 'cyber-vault', label: 'Vault', bg: 'from-blue-600 to-indigo-700', icon: 'shield' },
  { id: 'emerald-growth', label: 'Growth', bg: 'from-emerald-500 to-teal-700', icon: 'trending_up' },
  { id: 'zen-circle', label: 'Zen', bg: 'from-purple-600 to-pink-600', icon: 'spa' },
  { id: 'gold-crown', label: 'Crown', bg: 'from-amber-400 to-yellow-600', icon: 'military_tech' },
  { id: 'minimal-dark', label: 'Dark', bg: 'from-neutral-700 to-neutral-900', icon: 'person' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(userProfile.name || 'Pengguna');
  const [tagline, setTagline] = useState(userProfile.tagline || 'Manajemen Kas Mandiri');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: (typeof AVATAR_PRESETS)[0]) => {
    // Generates a clean SVG avatar data uri with the chosen preset
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${preset.id === 'neon-flame' ? '#FF3E00' : preset.id === 'cyber-vault' ? '#2563EB' : preset.id === 'emerald-growth' ? '#10B981' : preset.id === 'zen-circle' ? '#9333EA' : preset.id === 'gold-crown' ? '#EAB308' : '#333333'}" />
          <stop offset="100%" stop-color="${preset.id === 'neon-flame' ? '#B42500' : preset.id === 'cyber-vault' ? '#1E3A8A' : preset.id === 'emerald-growth' ? '#047857' : preset.id === 'zen-circle' ? '#DB2777' : preset.id === 'gold-crown' ? '#CA8A04' : '#111111'}" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="32" fill="url(#g)" />
      <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" font-family="system-ui, sans-serif" font-size="48" font-weight="900" fill="#FFFFFF">
        ${(name.trim() || 'U').charAt(0).toUpperCase()}
      </text>
    </svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setAvatarUrl(dataUri);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'Pengguna';
    onSaveProfile({
      name: cleanName,
      avatarUrl: avatarUrl.trim(),
      tagline: tagline.trim(),
    });
    onClose();
  };

  const initials = (name.trim() || 'P').charAt(0).toUpperCase();

  return (
    <div
      id="edit-profile-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        id="edit-profile-modal-card"
        className="bg-[#121212] border border-[#2A2A2A] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.8)] flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#24120C] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00]">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-mono text-[16px] font-bold text-white uppercase tracking-tight">
                Ubah Profil Pengguna
              </h3>
              <span className="font-mono text-[11px] text-[#888888] uppercase">
                Pengaturan nama &amp; foto profil personal
              </span>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1E1E1E] transition-all"
          >
            <span className="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Avatar Preview & Upload Area */}
          <div className="flex flex-col items-center justify-center gap-3 py-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#181818] border-2 border-[#FF3E00]/60 shadow-[0_0_20px_rgba(255,62,0,0.2)] flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF3E00] to-[#992200] flex items-center justify-center text-white font-mono text-[36px] font-black">
                    {initials}
                  </div>
                )}
              </div>

              <button
                type="button"
                id="trigger-file-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#FF3E00] hover:bg-[#FF551C] text-white flex items-center justify-center shadow-lg border border-white/20 transition-all active:scale-95"
                title="Pilih foto dari galeri/perangkat"
              >
                <span className="material-symbols-outlined text-[17px]">photo_camera</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="select-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] text-white border border-[#333333] hover:border-[#FF3E00]/60 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[15px] text-[#FF3E00]">upload</span>
                <span>Unggah Foto</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  id="remove-photo-btn"
                  onClick={() => setAvatarUrl('')}
                  className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2A1818] text-[#888888] hover:text-[#FF4D4D] border border-[#333333] font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  <span>Hapus</span>
                </button>
              )}
            </div>
            <span className="font-mono text-[10px] text-[#777777]">
              Mendukung PNG, JPG, WebP (Maks 3MB)
            </span>
          </div>

          {/* Preset Avatars */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[#AAAAAA] font-bold">
              Atau Pilih Gaya Avatar Otomatis
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`h-11 rounded-xl bg-gradient-to-br ${preset.bg} flex items-center justify-center text-white border border-white/20 hover:scale-105 active:scale-95 transition-all`}
                  title={preset.label}
                >
                  <span className="material-symbols-outlined text-[18px]">{preset.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-profile-name-input"
              className="block font-mono text-[11px] uppercase tracking-wider text-[#AAAAAA] font-bold"
            >
              Nama Tampilan Pengguna
            </label>
            <div className="relative">
              <input
                id="user-profile-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Pratama, Reimu, dll."
                className="w-full bg-[#181818] text-white border border-[#2E2E2E] focus:border-[#FF3E00] rounded-xl px-4 py-3 font-sans text-[14px] outline-none transition-colors"
              />
              <span className="absolute right-3.5 top-3.5 text-[#666666] material-symbols-outlined text-[18px]">
                person
              </span>
            </div>
          </div>

          {/* Tagline / Deskripsi Akun */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-profile-tagline-input"
              className="block font-mono text-[11px] uppercase tracking-wider text-[#AAAAAA] font-bold"
            >
              Label / Bio Singkat (Opsional)
            </label>
            <input
              id="user-profile-tagline-input"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Contoh: Brankas Kas Pribadi, Pengatur Finansial"
              className="w-full bg-[#181818] text-white border border-[#2E2E2E] focus:border-[#FF3E00] rounded-xl px-4 py-2.5 font-sans text-[13px] outline-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#222222] flex gap-2">
            <button
              type="button"
              id="cancel-profile-btn"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-[#AAAAAA] font-mono text-[12px] font-bold uppercase tracking-wider transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              id="save-profile-submit-btn"
              className="flex-1 py-3 rounded-xl bg-[#FF3E00] hover:bg-[#FF551C] text-white font-mono text-[12px] font-black uppercase tracking-wider shadow-[0_0_16px_rgba(255,62,0,0.3)] transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">check</span>
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
