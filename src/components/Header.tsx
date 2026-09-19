import React from 'react';
import { ActiveTab, UserProfile } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  userProfile?: UserProfile;
  onBack?: () => void;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  showBack?: boolean;
  customTitle?: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  userProfile,
  onBack,
  onProfileClick,
  onNotificationsClick,
  onNavigate,
  showBack = false,
  customTitle,
  theme = 'dark',
  onToggleTheme,
}) => {
  const getTitle = () => {
    if (customTitle) return customTitle;
    switch (activeTab) {
      case 'dashboard':
        return 'Beranda';
      case 'transactions':
        return 'Buku Kas';
      case 'instant-entry':
        return 'Catat Transaksi';
      case 'analytics':
        return 'Analisis Keuangan';
      case 'vault-settings':
        return 'Brankas & Akun';
      default:
        return 'ReimuWallet';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0D0F14]/95 backdrop-blur-xl border-b border-[#28303F] pt-safe">
      {/* Phone status bar simulation */}
      <div className="h-6 px-5 flex items-center justify-between text-[#64748B] font-mono select-none text-[11px] tracking-wider">
        <span>09:41</span>
        <div className="flex items-center gap-2 text-[14px]">
          <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-[14px]">wifi</span>
          <span className="material-symbols-outlined text-[16px]">battery_full</span>
        </div>
      </div>

      {/* Main app header */}
      <div className="h-16 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack}
              aria-label="Kembali"
              className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-[#FF5E36] hover:bg-[#1C222D] transition-colors active:scale-95 border border-[#28303F]"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          ) : (
            <div className="w-1 h-5 bg-[#FF5E36] rounded-full"></div>
          )}
          <h1 className="font-extrabold text-[19px] text-[#F1F5F9] tracking-tight uppercase font-display">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className="w-9 h-9 rounded-xl border border-[#28303F] bg-[#151921] flex items-center justify-center text-[#94A3B8] hover:text-[#FF5E36] hover:border-[#FF5E36]/40 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[19px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}

          {!showBack && (
            <button
              onClick={() => onNotificationsClick?.()}
              aria-label="Pusat Deteksi Notifikasi"
              title="Pusat Deteksi & Notifikasi Otomatis"
              className="w-9 h-9 rounded-xl border border-[#28303F] bg-[#151921] flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-[#3D4758] transition-colors relative active:scale-95"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF5E36] rounded-full"></span>
            </button>
          )}
          <button
            id="header-profile-btn"
            onClick={() => {
              if (onProfileClick) {
                onProfileClick();
              } else if (onNavigate) {
                onNavigate('vault-settings');
              }
            }}
            aria-label="Profil dan Brankas"
            title={userProfile?.name ? `Profil: ${userProfile.name}` : 'Buka Brankas & Profil'}
            className="w-9 h-9 rounded-xl border border-[#28303F] bg-[#1C222D] hover:border-[#FF5E36] flex items-center justify-center text-[#F1F5F9] active:scale-95 transition-all overflow-hidden"
          >
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            ) : userProfile?.name ? (
              <span className="font-mono text-[13px] font-black text-[#FF5E36]">
                {userProfile.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">person</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
