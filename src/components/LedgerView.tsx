import React, { useState, useMemo } from 'react';
import { Transaction, Wallet } from '../types';
import { formatRupiah } from '../data/mockData';
import { InteractiveCalendarModal } from './InteractiveCalendarModal';
import { formatDisplayDate } from '../utils/dateUtils';

interface LedgerViewProps {
  transactions: Transaction[];
  wallets?: Wallet[];
  onSelectTransaction: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onExportLedger?: () => void;
  onRecordNewTransaction?: (date?: string) => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  transactions,
  wallets = [],
  onSelectTransaction,
  onDeleteTransaction,
  onExportLedger,
  onRecordNewTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Filter transactions based on search, selected type, wallet, and date
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (filterType !== 'ALL') {
        if (filterType === 'INCOME' && t.type !== 'income') return false;
        if (filterType === 'EXPENSE' && t.type !== 'expense') return false;
        if (filterType === 'TRANSFER' && t.type !== 'transfer') return false;
      }

      // Wallet filter (matches real user wallets)
      if (selectedWalletFilter !== 'ALL') {
        const tw = t.wallet.toLowerCase();
        const targetW = t.targetWallet?.toLowerCase() || '';
        const fw = selectedWalletFilter.toLowerCase();
        if (!tw.includes(fw) && !fw.includes(tw) && !targetW.includes(fw)) {
          return false;
        }
      }

      // Date filter (from interactive calendar)
      if (selectedDateFilter) {
        if (t.date !== selectedDateFilter) return false;
      }

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q) ||
        t.wallet.toLowerCase().includes(q)
      );
    });
  }, [transactions, searchQuery, filterType, selectedWalletFilter, selectedDateFilter]);

  // Dynamically group transactions chronologically by date
  const groupedDates = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    filteredTransactions.forEach((tx) => {
      const d = tx.date || '2026-09-03';
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    });

    // Sort descending by date
    const sorted = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sorted.map((date) => ({
      date,
      transactions: groups[date],
    }));
  }, [filteredTransactions]);

  // Dynamic monthly expense sum
  const totalMonthlyExpenditure = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'income') return 'work';
    if (type === 'transfer') return 'swap_horiz';
    switch (category.toLowerCase()) {
      case 'food':
        return 'restaurant';
      case 'transit':
      case 'transportation':
        return 'directions_car';
      case 'gaming':
        return 'sports_esports';
      case 'shopping':
        return 'shopping_bag';
      case 'bills':
        return 'receipt_long';
      case 'health':
        return 'medical_services';
      case 'leisure':
        return 'theater_comedy';
      default:
        return 'category';
    }
  };

  const getCategoryColor = (category: string, type: string) => {
    if (type === 'income') return 'bg-[#1C222D] border border-emerald-500/40 text-emerald-400';
    if (type === 'transfer') return 'bg-[#1C222D] border border-[#28303F] text-[#CBD5E1]';
    switch (category.toLowerCase()) {
      case 'food':
        return 'bg-[#2A1711] border border-[#FF5E36]/40 text-[#FF5E36]';
      case 'transit':
      case 'transportation':
        return 'bg-[#1C222D] border border-[#28303F] text-white';
      case 'gaming':
        return 'bg-[#1C222D] border border-[#28303F] text-[#94A3B8]';
      default:
        return 'bg-[#2A1711] border border-[#FF5E36]/30 text-[#FF5E36]';
    }
  };

  const formatDateHeader = (dateStr: string) => {
    const todayStr = '2026-09-03';
    const yesterdayStr = '2026-09-02';

    if (dateStr === todayStr) {
      return { primary: 'HARI INI', secondary: '· 3 SEP' };
    }
    if (dateStr === yesterdayStr) {
      return { primary: 'KEMARIN', secondary: '· 2 SEP' };
    }

    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
        const day = parseInt(parts[2], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const year = parts[0];
        return { primary: `${day} ${months[monthIdx] || ''} ${year}`, secondary: '' };
      }
    } catch {
      // fallback
    }
    return { primary: dateStr, secondary: '' };
  };

  const handleConfirmDeleteTransaction = () => {
    if (transactionToDelete && onDeleteTransaction) {
      onDeleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-8 font-sans">
      {/* Overview Summary & Export Ribbon (Interactive Calendar Entry) */}
      <section className="flex items-center justify-between bg-[#151921] p-4 rounded-2xl border border-[#28303F]">
        <button
          onClick={() => setIsCalendarOpen(true)}
          className="flex items-center gap-3 text-left group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1C222D] border border-[#28303F] group-hover:border-[#FF5E36] flex items-center justify-center text-[#FF5E36] transition-colors">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps text-[9px] text-[#94A3B8] group-hover:text-[#FF5E36] uppercase tracking-[0.15em] font-bold transition-colors">
              {selectedDateFilter ? `Filter Tanggal: ${formatDisplayDate(selectedDateFilter)}` : 'Total Pengeluaran September'}
            </span>
            <span className="font-mono text-[18px] text-[#F1F5F9] font-bold tracking-tight">
              Rp {formatRupiah(totalMonthlyExpenditure)}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Calendar Picker Button */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            aria-label="Buka Kalender"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
              selectedDateFilter
                ? 'bg-[#2A1711] text-[#FF5E36] border-[#FF5E36]'
                : 'bg-[#1C222D] text-[#94A3B8] hover:text-[#FF5E36] border-[#28303F]'
            }`}
            title="Buka Kalender Interaktif"
          >
            <span className="material-symbols-outlined text-[19px]">calendar_today</span>
          </button>

          <button
            onClick={() => {
              if (onExportLedger) onExportLedger();
              else alert('Mengekspor laporan buku kas September (format CSV & JSON).');
            }}
            aria-label="Ekspor laporan transaksi"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-white bg-[#1C222D] hover:bg-[#242B38] transition-all active:scale-95 border border-[#28303F]"
            title="Ekspor Buku Kas"
          >
            <span className="material-symbols-outlined text-[20px]">file_download</span>
          </button>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="relative flex items-center gap-2">
        <div className="relative flex-1 flex items-center bg-[#151921] rounded-xl border border-[#28303F] focus-within:border-[#FF5E36] transition-all">
          <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, catatan, kategori, dompet..."
            className="w-full bg-transparent pl-11 pr-4 py-3 font-mono text-[13px] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mr-3 text-[#94A3B8] hover:text-white"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Dynamic Wallet Filter Cycle */}
        <button
          onClick={() => {
            const walletNames = ['ALL', ...wallets.map((w) => w.name)];
            const currentIdx = walletNames.indexOf(selectedWalletFilter);
            const nextIdx = (currentIdx + 1) % walletNames.length;
            setSelectedWalletFilter(walletNames[nextIdx] || 'ALL');
          }}
          aria-label="Filter dompet"
          className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors active:scale-95 ${
            selectedWalletFilter !== 'ALL'
              ? 'bg-[#2A1711] text-[#FF5E36] border-[#FF5E36]'
              : 'bg-[#151921] text-[#94A3B8] hover:text-[#FF5E36] border-[#28303F]'
          }`}
          title={`Filter Dompet: ${selectedWalletFilter}`}
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </section>

      {/* Type Filter Pills & Active Filters Ribbon */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3.5 py-1.5 rounded-lg font-label-caps text-[9px] uppercase tracking-wider font-bold whitespace-nowrap transition-transform active:scale-95 ${
            filterType === 'ALL'
              ? 'bg-[#FF5E36] text-white'
              : 'bg-[#151921] text-[#94A3B8] hover:text-white border border-[#28303F]'
          }`}
        >
          SEMUA
        </button>

        <button
          onClick={() => setFilterType('EXPENSE')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-label-caps text-[9px] uppercase tracking-wider font-bold whitespace-nowrap transition-transform active:scale-95 ${
            filterType === 'EXPENSE'
              ? 'bg-[#FF5E36] text-white'
              : 'bg-[#151921] text-[#94A3B8] hover:text-white border border-[#28303F]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E36]"></span>
          PENGELUARAN
        </button>

        <button
          onClick={() => setFilterType('INCOME')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-label-caps text-[9px] uppercase tracking-wider font-bold whitespace-nowrap transition-transform active:scale-95 ${
            filterType === 'INCOME'
              ? 'bg-[#FF5E36] text-white'
              : 'bg-[#151921] text-[#94A3B8] hover:text-white border border-[#28303F]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          PEMASUKAN
        </button>

        <button
          onClick={() => setFilterType('TRANSFER')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-label-caps text-[9px] uppercase tracking-wider font-bold whitespace-nowrap transition-transform active:scale-95 ${
            filterType === 'TRANSFER'
              ? 'bg-[#FF5E36] text-white'
              : 'bg-[#151921] text-[#94A3B8] hover:text-white border border-[#28303F]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]"></span>
          TRANSFER
        </button>

        {/* Active Wallet Filter Chip */}
        {selectedWalletFilter !== 'ALL' && (
          <button
            onClick={() => setSelectedWalletFilter('ALL')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2A1711] text-[#FF5E36] font-mono text-[9px] uppercase tracking-wider font-bold whitespace-nowrap border border-[#FF5E36]/40"
          >
            <span>{selectedWalletFilter.toUpperCase()}</span>
            <span className="material-symbols-outlined text-[13px]">close</span>
          </button>
        )}

        {/* Active Date Filter Chip */}
        {selectedDateFilter && (
          <button
            onClick={() => setSelectedDateFilter(null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2A1711] text-[#FF5E36] font-mono text-[9px] uppercase tracking-wider font-bold whitespace-nowrap border border-[#FF5E36]/40"
            title="Hapus filter tanggal"
          >
            <span className="material-symbols-outlined text-[12px]">calendar_month</span>
            <span>{selectedDateFilter}</span>
            <span className="material-symbols-outlined text-[13px]">close</span>
          </button>
        )}
      </section>

      {/* Dynamic Chronological Feed */}
      <div className="flex flex-col gap-4">
        {groupedDates.map((group) => {
          const dateHeaderInfo = formatDateHeader(group.date);

          // Calculate net change for this group
          const net = group.transactions.reduce((acc, t) => {
            if (t.type === 'expense') return acc - t.amount;
            if (t.type === 'income') return acc + t.amount;
            return acc;
          }, 0);

          return (
            <div key={group.date} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-[#F1F5F9] tracking-wider uppercase">
                    {dateHeaderInfo.primary}
                  </span>
                  {dateHeaderInfo.secondary && (
                    <span className="text-[#94A3B8] font-mono text-[11px]">
                      {dateHeaderInfo.secondary}
                    </span>
                  )}
                </div>
                <span
                  className={`font-mono text-[13px] font-bold ${
                    net < 0 ? 'text-[#FF5E36]' : net > 0 ? 'text-emerald-400' : 'text-[#94A3B8]'
                  }`}
                >
                  {net < 0 ? '− ' : net > 0 ? '+ ' : ''}Rp {formatRupiah(Math.abs(net))}
                </span>
              </div>

              <div className="flex flex-col bg-[#151921] rounded-2xl border border-[#28303F] overflow-hidden divide-y divide-[#28303F]">
                {group.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="group relative flex items-center justify-between p-3.5 hover:bg-[#1C222D] transition-colors cursor-pointer"
                  >
                    {/* Main Clickable Area to View & Edit */}
                    <div
                      onClick={() => onSelectTransaction(tx)}
                      className="flex items-center gap-3 min-w-0 flex-1"
                      title="Klik untuk melihat dan mengubah detail"
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${getCategoryColor(
                          tx.category,
                          tx.type
                        )}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {getCategoryIcon(tx.category, tx.type)}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-body-md text-[13px] font-bold text-[#F1F5F9] truncate group-hover:text-white">
                            {tx.title}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#FF5E36] text-[14px] material-symbols-outlined">
                            edit
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#94A3B8] truncate uppercase">
                          {tx.note || tx.category} · {tx.wallet}
                          {tx.targetWallet ? ` → ${tx.targetWallet}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Amount, Time & Delete Action */}
                    <div className="flex items-center gap-3 shrink-0 pl-2">
                      <div
                        onClick={() => onSelectTransaction(tx)}
                        className="flex flex-col items-end"
                      >
                        <span
                          className={`font-mono text-[14px] font-bold ${
                            tx.type === 'income'
                              ? 'text-emerald-400'
                              : tx.type === 'transfer'
                              ? 'text-white'
                              : 'text-[#FF5E36]'
                          }`}
                        >
                          {tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '− ' : ''}Rp{' '}
                          {formatRupiah(tx.amount)}
                        </span>
                        <span className="font-mono text-[10px] text-[#94A3B8]">{tx.time}</span>
                      </div>

                      {/* QUICK DELETE BUTTON (Directly on transaction row) */}
                      {onDeleteTransaction && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTransactionToDelete(tx);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#2A1711] transition-colors border border-transparent hover:border-[#EF4444]/30"
                          title="Hapus transaksi"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="bg-[#151921] rounded-2xl p-8 text-center text-[#94A3B8] border border-[#28303F] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#64748B]">
              search_off
            </span>
            <span className="font-mono text-[13px] font-bold text-[#F1F5F9]">Tidak ada transaksi ditemukan</span>
            <p className="font-body-sm text-[12px] text-[#94A3B8] max-w-xs">
              {selectedDateFilter
                ? `Tidak ada catatan pada tanggal ${selectedDateFilter}. Ketuk hapus filter untuk melihat semua catatan.`
                : 'Coba sesuaikan pencarian, filter dompet, atau catat transaksi baru.'}
            </p>
            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#1C222D] text-[#FF5E36] font-mono text-[11px] font-bold uppercase border border-[#28303F] hover:border-[#FF5E36]"
              >
                Hapus Filter Tanggal
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interactive Calendar Modal */}
      <InteractiveCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDateFilter || '2026-09-03'}
        transactions={transactions}
        onSelectDate={(date) => setSelectedDateFilter(date)}
        onClearDate={() => setSelectedDateFilter(null)}
        onRecordOnDate={onRecordNewTransaction}
        title="Kalender Buku Kas"
        subtitle="KLIK TANGGAL UNTUK FILTER TRANSAKSI"
      />

      {/* CONFIRM DELETE TRANSACTION MODAL */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#151921] border border-[#EF4444]/40 rounded-2xl w-full max-w-sm p-5 flex flex-col gap-3 font-sans">
            <div className="flex items-center gap-2.5 text-[#EF4444]">
              <span className="material-symbols-outlined text-[24px]">delete</span>
              <span className="font-mono text-[15px] font-bold uppercase">Hapus Transaksi?</span>
            </div>
            <p className="font-body-sm text-[13px] text-[#CBD5E1]">
              Apakah Anda yakin ingin menghapus <strong className="text-white">"{transactionToDelete.title}"</strong> (Rp {formatRupiah(transactionToDelete.amount)})?
              Jumlah saldo akan dikembalikan ke dompet asal.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1C222D] hover:bg-[#28303F] text-[#94A3B8] font-mono text-[12px] font-bold uppercase border border-[#28303F]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTransaction}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444] hover:bg-red-500 text-white font-mono text-[12px] font-bold uppercase"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
