import React, { useState, useEffect } from 'react';
import { TransactionType, Transaction, Wallet } from '../types';
import { CATEGORY_OPTIONS, formatRupiah } from '../data/mockData';
import { getTodayDateString, getCurrentTimeString, formatDisplayDate } from '../utils/dateUtils';
import { formatCurrencyInput } from '../utils/currencyUtils';
import { InteractiveCalendarModal } from './InteractiveCalendarModal';
import { parseFinancialNotification, SAMPLE_NOTIFICATIONS, ParsedNotificationResult } from '../utils/notificationParser';

interface InstantEntryViewProps {
  wallets: Wallet[];
  initialType?: TransactionType;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

interface PresetItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
  walletName?: string;
}

const DEFAULT_PRESETS: PresetItem[] = [
  { id: 'p-1', title: 'Makan Siang', amount: 25000, category: 'Food', type: 'expense' },
  { id: 'p-2', title: 'Kopi Kenangan', amount: 18000, category: 'Food', type: 'expense' },
  { id: 'p-3', title: 'Ongkos Transport', amount: 15000, category: 'Transit', type: 'expense' },
  { id: 'p-4', title: 'Sedekah / Donasi', amount: 50000, category: 'Others', type: 'expense' },
  { id: 'p-5', title: 'Proyek Lepas', amount: 500000, category: 'Income', type: 'income' },
];

export const InstantEntryView: React.FC<InstantEntryViewProps> = ({
  wallets,
  initialType = 'expense',
  onSave,
  onCancel,
}) => {
  const [entryType, setEntryType] = useState<TransactionType>(initialType);
  const [rawAmount, setRawAmount] = useState('0');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  
  // Real source wallet from active user wallets
  const [selectedWalletId, setSelectedWalletId] = useState<string>(() => {
    const primary = wallets.find((w) => w.isPrimary);
    return primary ? primary.id : wallets[0]?.id || '';
  });

  // Destination wallet for transfer
  const [destinationWalletId, setDestinationWalletId] = useState<string>(() => {
    const second = wallets.find((w) => w.id !== selectedWalletId);
    return second ? second.id : '';
  });

  // Date & Time
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedTime, setSelectedTime] = useState<string>(getCurrentTimeString());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [note, setNote] = useState('');
  const [hasReceipt, setHasReceipt] = useState(false);
  const [isSavedAnimating, setIsSavedAnimating] = useState(false);

  // Preset management modal
  const [presets, setPresets] = useState<PresetItem[]>(DEFAULT_PRESETS);
  const [showPresetModal, setShowPresetModal] = useState(false);

  // Notification Auto-Fill Modal
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifInputText, setNotifInputText] = useState(
    'DANA: Pembayaran sebesar Rp 25.000 ke Kopi Kenangan telah berhasil.'
  );
  const [notifParsedResult, setNotifParsedResult] = useState<ParsedNotificationResult | null>(() =>
    parseFinancialNotification(
      'DANA: Pembayaran sebesar Rp 25.000 ke Kopi Kenangan telah berhasil.',
      wallets
    )
  );
  const [autoFillSuccessMessage, setAutoFillSuccessMessage] = useState<string | null>(null);

  const handleNotifTextChange = (text: string) => {
    setNotifInputText(text);
    const parsed = parseFinancialNotification(text, wallets);
    setNotifParsedResult(parsed);
  };

  const handleApplyNotifAutoFill = () => {
    if (!notifParsedResult || notifParsedResult.amount <= 0) return;

    setRawAmount(notifParsedResult.amount.toString());
    setTitle(notifParsedResult.title);
    setEntryType(notifParsedResult.type);
    setSelectedCategory(notifParsedResult.category);
    if (notifParsedResult.matchedWalletId) {
      setSelectedWalletId(notifParsedResult.matchedWalletId);
    }
    setNote(`Deteksi otomatis: "${notifParsedResult.rawText}"`);

    setAutoFillSuccessMessage(`Terisi otomatis dari ${notifParsedResult.institution} (${notifParsedResult.title})`);
    setTimeout(() => setAutoFillSuccessMessage(null), 3500);

    setShowNotifModal(false);
  };

  // Synchronize default wallet if wallets change
  useEffect(() => {
    if (wallets.length > 0 && !wallets.some((w) => w.id === selectedWalletId)) {
      const primary = wallets.find((w) => w.isPrimary) || wallets[0];
      setSelectedWalletId(primary.id);
    }
  }, [wallets, selectedWalletId]);

  const activeWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];
  const activeDestWallet = wallets.find((w) => w.id === destinationWalletId);

  const amountNum = parseInt(rawAmount.replace(/\D/g, '') || '0', 10);

  const handleAddAmount = (val: number) => {
    const next = amountNum + val;
    setRawAmount(next.toString());
  };

  const handleClearAmount = () => {
    if (rawAmount.length > 1) {
      setRawAmount(rawAmount.slice(0, -1));
    } else {
      setRawAmount('0');
    }
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setRawAmount(digitsOnly || '0');
  };

  const handleApplyPreset = (preset: PresetItem) => {
    setTitle(preset.title);
    setRawAmount(preset.amount.toString());
    setSelectedCategory(preset.category);
    setEntryType(preset.type);
    if (preset.walletName) {
      const matched = wallets.find((w) => w.name.toLowerCase() === preset.walletName?.toLowerCase());
      if (matched) setSelectedWalletId(matched.id);
    }
    setShowPresetModal(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveTransaction = () => {
    if (amountNum <= 0) {
      alert('Harap masukkan nominal transaksi yang valid.');
      return;
    }

    if (!activeWallet) {
      alert('Harap pilih dompet asal yang valid.');
      return;
    }

    if (entryType === 'transfer') {
      if (!activeDestWallet) {
        alert('Harap pilih dompet tujuan untuk transfer.');
        return;
      }
      if (activeDestWallet.id === activeWallet.id) {
        alert('Dompet asal dan tujuan harus berbeda.');
        return;
      }
    }

    const transactionTitle = title.trim() || (entryType === 'transfer' ? `Transfer ke ${activeDestWallet?.name}` : selectedCategory);

    setIsSavedAnimating(true);
    
    // Immediate save call to persist into global state
    onSave({
      title: transactionTitle,
      category: entryType === 'transfer' ? 'Transfer' : selectedCategory,
      type: entryType,
      amount: amountNum,
      wallet: activeWallet.name,
      targetWallet: entryType === 'transfer' ? activeDestWallet?.name : undefined,
      date: selectedDate,
      time: selectedTime,
      note: note.trim() || undefined,
      hasReceipt,
    });
  };

  return (
    <div className="flex flex-col w-full pb-10 max-w-lg mx-auto font-sans">
      {/* Top Action Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={onCancel}
          aria-label="Batal dan tutup"
          type="button"
          className="w-10 h-10 -ml-1 rounded-lg flex items-center justify-center bg-[#141414] text-[#888888] hover:text-white hover:bg-[#1C1C1C] active:scale-95 transition-all border border-[#262626]"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#24120C] text-[#FF3E00] border border-[#FF3E00]/40 text-[10px] font-mono font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[14px] text-[#FF3E00]">bolt</span>
          <span>Catat Cepat</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNotifModal(true)}
            aria-label="Deteksi Otomatis dari Notifikasi"
            type="button"
            className="h-10 px-2.5 rounded-lg flex items-center gap-1 bg-[#24120C] text-[#FF3E00] hover:bg-[#341810] border border-[#FF3E00]/50 active:scale-95 transition-all text-[11px] font-mono font-bold uppercase"
            title="Deteksi Otomatis dari Notifikasi SMS / E-Wallet"
          >
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            <span className="hidden sm:inline">Auto-Parser</span>
          </button>

          <button
            onClick={() => setShowPresetModal(true)}
            aria-label="Template Presets"
            type="button"
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#141414] text-[#888888] hover:text-white hover:bg-[#1C1C1C] active:scale-95 transition-all border border-[#262626]"
            title="Template & Preset Cepat"
          >
            <span className="material-symbols-outlined text-[20px]">bookmark</span>
          </button>
        </div>
      </div>

      {/* Auto-Fill Success Toast */}
      {autoFillSuccessMessage && (
        <div className="mb-3 p-2.5 rounded-xl bg-[#1C2C1A] border border-[#3E8E41] text-[#78E08F] flex items-center gap-2 font-mono text-[11px] animate-in fade-in">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span className="font-bold">{autoFillSuccessMessage}</span>
        </div>
      )}

      {/* Transaction Type Segmented Switcher */}
      <div className="w-full bg-[#141414] p-1 rounded-xl flex items-center justify-between mb-4 border border-[#262626]">
        <button
          type="button"
          onClick={() => {
            setEntryType('expense');
            if (selectedCategory === 'Income' || selectedCategory === 'Transfer') {
              setSelectedCategory('Food');
            }
          }}
          className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-150 ${
            entryType === 'expense'
              ? 'bg-[#FF3E00] text-white shadow-[0_0_12px_rgba(255,62,0,0.35)]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => {
            setEntryType('income');
            setSelectedCategory('Income');
          }}
          className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-150 ${
            entryType === 'income'
              ? 'bg-[#FF3E00] text-white shadow-[0_0_12px_rgba(255,62,0,0.35)]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Pemasukan
        </button>
        <button
          type="button"
          onClick={() => {
            setEntryType('transfer');
            setSelectedCategory('Transfer');
          }}
          className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-150 ${
            entryType === 'transfer'
              ? 'bg-[#FF3E00] text-white shadow-[0_0_12px_rgba(255,62,0,0.35)]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Transfer
        </button>
      </div>

      {/* Value Input Card with typed keyboard input support */}
      <div className="w-full bg-[#121212] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.6)] border border-[#262626] flex flex-col items-center justify-center mb-4 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-[#FF3E00] shadow-[0_0_8px_#FF3E00]"></div>
        <span className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-[#888888] mb-1 font-extrabold">
          Nominal Transaksi
        </span>

        {/* Amount typing & display */}
        <div className="flex items-baseline justify-center gap-1.5 w-full my-1 relative">
          <span className="font-mono text-lg text-[#888888] font-bold select-none">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={amountNum === 0 ? '' : formatCurrencyInput(amountNum)}
            onChange={handleAmountInputChange}
            placeholder="0"
            className="w-56 text-center bg-transparent font-finance-metric-hero text-white tracking-tight text-[36px] font-black focus:outline-none focus:border-b-2 border-[#FF3E00]"
          />
        </div>

        {/* Real-time automatic IDR Rupiah badge */}
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1C1614] border border-[#FF3E00]/30 text-[#FF5E36] font-mono text-[11px] font-semibold mt-1">
          <span className="material-symbols-outlined text-[14px]">payments</span>
          <span>IDR Rupiah: {amountNum === 0 ? 'Rp 0' : `Rp ${formatRupiah(amountNum)}`}</span>
        </div>

        {/* Quick Amount Increment Pills */}
        <div className="flex items-center gap-2 mt-3 w-full justify-center overflow-x-auto py-1 no-scrollbar">
          <button
            type="button"
            onClick={() => handleAddAmount(10000)}
            className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#2E2E2E] text-white font-mono text-[11px] font-bold active:scale-90 transition-transform whitespace-nowrap hover:border-[#FF3E00]"
          >
            +10k
          </button>
          <button
            type="button"
            onClick={() => handleAddAmount(50000)}
            className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#2E2E2E] text-white font-mono text-[11px] font-bold active:scale-90 transition-transform whitespace-nowrap hover:border-[#FF3E00]"
          >
            +50k
          </button>
          <button
            type="button"
            onClick={() => handleAddAmount(100000)}
            className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#2E2E2E] text-white font-mono text-[11px] font-bold active:scale-90 transition-transform whitespace-nowrap hover:border-[#FF3E00]"
          >
            +100k
          </button>
          <button
            type="button"
            onClick={() => handleAddAmount(500000)}
            className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#2E2E2E] text-white font-mono text-[11px] font-bold active:scale-90 transition-transform whitespace-nowrap hover:border-[#FF3E00]"
          >
            +500k
          </button>
          <button
            type="button"
            onClick={handleClearAmount}
            aria-label="Clear value"
            className="w-8 h-8 rounded bg-[#1A1A1A] border border-[#2E2E2E] text-[#888888] flex items-center justify-center active:scale-90 transition-transform hover:text-white"
            title="Backspace"
          >
            <span className="material-symbols-outlined text-[16px]">backspace</span>
          </button>
          <button
            type="button"
            onClick={() => setRawAmount('0')}
            className="px-2 py-1.5 rounded bg-[#1A1A1A] border border-[#2E2E2E] text-[#FF4D4D] font-mono text-[10px] font-bold active:scale-90 transition-transform hover:border-[#FF4D4D]"
            title="Reset to 0"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Title / Merchant Name */}
      <div className="mb-4">
        <label className="block font-label-caps text-[9px] uppercase text-[#888888] tracking-[0.2em] font-extrabold mb-1.5">
          Judul / Merchant / Keterangan
        </label>
        <div className="bg-[#121212] rounded-xl border border-[#262626] focus-within:border-[#FF3E00] px-3.5 py-2.5 transition-all">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              entryType === 'expense'
                ? 'cth. Kopi Kenangan, Makan Siang, Supermarket...'
                : entryType === 'income'
                ? 'cth. Gaji Bulanan, Proyek Sampingan...'
                : 'cth. Tabungan Vault, Top-up...'
            }
            className="w-full bg-transparent font-sans text-[13px] text-white placeholder:text-[#555555] focus:outline-none"
          />
        </div>
      </div>

      {/* Date & Time Picker Bar (Interactive Calendar trigger) */}
      <div className="mb-4 bg-[#121212] p-3 rounded-xl border border-[#262626] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#24120C] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps text-[9px] text-[#888888] uppercase tracking-wider font-bold">
              Tanggal Transaksi
            </span>
            <span className="font-mono text-[12px] font-bold text-white group-hover:text-[#FF3E00] transition-colors">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#181818] px-2.5 py-1.5 rounded-lg border border-[#2E2E2E]">
            <span className="material-symbols-outlined text-[14px] text-[#888888]">schedule</span>
            <input
              type="text"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-12 bg-transparent font-mono text-[11px] font-bold text-[#CCCCCC] focus:outline-none text-center"
            />
          </div>
        </div>
      </div>

      {/* Select Category Grid (Only for Expense & Income) */}
      {entryType !== 'transfer' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-[9px] uppercase text-[#888888] tracking-[0.2em] font-extrabold">
              Pilih Kategori
            </span>
            <span className="font-mono text-[10px] text-[#888888] uppercase">
              {CATEGORY_OPTIONS.length} Aktif
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#24120C] border-[#FF3E00] text-[#FF3E00] shadow-[0_0_12px_rgba(255,62,0,0.2)]'
                      : 'bg-[#121212] border-[#262626] text-[#888888] hover:border-[#383838] hover:text-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#FF3E00] text-white' : 'bg-[#181818] text-[#CCCCCC]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px]">{cat.icon}</span>
                  </div>
                  <span className="font-body-sm text-[12px] font-bold truncate max-w-full">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* REAL SOURCE WALLET SELECTION (No dummy data) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-label-caps text-[9px] uppercase text-[#888888] tracking-[0.2em] font-extrabold">
            {entryType === 'transfer' ? 'Dompet Asal (Dari)' : 'Dompet Asal'}
          </span>
          <span className="font-mono text-[10px] text-[#666666] uppercase">Sinkronisasi Saldo</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {wallets.map((w) => {
            const isSelected = selectedWalletId === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWalletId(w.id)}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 min-w-[130px] shrink-0 text-left transition-all ${
                  isSelected
                    ? 'bg-[#24120C] border-[#FF3E00] shadow-[0_0_10px_rgba(255,62,0,0.25)]'
                    : 'bg-[#121212] border-[#262626] hover:border-[#383838]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isSelected ? 'text-[#FF3E00]' : 'text-[#888888]'
                    }`}
                  >
                    {w.icon || 'account_balance_wallet'}
                  </span>
                  {w.isPrimary && (
                    <span className="font-mono text-[8px] px-1 py-0.2 rounded bg-[#1F1F1F] text-[#AAAAAA] uppercase">
                      Utama
                    </span>
                  )}
                </div>
                <span className="font-mono text-[12px] font-bold text-white truncate max-w-full mt-1">
                  {w.name}
                </span>
                <span className="font-mono text-[10px] text-[#888888]">
                  Rp {formatRupiah(w.balance)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DESTINATION WALLET (For Transfers) */}
      {entryType === 'transfer' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-[9px] uppercase text-[#888888] tracking-[0.2em] font-extrabold">
              Dompet Tujuan (Ke)
            </span>
            <span className="font-mono text-[10px] text-[#666666] uppercase">Rekening Tujuan</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {wallets
              .filter((w) => w.id !== selectedWalletId)
              .map((w) => {
                const isSelected = destinationWalletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setDestinationWalletId(w.id)}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 min-w-[130px] shrink-0 text-left transition-all ${
                      isSelected
                        ? 'bg-[#1C2A1E] border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                        : 'bg-[#121212] border-[#262626] hover:border-[#383838]'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isSelected ? 'text-emerald-400' : 'text-[#888888]'
                      }`}
                    >
                      {w.icon || 'account_balance_wallet'}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-white truncate max-w-full mt-1">
                      {w.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#888888]">
                      Rp {formatRupiah(w.balance)}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Note and Receipt Options */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="bg-[#121212] rounded-xl border border-[#262626] focus-within:border-[#FF3E00] px-3.5 py-2.5 transition-all">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan tambahan / memo (opsional)..."
            className="w-full bg-transparent font-sans text-[12px] text-white placeholder:text-[#555555] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setHasReceipt(!hasReceipt)}
            className="flex items-center gap-2 text-[#888888] hover:text-white"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                hasReceipt ? 'text-[#FF3E00]' : 'text-[#666666]'
              }`}
            >
              {hasReceipt ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <span className="font-mono text-[11px]">Lampirkan Bukti Pembayaran</span>
          </button>
        </div>
      </div>

      {/* Main Save Transaction Action Button */}
      <button
        type="button"
        onClick={handleSaveTransaction}
        disabled={isSavedAnimating}
        className={`w-full h-14 rounded-2xl font-mono text-[14px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(255,62,0,0.35)] active:scale-[0.98] transition-all duration-150 ${
          isSavedAnimating
            ? 'bg-emerald-600 text-white shadow-[0_0_24px_rgba(16,185,129,0.5)]'
            : 'bg-[#FF3E00] text-white hover:bg-[#ff551c]'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isSavedAnimating ? 'done_all' : 'save'}
        </span>
        <span>{isSavedAnimating ? 'Transaksi Tersimpan!' : 'Simpan Transaksi'}</span>
      </button>

      {/* Interactive Calendar Modal */}
      <InteractiveCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(date) => setSelectedDate(date)}
        title="Pilih Tanggal Transaksi"
        subtitle="PILIH TANGGAL UNTUK CATATAN"
      />

      {/* Preset Modal with DELETE FEATURE */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2E2E2E] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col font-sans">
            <div className="flex items-center justify-between p-4 border-b border-[#242424] bg-[#161616]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF3E00] text-[20px]">bookmark</span>
                <span className="font-mono text-[14px] font-bold text-white uppercase">
                  Template Cepat
                </span>
              </div>
              <button
                onClick={() => setShowPresetModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#888888] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
              {presets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className="p-3 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#FF3E00] flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-[12px] font-bold text-white group-hover:text-[#FF3E00]">
                      {p.title}
                    </span>
                    <span className="font-mono text-[10px] text-[#888888]">
                      Rp {formatRupiah(p.amount)} • {p.category}
                    </span>
                  </div>

                  {/* Delete Preset Button */}
                  <button
                    onClick={(e) => handleDeletePreset(p.id, e)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#666666] hover:text-[#FF4D4D] hover:bg-[#2C1818] transition-colors"
                    title="Hapus template"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))}

              {presets.length === 0 && (
                <div className="text-center py-6 text-[#666666] font-mono text-[11px] uppercase">
                  Tidak ada template tersimpan
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Auto-Detect Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2E2E2E] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-[#242424] bg-[#161616]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF3E00] text-[20px]">notifications_active</span>
                <span className="font-mono text-[14px] font-bold text-white uppercase">
                  Deteksi Otomatis dari Notifikasi
                </span>
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#888888] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
              {/* Preset Sample Pills */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#888888] uppercase font-bold">
                  Contoh Notifikasi Bank / E-Wallet:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_NOTIFICATIONS.slice(0, 6).map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleNotifTextChange(sample.text)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase border transition-all ${
                        notifInputText === sample.text
                          ? 'bg-[#FF3E00] text-white border-[#FF3E00]'
                          : 'bg-[#181818] text-[#888888] border-[#2A2A2A] hover:text-white'
                      }`}
                    >
                      {sample.institution}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Textarea */}
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-[#888888] uppercase font-bold">
                  Tempel Teks Notifikasi SMS atau Aplikasi:
                </span>
                <textarea
                  rows={3}
                  value={notifInputText}
                  onChange={(e) => handleNotifTextChange(e.target.value)}
                  placeholder="Tempel teks notifikasi di sini..."
                  className="bg-[#181818] border border-[#2A2A2A] focus:border-[#FF3E00] rounded-xl p-3 text-white font-mono text-[12px] focus:outline-none placeholder-[#555555]"
                />
              </div>

              {/* Analysis Result Card */}
              {notifParsedResult && (
                <div className="p-3 rounded-xl bg-[#161616] border border-[#2A2A2A] flex flex-col gap-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between pb-1 border-b border-[#222222]">
                    <span className="text-[#888888] uppercase text-[9px] font-bold">Hasil Analisis</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#1E3A20] text-[#78E08F]">
                      {notifParsedResult.institution}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[#777777] text-[9px] uppercase">Merchant / Judul</span>
                      <span className="text-white font-bold">{notifParsedResult.title}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#777777] text-[9px] uppercase">Nominal</span>
                      <span className="text-[#FF3E00] font-bold">Rp {formatRupiah(notifParsedResult.amount)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#777777] text-[9px] uppercase">Dompet Cocok</span>
                      <span className="text-white">{notifParsedResult.walletName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#777777] text-[9px] uppercase">Tipe & Kategori</span>
                      <span className="text-[#CCCCCC] uppercase">
                        {notifParsedResult.type === 'expense'
                          ? 'Pengeluaran'
                          : notifParsedResult.type === 'income'
                          ? 'Pemasukan'
                          : 'Transfer'} • {notifParsedResult.category}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNotifModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-[#888888] font-mono text-[11px] font-bold uppercase transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyNotifAutoFill}
                  disabled={!notifParsedResult || notifParsedResult.amount <= 0}
                  className="flex-1 py-2 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] text-white font-mono text-[11px] font-bold uppercase shadow-[0_0_10px_rgba(255,62,0,0.3)] transition-all active:scale-95 disabled:opacity-50"
                >
                  Terapkan ke Formulir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
