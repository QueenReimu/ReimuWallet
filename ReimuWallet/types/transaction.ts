export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  walletId: string;
  walletName?: string;
  destinationWalletId?: string; // Required for transfers
  destinationWalletName?: string;
  description: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  createdAt: string;
  updatedAt: string;
  receiptUri?: string;
  source: 'manual' | 'notification' | 'import';
  confirmed: boolean;
  rawNotificationText?: string;
}

export interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  categoryId?: string;
  walletId: string;
  destinationWalletId?: string;
  description: string;
  date: string;
  time?: string;
  receiptUri?: string;
  source?: 'manual' | 'notification' | 'import';
  confirmed?: boolean;
}

export interface TransactionFilter {
  searchQuery?: string;
  type?: TransactionType | 'all';
  walletId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  month?: string; // YYYY-MM
}

export interface DateGroupedTransactions {
  date: string;
  displayDate: string;
  totalIncome: number;
  totalExpense: number;
  transactions: Transaction[];
}
