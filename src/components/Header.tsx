import React from 'react';
import { ActiveTab, UserProfile } from '../types';
import { ReimuLogo } from './ReimuLogo';

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
      {/* Main app header constrained to max-w-md to match app content */}
      <div className="h-14 px-4 max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack ? (
            <button
              onClick={onBack}
              aria-label="Kembali"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-[#FF5E36] hover:bg-[#1C222D] transition-colors active:scale-95 border border-[#28303F] shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          ) : (
            <div className="flex items-center shrink-0">
              <ReimuLogo size={28} className="rounded-lg border border-[#FF5E36]/30" />
            </div>
          )}
          <h1 className="font-extrabold text-[17px] text-[#F1F5F9] tracking-tight uppercase font-display truncate">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className="w-8 h-8 rounded-xl border border-[#28303F] bg-[#151921] flex items-center justify-center text-[#94A3B8] hover:text-[#FF5E36] hover:border-[#FF5E36]/40 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}

          {!showBack && (
            <button
              onClick={() => onNotificationsClick?.()}
              aria-label="Pusat Deteksi Notifikasi"
              title="Pusat Deteksi & Notifikasi Otomatis"
              className="w-8 h-8 rounded-xl border border-[#28303F] bg-[#151921] flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-[#3D4758] transition-colors relative active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF5E36] rounded-full"></span>
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
            className="w-8 h-8 rounded-xl border border-[#28303F] bg-[#1C222D] hover:border-[#FF5E36] flex items-center justify-center text-[#F1F5F9] active:scale-95 transition-all overflow-hidden"
          >
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            ) : userProfile?.name ? (
              <span className="font-mono text-[12px] font-black text-[#FF5E36]">
                {userProfile.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <span className="material-symbols-outlined text-[17px]">person</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
