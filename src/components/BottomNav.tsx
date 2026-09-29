import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  onTabChange?: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onTabChange }) => {
  const handleTab = (tab: ActiveTab) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    }
    if (typeof onTabChange === 'function') {
      onTabChange(tab);
    }
  };

  const isTransactionsActive = activeTab === 'transactions' || (activeTab as string) === 'ledger';
  const isVaultActive = activeTab === 'vault-settings' || (activeTab as string) === 'vault';
  const isInstantActive = activeTab === 'instant-entry';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[max(env(safe-area-inset-bottom,0px),8px)] bg-[#0D0F14]/95 backdrop-blur-xl border-t border-[#28303F]">
      {/* 5-column grid ensures the center '+' button is mathematically and optically centered */}
      <div className="grid grid-cols-5 items-center h-15 max-w-md mx-auto px-1 w-full">
        {/* 1. Home / Beranda */}
        <button
          onClick={() => handleTab('dashboard')}
          aria-label="Beranda Utama"
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'dashboard' ? 'text-[#FF5E36] font-bold' : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="font-label-caps text-[8.5px] mt-0.5 uppercase tracking-[0.1em]">Beranda</span>
        </button>

        {/* 2. Ledger / Buku Kas */}
        <button
          onClick={() => handleTab('transactions')}
          aria-label="Catatan Buku Kas"
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            isTransactionsActive ? 'text-[#FF5E36] font-bold' : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          <span className="font-label-caps text-[8.5px] mt-0.5 uppercase tracking-[0.1em]">Buku Kas</span>
        </button>

        {/* 3. CENTER: Catat Transaksi (+) Elevated Floating Button */}
        <div className="relative flex flex-col items-center justify-end pb-1 h-full">
          <button
            onClick={() => handleTab('instant-entry')}
            aria-label="Catat transaksi baru"
            title="Catat Transaksi Baru (+)"
            className={`absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${
              isInstantActive
                ? 'bg-[#E04822] text-white border-white/50 ring-4 ring-[#FF5E36]/30'
                : 'bg-[#FF5E36] hover:bg-[#E04822] text-white border-[#FF8260]/40 hover:scale-105'
            }`}
          >
            <span className="material-symbols-outlined text-[26px] font-black leading-none">
              add
            </span>
          </button>
          <span
            className={`font-label-caps text-[8.5px] uppercase tracking-[0.1em] font-bold transition-colors ${
              isInstantActive ? 'text-[#FF5E36]' : 'text-[#94A3B8]'
            }`}
          >
            Catat
          </span>
        </div>

        {/* 4. Insights / Analisis */}
        <button
          onClick={() => handleTab('analytics')}
          aria-label="Analisis dan Statistik Keuangan"
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'analytics' ? 'text-[#FF5E36] font-bold' : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">monitoring</span>
          <span className="font-label-caps text-[8.5px] mt-0.5 uppercase tracking-[0.1em]">Analisis</span>
        </button>

        {/* 5. Vault / Brankas */}
        <button
          onClick={() => handleTab('vault-settings')}
          aria-label="Brankas dan Dompet"
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            isVaultActive ? 'text-[#FF5E36] font-bold' : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          <span className="font-label-caps text-[8.5px] mt-0.5 uppercase tracking-[0.1em]">Brankas</span>
        </button>
      </div>
    </nav>
  );
};
