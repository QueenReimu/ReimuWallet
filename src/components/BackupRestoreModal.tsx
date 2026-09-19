import React, { useState, useRef } from 'react';
import { Transaction, Wallet, SavingsGoal, UserProfile } from '../types';
import {
  generateBackupJson,
  downloadBackupFile,
  validateBackupJson,
  BackupDataPayload,
} from '../utils/backupUtils';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  userProfile?: UserProfile;
  theme?: 'dark' | 'light';
  onRestoreSuccess: (payload: BackupDataPayload) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  wallets,
  transactions,
  savingsGoals,
  userProfile,
  theme = 'dark',
  onRestoreSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewPayload, setPreviewPayload] = useState<BackupDataPayload | null>(null);
  const [previewStats, setPreviewStats] = useState<{
    walletCount: number;
    transactionCount: number;
    goalCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const jsonStr = generateBackupJson(wallets, transactions, savingsGoals, userProfile, theme);
    downloadBackupFile(jsonStr);
  };

  const handleCopyJson = async () => {
    try {
      const jsonStr = generateBackupJson(wallets, transactions, savingsGoals, userProfile, theme);
      await navigator.clipboard.writeText(jsonStr);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (e) {
      setErrorMessage('Gagal menyalin teks ke clipboard.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
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
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!previewPayload) return;
    onRestoreSuccess(previewPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#241712] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00]">
              <span className="material-symbols-outlined text-[18px]">backup</span>
            </div>
            <div>
              <h2 className="font-title-lg text-[15px] font-bold text-white">Cadangan &amp; Pemulihan Data</h2>
              <p className="font-mono text-[10px] text-[#888888]">
                Bebas Kunci PIN • Aman &amp; Tersimpan Lokal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            className={`flex items-center gap-2 pb-2.5 px-3 font-mono text-[12px] font-bold border-b-2 transition-colors ${
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
            className={`flex items-center gap-2 pb-2.5 px-3 font-mono text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === 'restore'
                ? 'text-[#FF3E00] border-[#FF3E00]'
                : 'text-[#888888] border-transparent hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">file_upload</span>
            <span>Pulihkan Data (Restore)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {activeTab === 'backup' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
                <span className="font-mono text-[11px] text-[#AAAAAA] uppercase font-bold">
                  Data yang Akan Dicadangkan:
                </span>
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

              <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0 mt-0.5">
                  lock_open
                </span>
                <p className="font-body-sm text-[12px] text-[#CCCCCC] leading-relaxed">
                  Berkas cadangan disimpan dalam format <strong>JSON</strong> standar tanpa enkripsi rumit atau kunci PIN/biometrik, sehingga Anda dapat menyimpan dan memulihkannya kapan saja ke perangkat lain dengan mudah.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#FF3E00] hover:bg-[#FF551C] text-white font-mono text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(255,62,0,0.3)] transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Unduh File Cadangan</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="py-3 px-4 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-[#CCCCCC] hover:text-white border border-[#333333] font-mono text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copySuccess ? 'check' : 'content_copy'}
                  </span>
                  <span>{copySuccess ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#333333] hover:border-[#FF3E00] rounded-xl p-6 text-center cursor-pointer bg-[#171717] hover:bg-[#1A1A1A] transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#FF3E00]">
                  <span className="material-symbols-outlined text-[24px]">upload_file</span>
                </div>
                <span className="font-mono text-[13px] font-bold text-white">
                  Pilih Berkas Cadangan (.JSON)
                </span>
                <span className="font-mono text-[11px] text-[#888888]">
                  Klik untuk menelusuri file dari perangkat Anda
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#2D1616] border border-[#FF4D4D]/50 text-[#FF8888] font-mono text-[11px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {previewStats && (
                <div className="p-3.5 rounded-xl bg-[#18201A] border border-[#2E5E3A] space-y-2">
                  <div className="flex items-center gap-2 text-[#4ADE80]">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span className="font-mono text-[12px] font-bold">Berkas Cadangan Valid</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-[#121613] text-center border border-[#1E3324]">
                      <span className="font-mono text-[15px] font-bold text-white block">
                        {previewStats.walletCount}
                      </span>
                      <span className="font-mono text-[10px] text-[#888888]">Dompet</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#121613] text-center border border-[#1E3324]">
                      <span className="font-mono text-[15px] font-bold text-white block">
                        {previewStats.transactionCount}
                      </span>
                      <span className="font-mono text-[10px] text-[#888888]">Transaksi</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#121613] text-center border border-[#1E3324]">
                      <span className="font-mono text-[15px] font-bold text-white block">
                        {previewStats.goalCount}
                      </span>
                      <span className="font-mono text-[10px] text-[#888888]">Target Celengan</span>
                    </div>
                  </div>

                  <p className="font-mono text-[10px] text-[#88AA99] pt-1">
                    Memulihkan berkas ini akan memperbarui data brankas Anda sesuai data di dalam cadangan tanpa memerlukan PIN atau biometrik.
                  </p>
                </div>
              )}

              {previewPayload && (
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">restore</span>
                  <span>Pulihkan Data Sekarang</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
