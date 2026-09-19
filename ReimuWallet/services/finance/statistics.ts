import { Transaction } from '../../types/transaction';
import { Wallet } from '../../types/wallet';
import { calculateWalletBalance } from './balance';

export interface CategoryDistributionItem {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface DailySpendingItem {
  day: number;
  date: string;
  amount: number;
}

export interface MonthlyComparisonItem {
  month: string;
  income: number;
  expense: number;
}

export function calculateCategoryDistribution(
  transactions: Transaction[],
  monthStr?: string
): CategoryDistributionItem[] {
  const filtered = transactions.filter((tx) => {
    if (!tx.confirmed || tx.type !== 'expense') return false;
    if (monthStr && !tx.date.startsWith(monthStr)) return false;
    return true;
  });

  const totalExpense = filtered.reduce((sum, tx) => sum + tx.amount, 0);
  if (totalExpense === 0) return [];

  const categoryMap: Record<string, { name: string; color: string; amount: number }> = {};

  for (const tx of filtered) {
    const key = tx.categoryId || 'other';
    const name = tx.categoryName || 'Other';
    const color = tx.categoryColor || '#FF3E00';

    if (!categoryMap[key]) {
      categoryMap[key] = { name, color, amount: 0 };
    }
    categoryMap[key].amount += tx.amount;
  }

  return Object.entries(categoryMap)
    .map(([categoryId, data]) => ({
      categoryId,
      name: data.name,
      color: data.color,
      amount: data.amount,
      percentage: Math.round((data.amount / totalExpense) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculateDailySpending(
  transactions: Transaction[],
  monthStr: string
): DailySpendingItem[] {
  const filtered = transactions.filter(
    (tx) => tx.confirmed && tx.type === 'expense' && tx.date.startsWith(monthStr)
  );

  const [year, month] = monthStr.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();

  const dailyMap: Record<number, number> = {};
  for (let i = 1; i <= totalDays; i++) {
    dailyMap[i] = 0;
  }

  for (const tx of filtered) {
    const day = parseInt(tx.date.split('-')[2], 10);
    if (dailyMap[day] !== undefined) {
      dailyMap[day] += tx.amount;
    }
  }

  return Object.entries(dailyMap).map(([dayStr, amount]) => {
    const day = Number(dayStr);
    const date = `${monthStr}-${String(day).padStart(2, '0')}`;
    return { day, date, amount };
  });
}

export function calculateWalletDistribution(
  wallets: Wallet[],
  transactions: Transaction[]
): { walletId: string; name: string; color: string; balance: number; percentage: number }[] {
  const balances = wallets.map((w) => ({
    walletId: w.id,
    name: w.name,
    color: w.color,
    balance: Math.max(0, calculateWalletBalance(w, transactions)),
  }));

  const total = balances.reduce((sum, b) => sum + b.balance, 0);
  if (total === 0) return [];

  return balances.map((b) => ({
    ...b,
    percentage: Math.round((b.balance / total) * 100),
  }));
}
