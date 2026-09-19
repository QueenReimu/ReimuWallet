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

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#0D0F14]/95 backdrop-blur-xl border-t border-[#28303F]">
      <div className="relative flex items-center justify-around h-18 px-2 max-w-lg mx-auto">
        {/* Home */}
        <button
          onClick={() => handleTab('dashboard')}
          aria-label="Beranda Utama"
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] transition-colors ${
            activeTab === 'dashboard' ? 'text-[#FF5E36] font-bold' : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">home</span>
          <span className="font-label-caps text-[9px] mt-1 uppercase tracking-[0.15em]">Beranda</span>
        </button>

        {/* Ledger */}
        <button
          onClick={() => handleTab('transactions')}
          aria-label="Catatan Buku Kas"
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] transition-colors ${
            isTransactionsActive ? 'text-[#FF5E36] font-bold' : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">receipt_long</span>
          <span className="font-label-caps text-[9px] mt-1 uppercase tracking-[0.15em]">Buku Kas</span>
        </button>

        {/* Floating Quick Entry (+) Button */}
        <div className="relative flex-1 flex justify-center items-center">
          <button
            onClick={() => handleTab('instant-entry')}
            aria-label="Catat transaksi baru"
            title="Catat Transaksi Cepat"
            className="absolute -top-5 w-13 h-13 rounded-2xl bg-[#FF5E36] hover:bg-[#E04822] text-white flex items-center justify-center border border-[#FF8260]/30 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[28px] font-bold">add</span>
          </button>
        </div>

        {/* Insights / Analytics */}
        <button
          onClick={() => handleTab('analytics')}
          aria-label="Analisis dan Statistik Keuangan"
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] transition-colors ${
            activeTab === 'analytics' ? 'text-[#FF5E36] font-bold' : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">monitoring</span>
          <span className="font-label-caps text-[9px] mt-1 uppercase tracking-[0.15em]">Analisis</span>
        </button>

        {/* Vault Settings */}
        <button
          onClick={() => handleTab('vault-settings')}
          aria-label="Brankas dan Dompet"
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] transition-colors ${
            isVaultActive ? 'text-[#FF5E36] font-bold' : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
          <span className="font-label-caps text-[9px] mt-1 uppercase tracking-[0.15em]">Brankas</span>
        </button>
      </div>
    </nav>
  );
};
