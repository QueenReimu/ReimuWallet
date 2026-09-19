import { Transaction } from '../../types/transaction';

/**
 * Calculates total confirmed income for a given transaction list.
 * STRICT: Transfers are NOT income.
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.confirmed && tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Calculates total confirmed expenses for a given transaction list.
 * STRICT: Transfers are NOT expenses.
 */
export function calculateTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.confirmed && tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Calculates total confirmed transfers for audit tracking.
 * STRICT: Transfers only move liquidity.
 */
export function calculateTotalTransfers(transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.confirmed && tx.type === 'transfer')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Net savings = Income - Expenses
 */
export function calculateNetSavings(transactions: Transaction[]): number {
  const income = calculateTotalIncome(transactions);
  const expense = calculateTotalExpenses(transactions);
  return income - expense;
}

/**
 * Savings rate = ((Income - Expense) / Income) * 100
 * Returns 0 if Income <= 0. Capped at 100%.
 */
export function calculateSavingsRate(income: number, expense: number): number {
  if (income <= 0) return 0;
  const savings = income - expense;
  if (savings <= 0) return 0;
  return Math.min(100, Math.round((savings / income) * 100));
}
