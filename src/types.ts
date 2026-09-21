export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionStatus = 'pending' | 'confirmed' | 'rejected';
export type TransactionSource = 'manual' | 'notification' | 'import';

export interface Transaction {
  id: string;
  title: string;
  category: string;
  type: TransactionType;
  amount: number;
  wallet: string;
  targetWallet?: string;
  date: string; // e.g. '2026-09-02'
  time: string; // e.g. '14:20'
  note?: string;
  hasReceipt?: boolean;
  rawNotification?: string;
  source?: TransactionSource;
  status?: TransactionStatus;
  notificationHash?: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'pocket' | 'bank' | 'ewallet' | 'vault';
  accountNumber?: string;
  balance: number;
  targetMoney?: number;
  icon: string;
  isPrimary?: boolean;
  isLocked?: boolean;
  colorClass?: string;
  monthlyTransactionsCount?: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetDate: string; // e.g. 'Dec 2026'
  monthsLeft: number;
  currentAmount: number;
  targetAmount: number;
  monthlyPace: number;
  icon: string;
  accentColor: string;
  badge?: string;
}

export interface CategoryBudget {
  category: string;
  subtitle: string;
  spent: number;
  allocated: number;
  icon: string;
  colorClass: string;
}

export interface InterWalletTransfer {
  id: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  dateStr: string;
  tag: string;
}

export interface PresetItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
  walletName?: string;
}

export type ActiveTab = 'dashboard' | 'transactions' | 'instant-entry' | 'analytics' | 'vault-settings';
export type InsightsSubTab = 'overview' | 'budget' | 'audit';
export type VaultSubTab = 'accounts' | 'goals' | 'settings';

export interface UserProfile {
  name: string;
  avatarUrl?: string;
  tagline?: string;
}
