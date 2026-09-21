import React, { useState } from 'react';
import { Wallet, Transaction } from '../types';
import { parseFinancialNotification, ParsedNotificationResult } from '../utils/notificationParser';
import { formatRupiah } from '../data/mockData';

interface DetectionTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onProcessNotification?: (rawText: string, matchedWalletId?: string) => { success: boolean; message: string; transaction?: Transaction };
  onSaveTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onConfirmPendingTransaction?: (id: string) => void;
  onRejectPendingTransaction?: (id: string) => void;
  pendingTransactions?: Transaction[];
  onNavigateToLedger?: () => void;
  onOpenPermissionSettings?: () => void;
}

const TEST_NOTIFICATION_CATALOG = [
  {
    institution: 'DANA (Rp 28.000)',
    icon: 'restaurant',
    sample: 'DANA: Pembayaran sebesar Rp 28.000 ke Kopi Kenangan telah berhasil.',
  },
  {
    institution: 'GoPay (Rp28.000)',
    icon: 'commute',
    sample: 'GoPay: Pembayaran sebesar Rp28.000 ke Kopi Kenangan sukses.',
  },
  {
    institution: 'BCA (Rp1.500.000)',
    icon: 'account_balance',
    sample: 'BCA: M-Transfer Masuk sebesar Rp1.500.000 dari PT SOLUSI TEKNOLOGI.',
  },
  {
    institution: 'Mandiri (IDR 28.000)',
    icon: 'receipt_long',
    sample: 'Livin by Mandiri: Transaksi Debit IDR 28.000 di HokBen berhasil.',
  },
  {
    institution: 'SMS Non-Nominal (Negatif)',
    icon: 'block',
    sample: 'SMS Bank: Kode OTP 492019 berlaku s/d 2026-09-02 jam 14:20 ke Rekening 0148927492 Ref 9823491 Telp 08123456789.',
  },
  {
    institution: 'BRImo (Transfer Keluar)',
    icon: 'sync_alt',
    sample: 'BRImo: Transfer keluar sebesar Rp 150.000 ke Rekening BCA telah diproses.',
  },
];

export const DetectionTesterModal: React.FC<DetectionTesterModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onProcessNotification,
  onSaveTransaction,
  onConfirmPendingTransaction,
  onRejectPendingTransaction,
  pendingTransactions = [],
  onNavigateToLedger,
  onOpenPermissionSettings,
}) => {
  const [inputText, setInputText] = useState(TEST_NOTIFICATION_CATALOG[0].sample);
  const [lastCreatedTx, setLastCreatedTx] = useState<Transaction | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  if (!isOpen) return null;

  const parsed: ParsedNotificationResult = parseFinancialNotification(inputText, wallets);

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    setStatusFeedback(null);
  };

  const handleExecuteProcess = () => {
    // 1. Strict nominal requirement (Rule 2 & 5)
    if (!parsed || parsed.amount <= 0) {
      setStatusFeedback({
        type: 'error',
        message: 'Nominal Rp atau IDR tidak ditemukan dengan jelas. Transaksi tidak dapat dibuat.',
      });
      return;
    }

    if (onProcessNotification) {
      const res = onProcessNotification(inputText, parsed.matchedWalletId);
      if (!res.success) {
        setStatusFeedback({
          type: 'error',
          message: res.message,
        });
        return;
      }

      setLastCreatedTx(res.transaction || null);
      setStatusFeedback({
        type: 'info',
        message: res.message,
      });
    } else if (onSaveTransaction) {
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
        source: 'notification',
        status: 'pending',
      };

      onSaveTransaction(newTx);
      setStatusFeedback({
        type: 'info',
        message: `Transaksi Rp ${formatRupiah(parsed.amount)} masuk sebagai PENDING. Silakan konfirmasi.`,
      });
    }
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
          {/* Live Android Permission Hint Banner */}
          <div className="p-2.5 rounded-xl bg-[#201515] border border-[#FF3E00]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#FF3E00] shrink-0">android</span>
              <span className="font-body-sm text-[11px] text-[#DDDDDD]">
                Ingin deteksi langsung dari aplikasi DANA di HP? Pastikan izin notifikasi Android di-allow.
              </span>
            </div>
            {onOpenPermissionSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPermissionSettings();
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FF3E00] hover:bg-[#ff5722] text-white font-mono text-[10px] font-bold uppercase tracking-wider shrink-0"
              >
                Cek Izin HP
              </button>
            )}
          </div>

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

          {/* Status Feedback Banner */}
          {statusFeedback && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 font-mono text-[11px] animate-fade-in ${
                statusFeedback.type === 'error'
                  ? 'bg-red-500/10 border-red-500/40 text-red-400'
                  : statusFeedback.type === 'info'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                {statusFeedback.type === 'error'
                  ? 'error'
                  : statusFeedback.type === 'info'
                  ? 'info'
                  : 'verified'}
              </span>
              <div className="flex-1">
                <span>{statusFeedback.message}</span>
              </div>
            </div>
          )}

          {/* Pending Confirmation Box if there is a pending transaction */}
          {lastCreatedTx && lastCreatedTx.status === 'pending' && (
            <div className="p-3.5 rounded-xl bg-[#1F1916] border border-[#FF5E36]/50 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[9px] text-[#FF5E36] font-bold uppercase tracking-wider">
                  KONFIRMASI HASIL DETEKSI (LANGKAH 2)
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">
                  Pending
                </span>
              </div>

              <div className="flex items-center justify-between text-[12px] font-mono">
                <span className="text-white font-bold">{lastCreatedTx.title}</span>
                <span className="text-[#FF5E36] font-bold">
                  Rp {formatRupiah(lastCreatedTx.amount)}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onRejectPendingTransaction) {
                      onRejectPendingTransaction(lastCreatedTx.id);
                      setLastCreatedTx({ ...lastCreatedTx, status: 'rejected' });
                      setStatusFeedback({
                        type: 'info',
                        message: 'Transaksi ditolak (status: rejected). Saldo dan History tidak berubah.',
                      });
                    }
                  }}
                  className="flex-1 h-9 rounded-lg bg-[#151921] hover:bg-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-[#28303F] flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  <span>Tidak (Tolak)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirmPendingTransaction) {
                      onConfirmPendingTransaction(lastCreatedTx.id);
                      setLastCreatedTx({ ...lastCreatedTx, status: 'confirmed' });
                      setStatusFeedback({
                        type: 'success',
                        message: 'Transaksi dikonfirmasi (status: confirmed)! Masuk ke History dan saldo dompet telah diperbarui.',
                      });
                    }
                  }}
                  className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  <span>Benar (Konfirmasi)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Execution CTA Button */}
        <div className="pt-3 border-t border-[#222222] flex items-center gap-2">
          <button
            type="button"
            onClick={handleExecuteProcess}
            disabled={parsed.amount <= 0}
            className="flex-1 h-11 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] disabled:bg-[#222222] text-white disabled:text-[#666666] font-mono text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,62,0,0.3)] active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">sensors</span>
            <span>Simulasikan Notifikasi (Pending)</span>
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
