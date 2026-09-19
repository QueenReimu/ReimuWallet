import { Wallet } from '../types/wallet';
import { Transaction } from '../types/transaction';
import { calculateWalletBalance, calculateTotalAssets } from '../services/finance/balance';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalTransfers,
  calculateSavingsRate,
} from '../services/finance/calculations';

/**
 * Section 28: Financial Accuracy Automated Test
 */
export function runFinancialAccuracyTest(): { passed: boolean; details: Record<string, any> } {
  // 1. Initial State
  const bankWallet: Wallet = {
    id: 'wallet-bank',
    name: 'Bank',
    type: 'bank',
    balance: 1000000,
    initialBalance: 1000000,
    icon: 'account-balance',
    color: '#3B82F6',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const danaWallet: Wallet = {
    id: 'wallet-dana',
    name: 'DANA',
    type: 'ewallet',
    balance: 200000,
    initialBalance: 200000,
    icon: 'account-balance-wallet',
    color: '#FF3E00',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const wallets = [bankWallet, danaWallet];

  // 2. Transactions
  const transactions: Transaction[] = [
    // Bank expense = Rp100.000
    {
      id: 'tx-1',
      type: 'expense',
      amount: 100000,
      walletId: 'wallet-bank',
      description: 'Bank expense',
      date: '2026-09-02',
      createdAt: '2026-09-02T10:00:00Z',
      updatedAt: '2026-09-02T10:00:00Z',
      source: 'manual',
      confirmed: true,
    },
    // Bank income = Rp300.000
    {
      id: 'tx-2',
      type: 'income',
      amount: 300000,
      walletId: 'wallet-bank',
      description: 'Bank income',
      date: '2026-09-02',
      createdAt: '2026-09-02T11:00:00Z',
      updatedAt: '2026-09-02T11:00:00Z',
      source: 'manual',
      confirmed: true,
    },
    // Bank -> DANA transfer = Rp200.000
    {
      id: 'tx-3',
      type: 'transfer',
      amount: 200000,
      walletId: 'wallet-bank',
      destinationWalletId: 'wallet-dana',
      description: 'Bank to DANA top-up',
      date: '2026-09-02',
      createdAt: '2026-09-02T12:00:00Z',
      updatedAt: '2026-09-02T12:00:00Z',
      source: 'manual',
      confirmed: true,
    },
  ];

  // 3. Execution & Verification
  const calculatedBankBalance = calculateWalletBalance(bankWallet, transactions);
  const calculatedDanaBalance = calculateWalletBalance(danaWallet, transactions);
  const calculatedTotalAssets = calculateTotalAssets(wallets, transactions);

  const calculatedTotalIncome = calculateTotalIncome(transactions);
  const calculatedTotalExpense = calculateTotalExpenses(transactions);
  const calculatedTotalTransfer = calculateTotalTransfers(transactions);

  const bankCorrect = calculatedBankBalance === 1000000;
  const danaCorrect = calculatedDanaBalance === 400000;
  const totalAssetsCorrect = calculatedTotalAssets === 1400000;
  const incomeCorrect = calculatedTotalIncome === 300000;
  const expenseCorrect = calculatedTotalExpense === 100000;
  const transferCorrect = calculatedTotalTransfer === 200000;

  const passed =
    bankCorrect &&
    danaCorrect &&
    totalAssetsCorrect &&
    incomeCorrect &&
    expenseCorrect &&
    transferCorrect;

  return {
    passed,
    details: {
      bank: { expected: 1000000, actual: calculatedBankBalance, passed: bankCorrect },
      dana: { expected: 400000, actual: calculatedDanaBalance, passed: danaCorrect },
      totalAssets: { expected: 1400000, actual: calculatedTotalAssets, passed: totalAssetsCorrect },
      totalIncome: { expected: 300000, actual: calculatedTotalIncome, passed: incomeCorrect },
      totalExpense: { expected: 100000, actual: calculatedTotalExpense, passed: expenseCorrect },
      totalTransfer: { expected: 200000, actual: calculatedTotalTransfer, passed: transferCorrect },
    },
  };
}

// Self-execution when run via Node
if (typeof require !== 'undefined' && require.main === module) {
  const result = runFinancialAccuracyTest();
  console.log('--- REIMUWALLET SECTION 28 FINANCIAL ACCURACY TEST ---');
  console.log('Result:', result.passed ? 'PASSED (100% Accuracy)' : 'FAILED');
  console.log(JSON.stringify(result.details, null, 2));
  if (!result.passed) {
    process.exit(1);
  }
}
