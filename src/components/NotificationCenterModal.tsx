import React, { useState } from 'react';
import { Transaction, Wallet } from '../types';
import { formatRupiah } from '../data/mockData';
import { getTodayDateString, getCurrentTimeString } from '../utils/dateUtils';
import {
  parseFinancialNotification,
  SAMPLE_NOTIFICATIONS,
  ParsedNotificationResult,
} from '../utils/notificationParser';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onConfirmTransaction: (tx: Transaction) => void;
  onInspectTransaction: (tx: Transaction) => void;
  pendingNotifications: Transaction[];
  onDismissNotification: (id: string) => void;
  onSimulateNewNotification: (sampleText: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onConfirmTransaction,
  onInspectTransaction,
  pendingNotifications,
  onDismissNotification,
  onSimulateNewNotification,
}) => {
  const [inputText, setInputText] = useState(
    'DANA: Pembayaran sebesar Rp 25.000 ke Kopi Kenangan telah berhasil.'
  );
  const [parsedResult, setParsedResult] = useState<ParsedNotificationResult | null>(() =>
    parseFinancialNotification(
      'DANA: Pembayaran sebesar Rp 25.000 ke Kopi Kenangan telah berhasil.',
      wallets
    )
  );
  const [activeTab, setActiveTab] = useState<'pending' | 'tester'>('pending');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastAddedTitle, setLastAddedTitle] = useState('');

  if (!isOpen) return null;

  const handleParseInput = (text: string) => {
    setInputText(text);
    const res = parseFinancialNotification(text, wallets);
    setParsedResult(res);
  };

  const handleSelectSample = (sampleText: string) => {
    handleParseInput(sampleText);
  };

  const handleAcceptParsed = () => {
    if (!parsedResult || parsedResult.amount <= 0) return;

    const newTx: Transaction = {
      id: `tx-parsed-${Date.now()}`,
      title: parsedResult.title,
      amount: parsedResult.amount,
      type: parsedResult.type,
      category: parsedResult.category,
      wallet: parsedResult.walletName,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      note: parsedResult.note,
      rawNotification: parsedResult.rawText,
    };

    setLastAddedTitle(`${newTx.title} (Rp ${formatRupiah(newTx.amount)})`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2800);

    onConfirmTransaction(newTx);
  };

  const handleInspectParsed = () => {
    if (!parsedResult || parsedResult.amount <= 0) return;

    const newTx: Transaction = {
      id: `tx-parsed-${Date.now()}`,
      title: parsedResult.title,
      amount: parsedResult.amount,
      type: parsedResult.type,
      category: parsedResult.category,
      wallet: parsedResult.walletName,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      note: parsedResult.note,
      rawNotification: parsedResult.rawText,
    };

    onInspectTransaction(newTx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 font-sans">
      <div
        className="bg-[#151921] border border-[#28303F] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#28303F] bg-[#1C222D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2A1711] border border-[#FF5E36]/40 flex items-center justify-center text-[#FF5E36]">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[14px] font-bold text-[#F1F5F9] uppercase tracking-tight">
                Notification Auto-Parser
              </span>
              <span className="font-label-caps text-[9px] text-[#94A3B8] uppercase tracking-wider font-bold">
                Financial Push & SMS Detection Engine
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white bg-[#151921] hover:bg-[#28303F] border border-[#28303F] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-[#28303F] bg-[#151921] px-4 pt-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2.5 px-3 font-mono text-[12px] font-bold uppercase transition-all relative flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'text-[#FF5E36] border-b-2 border-[#FF5E36]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inbox</span>
            <span>Antrean Terdeteksi</span>
            {pendingNotifications.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF5E36] text-white text-[9px] font-bold">
                {pendingNotifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`pb-2.5 px-3 font-mono text-[12px] font-bold uppercase transition-all relative flex items-center gap-1.5 ${
              activeTab === 'tester'
                ? 'text-[#FF5E36] border-b-2 border-[#FF5E36]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            <span>Uji & Simulator Parser</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Success Toast */}
          {showSuccessToast && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
              <div className="flex flex-col">
                <span className="font-bold">Transaksi Berhasil Dicatat ke Buku Kas!</span>
                <span className="text-emerald-200/80 text-[10px]">{lastAddedTitle}</span>
              </div>
            </div>
          )}

          {/* TAB 1: PENDING DETECTED QUEUE */}
          {activeTab === 'pending' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#94A3B8] uppercase font-bold">
                  Antrean Notifikasi Tertangkap ({pendingNotifications.length})
                </span>
                <button
                  onClick={() => setActiveTab('tester')}
                  className="font-mono text-[10px] text-[#FF5E36] hover:underline uppercase flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">add_circle</span>
                  <span>Uji / Simulasi Notifikasi</span>
                </button>
              </div>

              {pendingNotifications.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#1C222D] border border-[#28303F] flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#151921] flex items-center justify-center text-[#94A3B8]">
                    <span className="material-symbols-outlined text-[22px]">mark_email_read</span>
                  </div>
                  <span className="font-mono text-[13px] text-[#F1F5F9] font-bold">Antrean Bersih</span>
                  <p className="font-body-sm text-[11px] text-[#94A3B8] max-w-xs">
                    Semua notifikasi pembayaran telah ditinjau dan dicocokkan. Anda dapat menguji simulasi notifikasi baru di bawah.
                  </p>
                  <button
                    onClick={() => {
                      const sample = SAMPLE_NOTIFICATIONS[0];
                      onSimulateNewNotification(sample.text);
                    }}
                    className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#FF5E36] text-white font-mono text-[11px] font-bold uppercase hover:bg-[#ff724f] active:scale-95 transition-all"
                  >
                    Simulasikan Notifikasi DANA
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {pendingNotifications.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-[#1C222D] border border-[#28303F] hover:border-[#FF5E36]/50 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-[#2A1711] border border-[#FF5E36]/40 flex items-center justify-center text-[#FF5E36] shrink-0">
                            <span className="material-symbols-outlined text-[18px]">
                              {tx.type === 'income' ? 'arrow_downward' : 'shopping_bag'}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#FF5E36]/20 text-[#FF5E36] font-bold uppercase tracking-wider">
                                {tx.wallet}
                              </span>
                              <span className="font-mono text-[10px] text-[#94A3B8] uppercase">
                                {tx.time} • Auto-Parsed
                              </span>
                            </div>
                            <span className="font-body-md text-[13px] font-bold text-[#F1F5F9] truncate">
                              {tx.title}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono text-[14px] font-bold ${
                              tx.type === 'income' ? 'text-emerald-400' : 'text-[#F1F5F9]'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}Rp {formatRupiah(tx.amount)}
                          </span>
                          <span className="font-mono text-[9px] text-[#94A3B8] uppercase">
                            {tx.category}
                          </span>
                        </div>
                      </div>

                      {/* Raw notification snippet */}
                      {tx.rawNotification && (
                        <div className="p-2 rounded-lg bg-[#151921] border border-[#28303F] font-mono text-[10px] text-[#94A3B8] italic leading-relaxed">
                          {tx.rawNotification}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => onDismissNotification(tx.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#151921] hover:bg-[#28303F] text-[#94A3B8] hover:text-white font-mono text-[10px] font-bold uppercase transition-colors border border-[#28303F]"
                        >
                          Abaikan
                        </button>
                        <button
                          onClick={() => onInspectTransaction(tx)}
                          className="px-3 py-1 rounded-lg bg-[#151921] hover:bg-[#28303F] text-white border border-[#28303F] font-mono text-[10px] font-bold uppercase transition-colors"
                        >
                          Periksa & Edit
                        </button>
                        <button
                          onClick={() => onConfirmTransaction(tx)}
                          className="px-3.5 py-1 rounded-lg bg-[#FF5E36] hover:bg-[#ff724f] text-white font-mono text-[10px] font-bold uppercase transition-all active:scale-95"
                        >
                          Terima & Catat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Simulator Bar */}
              <div className="pt-2 border-t border-[#28303F] flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase text-[#94A3B8] font-bold">
                  Pemicu Cepat Simulasi (Kirim Notifikasi Langsung):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SAMPLE_NOTIFICATIONS.slice(0, 4).map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => onSimulateNewNotification(sample.text)}
                      className="p-2 rounded-lg bg-[#1C222D] hover:bg-[#242B38] border border-[#28303F] text-left flex flex-col transition-colors group"
                    >
                      <span className="font-mono text-[9px] text-[#FF5E36] font-bold group-hover:underline">
                        + {sample.institution}
                      </span>
                      <span className="font-mono text-[10px] text-[#CBD5E1] truncate">
                        {sample.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARSER TESTER & SIMULATOR */}
          {activeTab === 'tester' && (
            <div className="flex flex-col gap-3">
              {/* Presets Grid */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold">
                  Pilih Preset Notifikasi Bank / E-Wallet:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_NOTIFICATIONS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample.text)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase border transition-all ${
                        inputText === sample.text
                          ? 'bg-[#FF5E36] text-white border-[#FF5E36]'
                          : 'bg-[#1C222D] text-[#94A3B8] border-[#28303F] hover:text-white'
                      }`}
                    >
                      {sample.institution} ({sample.description.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold">
                    Atau Ketik / Tempel SMS atau Notifikasi Push:
                  </label>
                  <button
                    onClick={() => handleParseInput('')}
                    className="font-mono text-[9px] text-[#94A3B8] hover:text-white uppercase"
                  >
                    Bersihkan
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={inputText}
                  onChange={(e) => handleParseInput(e.target.value)}
                  placeholder="Tempel teks notifikasi di sini (misal: BCA: Pembayaran QRIS Rp 25.000 ke Kopi Kenangan berhasil)..."
                  className="bg-[#1C222D] border border-[#28303F] focus:border-[#FF5E36] rounded-xl p-3 text-[#F1F5F9] font-mono text-[12px] focus:outline-none transition-colors"
                />
              </div>

              {/* Parsed Output Card */}
              {parsedResult && (
                <div className="p-3.5 rounded-xl bg-[#1C222D] border border-[#28303F] flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#28303F]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                      <span className="font-mono text-[12px] font-bold text-[#F1F5F9] uppercase">
                        Hasil Analisis Deteksi
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        parsedResult.confidence === 'high'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      Tingkat Keyakinan: {parsedResult.confidence === 'high' ? 'Tinggi' : 'Sedang'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
                    <div className="flex flex-col bg-[#151921] p-2.5 rounded-xl border border-[#28303F]">
                      <span className="text-[#94A3B8] uppercase text-[9px]">Merchant / Penerima</span>
                      <span className="text-[#F1F5F9] font-bold text-[13px]">{parsedResult.title}</span>
                    </div>

                    <div className="flex flex-col bg-[#151921] p-2.5 rounded-xl border border-[#28303F]">
                      <span className="text-[#94A3B8] uppercase text-[9px]">Nominal Transaksi</span>
                      <span
                        className={`font-bold text-[13px] ${
                          parsedResult.type === 'income' ? 'text-emerald-400' : 'text-[#FF5E36]'
                        }`}
                      >
                        {parsedResult.type === 'income' ? '+' : '-'}Rp {formatRupiah(parsedResult.amount)}
                      </span>
                    </div>

                    <div className="flex flex-col bg-[#151921] p-2.5 rounded-xl border border-[#28303F]">
                      <span className="text-[#94A3B8] uppercase text-[9px]">Dompet Cocok</span>
                      <span className="text-[#F1F5F9] font-bold">{parsedResult.walletName}</span>
                    </div>

                    <div className="flex flex-col bg-[#151921] p-2.5 rounded-xl border border-[#28303F]">
                      <span className="text-[#94A3B8] uppercase text-[9px]">Kategori & Jenis</span>
                      <span className="text-[#CBD5E1] font-bold uppercase">
                        {parsedResult.category} • {parsedResult.type}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onSimulateNewNotification(inputText)}
                      className="flex-1 py-2 rounded-xl bg-[#151921] hover:bg-[#28303F] text-[#CBD5E1] font-mono text-[11px] font-bold uppercase border border-[#28303F] transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      <span>Kirim ke Antrean</span>
                    </button>
                    <button
                      onClick={handleInspectParsed}
                      disabled={parsedResult.amount <= 0}
                      className="flex-1 py-2 rounded-xl bg-[#151921] hover:bg-[#28303F] text-[#F1F5F9] font-mono text-[11px] font-bold uppercase border border-[#28303F] transition-colors"
                    >
                      Periksa & Edit
                    </button>
                    <button
                      onClick={handleAcceptParsed}
                      disabled={parsedResult.amount <= 0}
                      className="flex-1 py-2 rounded-xl bg-[#FF5E36] hover:bg-[#ff724f] text-white font-mono text-[11px] font-bold uppercase transition-all active:scale-95 disabled:opacity-50"
                    >
                      Catat Langsung
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
