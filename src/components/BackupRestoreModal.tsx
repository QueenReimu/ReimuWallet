import React, { useState, useRef } from 'react';
import { Transaction, Wallet, SavingsGoal, UserProfile } from '../types';
import { formatRupiah } from '../data/mockData';
import {
  generateBackupJson,
  downloadBackupFile,
  validateBackupJson,
  BackupDataPayload,
} from '../utils/backupUtils';

export interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets?: Wallet[];
  transactions?: Transaction[];
  savingsGoals?: SavingsGoal[];
  userProfile?: UserProfile;
  theme?: 'dark' | 'light';
  currentData?: {
    wallets?: Wallet[];
    transactions?: Transaction[];
    savingsGoals?: SavingsGoal[];
    userProfile?: UserProfile;
    theme?: 'dark' | 'light';
  };
  onRestoreSuccess?: (payload: BackupDataPayload) => void;
  onRestoreConfirmed?: (payload: BackupDataPayload) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  wallets: directWallets,
  transactions: directTransactions,
  savingsGoals: directGoals,
  userProfile: directProfile,
  theme: directTheme,
  currentData,
  onRestoreSuccess,
  onRestoreConfirmed,
}) => {
  const wallets = directWallets || currentData?.wallets || [];
  const transactions = directTransactions || currentData?.transactions || [];
  const savingsGoals = directGoals || currentData?.savingsGoals || [];
  const userProfile = directProfile || currentData?.userProfile;
  const theme = directTheme || currentData?.theme || 'dark';

  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [restoreSuccessToast, setRestoreSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore input method
  const [restoreInputMethod, setRestoreInputMethod] = useState<'file' | 'paste'>('file');
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Preview of parsed backup
  const [previewPayload, setPreviewPayload] = useState<BackupDataPayload | null>(null);
  const [previewStats, setPreviewStats] = useState<{
    walletCount: number;
    transactionCount: number;
    goalCount: number;
    totalBalance?: number;
    userName?: string;
  } | null>(null);

  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Total balance of current state
  const currentTotalBalance = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);

  const handleDownloadBackup = () => {
    const jsonStr = generateBackupJson({
      wallets,
      transactions,
      savingsGoals,
      userProfile,
      theme,
    });
    downloadBackupFile(jsonStr);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyJson = async () => {
    try {
      const jsonStr = generateBackupJson({
        wallets,
        transactions,
        savingsGoals,
        userProfile,
        theme,
      });
      await navigator.clipboard.writeText(jsonStr);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (e) {
      setErrorMessage('Gagal menyalin teks ke clipboard. Silakan gunakan tombol Unduh.');
    }
  };

  const processJsonString = (content: string) => {
    setErrorMessage(null);
    const res = validateBackupJson(content);
    if (!res.valid || !res.payload) {
      setErrorMessage(res.error || 'Format berkas cadangan tidak valid.');
      setPreviewPayload(null);
      setPreviewStats(null);
    } else {
      setPreviewPayload(res.payload);
      setPreviewStats(res.stats || null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processJsonString(content);
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca berkas dari perangkat.');
    };
    reader.readAsText(file);
    // Reset file input value so the same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processJsonString(content);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmRestore = () => {
    if (!previewPayload) return;

    if (onRestoreSuccess) {
      onRestoreSuccess(previewPayload);
    }
    if (onRestoreConfirmed) {
      onRestoreConfirmed(previewPayload);
    }

    setRestoreSuccessToast('Data berhasil dipulihkan!');
    setTimeout(() => {
      setRestoreSuccessToast(null);
      onClose();
    }, 1200);
  };

  const currentBackupJson = generateBackupJson({
    wallets,
    transactions,
    savingsGoals,
    userProfile,
    theme,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#141414] border border-[#28303F] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#241712] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00] shadow-sm">
              <span className="material-symbols-outlined text-[20px]">backup</span>
            </div>
            <div>
              <h2 className="font-title-lg text-[15px] font-bold text-white leading-tight">
                Cadangan &amp; Pemulihan Data
              </h2>
              <p className="font-mono text-[10px] text-[#888888]">
                Bebas Kunci PIN • Format JSON Standar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#222222] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#242424] bg-[#121212] px-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('backup');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-2.5 px-2 font-mono text-[11px] sm:text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'text-[#FF3E00] border-[#FF3E00]'
                : 'text-[#888888] border-transparent hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Simpan Backup (Save)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('restore');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-2.5 px-2 font-mono text-[11px] sm:text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === 'restore'
                ? 'text-[#FF3E00] border-[#FF3E00]'
                : 'text-[#888888] border-transparent hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">file_upload</span>
            <span>Pulihkan Data (Restore)</span>
          </button>
        </div>

        {/* Success Banner */}
        {restoreSuccessToast && (
          <div className="m-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-mono text-[12px] font-bold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{restoreSuccessToast} Mengalihkan...</span>
          </div>
        )}

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {activeTab === 'backup' ? (
            <div className="space-y-4">
              {/* Summary of Current Data */}
              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#AAAAAA] uppercase font-bold">
                    Isi Data Cadangan Saat Ini:
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                    Total Saldo: {formatRupiah(currentTotalBalance)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-[#141414] border border-[#262626] text-center">
                    <span className="font-mono text-[16px] font-bold text-white block">
                      {wallets.length}
                    </span>
                    <span className="font-mono text-[10px] text-[#888888]">Dompet</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141414] border border-[#262626] text-center">
                    <span className="font-mono text-[16px] font-bold text-white block">
                      {transactions.length}
                    </span>
                    <span className="font-mono text-[10px] text-[#888888]">Transaksi</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141414] border border-[#262626] text-center">
                    <span className="font-mono text-[16px] font-bold text-white block">
                      {savingsGoals.length}
                    </span>
                    <span className="font-mono text-[10px] text-[#888888]">Target Celengan</span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0 mt-0.5">
                  description
                </span>
                <p className="font-body-sm text-[11px] text-[#CCCCCC] leading-relaxed">
                  Berkas disimpan dalam format <strong>JSON</strong> standar. Anda dapat menyimpan file ini di Google Drive, penyimpanan ponsel, atau membagikannya ke perangkat lain untuk memulihkan seluruh catatan keuangan Anda.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  id="modal-download-backup-btn"
                  onClick={handleDownloadBackup}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#FF3E00] hover:bg-[#FF551C] text-white font-mono text-[11px] sm:text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(255,62,0,0.35)] transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {downloadSuccess ? 'done' : 'download'}
                  </span>
                  <span>{downloadSuccess ? 'Berkas Diunduh!' : 'Unduh File JSON'}</span>
                </button>
                <button
                  type="button"
                  id="modal-copy-backup-btn"
                  onClick={handleCopyJson}
                  className="py-3 px-4 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-[#CCCCCC] hover:text-white border border-[#333333] font-mono text-[11px] sm:text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copySuccess ? 'check' : 'content_copy'}
                  </span>
                  <span>{copySuccess ? 'Tersalin!' : 'Salin Teks JSON'}</span>
                </button>
              </div>

              {/* Toggle Preview Raw JSON */}
              <div className="pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setShowJsonPreview((prev) => !prev)}
                  className="font-mono text-[10px] text-[#888888] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {showJsonPreview ? 'expand_less' : 'expand_more'}
                  </span>
                  <span>{showJsonPreview ? 'Sembunyikan Kode JSON' : 'Lihat Pratinjau Kode JSON'}</span>
                </button>

                {showJsonPreview && (
                  <div className="mt-2 p-2.5 rounded-lg bg-[#0D0D0D] border border-[#262626] font-mono text-[9px] text-[#A0A0A0] max-h-36 overflow-y-auto whitespace-pre no-scrollbar">
                    {currentBackupJson}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Input Method Switcher (File or Paste) */}
              <div className="flex items-center bg-[#181818] p-1 rounded-xl border border-[#262626]">
                <button
                  type="button"
                  onClick={() => {
                    setRestoreInputMethod('file');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    restoreInputMethod === 'file'
                      ? 'bg-[#262626] text-white shadow-sm'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">upload_file</span>
                  <span>Pilih Berkas .JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRestoreInputMethod('paste');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    restoreInputMethod === 'paste'
                      ? 'bg-[#262626] text-white shadow-sm'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">content_paste</span>
                  <span>Tempel Teks JSON</span>
                </button>
              </div>

              {/* Method A: File Upload / Drag and Drop */}
              {restoreInputMethod === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-[#FF3E00] bg-[#24120C]'
                        : 'border-[#333333] hover:border-[#FF3E00] bg-[#171717] hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#FF3E00]">
                      <span className="material-symbols-outlined text-[24px]">upload_file</span>
                    </div>
                    <span className="font-mono text-[12px] sm:text-[13px] font-bold text-white">
                      Pilih Berkas Cadangan (.JSON)
                    </span>
                    <span className="font-mono text-[10px] text-[#888888]">
                      Ketuk untuk memilih file dari HP / komputer atau seret file ke sini
                    </span>
                  </div>
                </div>
              )}

              {/* Method B: Paste JSON Text Directly */}
              {restoreInputMethod === 'paste' && (
                <div className="space-y-2">
                  <textarea
                    value={pastedJsonText}
                    onChange={(e) => setPastedJsonText(e.target.value)}
                    placeholder='Tempelkan isi berkas JSON cadangan di sini (contoh: {"wallets": [...], "transactions": [...]})'
                    rows={5}
                    className="w-full p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-[#E0E0E0] font-mono text-[11px] focus:outline-none focus:border-[#FF3E00] resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => processJsonString(pastedJsonText)}
                    disabled={!pastedJsonText.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] disabled:opacity-50 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border border-[#333333]"
                  >
                    <span className="material-symbols-outlined text-[16px]">search_check</span>
                    <span>Cek &amp; Muat Teks JSON</span>
                  </button>
                </div>
              )}

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#2D1616] border border-[#FF4D4D]/50 text-[#FF8888] font-mono text-[11px] flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Valid Backup Data Preview */}
              {previewStats && previewPayload && (
                <div className="p-3.5 rounded-xl bg-[#18201A] border border-[#2E5E3A] space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#4ADE80]">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span className="font-mono text-[12px] font-bold">Berkas Cadangan Valid!</span>
                    </div>
                    {previewStats.userName && (
                      <span className="font-mono text-[10px] text-[#A0D0B0]">
                        Pemilik: {previewStats.userName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-[#121613] text-center border border-[#1E3324]">
                      <span className="font-mono text-[15px] font-bold text-white block">
                        {previewStats.walletCount}
                      </span>
                      <span className="font-mono text-[9px] text-[#888888]">Dompet</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#121613] text-center border border-[#1E3324]">
                      <span className="font-mono text-[15px] font-bold text-[#4ADE80] block">
                        {previewStats.transactionCount}
                      </span>
                      <span className="font-mono text-[9px] text-[#888888]">Transaksi</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#121613] text-center border border-[#1E3324]">
                      <span className="font-mono text-[15px] font-bold text-white block">
                        {previewStats.goalCount}
                      </span>
                      <span className="font-mono text-[9px] text-[#888888]">Celengan</span>
                    </div>
                  </div>

                  {previewStats.totalBalance !== undefined && (
                    <div className="flex items-center justify-between px-1 text-[11px] font-mono text-[#CCCCCC]">
                      <span className="text-[#888888]">Total Saldo di Cadangan:</span>
                      <span className="font-bold text-emerald-400">
                        {formatRupiah(previewStats.totalBalance)}
                      </span>
                    </div>
                  )}

                  <p className="font-mono text-[10px] text-[#88AA99] pt-1 leading-relaxed">
                    Menekan tombol di bawah akan mengembalikan seluruh data dompet, transaksi, dan celengan Anda seperti saat cadangan dibuat.
                  </p>

                  <button
                    type="button"
                    id="confirm-restore-btn"
                    onClick={handleConfirmRestore}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] sm:text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(16,185,129,0.35)] transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">restore</span>
                    <span>Pulihkan Data Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
