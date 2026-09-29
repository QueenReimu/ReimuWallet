import React, { useState } from 'react';
import { Transaction, Wallet, SavingsGoal, UserProfile } from '../types';
import { formatRupiah } from '../data/mockData';
import {
  generateLedgerCsv,
  generatePrintableReportHtml,
  openPrintableReport,
  exportFileToDevice,
} from '../utils/exportUtils';
import { generateBackupJson, shareOrSaveBackupFile } from '../utils/backupUtils';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  wallets: Wallet[];
  savingsGoals?: SavingsGoal[];
  userProfile?: UserProfile;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  wallets,
  savingsGoals = [],
  userProfile,
}) => {
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const dateStr = new Date().toISOString().slice(0, 10);
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    setStatusMessage(null);
    try {
      const csv = generateLedgerCsv(transactions, wallets);
      const filename = `ReimuWallet_Laporan_${dateStr}.csv`;
      const res = await exportFileToDevice(
        csv,
        filename,
        'text/csv',
        'Ekspor Laporan CSV Reimu Wallet'
      );
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text:
            res.method === 'share'
              ? 'Pilihan simpan / kirim berkas CSV telah dibuka!'
              : 'Berkas CSV berhasil diunduh ke perangkat Anda!',
        });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Gagal mengekspor CSV.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Terjadi kesalahan ekspor CSV.' });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdfPrint = () => {
    setStatusMessage(null);
    try {
      const html = generatePrintableReportHtml({
        transactions,
        wallets,
        savingsGoals,
        userProfile,
        periodName: 'September 2026',
      });
      openPrintableReport(html);
      setStatusMessage({
        type: 'success',
        text: 'Jendela pratinjau cetak & simpan PDF telah dibuka!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal membuka pratinjau cetak PDF di perangkat.',
      });
    }
  };

  const handleExportJson = async () => {
    setIsExportingJson(true);
    setStatusMessage(null);
    try {
      const json = generateBackupJson({
        wallets,
        transactions,
        savingsGoals,
        userProfile,
      });
      const filename = `ReimuWallet_Laporan_${dateStr}.json`;
      const res = await shareOrSaveBackupFile(json, filename);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text:
            res.method === 'share'
              ? 'Pilihan simpan / kirim berkas JSON telah dibuka!'
              : 'Berkas JSON berhasil diunduh ke perangkat Anda!',
        });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Gagal mengekspor JSON.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Terjadi kesalahan ekspor JSON.' });
    } finally {
      setIsExportingJson(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12141A] border border-[#28303F] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#242C3D] bg-[#161B24]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2A1711] border border-[#FF5E36]/30 flex items-center justify-center text-[#FF5E36]">
              <span className="material-symbols-outlined text-[18px]">file_download</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[13px] font-bold text-white uppercase tracking-tight">
                Ekspor Laporan Keuangan
              </span>
              <span className="font-mono text-[10px] text-[#94A3B8]">
                {transactions.length} Transaksi Terhitung
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#1E2533] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3.5">
          {/* Summary Mini Card */}
          <div className="p-3 rounded-xl bg-[#181E29] border border-[#28303F] flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase text-[#94A3B8] font-bold">
                Pemasukan vs Pengeluaran
              </span>
              <span className="font-mono text-[12px] font-bold text-white mt-0.5">
                <span className="text-emerald-400">Rp {formatRupiah(totalIncome)}</span>
                <span className="text-[#64748B] mx-1.5">/</span>
                <span className="text-[#FF5E36]">Rp {formatRupiah(totalExpense)}</span>
              </span>
            </div>
            <span className="font-mono text-[10px] text-white px-2 py-0.5 rounded bg-[#242C3D] border border-[#333C4E]">
              {wallets.length} Dompet
            </span>
          </div>

          {statusMessage && (
            <div
              className={`p-2.5 rounded-xl font-mono text-[11px] flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/15 border border-red-500/30 text-red-400'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {statusMessage.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span className="flex-1 leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* Export Options Grid */}
          <div className="flex flex-col gap-2">
            {/* Option 1: PDF / Print View */}
            <button
              type="button"
              onClick={handleExportPdfPrint}
              className="p-3 rounded-xl bg-[#181E29] hover:bg-[#202735] border border-[#28303F] hover:border-[#FF5E36]/50 flex items-center justify-between text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2A1711] border border-[#FF5E36]/30 text-[#FF5E36] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[12px] font-bold text-white group-hover:text-[#FF5E36] transition-colors">
                    Format Dokumen PDF / Cetak
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    Laporan rapi lengkap dengan statistik &amp; tabel kas
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#64748B] text-[18px]">chevron_right</span>
            </button>

            {/* Option 2: CSV Excel */}
            <button
              type="button"
              disabled={isExportingCsv}
              onClick={handleExportCsv}
              className="p-3 rounded-xl bg-[#181E29] hover:bg-[#202735] border border-[#28303F] hover:border-emerald-500/50 flex items-center justify-between text-left transition-all active:scale-[0.98] group disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">table_view</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[12px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Format Spreadsheet (CSV)
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    Dapat dibuka di Microsoft Excel, Google Spreadsheet
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#64748B] text-[18px]">chevron_right</span>
            </button>

            {/* Option 3: Full JSON Data */}
            <button
              type="button"
              disabled={isExportingJson}
              onClick={handleExportJson}
              className="p-3 rounded-xl bg-[#181E29] hover:bg-[#202735] border border-[#28303F] hover:border-cyan-500/50 flex items-center justify-between text-left transition-all active:scale-[0.98] group disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">data_object</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[12px] font-bold text-white group-hover:text-cyan-400 transition-colors">
                    Format Data JSON (Cadangan)
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    Dapat dipulihkan kapan saja ke aplikasi Reimu
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#64748B] text-[18px]">chevron_right</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#242C3D] text-center">
            <span className="font-mono text-[10px] text-[#64748B]">
              Di Android, Anda bisa langsung menyimpan ke File HP atau Google Drive.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
