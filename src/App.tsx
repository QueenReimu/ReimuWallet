/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { ActiveTab, Transaction, Wallet, SavingsGoal, UserProfile } from './types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_WALLETS,
  INITIAL_GOALS,
  formatRupiah,
} from './data/mockData';
import { BackupDataPayload } from './utils/backupUtils';
import {
  parseFinancialNotification,
  checkAutoApproveMatch,
  DEFAULT_AUTO_APPROVE_WHITELIST,
} from './utils/notificationParser';
import { generateNotificationHash, isDuplicateNotification } from './utils/currencyUtils';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { LedgerView } from './components/LedgerView';
import { InstantEntryView } from './components/InstantEntryView';
import { InsightsView } from './components/InsightsView';
import { VaultView } from './components/VaultView';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { DetectionTesterModal } from './components/DetectionTesterModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ExportReportModal } from './components/ExportReportModal';
import { AndroidPermissionModal } from './components/AndroidPermissionModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAndroidPermissionModal, setShowAndroidPermissionModal] = useState(false);
  const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState<boolean>(() => {
    return localStorage.getItem('reimu_notification_permission') === 'true';
  });

  const handlePermissionChanged = (granted: boolean) => {
    setIsNotificationPermissionGranted(granted);
    localStorage.setItem('reimu_notification_permission', String(granted));
  };

  // User Profile state with localStorage persistence
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('reimu_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { name: 'Reimu', tagline: 'Brankas Kas Pribadi' };
      }
    }
    return { name: 'Reimu', tagline: 'Brankas Kas Pribadi' };
  });
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('reimu_user_profile', JSON.stringify(newProfile));
  };

  // Default empty state per user request: "Jadikan defsultnya semuanya kosong"
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('reimu_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem('reimu_wallets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('reimu_goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showNotificationToast, setShowNotificationToast] = useState(true);
  const [showDetectionModal, setShowDetectionModal] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [instantEntryInitialType, setInstantEntryInitialType] = useState<'expense' | 'income'>('expense');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('reimu_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  // Segregate transactions: Only 'confirmed' or legacy manual transactions enter history & affect stats (Rule 8)
  const confirmedTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.status === 'confirmed' || (!t.status && (!t.source || t.source === 'manual'))
    );
  }, [transactions]);

  // Detected transactions waiting for user confirmation (Rule 6 & 7)
  const pendingTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === 'pending');
  }, [transactions]);

  // Rejected / dismissed transactions archived for reference & recovery
  const rejectedTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === 'rejected');
  }, [transactions]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('reimu_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('reimu_wallets', JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem('reimu_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem('reimu_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleResetToEmpty = () => {
    setWallets([]);
    setTransactions([]);
    setSavingsGoals([]);
    localStorage.setItem('reimu_wallets', JSON.stringify([]));
    localStorage.setItem('reimu_transactions', JSON.stringify([]));
    localStorage.setItem('reimu_goals', JSON.stringify([]));
  };

  const handleRestoreBackup = (payload: BackupDataPayload) => {
    if (Array.isArray(payload.wallets)) {
      setWallets(payload.wallets);
      localStorage.setItem('reimu_wallets', JSON.stringify(payload.wallets));
    }
    if (Array.isArray(payload.transactions)) {
      setTransactions(payload.transactions);
      localStorage.setItem('reimu_transactions', JSON.stringify(payload.transactions));
    }
    if (Array.isArray(payload.savingsGoals)) {
      setSavingsGoals(payload.savingsGoals);
      localStorage.setItem('reimu_goals', JSON.stringify(payload.savingsGoals));
    }
    if (payload.userProfile) {
      setUserProfile(payload.userProfile);
      localStorage.setItem('reimu_user_profile', JSON.stringify(payload.userProfile));
    }
    if (payload.theme) {
      setTheme(payload.theme);
      localStorage.setItem('reimu_theme', payload.theme);
    }
  };

  const handleLoadSampleData = () => {
    setWallets(INITIAL_WALLETS);
    setTransactions(INITIAL_TRANSACTIONS);
    setSavingsGoals(INITIAL_GOALS);
    localStorage.setItem('reimu_wallets', JSON.stringify(INITIAL_WALLETS));
    localStorage.setItem('reimu_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem('reimu_goals', JSON.stringify(INITIAL_GOALS));
  };

  // Helper to match wallet by name or ID
  const matchesWallet = (wallet: Wallet, nameOrId: string) => {
    const q = nameOrId.trim().toLowerCase();
    const wName = wallet.name.trim().toLowerCase();
    const wId = wallet.id.trim().toLowerCase();
    return wId === q || wName === q || wName.includes(q) || q.includes(wName);
  };

  // Handle saving new manual transaction (Rule 9: manual remains manual)
  const handleSaveTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      source: newTx.source || 'manual',
      status: 'confirmed',
    };

    // 1. Prepend new transaction to persistent state so it shows at the top of the ledger
    setTransactions((prev) => [created, ...prev]);

    // 2. Mathematically update affected wallets
    setWallets((prev) => {
      if (prev.length === 0) {
        // Auto-create initial primary wallet so new users are never left without a wallet
        const initialBalance = created.type === 'income' ? created.amount : 0;
        const newWallet: Wallet = {
          id: 'wallet-default-cash',
          name: created.wallet || 'Dompet Tunai',
          type: 'pocket',
          balance: initialBalance,
          icon: 'payments',
          colorClass: 'bg-[#FF5E36]',
          isPrimary: true,
          monthlyTransactionsCount: 1,
        };
        localStorage.setItem('reimu_wallets', JSON.stringify([newWallet]));
        return [newWallet];
      }

      return prev.map((w) => {
        let newBalance = w.balance;
        let countDelta = 0;

        // Source Wallet
        if (matchesWallet(w, created.wallet)) {
          if (created.type === 'income') {
            newBalance += created.amount;
          } else if (created.type === 'expense' || created.type === 'transfer') {
            newBalance = Math.max(0, newBalance - created.amount);
          }
          countDelta = 1;
        }

        // Target Wallet (if transfer)
        if (created.type === 'transfer' && created.targetWallet && matchesWallet(w, created.targetWallet)) {
          newBalance += created.amount;
          countDelta = 1;
        }

        return {
          ...w,
          balance: newBalance,
          monthlyTransactionsCount: Math.max(0, (w.monthlyTransactionsCount || 0) + countDelta),
        };
      });
    });

    // 3. Immediately transition view to 'transactions' (the ledger tab)
    setActiveTab('transactions');
  };

  /**
   * Processes an incoming notification or SMS string.
   * Enforces rules 2, 4, 5, 6, and anti-duplicate check.
   */
  const handleProcessDetectedNotification = (
    rawText: string,
    matchedWalletId?: string
  ): { success: boolean; message: string; transaction?: Transaction } => {
    const parsed = parseFinancialNotification(rawText, wallets);

    // Rule 2 & 5: Pastikan nominal hanya diambil dari angka Rp atau IDR. Jika tidak jelas, jangan buat transaksi.
    if (!parsed || parsed.amount <= 0) {
      return {
        success: false,
        message: 'Nominal transaksi Rp atau IDR tidak ditemukan dengan jelas. Transaksi tidak dapat dibuat.',
      };
    }

    // Anti-duplicate rule: cegah notifikasi yang sama diproses berulang
    const hash = generateNotificationHash(rawText, parsed.amount);
    if (isDuplicateNotification(rawText, parsed.amount, transactions)) {
      return {
        success: false,
        message: 'Notifikasi ini sudah pernah terdeteksi sebelumnya (anti-duplicate aktif).',
      };
    }

    const matchedW =
      wallets.find((w) => w.id === (matchedWalletId || parsed.matchedWalletId)) || wallets[0];
    const walletName = matchedW ? matchedW.name : parsed.walletName || 'Kas / Tunai';

    // Smart Detection: Check Auto-Approve Whitelist
    const isAutoApproveOn = localStorage.getItem('reimu_auto_approve_enabled') === 'true';
    let whitelist: string[] = DEFAULT_AUTO_APPROVE_WHITELIST;
    try {
      const saved = localStorage.getItem('reimu_auto_approve_whitelist');
      if (saved) whitelist = JSON.parse(saved);
    } catch (_) {}

    const autoApproveCheck = isAutoApproveOn
      ? checkAutoApproveMatch(parsed.title, rawText, whitelist)
      : { isMatched: false };

    // If auto-approved by whitelist: directly confirmed & balance adjusted!
    if (autoApproveCheck.isMatched) {
      const confirmedTx: Transaction = {
        id: `tx-auto-${Date.now()}`,
        title: parsed.title,
        category: parsed.category,
        type: parsed.type,
        amount: parsed.amount,
        wallet: walletName,
        targetWallet: parsed.type === 'transfer' ? 'Brankas' : undefined,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        note: `Auto-Approve Whitelist [${autoApproveCheck.matchedKeyword}] • ${parsed.institution}`,
        rawNotification: rawText,
        notificationHash: hash,
        source: 'notification',
        status: 'confirmed',
      };

      setTransactions((prev) => [confirmedTx, ...prev]);

      // Apply balance changes to wallet immediately
      setWallets((prev) => {
        if (prev.length === 0) {
          const initialBalance = confirmedTx.type === 'income' ? confirmedTx.amount : 0;
          return [
            {
              id: 'wallet-default-cash',
              name: confirmedTx.wallet || 'Dompet Tunai',
              type: 'pocket',
              balance: initialBalance,
              icon: 'payments',
              colorClass: 'bg-[#FF5E36]',
              isPrimary: true,
              monthlyTransactionsCount: 1,
            },
          ];
        }

        return prev.map((w) => {
          let newBalance = w.balance;
          let countDelta = 0;

          if (matchesWallet(w, confirmedTx.wallet)) {
            if (confirmedTx.type === 'income') {
              newBalance += confirmedTx.amount;
            } else if (confirmedTx.type === 'expense' || confirmedTx.type === 'transfer') {
              newBalance = Math.max(0, newBalance - confirmedTx.amount);
            }
            countDelta = 1;
          }

          if (
            confirmedTx.type === 'transfer' &&
            confirmedTx.targetWallet &&
            matchesWallet(w, confirmedTx.targetWallet)
          ) {
            newBalance += confirmedTx.amount;
            countDelta = 1;
          }

          return {
            ...w,
            balance: newBalance,
            monthlyTransactionsCount: Math.max(0, (w.monthlyTransactionsCount || 0) + countDelta),
          };
        });
      });

      return {
        success: true,
        message: `Auto-Approve Aktif: Transaksi Rp ${formatRupiah(confirmedTx.amount)} (${confirmedTx.title}) langsung dikonfirmasi otomatis ke buku kas [${autoApproveCheck.matchedKeyword}].`,
        transaction: confirmedTx,
      };
    }

    // Standard Detection (Manual confirmation queue):
    // Rule 6: Transaksi dari Notification/SMS harus masuk sebagai PENDING terlebih dahulu
    const pendingTx: Transaction = {
      id: `tx-detected-${Date.now()}`,
      title: parsed.title,
      category: parsed.category,
      type: parsed.type,
      amount: parsed.amount,
      wallet: walletName,
      targetWallet: parsed.type === 'transfer' ? 'Brankas' : undefined,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      note: `Otomatis dari ${parsed.institution}`,
      rawNotification: rawText,
      notificationHash: hash,
      source: 'notification',
      status: 'pending',
    };

    // Rule 8: Saldo TIDAK diubah saat pending. Masuk ke antrean transaksi sebagai pending.
    setTransactions((prev) => [pendingTx, ...prev]);

    return {
      success: true,
      message: `Notifikasi berhasil dideteksi: Rp ${formatRupiah(pendingTx.amount)} (${pendingTx.title}). Masuk sebagai PENDING, membutuhkan konfirmasi.`,
      transaction: pendingTx,
    };
  };

  // Listen for native Android notifications dispatched from ReimuNotificationListener via WebView bridge
  useEffect(() => {
    const handleNativeNotif = (e: any) => {
      if (e.detail && e.detail.text) {
        handleProcessDetectedNotification(e.detail.text);
      }
    };
    window.addEventListener('reimu:notification', handleNativeNotif);
    return () => window.removeEventListener('reimu:notification', handleNativeNotif);
  }, [wallets, transactions]);

  // Live Clipboard Monitor: if user enabled clipboard monitoring, check clipboard on app focus
  useEffect(() => {
    const checkClipboardOnFocus = async () => {
      const isClipActive = localStorage.getItem('reimu_clipboard_monitor') === 'true';
      if (!isClipActive) return;
      try {
        if (navigator.clipboard && document.hasFocus()) {
          const clipText = await navigator.clipboard.readText();
          if (
            clipText &&
            (clipText.includes('Rp') || clipText.includes('IDR')) &&
            (clipText.includes('DANA') || clipText.includes('berhasil') || clipText.includes('Transfer') || clipText.includes('GoPay') || clipText.includes('BCA'))
          ) {
            handleProcessDetectedNotification(clipText);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('focus', checkClipboardOnFocus);
    return () => window.removeEventListener('focus', checkClipboardOnFocus);
  }, [wallets, transactions]);

  /**
   * User Confirmation: "Benar" (Rule 7 & 8)
   * Status becomes 'confirmed', updates wallet balance, enters History and statistics.
   */
  const handleConfirmPendingTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    // Update status to confirmed
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'confirmed' } : t))
    );

    // Apply financial balance change to wallet (Rule 8)
    setWallets((prev) => {
      if (prev.length === 0) {
        const initialBalance = target.type === 'income' ? target.amount : 0;
        const newWallet: Wallet = {
          id: 'wallet-default-cash',
          name: target.wallet || 'Dompet Tunai',
          type: 'pocket',
          balance: initialBalance,
          icon: 'payments',
          colorClass: 'bg-[#FF5E36]',
          isPrimary: true,
          monthlyTransactionsCount: 1,
        };
        return [newWallet];
      }

      return prev.map((w) => {
        let newBalance = w.balance;
        let countDelta = 0;

        if (matchesWallet(w, target.wallet)) {
          if (target.type === 'income') {
            newBalance += target.amount;
          } else if (target.type === 'expense' || target.type === 'transfer') {
            newBalance = Math.max(0, newBalance - target.amount);
          }
          countDelta = 1;
        }

        if (target.type === 'transfer' && target.targetWallet && matchesWallet(w, target.targetWallet)) {
          newBalance += target.amount;
          countDelta = 1;
        }

        return {
          ...w,
          balance: newBalance,
          monthlyTransactionsCount: Math.max(0, (w.monthlyTransactionsCount || 0) + countDelta),
        };
      });
    });
  };

  /**
   * User Confirmation: "Tidak" (Rule 7 & 8)
   * Status becomes 'rejected', does NOT affect wallet balance or stats.
   */
  const handleRejectPendingTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'rejected' } : t))
    );
  };

  // Handle updating an existing or newly confirmed transaction
  const handleSaveConfirmedTransaction = (updated: Transaction) => {
    const existing = transactions.find((t) => t.id === updated.id);

    setTransactions((prev) => {
      if (existing) {
        return prev.map((t) => (t.id === updated.id ? updated : t));
      }
      return [updated, ...prev];
    });

    // Reconcile wallet balances (revert old impact, apply new impact)
    setWallets((prev) =>
      prev.map((w) => {
        let balance = w.balance;

        // Revert old transaction if existed
        if (existing) {
          if (matchesWallet(w, existing.wallet)) {
            if (existing.type === 'income') balance -= existing.amount;
            else if (existing.type === 'expense' || existing.type === 'transfer') balance += existing.amount;
          }
          if (existing.type === 'transfer' && existing.targetWallet && matchesWallet(w, existing.targetWallet)) {
            balance -= existing.amount;
          }
        }

        // Apply new transaction
        if (matchesWallet(w, updated.wallet)) {
          if (updated.type === 'income') balance += updated.amount;
          else if (updated.type === 'expense' || updated.type === 'transfer') balance -= updated.amount;
        }
        if (updated.type === 'transfer' && updated.targetWallet && matchesWallet(w, updated.targetWallet)) {
          balance += updated.amount;
        }

        return { ...w, balance: Math.max(0, balance) };
      })
    );

    setShowNotificationToast(false);
  };

  // Handle deleting a transaction
  const handleDeleteTransaction = (id: string) => {
    const existing = transactions.find((t) => t.id === id);
    if (existing) {
      setWallets((prev) =>
        prev.map((w) => {
          let balance = w.balance;
          let countDelta = 0;

          if (matchesWallet(w, existing.wallet)) {
            if (existing.type === 'income') balance -= existing.amount;
            else if (existing.type === 'expense' || existing.type === 'transfer') balance += existing.amount;
            countDelta = -1;
          }
          if (existing.type === 'transfer' && existing.targetWallet && matchesWallet(w, existing.targetWallet)) {
            balance -= existing.amount;
            countDelta = -1;
          }

          return {
            ...w,
            balance: Math.max(0, balance),
            monthlyTransactionsCount: Math.max(0, (w.monthlyTransactionsCount || 0) + countDelta),
          };
        })
      );
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setSelectedTransaction(null);
  };

  // Wallet Management (Add, Edit, Delete)
  const handleAddWallet = (newWallet: Omit<Wallet, 'id'>) => {
    const created: Wallet = {
      ...newWallet,
      id: `w-${Date.now()}`,
    };
    setWallets((prev) => [...prev, created]);
  };

  const handleUpdateWallet = (updatedWallet: Wallet) => {
    setWallets((prev) => prev.map((w) => (w.id === updatedWallet.id ? updatedWallet : w)));
  };

  const handleDeleteWallet = (walletId: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== walletId));
  };

  // Savings Goal Management (Add, Edit, Delete)
  const handleAddGoal = (newGoal: Omit<SavingsGoal, 'id'>) => {
    const created: SavingsGoal = {
      ...newGoal,
      id: `g-${Date.now()}`,
    };
    setSavingsGoals((prev) => [...prev, created]);
  };

  const handleUpdateGoal = (updatedGoal: SavingsGoal) => {
    setSavingsGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  const handleDeleteGoal = (goalId: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  // Trigger quick entry from dashboard button
  const handleOpenInstantEntryWithType = (type: 'expense' | 'income') => {
    setInstantEntryInitialType(type);
    setActiveTab('instant-entry');
  };

  // Sample detected transaction for Android notification demonstration
  const sampleDetectedTransaction: Transaction = {
    id: 'tx-notif-detected',
    title: 'Kopi Kenangan',
    category: 'Food',
    type: 'expense',
    amount: 25000,
    wallet: 'DANA',
    date: '2026-09-03',
    time: '14:20',
    note: 'Kopi & Minuman',
    rawNotification: '“DANA: Pembayaran sebesar Rp 25.000 ke Kopi Kenangan telah berhasil.”',
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0D0F14] text-[#F1F5F9] flex flex-col justify-between selection:bg-[#FF5E36] selection:text-white font-sans">
      {/* Persistent Sanctuary App Bar */}
      <Header
        activeTab={activeTab}
        userProfile={userProfile}
        onProfileClick={() => setShowEditProfileModal(true)}
        onNotificationsClick={() => setShowNotificationCenter(true)}
        pendingCount={pendingTransactions.length}
        onNavigate={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area Container strictly bounded for mobile app viewports */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 sm:px-4 pt-header-safe pb-nav-safe overflow-x-hidden">
        {/* User Confirmation Banner for Detected Transactions (Rule 7 & 8) */}
        {pendingTransactions.length > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-[#1C1815] border-2 border-[#FF5E36] shadow-[0_4px_24px_rgba(255,94,54,0.22)] flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E36] animate-pulse"></span>
                <span className="font-label-caps text-[10px] text-[#FF5E36] font-black uppercase tracking-[0.16em]">
                  KONFIRMASI DETEKSI TRANSAKSI OTOMATIS
                </span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#FF5E36]/20 text-[#FF5E36] font-bold">
                {pendingTransactions.length} Menunggu
              </span>
            </div>

            {pendingTransactions.slice(0, 1).map((pTx) => (
              <div key={pTx.id} className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-md text-[14px] font-bold text-[#F1F5F9] truncate">
                      {pTx.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[#94A3B8] font-mono text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-[#28303F] text-white text-[9px] uppercase font-bold">
                        {pTx.wallet}
                      </span>
                      <span>•</span>
                      <span className="uppercase text-[10px]">{pTx.category}</span>
                      <span>•</span>
                      <span className="text-[10px]">{pTx.time}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-mono text-[16px] font-black text-white">
                      {pTx.type === 'income' ? '+ ' : '− '}Rp {formatRupiah(pTx.amount)}
                    </span>
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold mt-0.5">
                      Status: Pending
                    </span>
                  </div>
                </div>

                {pTx.rawNotification && (
                  <div className="p-2.5 rounded-xl bg-[#151921] border border-[#28303F] font-mono text-[11px] text-[#CBD5E1] italic leading-relaxed">
                    "{pTx.rawNotification}"
                  </div>
                )}

                {/* User Confirmation Buttons: Benar / Tidak */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRejectPendingTransaction(pTx.id)}
                    className="flex-1 h-10 rounded-xl bg-[#151921] hover:bg-red-500/15 text-red-400 hover:text-red-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#28303F] hover:border-red-500/40 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    <span>Tidak (Tolak)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmPendingTransaction(pTx.id)}
                    className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.35)] active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Benar (Konfirmasi)</span>
                  </button>
                </div>
              </div>
            ))}

            {pendingTransactions.length > 1 && (
              <button
                type="button"
                onClick={() => setShowNotificationCenter(true)}
                className="text-center font-mono text-[11px] text-[#FF5E36] hover:underline font-bold py-1"
              >
                Lihat Semua {pendingTransactions.length} Transaksi Tertangkap →
              </button>
            )}
          </div>
        )}

        {/* Dynamic Android Notification Detection Pill */}
        {showNotificationToast && activeTab !== 'instant-entry' && (
          <div
            className={`mb-3.5 p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
              isNotificationPermissionGranted
                ? 'bg-[#151921] border-[#28303F]'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <div
              onClick={() => setShowAndroidPermissionModal(true)}
              className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isNotificationPermissionGranted
                    ? 'bg-[#2A1711] border border-[#FF5E36]/30 text-[#FF5E36]'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isNotificationPermissionGranted ? 'notifications_active' : 'lock_open'}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-label-caps text-[9px] font-bold uppercase tracking-[0.15em] ${
                      isNotificationPermissionGranted ? 'text-[#FF5E36]' : 'text-amber-400'
                    }`}
                  >
                    {isNotificationPermissionGranted ? 'Deteksi Otomatis: Aktif' : 'Izin Android: Belum Di-Allow'}
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">
                    {isNotificationPermissionGranted ? 'DANA / Bank • Siap' : 'Wajib Izin HP'}
                  </span>
                </div>
                <span className="font-body-md text-[13px] font-semibold text-[#F1F5F9] truncate">
                  {isNotificationPermissionGranted
                    ? 'Ketuk untuk uji transaksi DANA live atau salin notifikasi mutasi'
                    : 'Buka Pengaturan Android agar mutasi transaksi dapat terdeteksi'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowAndroidPermissionModal(true)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all shadow-sm ${
                  isNotificationPermissionGranted
                    ? 'bg-[#FF5E36] text-white hover:bg-[#E04822]'
                    : 'bg-amber-500 text-black hover:bg-amber-400 font-extrabold'
                }`}
              >
                {isNotificationPermissionGranted ? 'Uji Live' : 'Buka Setting'}
              </button>
              <button
                onClick={() => setShowNotificationToast(false)}
                aria-label="Tutup notifikasi"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* View Switcher: Only confirmed transactions feed into History and stats (Rule 8) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            wallets={wallets}
            transactions={confirmedTransactions}
            userProfile={userProfile}
            onOpenEditProfile={() => setShowEditProfileModal(true)}
            onNavigate={setActiveTab}
            onOpenInstantEntryWithType={handleOpenInstantEntryWithType}
          />
        )}

        {(activeTab === 'transactions' || (activeTab as string) === 'ledger') && (
          <LedgerView
            transactions={confirmedTransactions}
            wallets={wallets}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            onDeleteTransaction={handleDeleteTransaction}
            onExportLedger={() => setShowExportModal(true)}
            onRecordNewTransaction={() => setActiveTab('instant-entry')}
          />
        )}

        {activeTab === 'instant-entry' && (
          <InstantEntryView
            wallets={wallets}
            initialType={instantEntryInitialType}
            onSave={handleSaveTransaction}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'analytics' && (
          <InsightsView
            transactions={confirmedTransactions}
            wallets={wallets}
            savingsGoals={savingsGoals}
            userProfile={userProfile}
            onNavigateToInstantEntry={() => setActiveTab('instant-entry')}
            onOpenExportReport={() => setShowExportModal(true)}
          />
        )}

        {(activeTab === 'vault-settings' || (activeTab as string) === 'vault') && (
          <VaultView
            wallets={wallets}
            savingsGoals={savingsGoals}
            transactions={confirmedTransactions}
            totalTransactionsCount={confirmedTransactions.length}
            userProfile={userProfile}
            onOpenEditProfile={() => setShowEditProfileModal(true)}
            onAddWallet={handleAddWallet}
            onUpdateWallet={handleUpdateWallet}
            onDeleteWallet={handleDeleteWallet}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onSaveTransaction={handleSaveTransaction}
            onResetToEmpty={handleResetToEmpty}
            onRestoreBackup={handleRestoreBackup}
            onNavigateToLedger={() => setActiveTab('transactions')}
            theme={theme}
            onToggleTheme={toggleTheme}
            isNotificationPermissionGranted={isNotificationPermissionGranted}
            onOpenAndroidPermissionModal={() => setShowAndroidPermissionModal(true)}
            onSimulateDanaTransaction={(text) => handleProcessDetectedNotification(text)}
            onOpenNotificationCenter={() => setShowNotificationCenter(true)}
            rejectedCount={rejectedTransactions.length}
            pendingCount={pendingTransactions.length}
          />
        )}
      </main>

      {/* Edit User Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          wallets={wallets}
          onClose={() => setSelectedTransaction(null)}
          onSaveConfirmed={handleSaveConfirmedTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {/* Detection Tester Modal */}
      <DetectionTesterModal
        isOpen={showDetectionModal}
        onClose={() => setShowDetectionModal(false)}
        wallets={wallets}
        onProcessNotification={handleProcessDetectedNotification}
        onSaveTransaction={handleSaveTransaction}
        onConfirmPendingTransaction={handleConfirmPendingTransaction}
        onRejectPendingTransaction={handleRejectPendingTransaction}
        pendingTransactions={pendingTransactions}
        onNavigateToLedger={() => setActiveTab('transactions')}
        onOpenPermissionSettings={() => setShowAndroidPermissionModal(true)}
      />

      {/* Notification Center Modal (Pending Reviews, Rejected Archive & Simulation) */}
      <NotificationCenterModal
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        wallets={wallets}
        pendingNotifications={pendingTransactions}
        rejectedNotifications={rejectedTransactions}
        onConfirmTransaction={(tx) => handleConfirmPendingTransaction(tx.id)}
        onDismissNotification={(id) => handleRejectPendingTransaction(id)}
        onRestoreRejectedNotification={(id) => handleConfirmPendingTransaction(id)}
        onDeletePermanently={(id) => handleDeleteTransaction(id)}
        onInspectTransaction={(tx) => {
          setSelectedTransaction(tx);
          setShowNotificationCenter(false);
        }}
        onSimulateNewNotification={(text) => handleProcessDetectedNotification(text)}
      />

      {/* Financial Report Export Modal (PDF, CSV, JSON) */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        transactions={confirmedTransactions}
        wallets={wallets}
        savingsGoals={savingsGoals}
        userProfile={userProfile}
      />

      {/* Android Notification Permission & Live Testing Modal */}
      <AndroidPermissionModal
        isOpen={showAndroidPermissionModal}
        onClose={() => setShowAndroidPermissionModal(false)}
        isPermissionGranted={isNotificationPermissionGranted}
        onPermissionChanged={handlePermissionChanged}
        onSimulateDanaTransaction={(text) => handleProcessDetectedNotification(text)}
      />

      {/* Bottom Floating Navigation Bar */}
      <BottomNav
        activeTab={activeTab === ('ledger' as any) ? 'transactions' : activeTab}
        onSelectTab={setActiveTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
