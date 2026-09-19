import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Wallet } from '../types';
import { formatRupiah, CATEGORY_OPTIONS, INITIAL_WALLETS } from '../data/mockData';
import { formatCurrencyInput } from '../utils/currencyUtils';

interface TransactionDetailModalProps {
  transaction?: Transaction | null;
  wallets?: Wallet[];
  onClose: () => void;
  onSaveConfirmed?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  initialEditMode?: boolean;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  wallets = INITIAL_WALLETS,
  onClose,
  onSaveConfirmed,
  onDeleteTransaction,
  initialEditMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable Form States
  const [title, setTitle] = useState(transaction?.title || 'Kopi Kenangan');
  const [amountRaw, setAmountRaw] = useState(transaction?.amount ? String(transaction.amount) : '25000');
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense');
  const [category, setCategory] = useState(transaction?.category || 'Food');
  const [wallet, setWallet] = useState(transaction?.wallet || wallets[0]?.name || 'DANA Balance');
  const [targetWallet, setTargetWallet] = useState(transaction?.targetWallet || 'Emergency Vault');
  const [date, setDate] = useState(transaction?.date || '2026-09-03');
  const [time, setTime] = useState(transaction?.time || '14:20');
  const [note, setNote] = useState(transaction?.note || '');

  // Keep state in sync if transaction prop changes
  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmountRaw(transaction.amount ? formatCurrencyInput(transaction.amount) : '');
      setType(transaction.type);
      setCategory(transaction.category);
      setWallet(transaction.wallet);
      setTargetWallet(transaction.targetWallet || 'Emergency Vault');
      setDate(transaction.date);
      setTime(transaction.time);
      setNote(transaction.note || '');
    }
  }, [transaction]);

  const parsedAmount = parseInt(amountRaw.replace(/\D/g, '') || '0', 10);
  const notificationText =
    transaction?.rawNotification ||
    '“DANA: Pembayaran sebesar Rp 25.000 ke Kopi Kenangan telah berhasil.”';

  const handleSave = () => {
    if (!title.trim()) {
      alert('Harap masukkan judul atau nama merchant yang valid.');
      return;
    }
    if (parsedAmount <= 0) {
      alert('Harap masukkan nominal yang valid.');
      return;
    }

    const updatedTransaction: Transaction = {
      id: transaction?.id || `tx-${Date.now()}`,
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: type === 'transfer' ? 'Transfer' : category,
      wallet,
      targetWallet: type === 'transfer' ? targetWallet : undefined,
      date,
      time,
      note: note.trim() || undefined,
      rawNotification: transaction?.rawNotification,
      hasReceipt: transaction?.hasReceipt,
    };

    setIsSaved(true);
    setTimeout(() => {
      if (onSaveConfirmed) {
        onSaveConfirmed(updatedTransaction);
      }
      onClose();
    }, 600);
  };

  const handleDelete = () => {
    if (transaction && onDeleteTransaction) {
      onDeleteTransaction(transaction.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] overflow-y-auto pt-safe pb-safe flex flex-col font-sans">
      {/* Top sticky navigation bar */}
      <header className="h-16 px-5 flex items-center justify-between border-b border-[#262626] bg-[#0A0A0A]/95 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isEditing && !initialEditMode) {
                setIsEditing(false);
              } else {
                onClose();
              }
            }}
            aria-label="Kembali"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#888888] hover:text-white transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-mono text-[16px] font-bold text-white uppercase tracking-tight">
              {isEditing ? 'Edit Transaksi' : 'Detail Transaksi'}
            </h1>
            <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider">
              {isEditing ? 'Ubah Kolom Catatan' : 'Entri Buku Kas Terproteksi'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-lg bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white flex items-center gap-1.5 text-[12px] font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-[#FF3E00]">edit</span>
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaved}
              className="px-3.5 py-1.5 rounded-lg bg-[#FF3E00] hover:bg-[#ff551c] text-white flex items-center gap-1 text-[12px] font-mono font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,62,0,0.4)] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>Simpan</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 px-5 pt-4 pb-12 max-w-lg mx-auto w-full flex flex-col">
        {/* EDIT MODE FORM */}
        {isEditing ? (
          <div className="flex flex-col gap-4">
            {/* Type selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                Tipe Transaksi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['expense', 'income', 'transfer'] as const).map((t) => {
                  const isSelected = type === t;
                  const activeClass =
                    t === 'expense'
                      ? 'bg-[#FF3E00] text-white shadow-[0_0_12px_rgba(255,62,0,0.4)]'
                      : t === 'income'
                      ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-white text-black font-bold';

                  const labelText =
                    t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer';

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all border ${
                        isSelected
                          ? `${activeClass} border-transparent`
                          : 'bg-[#141414] text-[#888888] border-[#262626] hover:text-white'
                      }`}
                    >
                      {labelText}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Merchant / Title */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                Judul / Keterangan Merchant
              </label>
              <div className="bg-[#121212] rounded-xl border border-[#262626] focus-within:border-[#FF3E00] px-3.5 py-2.5 transition-colors">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="cth. Kopi Kenangan, Indomaret..."
                  className="w-full bg-transparent font-sans text-[14px] text-white placeholder:text-[#555555] focus:outline-none"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                  Nominal Transaksi
                </label>
                <span className="font-mono text-[11px] text-[#FF3E00] font-bold">
                  IDR Rupiah: Rp {formatRupiah(parsedAmount)}
                </span>
              </div>
              <div className="bg-[#121212] rounded-xl border border-[#262626] focus-within:border-[#FF3E00] px-3.5 py-3 flex items-center gap-2 transition-colors">
                <span className="font-mono text-[18px] font-bold text-[#FF3E00]">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(formatCurrencyInput(e.target.value))}
                  placeholder="0"
                  className="w-full bg-transparent font-mono text-[20px] font-bold text-white placeholder:text-[#555555] focus:outline-none"
                />
                {amountRaw.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountRaw('')}
                    className="text-[#666666] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category selection (only for Expense and Income) */}
            {type !== 'transfer' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                    Pilihan Kategori
                  </label>
                  <span className="font-mono text-[11px] text-white font-bold">{category}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#24120C] border-[#FF3E00] text-[#FF3E00]'
                            : 'bg-[#121212] border-[#262626] text-[#AAAAAA] hover:text-white hover:border-[#3A3A3A]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px] shrink-0">
                          {cat.icon}
                        </span>
                        <span className="font-mono text-[11px] font-bold truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Source Wallet Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                {type === 'transfer' ? 'Dompet Asal (Debit)' : 'Dompet / Rekening'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {wallets.map((w) => {
                  const isSelected = wallet.toLowerCase().includes(w.name.toLowerCase()) || w.name.toLowerCase().includes(wallet.toLowerCase());
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWallet(w.name)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#181818] border-[#FF3E00] text-white'
                          : 'bg-[#121212] border-[#262626] text-[#888888] hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#FF3E00]">
                        {w.icon}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-body-md text-[12px] font-bold truncate text-white">
                          {w.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#666666]">
                          Rp {formatRupiah(w.balance)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Wallet (Transfer only) */}
            {type === 'transfer' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                  Dompet Tujuan (Kredit)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {wallets
                    .filter((w) => !w.name.toLowerCase().includes(wallet.toLowerCase()))
                    .map((w) => {
                      const isSelected = targetWallet.toLowerCase().includes(w.name.toLowerCase());
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setTargetWallet(w.name)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-[#181818] border-emerald-500 text-white'
                              : 'bg-[#121212] border-[#262626] text-[#888888] hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px] text-emerald-400">
                            {w.icon}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-body-md text-[12px] font-bold truncate text-white">
                              {w.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#666666]">
                              Rp {formatRupiah(w.balance)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                  Tanggal (YYYY-MM-DD)
                </label>
                <div className="bg-[#121212] rounded-xl border border-[#262626] px-3.5 py-2.5">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent font-mono text-[13px] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                  Waktu (JJ:MM)
                </label>
                <div className="bg-[#121212] rounded-xl border border-[#262626] px-3.5 py-2.5">
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-transparent font-mono text-[13px] text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Note / Memo */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[10px] text-[#888888] uppercase tracking-wider font-extrabold">
                Catatan / Memo
              </label>
              <div className="bg-[#121212] rounded-xl border border-[#262626] focus-within:border-[#FF3E00] px-3.5 py-2.5">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="cth. Makan siang bersama, transfer antar dompet..."
                  className="w-full bg-transparent font-sans text-[13px] text-white placeholder:text-[#555555] focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons in Edit Mode */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaved}
                className={`w-full h-12 text-white font-mono text-[13px] font-bold uppercase tracking-wider rounded-xl shadow-[0_0_12px_rgba(255,62,0,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                  isSaved ? 'bg-emerald-600' : 'bg-[#FF3E00] hover:bg-[#ff551c]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isSaved ? 'check_circle' : 'check'}
                </span>
                <span>{isSaved ? 'Perubahan Disimpan' : 'Simpan Perubahan'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full h-11 bg-[#141414] text-[#AAAAAA] hover:text-white font-mono text-[12px] font-bold uppercase tracking-wider rounded-xl hover:bg-[#202020] transition-colors flex items-center justify-center gap-1.5 border border-[#262626]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  <span>Batal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-11 bg-[#1C1212] text-[#FF4D4D] hover:bg-[#2C1818] font-mono text-[12px] font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-[#FF4D4D]/30"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW MODE */
          <div className="flex flex-col gap-5">
            {/* Live sync / status pill */}
            <div className="flex flex-col gap-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 bg-[#14261C] px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    Rekaman Enklaf Mandiri
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#888888] flex items-center gap-1 uppercase">
                  <span className="material-symbols-outlined text-[15px] text-[#FF3E00]">verified_user</span> DB Lokal
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-[#888888] leading-relaxed mt-1">
                Disimpan aman dalam basis data lokal perangkat. Tekan <strong>Edit Rincian</strong> di bawah untuk mengubah nominal, kategori, atau catatan.
              </p>
            </div>

            {/* Main Overview Card */}
            <div className="w-full bg-[#121212] rounded-2xl border border-[#262626] p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF3E00] shadow-[0_0_8px_#FF3E00]"></div>

              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#333333] flex items-center justify-center text-[#FF3E00]">
                    <span className="material-symbols-outlined text-[20px] text-[#FF3E00]">
                      {type === 'transfer'
                        ? 'swap_horiz'
                        : type === 'income'
                        ? 'arrow_downward'
                        : 'receipt_long'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[14px] font-bold text-white uppercase tracking-tight">
                        {wallet}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#888888]"></span>
                      <span className="font-mono text-[11px] text-[#888888]">{time}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#FF3E00] uppercase font-bold tracking-wider">
                      {type === 'income'
                        ? 'Pemasukan Diterima'
                        : type === 'transfer'
                        ? 'Likuiditas Dialihkan'
                        : 'Pembayaran Dicatat'}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-[#24120C] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00]">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
              </div>

              {/* Amount Display */}
              <div className="my-4 py-4 flex flex-col items-center justify-center bg-[#181818] rounded-xl p-4 border border-[#262626]">
                <span className="font-mono text-[9px] text-[#888888] uppercase tracking-[0.2em] mb-1 font-bold">
                  {type === 'income' ? 'Nominal Pemasukan' : type === 'transfer' ? 'Nominal Transfer' : 'Nominal Pengeluaran'}
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`font-mono text-[30px] font-black tracking-tight ${
                      type === 'income'
                        ? 'text-emerald-400'
                        : type === 'transfer'
                        ? 'text-white'
                        : 'text-[#FF3E00]'
                    }`}
                  >
                    {type === 'income' ? '+ ' : type === 'expense' ? '− ' : ''}Rp {formatRupiah(parsedAmount)}
                  </span>
                </div>
                <span className="font-mono text-[13px] text-[#E0E0E0] mt-1 font-bold text-center uppercase">
                  {title} {note ? `• ${note}` : ''}
                </span>
              </div>

              {/* Metadata rows */}
              <div className="flex flex-col gap-y-3 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-[#202020]">
                  <div className="flex items-center gap-2 text-[#888888]">
                    <span className="material-symbols-outlined text-[18px]">category</span>
                    <span className="font-body-md text-[13px]">Kategori</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#24120C] text-[#FF3E00] px-3 py-1 rounded border border-[#FF3E00]/40">
                    <span className="material-symbols-outlined text-[15px]">
                      {CATEGORY_OPTIONS.find((c) => c.name.toLowerCase() === category.toLowerCase())?.icon || 'label'}
                    </span>
                    <span className="font-mono text-[11px] font-bold uppercase">{category}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#202020]">
                  <div className="flex items-center gap-2 text-[#888888]">
                    <span className="material-symbols-outlined text-[18px]">wallet</span>
                    <span className="font-body-md text-[13px]">
                      {type === 'transfer' ? 'Dari Dompet' : 'Dompet / Rekening'}
                    </span>
                  </div>
                  <span className="font-mono text-[13px] font-bold text-white">{wallet}</span>
                </div>

                {type === 'transfer' && (
                  <div className="flex items-center justify-between py-1 border-b border-[#202020]">
                    <div className="flex items-center gap-2 text-[#888888]">
                      <span className="material-symbols-outlined text-[18px]">input</span>
                      <span className="font-body-md text-[13px]">Ke Dompet Tujuan</span>
                    </div>
                    <span className="font-mono text-[13px] font-bold text-white">{targetWallet}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-[#202020]">
                  <div className="flex items-center gap-2 text-[#888888]">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    <span className="font-body-md text-[13px]">Tanggal & Waktu</span>
                  </div>
                  <span className="font-mono text-[13px] text-white">
                    {date} • {time}
                  </span>
                </div>

                {/* Excerpt if notification exists */}
                {notificationText && (
                  <div className="flex flex-col gap-1.5 bg-[#181818] p-3 rounded-xl mt-1 border border-[#262626]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider font-bold">
                        Audit Deteksi Notifikasi
                      </span>
                      <span className="material-symbols-outlined text-[15px] text-[#888888]">
                        android
                      </span>
                    </div>
                    <p className="font-mono text-[12px] text-[#DDDDDD] italic leading-relaxed">
                      {notificationText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons in View Mode */}
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full h-12 bg-[#FF3E00] hover:bg-[#ff551c] text-white font-mono text-[13px] font-bold uppercase tracking-wider rounded-xl shadow-[0_0_12px_rgba(255,62,0,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                <span>Edit Rincian</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-11 bg-[#1A1111] text-[#FF5555] hover:bg-[#251515] font-mono text-[12px] font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-[#FF5555]/30"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>Hapus</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full h-11 bg-[#141414] text-[#888888] font-mono text-[12px] font-bold uppercase tracking-wider rounded-xl hover:text-white hover:bg-[#1E1E1E] transition-colors flex items-center justify-center gap-1.5 border border-[#262626]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  <span>Tutup</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal / Dialog Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#141414] border border-[#2E2E2E] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-[#24120C] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00]">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="font-mono text-[16px] font-bold text-white uppercase tracking-tight">
                  Hapus Transaksi?
                </h3>
                <p className="font-sans text-[13px] text-[#888888] mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus permanen <strong>"{title}"</strong> (Rp{' '}
                  {formatRupiah(parsedAmount)}) dari buku kas Anda?
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1E1E1E] text-[#AAAAAA] hover:text-white font-mono text-[12px] font-bold uppercase tracking-wider border border-[#2E2E2E]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF3E00] text-white font-mono text-[12px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,62,0,0.4)]"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
