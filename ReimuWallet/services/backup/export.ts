import { Transaction } from '../../types/transaction';
import { Wallet } from '../../types/wallet';
import { Budget } from '../../types/budget';
import { SavingsGoal } from '../../types/savings';
import { APP_CONFIG } from '../../constants/config';

export interface BackupDataPayload {
  version: string;
  app: 'ReimuWallet';
  exportedAt: string;
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  settings: Record<string, any>;
}

export function generateJsonBackup(
  wallets: Wallet[],
  transactions: Transaction[],
  budgets: Budget[],
  savingsGoals: SavingsGoal[],
  settings: Record<string, any> = {}
): string {
  const payload: BackupDataPayload = {
    version: APP_CONFIG.version,
    app: 'ReimuWallet',
    exportedAt: new Date().toISOString(),
    wallets,
    transactions,
    budgets,
    savingsGoals,
    settings,
  };

  return JSON.stringify(payload, null, 2);
}

export function generateCsvTransactions(transactions: Transaction[]): string {
  const headers = [
    'ID',
    'Date',
    'Time',
    'Type',
    'Amount',
    'Description',
    'Category',
    'Wallet ID',
    'Destination Wallet ID',
    'Confirmed',
    'Source',
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.time || '',
    t.type,
    t.amount.toString(),
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.categoryName || t.categoryId || '').replace(/"/g, '""')}"`,
    t.walletId,
    t.destinationWalletId || '',
    t.confirmed ? 'YES' : 'NO',
    t.source,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
