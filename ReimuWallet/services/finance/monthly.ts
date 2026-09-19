import { Transaction } from '../../types/transaction';
import { calculateTotalIncome, calculateTotalExpenses, calculateSavingsRate } from './calculations';
import { getDaysInMonth } from '../../utils/dates';

export interface MonthlyFinanceSummary {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  transactionCount: number;
  averageDailySpending: number;
  largestExpense: Transaction | null;
  largestIncome: Transaction | null;
  mostExpensiveCategory: { name: string; amount: number } | null;
  mostUsedWalletId: string | null;
}

export function filterTransactionsByMonth(transactions: Transaction[], monthStr: string): Transaction[] {
  return transactions.filter((tx) => tx.date.startsWith(monthStr) && tx.confirmed);
}

export function calculateMonthlyFinanceSummary(
  monthStr: string,
  allTransactions: Transaction[]
): MonthlyFinanceSummary {
  const monthTxs = filterTransactionsByMonth(allTransactions, monthStr);
  const income = calculateTotalIncome(monthTxs);
  const expenses = calculateTotalExpenses(monthTxs);
  const savings = income - expenses;
  const savingsRate = calculateSavingsRate(income, expenses);

  const daysInMonth = getDaysInMonth(monthStr);
  const averageDailySpending = daysInMonth > 0 ? Math.round(expenses / daysInMonth) : 0;

  // Largest expense
  const expenseTxs = monthTxs.filter((t) => t.type === 'expense');
  const largestExpense = expenseTxs.length > 0
    ? expenseTxs.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), expenseTxs[0])
    : null;

  // Largest income
  const incomeTxs = monthTxs.filter((t) => t.type === 'income');
  const largestIncome = incomeTxs.length > 0
    ? incomeTxs.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), incomeTxs[0])
    : null;

  // Category spending aggregation
  const categoryMap: Record<string, number> = {};
  for (const tx of expenseTxs) {
    const catName = tx.categoryName || tx.categoryId || 'Other';
    categoryMap[catName] = (categoryMap[catName] || 0) + tx.amount;
  }

  let mostExpensiveCategory: { name: string; amount: number } | null = null;
  let maxCatAmount = 0;
  for (const [catName, catAmount] of Object.entries(categoryMap)) {
    if (catAmount > maxCatAmount) {
      maxCatAmount = catAmount;
      mostExpensiveCategory = { name: catName, amount: catAmount };
    }
  }

  // Most used wallet
  const walletUsageMap: Record<string, number> = {};
  for (const tx of monthTxs) {
    walletUsageMap[tx.walletId] = (walletUsageMap[tx.walletId] || 0) + 1;
  }

  let mostUsedWalletId: string | null = null;
  let maxCount = 0;
  for (const [wId, count] of Object.entries(walletUsageMap)) {
    if (count > maxCount) {
      maxCount = count;
      mostUsedWalletId = wId;
    }
  }

  return {
    month: monthStr,
    income,
    expenses,
    savings,
    savingsRate,
    transactionCount: monthTxs.length,
    averageDailySpending,
    largestExpense,
    largestIncome,
    mostExpensiveCategory,
    mostUsedWalletId,
  };
}
