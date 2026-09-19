import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { MONTH_NAMES_ID, MONTH_NAMES_SHORT, getTodayDateString, formatDisplayDate } from '../utils/dateUtils';
import { formatRupiah } from '../data/mockData';

interface InteractiveCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string; // 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
  transactions?: Transaction[];
  title?: string;
  subtitle?: string;
  allowClear?: boolean;
  onClearDate?: () => void;
  onRecordOnDate?: (date: string) => void;
}

export const InteractiveCalendarModal: React.FC<InteractiveCalendarModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  transactions = [],
  title = 'Kalender Transaksi',
  subtitle = 'PILIH TANGGAL UNTUK FILTER ATAU CATAT',
  allowClear = true,
  onClearDate,
  onRecordOnDate,
}) => {
  // Parse initial year & month
  const initialDate = selectedDate || '2026-09-03';
  const [activeYear, setActiveYear] = useState(() => {
    const parts = initialDate.split('-');
    return parseInt(parts[0], 10) || 2026;
  });
  const [activeMonth, setActiveMonth] = useState(() => {
    const parts = initialDate.split('-');
    return parseInt(parts[1], 10) - 1 >= 0 ? parseInt(parts[1], 10) - 1 : 8; // 8 = Sept
  });

  const [highlightedDate, setHighlightedDate] = useState<string>(selectedDate || '2026-09-03');

  // Map of date string -> array of transactions
  const txByDate = useMemo(() => {
    const map: { [dateStr: string]: Transaction[] } = {};
    transactions.forEach((tx) => {
      const d = tx.date || '2026-09-03';
      if (!map[d]) map[d] = [];
      map[d].push(tx);
    });
    return map;
  }, [transactions]);

  if (!isOpen) return null;

  // Days calculation for current view
  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(activeYear, activeMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  // Convert so Monday = 0, Sunday = 6
  const startOffset = (firstDayOfWeek + 6) % 7;

  const prevMonthDays = new Date(activeYear, activeMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      setActiveMonth(11);
      setActiveYear((y) => y - 1);
    } else {
      setActiveMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      setActiveMonth(0);
      setActiveYear((y) => y + 1);
    } else {
      setActiveMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = getTodayDateString();
    const [y, m] = today.split('-').map(Number);
    setActiveYear(y);
    setActiveMonth(m - 1);
    setHighlightedDate(today);
  };

  const currentMonthName = MONTH_NAMES_ID[activeMonth] || 'September';

  // Transactions on highlighted date
  const selectedDayTxs = txByDate[highlightedDate] || [];
  const selectedDayTotalExpense = selectedDayTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const selectedDayTotalIncome = selectedDayTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="bg-[#121212] border border-[#2E2E2E] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#242424] bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#24120C] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00]">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[14px] font-bold text-white uppercase tracking-tight">
                {title}
              </span>
              <span className="font-label-caps text-[9px] text-[#888888] uppercase tracking-wider font-extrabold">
                {subtitle}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup kalender"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1F1F1F] text-[#888888] hover:text-white hover:bg-[#282828] active:scale-95 transition-all border border-[#2E2E2E]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Month Navigation Row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[17px] text-white tracking-tight">
              {currentMonthName} {activeYear}
            </span>
            <button
              onClick={handleJumpToToday}
              className="px-2 py-0.5 rounded bg-[#1C1C1C] border border-[#333333] text-[#FF3E00] text-[10px] font-mono font-bold uppercase tracking-wider hover:border-[#FF3E00] transition-colors"
            >
              Hari Ini
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Bulan Sebelumnya"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1A1A1A] text-[#AAAAAA] hover:text-white hover:bg-[#242424] active:scale-90 border border-[#2A2A2A] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Bulan Berikutnya"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1A1A1A] text-[#AAAAAA] hover:text-white hover:bg-[#242424] active:scale-90 border border-[#2A2A2A] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Calendar Days Matrix */}
        <div className="px-4 pb-3">
          {/* Day of week labels */}
          <div className="grid grid-cols-7 gap-1 text-center py-1.5 border-b border-[#222222] mb-1.5">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
              <span key={day} className="font-mono text-[11px] font-bold text-[#666666] uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous month padding days */}
            {Array.from({ length: startOffset }).map((_, i) => {
              const dayNum = prevMonthDays - startOffset + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="h-10 rounded-lg flex flex-col items-center justify-center opacity-25 text-[#666666] font-mono text-[12px] select-none"
                >
                  <span>{dayNum}</span>
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayString = String(dayNum).padStart(2, '0');
              const monthString = String(activeMonth + 1).padStart(2, '0');
              const dateKey = `${activeYear}-${monthString}-${dayString}`;

              const isSelected = highlightedDate === dateKey;
              const isRealToday = dateKey === getTodayDateString() || dateKey === '2026-09-03';
              const dayTxs = txByDate[dateKey] || [];
              const hasTxs = dayTxs.length > 0;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => {
                    setHighlightedDate(dateKey);
                  }}
                  className={`h-10 rounded-lg flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#FF3E00] text-white font-bold shadow-[0_0_12px_rgba(255,62,0,0.4)]'
                      : isRealToday
                      ? 'bg-[#1C1C1C] text-white border border-[#FF3E00]/60 hover:bg-[#252525]'
                      : 'bg-[#151515] text-[#DDDDDD] hover:bg-[#202020] border border-transparent'
                  }`}
                >
                  <span className="font-mono text-[12px]">{dayNum}</span>
                  {hasTxs && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-[#FF3E00] shadow-[0_0_4px_#FF3E00]'
                        }`}
                      ></span>
                      {dayTxs.length > 1 && (
                        <span
                          className={`font-mono text-[8px] leading-none ${
                            isSelected ? 'text-white' : 'text-[#888888]'
                          }`}
                        >
                          {dayTxs.length}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Ribbon */}
        <div className="bg-[#161616] p-4 border-t border-[#242424] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#FF3E00]">event</span>
              <span className="font-mono text-[13px] font-bold text-white">
                {formatDisplayDate(highlightedDate)}
              </span>
            </div>
            {selectedDayTxs.length > 0 ? (
              <span className="font-mono text-[11px] text-[#888888]">
                {selectedDayTxs.length} transaksi
              </span>
            ) : (
              <span className="font-mono text-[10px] text-[#666666] uppercase">Tidak ada catatan</span>
            )}
          </div>

          {/* Quick breakdown if transactions exist */}
          {selectedDayTxs.length > 0 && (
            <div className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-[#111111] border border-[#242424] text-[11px] font-mono">
              {selectedDayTotalExpense > 0 && (
                <div className="flex items-center gap-1 text-[#FF3E00]">
                  <span>Pengeluaran:</span>
                  <span className="font-bold">Rp {formatRupiah(selectedDayTotalExpense)}</span>
                </div>
              )}
              {selectedDayTotalIncome > 0 && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <span>Pemasukan:</span>
                  <span className="font-bold">+Rp {formatRupiah(selectedDayTotalIncome)}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onSelectDate(highlightedDate);
                onClose();
              }}
              className="flex-1 h-11 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] text-white font-mono text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(255,62,0,0.3)] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>Pilih Tanggal</span>
            </button>

            {allowClear && onClearDate && (
              <button
                type="button"
                onClick={() => {
                  onClearDate();
                  onClose();
                }}
                className="h-11 px-3.5 rounded-xl bg-[#1E1E1E] hover:bg-[#282828] text-[#888888] hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider border border-[#2C2C2C] active:scale-95 transition-all"
                title="Tampilkan semua catatan tanpa filter tanggal"
              >
                Hapus Filter
              </button>
            )}

            {onRecordOnDate && (
              <button
                type="button"
                onClick={() => {
                  onRecordOnDate(highlightedDate);
                  onClose();
                }}
                className="h-11 px-3 rounded-xl bg-[#24120C] hover:bg-[#341810] text-[#FF3E00] font-mono text-[11px] font-bold uppercase tracking-wider border border-[#FF3E00]/40 flex items-center justify-center gap-1 active:scale-95 transition-all"
                title="Catat transaksi baru pada tanggal ini"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tambah</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
