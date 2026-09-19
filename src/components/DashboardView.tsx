import React, { useState } from 'react';
import { Transaction, Wallet, ActiveTab, UserProfile } from '../types';
import { formatRupiah } from '../data/mockData';
import { InteractiveCalendarModal } from './InteractiveCalendarModal';
import { SurplusPieChart } from './SurplusPieChart';

interface DashboardViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  userProfile?: UserProfile;
  onOpenEditProfile?: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onOpenInstantEntryWithType?: (type: 'expense' | 'income') => void;
  onSelectDateToFilter?: (date: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  wallets,
  transactions,
  userProfile,
  onOpenEditProfile,
  onNavigate,
  onOpenInstantEntryWithType,
  onSelectDateToFilter,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'Sep' | '30Days'>('Sep');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Calculate total liquid assets across wallets
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  // Compute dynamic category expenses
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpenses = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  const categoryMap: Record<string, { amount: number; icon: string }> = {};
  expenseTransactions.forEach((t) => {
    const cat = t.category || 'Lainnya';
    if (!categoryMap[cat]) {
      let icon = 'category';
      const c = cat.toLowerCase();
      if (c.includes('makan') || c.includes('food')) icon = 'restaurant';
      else if (c.includes('transport') || c.includes('ojek')) icon = 'commute';
      else if (c.includes('belanja') || c.includes('shop')) icon = 'shopping_bag';
      else if (c.includes('hiburan') || c.includes('game')) icon = 'sports_esports';
      else if (c.includes('tagihan') || c.includes('listrik')) icon = 'receipt_long';
      categoryMap[cat] = { amount: 0, icon };
    }
    categoryMap[cat].amount += t.amount;
  });

  const sortedCategories = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      icon: data.icon,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  // Emblem hotlink from user prompt
  const emblemUrl =
    'https://lh3.googleusercontent.com/aida/AEtjO1XbzWML77efCsnozR-3ttiVE1qwoW5EvDoc4qoP7vuTYzPodvpPh5gVnHmlgz5YvNZVQxa2cvIUU-E-TvwnEHvgfhURARH3_mYSiKutg2bJSGjZJW3tTjIXPVJdUNI9cP1gsjdpcXd7ZtZ6rpzDh53NlNWXn5GVTHaYpiX8Z50uBkxudVPoKQHtIrZ8-moHOPKKbQkK2VPbN6a3ShP95rQ-1npOwgAPjiwrPB7YSiH5NK4cEbgOVw8bEsE';

  return (
    <div className="flex flex-col w-full gap-5 pb-8 font-sans">
      {/* Sub-Header / Profile & Date Greeting Row */}
      <div className="flex items-center justify-between pt-1">
        <div
          onClick={onOpenEditProfile}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="Klik untuk ubah profil"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-[#1C222D] flex items-center justify-center overflow-hidden border border-[#28303F] group-hover:border-[#FF5E36] transition-colors">
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#2A1711] border border-[#FF5E36]/40 flex items-center justify-center text-[#FF5E36] font-mono text-[16px] font-black">
                  {(userProfile?.name || 'P').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FF5E36] text-white flex items-center justify-center border border-[#0D0F14] text-[9px]">
              <span className="material-symbols-outlined text-[10px]">edit</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-label-caps text-[9px] text-[#FF5E36] tracking-[0.15em] uppercase font-bold">
                {userProfile?.tagline || 'Kas Mandiri'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E36]"></span>
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider group-hover:text-white transition-colors">
                Ubah Profil
              </span>
            </div>
            <span className="font-extrabold text-[18px] text-[#F1F5F9] tracking-tight group-hover:text-[#FF5E36] transition-colors font-display">
              Halo, {userProfile?.name || 'Pengguna'}!
            </span>
          </div>
        </div>

        {/* Month & Interactive Calendar Quick Action */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151921] hover:bg-[#1C222D] border border-[#28303F] hover:border-[#FF5E36] transition-colors active:scale-95 group"
          title="Buka kalender transaksi interaktif"
        >
          <span className="material-symbols-outlined text-[15px] text-[#FF5E36] group-hover:scale-110 transition-transform">
            calendar_today
          </span>
          <span className="font-mono text-[11px] font-bold text-[#CBD5E1] group-hover:text-white uppercase tracking-wider">
            Sep 2026
          </span>
        </button>
      </div>

      {/* Primary Architectural Hero Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#151921] p-5 border border-[#28303F]">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF5E36]"></div>

        <div className="flex flex-col gap-4 relative z-10">
          {/* Balance Header & Visibility Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-label-caps text-[9px] uppercase text-[#94A3B8] tracking-[0.15em] font-bold">
                Total Saldo
              </span>
              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                aria-label="Tampilkan / Sembunyikan Saldo"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1C222D] transition-colors text-[#94A3B8] hover:text-white active:scale-95"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {isBalanceHidden ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Trend Delta Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#1C222D] border border-[#28303F]">
              {transactions.length > 0 ? (
                <>
                  <span className="material-symbols-outlined text-[13px] text-[#FF5E36]">trending_up</span>
                  <span className="font-mono text-[11px] font-bold text-[#FF5E36]">
                    {transactions.length} Trx
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8] uppercase">Tercatat</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[13px] text-emerald-400">check_circle</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-400">SIAP</span>
                  <span className="font-mono text-[10px] text-[#94A3B8] uppercase">Buku Kas Bersih</span>
                </>
              )}
            </div>
          </div>

          {/* Big Rupiah Balance Display */}
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[20px] text-[#94A3B8] font-bold">Rp</span>
            <span className="font-finance-metric-hero text-[#F1F5F9] tracking-tight text-[36px] font-extrabold leading-none">
              {isBalanceHidden ? '••••••••' : formatRupiah(totalBalance)}
            </span>
          </div>

          {/* Quick Wallet Horizontal Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-2">
            {wallets.length > 0 ? (
              wallets.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onNavigate('vault-settings')}
                  className="flex items-center gap-2.5 bg-[#1C222D] hover:bg-[#242B38] px-3 py-2 rounded-xl border border-[#28303F] hover:border-[#FF5E36]/50 shrink-0 cursor-pointer transition-all group"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#FF5E36]">
                    {w.icon || (w.type === 'vault' ? 'lock' : 'account_balance_wallet')}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-[#F1F5F9] font-bold group-hover:text-[#FF5E36] transition-colors">{w.name}</span>
                      {w.type === 'vault' && (
                        <span className="material-symbols-outlined text-[12px] text-[#94A3B8]">
                          {w.isLocked ? 'lock' : 'lock_open'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[10px] text-[#94A3B8]">
                        {isBalanceHidden ? '•••' : `Rp ${formatRupiah(w.balance)}`}
                      </span>
                      {w.targetMoney && w.targetMoney > 0 && !isBalanceHidden && (
                        <span className="font-mono text-[9px] text-[#FF5E36] font-semibold">
                          / {formatRupiah(w.targetMoney)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                onClick={() => onNavigate('vault-settings')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1C222D] border border-dashed border-[#28303F] hover:border-[#FF5E36] text-[#94A3B8] hover:text-white cursor-pointer transition-all text-[11px] font-mono"
              >
                <span className="material-symbols-outlined text-[16px] text-[#FF5E36]">add_circle</span>
                <span>Belum ada dompet • Ketuk untuk tambah</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Surplus Pie Chart Bento */}
      <SurplusPieChart
        transactions={transactions}
        selectedPeriod={selectedPeriod}
        onChangePeriod={setSelectedPeriod}
        onNavigateToAnalytics={() => onNavigate('analytics')}
        onRecordNew={() => {
          if (onOpenInstantEntryWithType) onOpenInstantEntryWithType('expense');
          else onNavigate('instant-entry');
        }}
      />

      {/* "Where your money goes" Breakdown Section */}
      <div className="flex flex-col gap-4 rounded-2xl bg-[#151921] p-4 border border-[#28303F]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-bold text-[16px] text-[#F1F5F9] tracking-tight uppercase font-display">Alokasi Pengeluaran</h2>
            <span className="font-mono text-[11px] text-[#94A3B8]">
              {sortedCategories.length > 0 ? 'Rincian kategori pengeluaran teratas' : 'Belum ada pengeluaran'}
            </span>
          </div>
          {sortedCategories.length > 0 && (
            <button
              onClick={() => onNavigate('analytics')}
              className="font-label-caps text-[9px] text-[#FF5E36] font-bold tracking-[0.15em] uppercase hover:underline p-1 flex items-center gap-0.5"
            >
              <span>LIHAT SEMUA</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>

        {/* Category Progress Items */}
        {sortedCategories.length > 0 ? (
          <div className="flex flex-col gap-3">
            {sortedCategories.map((item, idx) => (
              <div key={item.category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        idx === 0
                          ? 'bg-[#2A1711] border border-[#FF5E36]/40 text-[#FF5E36]'
                          : 'bg-[#1C222D] border border-[#28303F] text-[#F1F5F9]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-[13px] font-bold text-[#F1F5F9]">{item.category}</span>
                      <span className="font-mono text-[10px] text-[#94A3B8]">
                        {item.percentage.toFixed(1)}% DARI PENGELUARAN
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[14px] font-bold text-[#F1F5F9]">
                    Rp {formatRupiah(item.amount)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1C222D] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${idx === 0 ? 'bg-[#FF5E36]' : 'bg-[#94A3B8]'}`}
                    style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-[#28303F] rounded-xl bg-[#1C222D]/40">
            <span className="material-symbols-outlined text-[28px] text-[#64748B]">
              pie_chart_outline
            </span>
            <span className="font-mono text-[12px] font-bold text-[#F1F5F9]">Belum Ada Pengeluaran</span>
            <p className="font-body-sm text-[11px] text-[#94A3B8] max-w-xs">
              Catat pengeluaran pertamamu untuk memantau proporsi belanja dan alokasi dana secara langsung.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onOpenInstantEntryWithType) onOpenInstantEntryWithType('expense');
                else onNavigate('instant-entry');
              }}
              className="mt-1 px-3 py-1.5 rounded-lg bg-[#2A1711] hover:bg-[#381F17] text-[#FF5E36] border border-[#FF5E36]/30 font-mono text-[10px] uppercase font-bold tracking-wider transition-all"
            >
              + Catat Pengeluaran
            </button>
          </div>
        )}
      </div>

      {/* Quick Action Sanctuary Bar */}
      <div className="grid grid-cols-2 gap-3 pb-2">
        <button
          onClick={() => {
            if (onOpenInstantEntryWithType) onOpenInstantEntryWithType('expense');
            else onNavigate('instant-entry');
          }}
          className="h-12 rounded-xl bg-[#FF5E36] hover:bg-[#E04822] text-white font-bold text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Catat Pengeluaran</span>
        </button>
        <button
          onClick={() => {
            if (onOpenInstantEntryWithType) onOpenInstantEntryWithType('income');
            else onNavigate('instant-entry');
          }}
          className="h-12 rounded-xl bg-[#1C222D] hover:bg-[#242B38] text-white font-bold text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all border border-[#28303F]"
        >
          <span className="material-symbols-outlined text-[20px] text-[#FF5E36]">download</span>
          <span>Catat Pemasukan</span>
        </button>
      </div>

      {/* Interactive Calendar Modal from Dashboard */}
      <InteractiveCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate="2026-09-03"
        transactions={transactions}
        onSelectDate={(date) => {
          if (onSelectDateToFilter) {
            onSelectDateToFilter(date);
          } else {
            onNavigate('transactions');
          }
        }}
        onRecordOnDate={() => {
          if (onOpenInstantEntryWithType) onOpenInstantEntryWithType('expense');
          else onNavigate('instant-entry');
        }}
        title="Kalender Transaksi"
        subtitle="PILIH TANGGAL UNTUK FILTER ATAU MENCATAT"
      />
    </div>
  );
};
