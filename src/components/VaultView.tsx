import React, { useState, useRef } from 'react';
import { Wallet, SavingsGoal, Transaction, UserProfile } from '../types';
import { formatRupiah } from '../data/mockData';
import { DetectionTesterModal } from './DetectionTesterModal';
import { BackupRestoreModal } from './BackupRestoreModal';
import { ReimuLogo } from './ReimuLogo';
import {
  BackupDataPayload,
  generateBackupJson,
  downloadBackupFile,
  shareOrSaveBackupFile,
  validateBackupJson,
} from '../utils/backupUtils';
import {
  formatCurrencyInput,
  parseCurrencyInput,
  formatRupiahDisplay,
} from '../utils/currencyUtils';
import { DEFAULT_AUTO_APPROVE_WHITELIST } from '../utils/notificationParser';

interface VaultViewProps {
  wallets: Wallet[];
  savingsGoals: SavingsGoal[];
  transactions?: Transaction[];
  totalTransactionsCount?: number;
  userProfile?: UserProfile;
  onOpenEditProfile?: () => void;
  onAddWallet?: (wallet: Omit<Wallet, 'id'>) => void;
  onUpdateWallet?: (wallet: Wallet) => void;
  onDeleteWallet?: (walletId: string) => void;
  onAddGoal?: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoal?: (goal: SavingsGoal) => void;
  onDeleteGoal?: (goalId: string) => void;
  onSaveTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onResetToEmpty?: () => void;
  onRestoreBackup?: (payload: BackupDataPayload) => void;
  onNavigateToLedger?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isNotificationPermissionGranted?: boolean;
  onOpenAndroidPermissionModal?: () => void;
  onSimulateDanaTransaction?: (text: string) => void;
  onOpenNotificationCenter?: () => void;
  rejectedCount?: number;
  pendingCount?: number;
}

export const VaultView: React.FC<VaultViewProps> = ({
  wallets,
  savingsGoals,
  transactions = [],
  totalTransactionsCount = 0,
  userProfile,
  onOpenEditProfile,
  onAddWallet,
  onUpdateWallet,
  onDeleteWallet,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onSaveTransaction,
  onResetToEmpty,
  onRestoreBackup,
  onNavigateToLedger,
  theme = 'dark',
  onToggleTheme,
  isNotificationPermissionGranted = false,
  onOpenAndroidPermissionModal,
  onSimulateDanaTransaction,
  onOpenNotificationCenter,
  rejectedCount = 0,
  pendingCount = 0,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'wallets' | 'settings'>('wallets');
  const [isNotificationServiceActive, setIsNotificationServiceActive] = useState(true);

  // Auto-Approve Whitelist State
  const [isAutoApproveEnabled, setIsAutoApproveEnabled] = useState<boolean>(() => {
    return localStorage.getItem('reimu_auto_approve_enabled') === 'true';
  });
  const [autoApproveWhitelist, setAutoApproveWhitelist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('reimu_auto_approve_whitelist');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_AUTO_APPROVE_WHITELIST;
  });
  const [newKeywordInput, setNewKeywordInput] = useState('');

  const handleToggleAutoApprove = () => {
    const next = !isAutoApproveEnabled;
    setIsAutoApproveEnabled(next);
    localStorage.setItem('reimu_auto_approve_enabled', String(next));
  };

  const handleAddWhitelistKeyword = (keywordToAdd?: string) => {
    const kw = (keywordToAdd !== undefined ? keywordToAdd : newKeywordInput).trim();
    if (!kw) return;
    if (autoApproveWhitelist.some((k) => k.toLowerCase() === kw.toLowerCase())) {
      setNewKeywordInput('');
      return;
    }
    const updated = [...autoApproveWhitelist, kw];
    setAutoApproveWhitelist(updated);
    localStorage.setItem('reimu_auto_approve_whitelist', JSON.stringify(updated));
    setNewKeywordInput('');
  };

  const handleRemoveWhitelistKeyword = (kw: string) => {
    const updated = autoApproveWhitelist.filter((k) => k.toLowerCase() !== kw.toLowerCase());
    setAutoApproveWhitelist(updated);
    localStorage.setItem('reimu_auto_approve_whitelist', JSON.stringify(updated));
  };

  const handleResetWhitelist = () => {
    setAutoApproveWhitelist(DEFAULT_AUTO_APPROVE_WHITELIST);
    localStorage.setItem('reimu_auto_approve_whitelist', JSON.stringify(DEFAULT_AUTO_APPROVE_WHITELIST));
  };

  // Backup & Restore Modal State
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showDetectionTesterModal, setShowDetectionTesterModal] = useState(false);
  const [backupToastMessage, setBackupToastMessage] = useState<string | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateBackupJson(content);
      if (!res.valid || !res.payload) {
        setBackupToastMessage(res.error || 'Format berkas cadangan tidak valid.');
        setTimeout(() => setBackupToastMessage(null), 5000);
      } else {
        if (onRestoreBackup) {
          onRestoreBackup(res.payload);
        }
        setBackupToastMessage(
          `Data berhasil dipulihkan! ${res.payload.transactions.length} transaksi dan ${res.payload.wallets.length} dompet telah kembali.`
        );
        setTimeout(() => setBackupToastMessage(null), 5000);
      }
    };
    reader.onerror = () => {
      setBackupToastMessage('Gagal membaca berkas cadangan dari perangkat.');
      setTimeout(() => setBackupToastMessage(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add Wallet Modal
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'bank' | 'ewallet' | 'pocket' | 'vault'>('vault');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newWalletTargetMoney, setNewWalletTargetMoney] = useState('');
  const [newWalletIsLocked, setNewWalletIsLocked] = useState(true);

  // Edit / Delete Wallet Modal
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [editWalletType, setEditWalletType] = useState<'bank' | 'ewallet' | 'pocket' | 'vault'>('vault');
  const [editWalletBalance, setEditWalletBalance] = useState('');
  const [editWalletTargetMoney, setEditWalletTargetMoney] = useState('');
  const [editWalletIsLocked, setEditWalletIsLocked] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);

  // Add Goal Modal
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');

  // Edit / Delete Goal Modal
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalCurrent, setEditGoalCurrent] = useState('');
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  const totalLiquidity = wallets.reduce((acc, w) => acc + w.balance, 0);

  const emblemUrl =
    'https://lh3.googleusercontent.com/aida/AEtjO1XbzWML77efCsnozR-3ttiVE1qwoW5EvDoc4qoP7vuTYzPodvpPh5gVnHmlgz5YvNZVQxa2cvIUU-E-TvwnEHvgfhURARH3_mYSiKutg2bJSGjZJW3tTjIXPVJdUNI9cP1gsjdpcXd7ZtZ6rpzDh53NlNWXn5GVTHaYpiX8Z50uBkxudVPoKQHtIrZ8-moHOPKKbQkK2VPbN6a3ShP95rQ-1npOwgAPjiwrPB7YSiH5NK4cEbgOVw8bEsE';

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    const balanceNum = parseInt(newWalletBalance.replace(/\D/g, ''), 10) || 0;
    const targetMoneyNum = newWalletTargetMoney.trim()
      ? parseInt(newWalletTargetMoney.replace(/\D/g, ''), 10)
      : undefined;

    if (onAddWallet) {
      onAddWallet({
        name: newWalletName.trim(),
        type: newWalletType,
        balance: balanceNum,
        targetMoney: targetMoneyNum,
        isLocked: newWalletType === 'vault' ? newWalletIsLocked : false,
        icon:
          newWalletType === 'bank'
            ? 'account_balance'
            : newWalletType === 'pocket'
            ? 'payments'
            : newWalletType === 'vault'
            ? newWalletIsLocked ? 'lock' : 'lock_open'
            : 'account_balance_wallet',
        monthlyTransactionsCount: 0,
      });
    }
    setNewWalletName('');
    setNewWalletBalance('');
    setNewWalletTargetMoney('');
    setNewWalletIsLocked(false);
    setShowAddWalletModal(false);
  };

  const handleOpenEditWallet = (w: Wallet) => {
    setEditingWallet(w);
    setEditWalletName(w.name);
    setEditWalletType(w.type);
    setEditWalletBalance(w.balance ? formatCurrencyInput(w.balance) : '');
    setEditWalletTargetMoney(w.targetMoney ? formatCurrencyInput(w.targetMoney) : '');
    setEditWalletIsLocked(!!w.isLocked);
  };

  const handleSaveEditWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !editWalletName.trim()) return;
    const balanceNum = parseInt(editWalletBalance.replace(/\D/g, ''), 10) || 0;
    const targetMoneyNum = editWalletTargetMoney.trim()
      ? parseInt(editWalletTargetMoney.replace(/\D/g, ''), 10)
      : undefined;

    if (onUpdateWallet) {
      onUpdateWallet({
        ...editingWallet,
        name: editWalletName.trim(),
        type: editWalletType,
        balance: balanceNum,
        targetMoney: targetMoneyNum,
        isLocked: editWalletType === 'vault' ? editWalletIsLocked : false,
        icon:
          editWalletType === 'bank'
            ? 'account_balance'
            : editWalletType === 'pocket'
            ? 'payments'
            : editWalletType === 'vault'
            ? editWalletIsLocked ? 'lock' : 'lock_open'
            : 'account_balance_wallet',
      });
    }
    setEditingWallet(null);
  };

  const handleToggleVaultLock = (w: Wallet) => {
    if (w.type !== 'vault') return;
    const nextLocked = !w.isLocked;
    if (onUpdateWallet) {
      onUpdateWallet({
        ...w,
        isLocked: nextLocked,
        icon: nextLocked ? 'lock' : 'lock_open',
      });
    }
  };

  const handleConfirmDeleteWallet = () => {
    if (walletToDelete && onDeleteWallet) {
      onDeleteWallet(walletToDelete.id);
      setWalletToDelete(null);
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    const targetNum = parseInt(newGoalTarget.replace(/\D/g, ''), 10) || 1000000;
    const currentNum = parseInt(newGoalCurrent.replace(/\D/g, ''), 10) || 0;
    if (onAddGoal) {
      onAddGoal({
        title: newGoalTitle.trim(),
        targetAmount: targetNum,
        currentAmount: currentNum,
        targetDate: 'Dec 2026',
        monthsLeft: 4,
        monthlyPace: Math.round(Math.max(0, targetNum - currentNum) / 4),
        icon: 'savings',
        accentColor: '#FF3E00',
      });
    }
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
    setShowAddGoalModal(false);
  };

  const handleOpenEditGoal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setEditGoalTitle(g.title);
    setEditGoalTarget(g.targetAmount ? formatCurrencyInput(g.targetAmount) : '');
    setEditGoalCurrent(g.currentAmount ? formatCurrencyInput(g.currentAmount) : '');
  };

  const handleSaveEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editGoalTitle.trim()) return;
    const targetNum = parseInt(editGoalTarget.replace(/\D/g, ''), 10) || 1000000;
    const currentNum = parseInt(editGoalCurrent.replace(/\D/g, ''), 10) || 0;
    if (onUpdateGoal) {
      onUpdateGoal({
        ...editingGoal,
        title: editGoalTitle.trim(),
        targetAmount: targetNum,
        currentAmount: currentNum,
        monthlyPace: Math.round(Math.max(0, targetNum - currentNum) / Math.max(1, editingGoal.monthsLeft || 4)),
      });
    }
    setEditingGoal(null);
  };

  const handleConfirmDeleteGoal = () => {
    if (goalToDelete && onDeleteGoal) {
      onDeleteGoal(goalToDelete.id);
      setGoalToDelete(null);
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-12 max-w-md mx-auto font-sans">
      {/* Sub-Tabs Selector */}
      <div className="flex items-center bg-[#151921] p-1 rounded-xl border border-[#28303F]">
        <button
          onClick={() => setActiveSubTab('wallets')}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'wallets'
              ? 'bg-[#FF5E36] text-white'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          Dompet &amp; Tabungan
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'settings'
              ? 'bg-[#FF5E36] text-white'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          Pengaturan Brankas
        </button>
      </div>

      {activeSubTab === 'wallets' ? (
        <div className="flex flex-col gap-4">
          {/* Consolidated Liquidity Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1C222D] p-5 border border-[#28303F]">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#FF5E36]"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-[#94A3B8] font-bold">
                Total Likuiditas
              </span>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-[#151921] text-[#FF5E36] font-bold border border-[#FF5E36]/30 uppercase">
                {wallets.length} Sumber Aktif
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-1">
              <span className="font-mono text-[16px] text-[#94A3B8] font-medium">Rp</span>
              <span className="font-finance-metric-hero text-[#F1F5F9] font-black tracking-tight text-[36px]">
                {formatRupiah(totalLiquidity)}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-[#28303F] flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#94A3B8] uppercase">
                Terenkripsi aman di perangkat
              </span>
              <button
                onClick={() => setShowAddWalletModal(true)}
                className="font-mono text-[11px] text-[#FF5E36] font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tambah Sumber</span>
              </button>
            </div>
          </div>

          {/* Active Wallets & Accounts List */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[15px] font-bold text-[#F1F5F9] uppercase tracking-tight">
                Daftar Dompet &amp; Saldo Aktif
              </span>
              <button
                onClick={() => setShowAddWalletModal(true)}
                className="w-8 h-8 rounded-lg bg-[#FF5E36] text-white flex items-center justify-center hover:bg-[#ff724f] active:scale-95 transition-all"
                title="Tambah Dompet"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {wallets.map((wallet) => {
                const hasTarget = !!(wallet.targetMoney && wallet.targetMoney > 0);
                const targetPct = hasTarget
                  ? Math.min(100, Math.round((wallet.balance / (wallet.targetMoney || 1)) * 100))
                  : 0;
                const isVault = wallet.type === 'vault';

                return (
                  <div
                    key={wallet.id}
                    className={`bg-[#1C222D] p-4 rounded-xl border transition-all flex flex-col gap-3 group ${
                      isVault
                        ? 'border-[#28303F] hover:border-[#FF5E36]/60'
                        : 'border-[#28303F] hover:border-[#384357]'
                    }`}
                  >
                    {/* Top Row: Info, Balance, Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border ${
                            isVault
                              ? 'bg-[#2A1711] text-[#FF5E36] border-[#FF5E36]/40'
                              : 'bg-[#151921] text-[#FF5E36] border-[#28303F]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[22px]">{wallet.icon}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-body-md text-[14px] font-bold text-[#F1F5F9] truncate">
                              {wallet.name}
                            </span>
                            {isVault && (
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#2A1711] border border-[#FF5E36]/40 text-[#FF5E36] font-bold uppercase flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">
                                  {wallet.isLocked ? 'lock' : 'lock_open'}
                                </span>
                                <span>{wallet.isLocked ? 'Brankas Terkunci' : 'Brankas Terbuka'}</span>
                              </span>
                            )}
                            {wallet.isPrimary && (
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#151921] border border-[#28303F] text-[#CBD5E1] font-bold uppercase">
                                Utama
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-[#94A3B8] uppercase">
                            {wallet.type === 'ewallet'
                              ? 'Dompet Digital'
                              : wallet.type === 'bank'
                              ? 'Rekening Bank'
                              : wallet.type === 'vault'
                              ? 'Brankas Cadangan'
                              : 'Uang Tunai'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 pl-2">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[15px] font-bold text-[#F1F5F9]">
                            Rp {formatRupiah(wallet.balance)}
                          </span>
                          <span className="font-mono text-[10px] text-[#94A3B8] uppercase">Saldo Aktif</span>
                        </div>

                        {/* Edit, Lock, and Delete Actions */}
                        <div className="flex items-center gap-1">
                          {isVault && (
                            <button
                              onClick={() => handleToggleVaultLock(wallet)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                                wallet.isLocked
                                   ? 'bg-[#24120C] text-[#FF3E00] border-[#FF3E00]/40 hover:bg-[#2F160E]'
                                  : 'bg-[#1A1A1A] text-[#888888] border-[#2A2A2A] hover:text-white'
                              }`}
                              title={wallet.isLocked ? 'Buka Kunci Brankas' : 'Kunci Brankas'}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {wallet.isLocked ? 'lock' : 'lock_open'}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditWallet(wallet)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1A1A1A] hover:bg-[#252525] text-[#888888] hover:text-white border border-[#2A2A2A] transition-colors"
                            title={isVault ? 'Ubah Brankas' : 'Ubah Dompet'}
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => setWalletToDelete(wallet)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1A1A1A] hover:bg-[#2C1818] text-[#888888] hover:text-[#FF4D4D] border border-[#2A2A2A] hover:border-[#FF4D4D]/40 transition-colors"
                            title={isVault ? 'Hapus Brankas' : 'Hapus Dompet'}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Target Money Progress Bar (if targetMoney is set) */}
                    {hasTarget && (
                      <div className="pt-2 border-t border-[#1F1F1F] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[#FF3E00]">flag</span>
                            <span className="text-[#888888] uppercase">Target Dana:</span>
                            <span className="text-white font-bold">
                              Rp {formatRupiah(wallet.targetMoney!)}
                            </span>
                          </div>
                          <span className="text-[#FF3E00] font-bold uppercase">
                            {targetPct}% {targetPct >= 100 ? 'Tercapai!' : 'Terpenuhi'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#1C1C1C] rounded-full overflow-hidden border border-[#262626]">
                          <div
                            className="h-full rounded-full bg-[#FF3E00] shadow-[0_0_6px_#FF3E00] transition-all duration-500"
                            style={{ width: `${targetPct}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#777777]">
                          <span>Tersimpan: Rp {formatRupiah(wallet.balance)}</span>
                          <span>
                            {wallet.balance >= wallet.targetMoney!
                              ? 'Target Tercapai! 🎉'
                              : `Sisa Rp ${formatRupiah(wallet.targetMoney! - wallet.balance)} lagi`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {wallets.length === 0 && (
                <div className="p-8 text-center bg-[#121212] rounded-xl border border-[#262626] text-[#666666] font-mono text-[12px] uppercase">
                  Belum ada dompet terdaftar. Klik "Tambah Sumber" untuk menambahkan.
                </div>
              )}
            </div>
          </div>

          {/* Sanctuary Savings Goals / Jars */}
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF3E00] text-[20px]">savings</span>
                <span className="font-mono text-[15px] font-bold text-white uppercase tracking-tight">
                  Celengan &amp; Target Tabungan
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#888888] font-bold uppercase">
                {savingsGoals.length} Aktif
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {savingsGoals.map((goal) => {
                const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div
                    key={goal.id}
                    className="bg-[#121212] p-4 rounded-xl border border-[#262626] flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#333333] text-[#FF3E00] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">{goal.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-body-md text-[13px] font-bold text-white">{goal.title}</span>
                          <span className="font-mono text-[11px] text-[#888888] uppercase">
                            Target: Rp {formatRupiah(goal.targetAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[14px] font-bold text-white">
                            Rp {formatRupiah(goal.currentAmount)}
                          </span>
                          <span className="font-mono text-[10px] text-[#FF3E00] font-bold uppercase">
                            {pct}% Tercapai
                          </span>
                        </div>

                        {/* Edit & Delete Actions for Goal */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditGoal(goal)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1A1A1A] hover:bg-[#252525] text-[#888888] hover:text-white border border-[#2A2A2A] transition-colors"
                            title="Ubah Target"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button
                            onClick={() => setGoalToDelete(goal)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1A1A1A] hover:bg-[#2C1818] text-[#888888] hover:text-[#FF4D4D] border border-[#2A2A2A] hover:border-[#FF4D4D]/40 transition-colors"
                            title="Hapus Target"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-[#1C1C1C] rounded-full overflow-hidden border border-[#262626]">
                      <div
                        className="h-full rounded-full bg-[#FF3E00] shadow-[0_0_6px_#FF3E00] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {savingsGoals.length === 0 && (
                <div className="p-6 text-center bg-[#121212] rounded-xl border border-[#262626] text-[#666666] font-mono text-[12px] uppercase">
                  Belum ada target tabungan. Buat sekarang untuk memantau impian Anda.
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddGoalModal(true)}
              className="w-full h-11 rounded-xl bg-[#181818] hover:bg-[#202020] text-white font-mono text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border border-[#2E2E2E]"
            >
              <span className="material-symbols-outlined text-[18px] text-[#FF3E00]">add_circle</span>
              <span>Buat Celengan Tabungan Baru</span>
            </button>
          </div>
        </div>
      ) : (
        /* SETTINGS TAB */
        <div className="flex flex-col gap-4">
          {/* USER PROFILE CARD */}
          <div className="bg-[#1C222D] p-4 rounded-xl border border-[#28303F] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#151921] border-2 border-[#FF5E36]/60 flex items-center justify-center">
                  {userProfile?.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FF5E36] flex items-center justify-center text-white font-mono text-[22px] font-bold">
                      {(userProfile?.name || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-body-md text-[16px] font-bold text-[#F1F5F9]">
                    {userProfile?.name || 'Pengguna'}
                  </span>
                  <span className="font-mono text-[9px] font-bold text-[#FF5E36] px-1.5 py-0.5 rounded bg-[#2A1711] border border-[#FF5E36]/40 uppercase">
                    Pemilik
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#94A3B8]">
                  {userProfile?.tagline || 'Pencatat Keuangan Mandiri'}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="vault-edit-profile-btn"
              onClick={onOpenEditProfile}
              className="px-3 py-2 rounded-xl bg-[#151921] hover:bg-[#28303F] text-[#F1F5F9] border border-[#28303F] hover:border-[#FF5E36] font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-[#FF5E36]">edit</span>
              <span>Ubah Profil</span>
            </button>
          </div>

          {/* Theme Selector (Dark / Light Mode) */}
          <div className="bg-[#1C222D] p-4 rounded-xl border border-[#28303F] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#151921] border border-[#28303F] flex items-center justify-center text-[#FF5E36]">
                <span className="material-symbols-outlined text-[20px]">
                  {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-md text-[14px] font-bold text-[#F1F5F9]">Tema Tampilan</span>
                <span className="font-mono text-[11px] text-[#94A3B8]">
                  {theme === 'dark' ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}
                </span>
              </div>
            </div>
            <div className="flex items-center bg-[#151921] p-1 rounded-xl border border-[#28303F] gap-1">
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'light' && onToggleTheme) onToggleTheme();
                }}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  theme === 'light'
                    ? 'bg-[#FF5E36] text-white'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">light_mode</span>
                <span>Terang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'dark' && onToggleTheme) onToggleTheme();
                }}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#FF5E36] text-white'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">dark_mode</span>
                <span>Gelap</span>
              </button>
            </div>
          </div>

          {/* Cadangan & Simpan Data (Backup & Restore) - Tanpa PIN / Biometrik */}
          <div className="bg-[#1C222D] p-4 rounded-xl border border-[#28303F] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#151921] border border-[#28303F] flex items-center justify-center text-[#FF5E36]">
                  <span className="material-symbols-outlined text-[20px]">backup</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-body-md text-[14px] font-bold text-[#F1F5F9]">
                      Cadangan &amp; Simpan Data (Backup / Restore)
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#151921] border border-emerald-500/30 text-emerald-400 font-bold uppercase">
                      Bebas PIN
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#94A3B8]">
                    Format JSON Standar • Langsung simpan &amp; pulihkan tanpa biometrik
                  </span>
                </div>
              </div>
            </div>

            <p className="font-body-sm text-[11px] text-[#94A3B8] leading-relaxed">
              Seluruh data dompet ({wallets.length}), catatan kas ({transactions.length > 0 ? transactions.length : totalTransactionsCount} transaksi), dan celengan ({savingsGoals.length} target) dapat Anda simpan ke file backup atau salin teks JSON tanpa perlu kode PIN atau verifikasi sensor sidik jari.
            </p>

            {backupToastMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{backupToastMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#28303F]">
              <input
                ref={quickFileInputRef}
                type="file"
                accept=".json,application/json,text/plain,text/*"
                onChange={handleQuickFileRestore}
                className="hidden"
              />

              <button
                type="button"
                id="quick-download-backup-btn"
                onClick={async () => {
                  const backupJson = generateBackupJson({
                    wallets,
                    transactions,
                    savingsGoals,
                    userProfile,
                    theme,
                  });
                  const res = await shareOrSaveBackupFile(backupJson);
                  if (res.success) {
                    setBackupToastMessage(
                      res.method === 'share'
                        ? 'Dialog simpan / bagikan berkas dibuka!'
                        : 'Berkas cadangan (.JSON) berhasil diunduh ke perangkat Anda!'
                    );
                  } else {
                    setBackupToastMessage(res.error || 'Gagal menyimpan berkas di perangkat.');
                  }
                  setTimeout(() => setBackupToastMessage(null), 4000);
                }}
                className="px-3 py-2.5 rounded-lg bg-[#FF5E36] hover:bg-[#FF734F] text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Unduh JSON</span>
              </button>

              <button
                type="button"
                id="quick-restore-file-btn"
                onClick={() => quickFileInputRef.current?.click()}
                className="px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>Pulihkan File</span>
              </button>

              <button
                type="button"
                id="open-backup-restore-modal-btn"
                onClick={() => setShowBackupModal(true)}
                className="px-3 py-2.5 rounded-lg bg-[#151921] hover:bg-[#28303F] text-[#F1F5F9] border border-[#28303F] hover:border-[#FF5E36]/60 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-[#FF5E36]">tune</span>
                <span>Panel Lengkap</span>
              </button>
            </div>
          </div>

          {/* Automatic Transaction Detection Card with Permission Status & Android Redirection */}
          <div className="bg-[#1C222D] p-4 rounded-xl border border-[#28303F] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#151921] border border-[#28303F] flex items-center justify-center text-[#FF5E36]">
                  <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-[14px] font-bold text-[#F1F5F9]">Deteksi Transaksi Otomatis</span>
                  <span className="font-mono text-[11px] text-[#94A3B8]">Baca SMS perbankan &amp; notifikasi e-wallet DANA, GoPay</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isNotificationPermissionGranted) {
                    // Redirect to settings permission modal if not yet allowed!
                    if (onOpenAndroidPermissionModal) onOpenAndroidPermissionModal();
                  } else {
                    setIsNotificationServiceActive(!isNotificationServiceActive);
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  isNotificationServiceActive && isNotificationPermissionGranted ? 'bg-[#FF5E36]' : 'bg-[#28303F]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isNotificationServiceActive && isNotificationPermissionGranted ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                ></div>
              </button>
            </div>

            {/* Permission Status Banner & Android Settings Redirection */}
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                isNotificationPermissionGranted
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${
                    isNotificationPermissionGranted ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isNotificationPermissionGranted ? 'verified_user' : 'lock_open'}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] font-bold uppercase text-white">
                    {isNotificationPermissionGranted
                      ? 'Izin Akses Android: Aktif (Di-Allow)'
                      : 'Izin Akses Android: Belum Diizinkan'}
                  </span>
                  <span className="font-body-sm text-[11px] text-[#94A3B8]">
                    {isNotificationPermissionGranted
                      ? 'Sistem siap menangkap mutasi DANA & SMS otomatis'
                      : 'Wajib mengizinkan Akses Notifikasi di Pengaturan HP'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAndroidPermissionModal}
                className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 ${
                  isNotificationPermissionGranted
                    ? 'bg-[#151921] hover:bg-[#28303F] text-emerald-300 border border-emerald-500/30'
                    : 'bg-[#FF5E36] hover:bg-[#E04822] text-white shadow-[0_0_10px_rgba(255,94,54,0.3)]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isNotificationPermissionGranted ? 'check_circle' : 'settings'}
                </span>
                <span>{isNotificationPermissionGranted ? 'Pengaturan Izin' : 'Buka Pengaturan (Allow)'}</span>
              </button>
            </div>

            {/* Test Detection Action Row */}
            <div className="pt-2 border-t border-[#28303F] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#94A3B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>BCA, Mandiri, BRI, DANA, GoPay, OVO, ShopeePay</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAndroidPermissionModal}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[15px]">play_circle</span>
                  <span>Uji Live DANA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetectionTesterModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#2A1711] hover:bg-[#3d1e15] text-[#FF5E36] border border-[#FF5E36]/40 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[15px]">science</span>
                  <span>Katalog SMS &amp; Tester</span>
                </button>
              </div>
            </div>
          </div>

          {/* Smart Detection: Auto-Approve Whitelist Card */}
          <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#333333] flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-body-md text-[14px] font-bold text-white">
                      Konfirmasi Otomatis (Auto-Approve)
                    </span>
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isAutoApproveEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#222222] text-[#888888] border border-[#333333]'
                      }`}
                    >
                      {isAutoApproveEnabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <span className="font-body-sm text-[12px] text-[#888888]">
                    Transaksi dari merchant/kata kunci di bawah langsung disetujui otomatis ke buku kas.
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleAutoApprove}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  isAutoApproveEnabled ? 'bg-emerald-500' : 'bg-[#28303F]'
                }`}
                title={isAutoApproveEnabled ? 'Nonaktifkan Auto-Approve' : 'Aktifkan Auto-Approve'}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isAutoApproveEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Keyword Whitelist Management */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-[#222222]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#AAAAAA]">
                  Daftar Kata Kunci / Merchant Whitelist ({autoApproveWhitelist.length}):
                </span>
                <button
                  type="button"
                  onClick={handleResetWhitelist}
                  className="font-mono text-[10px] text-[#888888] hover:text-[#CCCCCC] underline"
                >
                  Reset ke Standar
                </button>
              </div>

              {/* Active Chip Tags */}
              <div className="flex flex-wrap gap-1.5">
                {autoApproveWhitelist.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1A1A] border border-[#333333] font-mono text-[11px] text-[#DDDDDD] font-medium"
                  >
                    <span>{keyword}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhitelistKeyword(keyword)}
                      className="text-[#888888] hover:text-red-400 font-bold transition-colors ml-0.5"
                      title={`Hapus ${keyword} dari whitelist`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Custom Keyword Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddWhitelistKeyword();
                }}
                className="flex items-center gap-2 mt-1"
              >
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  placeholder="Ketik nama merchant/toko (misal: Netflix, PLN)..."
                  className="flex-1 bg-[#181818] border border-[#333333] rounded-lg px-3 py-1.5 font-body-sm text-[12px] text-white placeholder-[#666666] focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newKeywordInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-[11px] font-bold uppercase transition-all"
                >
                  + Tambah
                </button>
              </form>

              {/* Preset suggestions */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="font-mono text-[9px] text-[#777777] uppercase font-bold mr-1">
                  Saran Cepat:
                </span>
                {[
                  'Netflix',
                  'Spotify',
                  'PLN',
                  'Indomaret',
                  'Alfamart',
                  'Tokopedia',
                  'Pertamina',
                  'Kopi Kenangan',
                  'Gojek',
                  'Grab',
                ].map((sug) => {
                  const alreadyAdded = autoApproveWhitelist.some(
                    (k) => k.toLowerCase() === sug.toLowerCase()
                  );
                  if (alreadyAdded) return null;
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddWhitelistKeyword(sug)}
                      className="px-2 py-0.5 rounded bg-[#181818] hover:bg-[#252525] border border-[#2E2E2E] font-mono text-[10px] text-[#999999] hover:text-white transition-colors"
                    >
                      + {sug}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Center / Rejection Recovery Shortcut */}
            {onOpenNotificationCenter && (
              <div className="pt-2.5 border-t border-[#222222] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-amber-400">
                    history_toggle_off
                  </span>
                  <span className="font-mono text-[11px] text-[#AAAAAA]">
                    {rejectedCount > 0
                      ? `${rejectedCount} notifikasi ditolak dapat dipulihkan`
                      : 'Riwayat penolakan notifikasi & arsip mutasi'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenNotificationCenter}
                  className="px-2.5 py-1 rounded-lg bg-[#1E1E1E] hover:bg-[#282828] border border-[#333333] text-white font-mono text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                >
                  <span>Buka Arsip &amp; Antrean</span>
                  {rejectedCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-extrabold">
                      {rejectedCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Database Reset & Sample Management Card */}
          <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#333333] flex items-center justify-center text-[#FF3E00]">
                  <span className="material-symbols-outlined text-[20px]">database</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-[14px] font-bold text-white">Status Data &amp; Reset</span>
                  <span className="font-mono text-[11px] text-[#888888]">
                    {wallets.length} Dompet • {transactions.length > 0 ? transactions.length : totalTransactionsCount} Transaksi Tercatat
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#181818] border border-[#2E2E2E] text-[#AAAAAA]">
                {wallets.length === 0 && (transactions.length === 0 && totalTransactionsCount === 0) ? 'KOSONG (BERSIH)' : 'TERISI'}
              </span>
            </div>

            <p className="font-body-sm text-[12px] text-[#888888]">
              Kosongkan semua data kas untuk memulai pencatatan baru dari nol. Anda dapat mencadangkan data terlebih dahulu sebelum melakukan reset.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onResetToEmpty) {
                    if (window.confirm('Kosongkan semua dompet, transaksi, dan target tabungan sekarang?')) {
                      onResetToEmpty();
                    }
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#281818] text-[#888888] hover:text-[#FF4D4D] border border-[#2E2E2E] hover:border-[#FF4D4D]/50 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                <span>Kosongkan Semua Data</span>
              </button>
            </div>
          </div>

          {/* App Branding & Logo Card */}
          <div className="bg-[#1C222D] p-4 rounded-xl border border-[#28303F] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <ReimuLogo size={42} className="rounded-xl border border-[#FF5E36]/30 shadow-md shrink-0" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-[15px] text-[#F1F5F9]">
                    ReimuWallet
                  </span>
                  <span className="font-mono text-[9px] font-bold text-[#FF5E36] px-1.5 py-0.5 rounded bg-[#2A1711] border border-[#FF5E36]/40 uppercase">
                    v1.0 Mobile
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#94A3B8]">
                  Pencatat Keuangan &amp; Buku Kas Mandiri
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 bg-[#151921] px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Aktif</span>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Data Modal (Bebas PIN / Biometrik) */}
      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        wallets={wallets}
        transactions={transactions}
        savingsGoals={savingsGoals}
        userProfile={userProfile}
        theme={theme}
        onRestoreConfirmed={(payload) => {
          if (onRestoreBackup) {
            onRestoreBackup(payload);
          }
          setBackupToastMessage(
            `Data berhasil dipulihkan! ${payload.transactions.length} transaksi dan ${payload.wallets.length} dompet telah kembali.`
          );
          setTimeout(() => setBackupToastMessage(null), 5000);
        }}
      />

      {/* Detection Tester Modal */}
      {onSaveTransaction && (
        <DetectionTesterModal
          isOpen={showDetectionTesterModal}
          onClose={() => setShowDetectionTesterModal(false)}
          wallets={wallets}
          onSaveTransaction={onSaveTransaction}
          onNavigateToLedger={onNavigateToLedger}
        />
      )}

      {/* ADD WALLET / VAULT MODAL */}
      {showAddWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateWallet}
            className="bg-[#121212] border border-[#2E2E2E] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col font-sans"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#242424] bg-[#161616]">
              <span className="font-mono text-[14px] font-bold text-white uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#FF3E00]">
                  {newWalletType === 'vault' ? 'lock' : 'add_circle'}
                </span>
                <span>{newWalletType === 'vault' ? 'Tambah Brankas Baru' : 'Tambah Dompet Baru'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddWalletModal(false)}
                className="text-[#888888] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">
                  {newWalletType === 'vault' ? 'Nama Brankas' : 'Nama Dompet'}
                </label>
                <input
                  type="text"
                  required
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder={
                    newWalletType === 'vault'
                      ? 'misal: Brankas Darurat, Simpanan Masa Depan...'
                      : 'misal: Mandiri Livin, Dompet Tunai...'
                  }
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">Tipe Kategori</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['vault', 'bank', 'ewallet', 'pocket'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setNewWalletType(t);
                        if (t === 'vault') setNewWalletIsLocked(true);
                      }}
                      className={`py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold border transition-colors flex items-center justify-center gap-1 ${
                        newWalletType === t
                          ? 'bg-[#FF3E00] text-white border-[#FF3E00] shadow-[0_0_8px_rgba(255,62,0,0.3)]'
                          : 'bg-[#181818] text-[#888888] border-[#2A2A2A] hover:text-white'
                      }`}
                    >
                      {t === 'vault' && <span className="material-symbols-outlined text-[12px]">lock</span>}
                      {t === 'pocket' ? 'Tunai' : t === 'ewallet' ? 'E-Wallet' : t === 'bank' ? 'Bank' : 'Brankas'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">
                    Saldo Awal (Rp)
                  </label>
                  {parseCurrencyInput(newWalletBalance) > 0 && (
                    <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                      IDR Rupiah: {formatRupiahDisplay(parseCurrencyInput(newWalletBalance))}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(formatCurrencyInput(e.target.value))}
                  placeholder="0"
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              {/* Target Money Option */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase text-[#FF3E00] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">flag</span>
                    <span>Target Dana (Rp)</span>
                  </label>
                  {parseCurrencyInput(newWalletTargetMoney) > 0 ? (
                    <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                      IDR Rupiah: {formatRupiahDisplay(parseCurrencyInput(newWalletTargetMoney))}
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] text-[#888888] uppercase">Target Opsional</span>
                  )}
                </div>
                <input
                  type="text"
                  value={newWalletTargetMoney}
                  onChange={(e) => setNewWalletTargetMoney(formatCurrencyInput(e.target.value))}
                  placeholder="misal: 10,000 (Target tercapai)"
                  className="bg-[#181818] border border-[#3A2218] focus:border-[#FF3E00] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none placeholder-[#555555]"
                />
                <p className="font-mono text-[9px] text-[#777777]">
                  Tetapkan target dana untuk memantau progres tabungan pada {newWalletType === 'vault' ? 'brankas' : 'dompet'} ini.
                </p>
              </div>

              {/* Vault Lock Switch */}
              {newWalletType === 'vault' && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A1412] border border-[#FF3E00]/30 mt-1">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-white font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-[#FF3E00]">lock</span>
                      <span>Kunci Brankas</span>
                    </span>
                    <span className="font-mono text-[9px] text-[#888888]">
                      Melindungi aset dari penarikan impulsif
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewWalletIsLocked(!newWalletIsLocked)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      newWalletIsLocked ? 'bg-[#FF3E00]' : 'bg-[#2E2E2E]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        newWalletIsLocked ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    ></div>
                  </button>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddWalletModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] text-[#888888] font-mono text-[12px] font-bold uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] text-white font-mono text-[12px] font-bold uppercase shadow-[0_0_10px_rgba(255,62,0,0.3)]"
                >
                  Buat {newWalletType === 'vault' ? 'Brankas' : 'Dompet'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* EDIT WALLET / VAULT MODAL */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditWallet}
            className="bg-[#121212] border border-[#2E2E2E] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col font-sans"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#242424] bg-[#161616]">
              <span className="font-mono text-[14px] font-bold text-white uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#FF3E00]">
                  {editWalletType === 'vault' ? 'lock' : 'edit'}
                </span>
                <span>{editWalletType === 'vault' ? 'Ubah Brankas' : 'Ubah Dompet'}</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingWallet(null)}
                className="text-[#888888] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">
                  {editWalletType === 'vault' ? 'Nama Brankas' : 'Nama Dompet'}
                </label>
                <input
                  type="text"
                  required
                  value={editWalletName}
                  onChange={(e) => setEditWalletName(e.target.value)}
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">Tipe Kategori</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['vault', 'bank', 'ewallet', 'pocket'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditWalletType(t)}
                      className={`py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold border transition-colors flex items-center justify-center gap-1 ${
                        editWalletType === t
                          ? 'bg-[#FF3E00] text-white border-[#FF3E00] shadow-[0_0_8px_rgba(255,62,0,0.3)]'
                          : 'bg-[#181818] text-[#888888] border-[#2A2A2A] hover:text-white'
                      }`}
                    >
                      {t === 'vault' && <span className="material-symbols-outlined text-[12px]">lock</span>}
                      {t === 'pocket' ? 'Tunai' : t === 'ewallet' ? 'E-Wallet' : t === 'bank' ? 'Bank' : 'Brankas'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">
                    Saldo Saat Ini (Rp)
                  </label>
                  {parseCurrencyInput(editWalletBalance) > 0 && (
                    <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                      IDR Rupiah: {formatRupiahDisplay(parseCurrencyInput(editWalletBalance))}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={editWalletBalance}
                  onChange={(e) => setEditWalletBalance(formatCurrencyInput(e.target.value))}
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              {/* Target Money Option */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase text-[#FF3E00] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">flag</span>
                    <span>Target Dana (Rp)</span>
                  </label>
                  {parseCurrencyInput(editWalletTargetMoney) > 0 ? (
                    <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                      IDR Rupiah: {formatRupiahDisplay(parseCurrencyInput(editWalletTargetMoney))}
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] text-[#888888] uppercase">Jumlah Target</span>
                  )}
                </div>
                <input
                  type="text"
                  value={editWalletTargetMoney}
                  onChange={(e) => setEditWalletTargetMoney(formatCurrencyInput(e.target.value))}
                  placeholder="misal: 10,000 (kosongkan jika tanpa target)"
                  className="bg-[#181818] border border-[#3A2218] focus:border-[#FF3E00] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none placeholder-[#555555]"
                />
              </div>

              {/* Vault Lock Switch */}
              {editWalletType === 'vault' && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A1412] border border-[#FF3E00]/30 mt-1">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-white font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-[#FF3E00]">lock</span>
                      <span>Kunci Brankas</span>
                    </span>
                    <span className="font-mono text-[9px] text-[#888888]">
                      Kunci atau buka kunci brankas ini
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditWalletIsLocked(!editWalletIsLocked)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      editWalletIsLocked ? 'bg-[#FF3E00]' : 'bg-[#2E2E2E]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        editWalletIsLocked ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    ></div>
                  </button>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingWallet(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] text-[#888888] font-mono text-[12px] font-bold uppercase"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] text-white font-mono text-[12px] font-bold uppercase shadow-[0_0_10px_rgba(255,62,0,0.3)]"
                  >
                    Simpan Perubahan
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setWalletToDelete(editingWallet);
                    setEditingWallet(null);
                  }}
                  className="w-full py-2 rounded-xl bg-[#2C1818] hover:bg-[#3E1C1C] text-[#FF4D4D] font-mono text-[11px] font-bold uppercase border border-[#FF4D4D]/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Hapus {editWalletType === 'vault' ? 'Brankas' : 'Dompet'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM DELETE WALLET / VAULT MODAL */}
      {walletToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#FF4D4D]/40 rounded-2xl w-full max-w-sm p-5 flex flex-col gap-3 font-sans shadow-2xl">
            <div className="flex items-center gap-2.5 text-[#FF4D4D]">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <span className="font-mono text-[15px] font-bold uppercase">
                Hapus {walletToDelete.type === 'vault' ? 'Brankas' : 'Dompet'}?
              </span>
            </div>
            <p className="font-body-sm text-[13px] text-[#CCCCCC]">
              Apakah Anda yakin ingin menghapus <strong className="text-white">"{walletToDelete.name}"</strong>?
              Tindakan ini akan menghapus {walletToDelete.type === 'vault' ? 'brankas dan progres target dananya' : 'sumber ini'} dari akun aktif Anda.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWalletToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#292929] text-[#AAAAAA] font-mono text-[12px] font-bold uppercase"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWallet}
                className="flex-1 py-2.5 rounded-xl bg-[#FF4D4D] hover:bg-[#ff6666] text-white font-mono text-[12px] font-bold uppercase shadow-[0_0_12px_rgba(255,77,77,0.3)]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateGoal}
            className="bg-[#121212] border border-[#2E2E2E] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col font-sans"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#242424] bg-[#161616]">
              <span className="font-mono text-[14px] font-bold text-white uppercase">Celengan Tabungan Baru</span>
              <button
                type="button"
                onClick={() => setShowAddGoalModal(false)}
                className="text-[#888888] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">Nama Target</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="misal: Liburan Jepang, Laptop Baru..."
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase text-[#FF3E00] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">flag</span>
                    <span>Target Dana (Rp)</span>
                  </label>
                  {parseCurrencyInput(newGoalTarget) > 0 && (
                    <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                      IDR Rupiah: {formatRupiahDisplay(parseCurrencyInput(newGoalTarget))}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(formatCurrencyInput(e.target.value))}
                  placeholder="misal: 10,000"
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">Saldo Terkumpul (Rp)</label>
                  {parseCurrencyInput(newGoalCurrent) > 0 && (
                    <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                      IDR Rupiah: {formatRupiahDisplay(parseCurrencyInput(newGoalCurrent))}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={newGoalCurrent}
                  onChange={(e) => setNewGoalCurrent(formatCurrencyInput(e.target.value))}
                  placeholder="0"
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] text-[#888888] font-mono text-[12px] font-bold uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] text-white font-mono text-[12px] font-bold uppercase shadow-[0_0_10px_rgba(255,62,0,0.3)]"
                >
                  Buat Celengan
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditGoal}
            className="bg-[#121212] border border-[#2E2E2E] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col font-sans"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#242424] bg-[#161616]">
              <span className="font-mono text-[14px] font-bold text-white uppercase">Ubah Target Tabungan</span>
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="text-[#888888] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">Nama Target</label>
                <input
                  type="text"
                  required
                  value={editGoalTitle}
                  onChange={(e) => setEditGoalTitle(e.target.value)}
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase text-[#FF3E00] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">flag</span>
                    <span>Target Dana (Rp)</span>
                  </label>
                  {parseCurrencyInput(editGoalTarget) > 0 && (
                    <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                      IDR Rupiah: {formatRupiahDisplay(parseCurrencyInput(editGoalTarget))}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={editGoalTarget}
                  onChange={(e) => setEditGoalTarget(formatCurrencyInput(e.target.value))}
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase text-[#888888] font-bold">Saldo Terkumpul (Rp)</label>
                  {parseCurrencyInput(editGoalCurrent) > 0 && (
                    <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                      IDR Rupiah: {formatRupiahDisplay(parseCurrencyInput(editGoalCurrent))}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={editGoalCurrent}
                  onChange={(e) => setEditGoalCurrent(formatCurrencyInput(e.target.value))}
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[13px] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGoal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] text-[#888888] font-mono text-[12px] font-bold uppercase"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] text-white font-mono text-[12px] font-bold uppercase shadow-[0_0_10px_rgba(255,62,0,0.3)]"
                  >
                    Simpan
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGoalToDelete(editingGoal);
                    setEditingGoal(null);
                  }}
                  className="w-full py-2 rounded-xl bg-[#2C1818] hover:bg-[#3E1C1C] text-[#FF4D4D] font-mono text-[11px] font-bold uppercase border border-[#FF4D4D]/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Hapus Target</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM DELETE GOAL MODAL */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#FF4D4D]/40 rounded-2xl w-full max-w-sm p-5 flex flex-col gap-3 font-sans shadow-2xl">
            <div className="flex items-center gap-2.5 text-[#FF4D4D]">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <span className="font-mono text-[15px] font-bold uppercase">Hapus Target Tabungan?</span>
            </div>
            <p className="font-body-sm text-[13px] text-[#CCCCCC]">
              Apakah Anda yakin ingin menghapus <strong className="text-white">"{goalToDelete.title}"</strong>?
              Target tabungan dan catatan progresnya akan dihapus.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#292929] text-[#AAAAAA] font-mono text-[12px] font-bold uppercase"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGoal}
                className="flex-1 py-2.5 rounded-xl bg-[#FF4D4D] hover:bg-[#ff6666] text-white font-mono text-[12px] font-bold uppercase shadow-[0_0_12px_rgba(255,77,77,0.3)]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
