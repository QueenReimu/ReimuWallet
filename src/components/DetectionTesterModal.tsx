import React, { useState } from 'react';
import { Wallet, Transaction } from '../types';
import {
  parseFinancialNotification,
  ParsedNotificationResult,
  SAMPLE_NOTIFICATIONS,
  isNonTransactionNotification,
  SUPPORTED_APP_PACKAGES,
} from '../utils/notificationParser';
import { formatRupiah } from '../data/mockData';

interface DetectionTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onProcessNotification?: (
    rawText: string,
    matchedWalletId?: string,
    options?: { packageName?: string; title?: string; timestamp?: number }
  ) => { success: boolean; message: string; transaction?: Transaction };
  onSaveTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onConfirmPendingTransaction?: (id: string) => void;
  onRejectPendingTransaction?: (id: string) => void;
  pendingTransactions?: Transaction[];
  onNavigateToLedger?: () => void;
  onOpenPermissionSettings?: () => void;
}

export const DetectionTesterModal: React.FC<DetectionTesterModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onProcessNotification,
  onSaveTransaction,
  onConfirmPendingTransaction,
  onRejectPendingTransaction,
  onOpenPermissionSettings,
}) => {
  const [selectedSample, setSelectedSample] = useState(SAMPLE_NOTIFICATIONS[0]);
  const [inputText, setInputText] = useState(SAMPLE_NOTIFICATIONS[0].text);
  const [selectedPackage, setSelectedPackage] = useState<string>(SAMPLE_NOTIFICATIONS[0].packageName);
  const [activeTab, setActiveTab] = useState<'all' | 'ewallet' | 'bank' | 'negative'>('all');
  const [lastCreatedTx, setLastCreatedTx] = useState<Transaction | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const nonTxCheck = isNonTransactionNotification(inputText);
  const parsed: ParsedNotificationResult | null = parseFinancialNotification(inputText, wallets, {
    packageName: selectedPackage,
  });

  const handleSelectSample = (sample: typeof SAMPLE_NOTIFICATIONS[0]) => {
    setSelectedSample(sample);
    setInputText(sample.text);
    setSelectedPackage(sample.packageName);
    setStatusFeedback(null);
  };

  const filteredSamples = SAMPLE_NOTIFICATIONS.filter((s) => {
    if (activeTab === 'ewallet') return ['id.dana', 'com.gojek.app', 'ovo.id', 'com.shopee.id', 'com.telkom.mwallet'].includes(s.packageName) && s.expectedType !== 'rejected';
    if (activeTab === 'bank') return ['com.bca', 'id.co.mandiri.livin', 'id.co.bri.brimo'].includes(s.packageName) && s.expectedType !== 'rejected';
    if (activeTab === 'negative') return s.expectedType === 'rejected';
    return true;
  });

  const handleExecuteProcess = () => {
    // Check if non-transaction
    if (nonTxCheck.ignored) {
      setStatusFeedback({
        type: 'error',
        message: `Ditolak secara aman: ${nonTxCheck.reason}. Transaksi tidak dibuat.`,
      });
      return;
    }

    // Strict nominal requirement
    if (!parsed || parsed.amount <= 0) {
      setStatusFeedback({
        type: 'error',
        message: 'Nominal Rp atau IDR tidak ditemukan dengan jelas. Transaksi tidak dapat dibuat.',
      });
      return;
    }

    if (onProcessNotification) {
      const res = onProcessNotification(inputText, parsed.matchedWalletId, {
        packageName: selectedPackage,
        title: parsed.title,
      });
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
        note: `Hasil Pengujian Deteksi (${parsed.institution})`,
        rawNotification: parsed.rawText,
        source: 'notification',
        status: 'pending',
        packageName: selectedPackage,
      };

      onSaveTransaction(newTx);
      setStatusFeedback({
        type: 'info',
        message: `Transaksi Rp ${formatRupiah(parsed.amount)} (${parsed.type.toUpperCase()}) masuk sebagai PENDING. Silakan konfirmasi.`,
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
                LAB PENGUJIAN NOTIFIKASI
              </span>
            </div>
            <h3 className="font-mono text-[16px] font-black text-white">
              Android Notification Listener Tester
            </h3>
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
        <div className="overflow-y-auto pr-1 py-3 flex flex-col gap-3.5">
          {/* Live Android Permission Hint Banner */}
          <div className="p-2.5 rounded-xl bg-[#201515] border border-[#FF3E00]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#FF3E00] shrink-0">
                android
              </span>
              <span className="font-body-sm text-[11px] text-[#DDDDDD]">
                Tangkap notifikasi otomatis dari DANA, GoPay, OVO, ShopeePay, LinkAja & Bank di HP Anda.
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
                Cek Izin
              </button>
            )}
          </div>

          {/* Preset Tabs */}
          <div className="flex items-center gap-1 bg-[#161616] p-1 rounded-xl border border-[#262626]">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'ewallet', label: 'E-Wallet' },
              { id: 'bank', label: 'Bank' },
              { id: 'negative', label: 'Uji Tolak (OTP/Promo)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-1 px-2 rounded-lg font-mono text-[10px] font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#FF3E00] text-white'
                    : 'text-[#888888] hover:text-[#CCCCCC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Select Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider font-bold">
              Pilih Sampel Notifikasi ({filteredSamples.length}):
            </span>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {filteredSamples.map((sample) => {
                const isSelected = inputText === sample.text;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`p-2 rounded-lg text-left font-mono text-[10px] flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-[#24120C] border-[#FF3E00] text-[#FF3E00]'
                        : 'bg-[#161616] border-[#262626] text-[#CCCCCC] hover:border-[#3E3E3E]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          sample.expectedType === 'income'
                            ? 'bg-emerald-400'
                            : sample.expectedType === 'expense'
                            ? 'bg-[#FF3E00]'
                            : 'bg-amber-400'
                        }`}
                      ></span>
                      <div className="flex flex-col truncate">
                        <span className="font-bold truncate">{sample.institution}</span>
                        <span className="text-[9px] text-[#888888] truncate">
                          {sample.description}
                        </span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#1F1F1F] text-[9px] font-mono text-[#AAAAAA] shrink-0">
                      {sample.packageName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Package Selector */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider font-bold">
              Target Package Name:
            </span>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="bg-[#181818] border border-[#2E2E2E] focus:border-[#FF3E00] rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none"
            >
              <option value="">Otomatis dari Teks</option>
              {SUPPORTED_APP_PACKAGES.map((pkg) => (
                <option key={pkg.id} value={pkg.packageName}>
                  {pkg.name} ({pkg.packageName})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Notification Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider font-bold">
                Teks Notifikasi Asli:
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
              placeholder="Tempel pesan notifikasi bank atau e-wallet di sini..."
              rows={3}
              className="w-full bg-[#181818] border border-[#2E2E2E] focus:border-[#FF3E00] rounded-xl p-3 text-white font-mono text-[12px] placeholder-[#555555] focus:outline-none transition-colors resize-none"
            ></textarea>
          </div>

          {/* Diagnostic Result Box */}
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#282828] flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#222222]">
              <span className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-[#888888] font-extrabold">
                HASIL ANALISIS MESIN DETEKSI
              </span>
              {nonTxCheck.ignored ? (
                <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  DITOLAK (BUKAN TRANSAKSI)
                </span>
              ) : (
                <span
                  className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded ${
                    parsed && parsed.confidence === 'high'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : parsed && parsed.amount > 0
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {parsed && parsed.amount > 0 ? 'VALID TRANSAKSI' : 'TIDAK VALID'}
                </span>
              )}
            </div>

            {nonTxCheck.ignored ? (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 font-mono text-[11px] text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">block</span>
                <span>Alasan Penolakan: {nonTxCheck.reason}</span>
              </div>
            ) : parsed ? (
              <>
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
                          : 'text-amber-400'
                      }`}
                    >
                      {parsed.type}
                    </span>
                  </div>
                  <div className="flex flex-col bg-[#1A1A1A] p-2 rounded-lg border border-[#262626]">
                    <span className="text-[#888888] text-[9px] uppercase">Instansi / App</span>
                    <span className="text-white font-bold truncate">{parsed.institution}</span>
                  </div>
                  <div className="flex flex-col bg-[#1A1A1A] p-2 rounded-lg border border-[#262626]">
                    <span className="text-[#888888] text-[9px] uppercase">Kategori Otomatis</span>
                    <span className="text-white font-bold truncate">{parsed.category}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[10px] text-[#888888]">
                    Dompet Pencocokan:{' '}
                    <strong className="text-white font-bold">
                      {wallets.find((w) => w.id === parsed.matchedWalletId)?.name ||
                        parsed.walletName}
                    </strong>
                  </span>
                  <span className="font-mono text-[9px] text-[#666666]">
                    Package: {parsed.packageName || 'Auto-detect'}
                  </span>
                </div>
              </>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#1F1F1F] font-mono text-[11px] text-[#888888] text-center">
                Belum ada transaksi yang terbaca. Pastikan teks mengandung nominal dengan awalan Rp atau IDR.
              </div>
            )}
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
                  KONFIRMASI HASIL DETEKSI (PENDING)
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">
                  Pending
                </span>
              </div>

              <div className="flex items-center justify-between text-[12px] font-mono">
                <span className="text-white font-bold">{lastCreatedTx.title}</span>
                <span className="text-[#FF5E36] font-bold">
                  Rp {formatRupiah(lastCreatedTx.amount)} ({lastCreatedTx.type.toUpperCase()})
                </span>
              </div>

              <p className="font-body-sm text-[11px] text-[#94A3B8]">
                Hanya transaksi yang di-Confirm yang masuk Wallet dan memengaruhi saldo.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onRejectPendingTransaction) {
                      onRejectPendingTransaction(lastCreatedTx.id);
                      setLastCreatedTx({ ...lastCreatedTx, status: 'rejected' });
                      setStatusFeedback({
                        type: 'info',
                        message:
                          'Transaksi ditolak (status: rejected). Saldo dan dompet tidak berubah.',
                      });
                    }
                  }}
                  className="flex-1 h-9 rounded-lg bg-[#151921] hover:bg-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-[#28303F] flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  <span>Reject (Tolak)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirmPendingTransaction) {
                      onConfirmPendingTransaction(lastCreatedTx.id);
                      setLastCreatedTx({ ...lastCreatedTx, status: 'confirmed' });
                      setStatusFeedback({
                        type: 'success',
                        message:
                          'Transaksi dikonfirmasi (status: confirmed)! Saldo dompet telah diperbarui.',
                      });
                    }
                  }}
                  className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  <span>Confirm (Setujui)</span>
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
            disabled={!parsed || parsed.amount <= 0 || nonTxCheck.ignored}
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
