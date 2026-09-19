import React, { useState } from 'react';
import { Wallet, Transaction } from '../types';
import { parseFinancialNotification, ParsedNotificationResult } from '../utils/notificationParser';
import { formatRupiah } from '../data/mockData';

interface DetectionTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onSaveTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onNavigateToLedger?: () => void;
}

const TEST_NOTIFICATION_CATALOG = [
  {
    institution: 'BCA (Pemasukan)',
    icon: 'account_balance',
    sample: 'BCA: M-Transfer Berhasil ke Rekening 8921 Sebesar Rp 250.000 dari PT KLIEN FREELANCE.',
  },
  {
    institution: 'DANA (Makanan)',
    icon: 'restaurant',
    sample: 'DANA: Pembayaran sebesar Rp 25.000 ke Kopi Kenangan telah berhasil.',
  },
  {
    institution: 'GoPay (Transport)',
    icon: 'commute',
    sample: 'GoPay: Pembayaran sebesar Rp 18.000 ke GoJek Ojek Online Stasiun sukses.',
  },
  {
    institution: 'Mandiri Livin (Tagihan)',
    icon: 'receipt_long',
    sample: 'Livin by Mandiri: Pembayaran Tagihan Listrik PLN sebesar Rp 135.000 telah berhasil.',
  },
  {
    institution: 'ShopeePay (Belanja)',
    icon: 'shopping_bag',
    sample: 'ShopeePay: Pembayaran sebesar Rp 85.000 di Tokopedia / Shopee Store berhasil.',
  },
  {
    institution: 'BRImo (Transfer)',
    icon: 'sync_alt',
    sample: 'BRImo: Transfer keluar sebesar Rp 150.000 ke Rekening BCA telah diproses.',
  },
];

export const DetectionTesterModal: React.FC<DetectionTesterModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onSaveTransaction,
  onNavigateToLedger,
}) => {
  const [inputText, setInputText] = useState(TEST_NOTIFICATION_CATALOG[1].sample);
  const [lastSavedTx, setLastSavedTx] = useState<Transaction | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsed: ParsedNotificationResult = parseFinancialNotification(inputText, wallets);

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    setSaveToast(null);
  };

  const handleExecuteSave = () => {
    if (!parsed || parsed.amount <= 0) return;

    const matchedW = wallets.find((w) => w.id === parsed.matchedWalletId) || wallets[0];
    const walletName = matchedW ? matchedW.name : parsed.walletName || 'Kas / Tunai';

    const newTx: Omit<Transaction, 'id'> = {
      title: parsed.title,
      category: parsed.category,
      type: parsed.type,
      amount: parsed.amount,
      wallet: walletName,
      targetWallet: parsed.type === 'transfer' ? 'Brankas' : undefined,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      note: `Hasil Pengujian Deteksi Otomatis (${parsed.institution})`,
      rawNotification: parsed.rawText,
    };

    onSaveTransaction(newTx);
    setSaveToast(`Berhasil dicatat! Rp ${formatRupiah(parsed.amount)} masuk ke dompet ${walletName}`);

    setTimeout(() => {
      setSaveToast(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121212] border border-[#2A2A2A] shadow-2xl p-5 overflow-hidden font-sans max-h-[90vh] flex flex-col">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF3E00]"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF3E00]"></span>
              <span className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-[#888888] font-extrabold">
                LAB PENGUJIAN OTOMATIS
              </span>
            </div>
            <h3 className="font-mono text-[16px] font-black text-white">Uji Deteksi Notifikasi & SMS</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1A1A1A] hover:bg-[#262626] text-[#888888] hover:text-white flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 py-3 flex flex-col gap-4">
          {/* Quick Select Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider font-bold">
              Pilih Notifikasi Sampel Bank / E-Wallet:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {TEST_NOTIFICATION_CATALOG.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(cat.sample)}
                  className={`px-2.5 py-1.5 rounded-lg text-left font-mono text-[10px] flex items-center gap-2 border transition-all ${
                    inputText === cat.sample
                      ? 'bg-[#24120C] border-[#FF3E00] text-[#FF3E00] font-bold'
                      : 'bg-[#161616] border-[#262626] text-[#CCCCCC] hover:border-[#3E3E3E]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.institution}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Notification Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider font-bold">
                Teks Notifikasi / SMS Asli:
              </span>
              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-[10px] font-mono text-[#888888] hover:text-white uppercase"
              >
                Bersihkan
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik atau tempel pesan notifikasi bank/e-wallet di sini..."
              rows={3}
              className="w-full bg-[#181818] border border-[#2E2E2E] focus:border-[#FF3E00] rounded-xl p-3 text-white font-mono text-[12px] placeholder-[#555555] focus:outline-none transition-colors resize-none"
            ></textarea>
          </div>

          {/* Live Parser Inspection Box */}
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#282828] flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#222222]">
              <span className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-[#888888] font-extrabold">
                HASIL ANALISIS MESIN DETEKSI
              </span>
              <span
                className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded ${
                  parsed.confidence === 'high'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : parsed.amount > 0
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {parsed.confidence === 'high'
                  ? 'AKURASI TINGGI'
                  : parsed.amount > 0
                  ? 'AKURASI SEDANG'
                  : 'BELUM TERDETEKSI'}
              </span>
            </div>

            {/* Diagnostic Row Attributes */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex flex-col bg-[#1A1A1A] p-2 rounded-lg border border-[#262626]">
                <span className="text-[#888888] text-[9px] uppercase">Nominal Terbaca</span>
                <span className="text-white font-bold text-[14px]">
                  Rp {formatRupiah(parsed.amount)}
                </span>
              </div>
              <div className="flex flex-col bg-[#1A1A1A] p-2 rounded-lg border border-[#262626]">
                <span className="text-[#888888] text-[9px] uppercase">Tipe Transaksi</span>
                <span
                  className={`font-bold uppercase ${
                    parsed.type === 'income'
                      ? 'text-emerald-400'
                      : parsed.type === 'expense'
                      ? 'text-[#FF3E00]'
                      : 'text-white'
                  }`}
                >
                  {parsed.type}
                </span>
              </div>
              <div className="flex flex-col bg-[#1A1A1A] p-2 rounded-lg border border-[#262626]">
                <span className="text-[#888888] text-[9px] uppercase">Instansi / Bank</span>
                <span className="text-white font-bold">{parsed.institution}</span>
              </div>
              <div className="flex flex-col bg-[#1A1A1A] p-2 rounded-lg border border-[#262626]">
                <span className="text-[#888888] text-[9px] uppercase">Kategori Otomatis</span>
                <span className="text-white font-bold">{parsed.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[10px] text-[#888888]">
                Dompet Pencocokan:{' '}
                <strong className="text-white font-bold">
                  {wallets.find((w) => w.id === parsed.matchedWalletId)?.name || parsed.walletName}
                </strong>
              </span>
            </div>
          </div>

          {/* Success Toast Banner */}
          {saveToast && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-between font-mono text-[11px] animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>{saveToast}</span>
              </div>
              {onNavigateToLedger && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToLedger();
                  }}
                  className="px-2 py-1 bg-emerald-500 text-black font-black text-[10px] rounded uppercase hover:bg-emerald-400 transition-colors"
                >
                  Buka Kas
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Execution CTA Button */}
        <div className="pt-3 border-t border-[#222222] flex items-center gap-2">
          <button
            type="button"
            onClick={handleExecuteSave}
            disabled={parsed.amount <= 0}
            className="flex-1 h-11 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] disabled:bg-[#222222] text-white disabled:text-[#666666] font-mono text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,62,0,0.3)] active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Uji &amp; Simpan ke Buku Kas</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-11 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] text-[#AAAAAA] hover:text-white font-mono text-[11px] font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
