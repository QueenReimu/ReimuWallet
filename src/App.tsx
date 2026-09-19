/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ActiveTab, Transaction, Wallet, SavingsGoal, UserProfile } from './types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_WALLETS,
  INITIAL_GOALS,
} from './data/mockData';
import { BackupDataPayload } from './utils/backupUtils';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { LedgerView } from './components/LedgerView';
import { InstantEntryView } from './components/InstantEntryView';
import { InsightsView } from './components/InsightsView';
import { VaultView } from './components/VaultView';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { DetectionTesterModal } from './components/DetectionTesterModal';
import { EditProfileModal } from './components/EditProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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
  const [instantEntryInitialType, setInstantEntryInitialType] = useState<'expense' | 'income'>('expense');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('reimu_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

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
    if (payload.wallets) {
      setWallets(payload.wallets);
      localStorage.setItem('reimu_wallets', JSON.stringify(payload.wallets));
    }
    if (payload.transactions) {
      setTransactions(payload.transactions);
      localStorage.setItem('reimu_transactions', JSON.stringify(payload.transactions));
    }
    if (payload.savingsGoals) {
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

  // Handle saving new transaction
  const handleSaveTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };

    // 1. Prepend new transaction to persistent state so it shows at the top of the ledger
    setTransactions((prev) => [created, ...prev]);

    // 2. Mathematically update affected wallets
    setWallets((prev) =>
      prev.map((w) => {
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
      })
    );

    // 3. Immediately transition view to 'transactions' (the ledger tab)
    setActiveTab('transactions');
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
    <div className="min-h-screen bg-[#0D0F14] text-[#F1F5F9] flex flex-col justify-between selection:bg-[#FF5E36] selection:text-white font-sans">
      {/* Persistent Sanctuary App Bar */}
      <Header
        activeTab={activeTab}
        userProfile={userProfile}
        onProfileClick={() => setShowEditProfileModal(true)}
        onNavigate={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-2 pb-24">
        {/* Dynamic Android Notification Detection Pill */}
        {showNotificationToast && activeTab !== 'instant-entry' && (
          <div className="mb-3.5 p-3 rounded-xl bg-[#151921] border border-[#28303F] flex items-center justify-between gap-2.5 transition-all">
            <div
              onClick={() => setShowDetectionModal(true)}
              className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2A1711] border border-[#FF5E36]/30 flex items-center justify-center text-[#FF5E36] shrink-0">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-caps text-[9px] text-[#FF5E36] font-bold uppercase tracking-[0.15em]">
                    Deteksi Otomatis
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">
                    {transactions.length === 0 ? 'Mode Pengujian Siap' : 'DANA / Bank • Siap'}
                  </span>
                </div>
                <span className="font-body-md text-[13px] font-semibold text-[#F1F5F9] truncate">
                  {transactions.length === 0
                    ? 'Uji Baca Notifikasi & SMS (BCA, DANA, GoPay)'
                    : 'Uji deteksi notifikasi mutasi secara langsung'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowDetectionModal(true)}
                className="px-2.5 py-1 rounded-lg bg-[#FF5E36] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#E04822] active:scale-95 transition-all"
              >
                Uji Coba
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

        {/* View Switcher */}
        {activeTab === 'dashboard' && (
          <DashboardView
            wallets={wallets}
            transactions={transactions}
            userProfile={userProfile}
            onOpenEditProfile={() => setShowEditProfileModal(true)}
            onNavigate={setActiveTab}
            onOpenInstantEntryWithType={handleOpenInstantEntryWithType}
          />
        )}

        {(activeTab === 'transactions' || (activeTab as string) === 'ledger') && (
          <LedgerView
            transactions={transactions}
            wallets={wallets}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            onDeleteTransaction={handleDeleteTransaction}
            onExportLedger={() => alert('Mengekspor CSV & JSON Buku Kas September 2026...')}
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
            transactions={transactions}
            wallets={wallets}
            savingsGoals={savingsGoals}
            onNavigateToInstantEntry={() => setActiveTab('instant-entry')}
          />
        )}

        {(activeTab === 'vault-settings' || (activeTab as string) === 'vault') && (
          <VaultView
            wallets={wallets}
            savingsGoals={savingsGoals}
            transactions={transactions}
            totalTransactionsCount={transactions.length}
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

      {/* Top Banner Detection Tester Modal */}
      <DetectionTesterModal
        isOpen={showDetectionModal}
        onClose={() => setShowDetectionModal(false)}
        wallets={wallets}
        onSaveTransaction={handleSaveTransaction}
        onNavigateToLedger={() => setActiveTab('transactions')}
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
