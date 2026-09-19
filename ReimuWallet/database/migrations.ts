import * as SQLite from 'expo-sqlite';
import { DEFAULT_EXPENSE_CATEGORIES } from '../constants/categories';

/**
 * Seeds optional sample data for testing/development.
 * Does NOT run automatically in production.
 */
export async function seedDevelopmentSampleData(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  // 1. Wallets
  await db.runAsync(
    `INSERT OR REPLACE INTO wallets (id, name, type, initial_balance, icon, color, is_primary, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['w-cash', 'Physical Cash', 'cash', 350000, 'payments', '#F59E0B', 0, now, now]
  );

  await db.runAsync(
    `INSERT OR REPLACE INTO wallets (id, name, type, initial_balance, icon, color, is_primary, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['w-bank', 'BCA Main Account', 'bank', 2500000, 'account-balance', '#3B82F6', 1, now, now]
  );

  await db.runAsync(
    `INSERT OR REPLACE INTO wallets (id, name, type, initial_balance, icon, color, is_primary, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['w-dana', 'DANA Balance', 'ewallet', 400000, 'account-balance-wallet', '#FF3E00', 0, now, now]
  );

  await db.runAsync(
    `INSERT OR REPLACE INTO wallets (id, name, type, initial_balance, icon, color, is_primary, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['w-gopay', 'GoPay Wallet', 'ewallet', 300000, 'two-wheeler', '#10B981', 0, now, now]
  );

  // 2. Sample Transactions
  const sampleTransactions = [
    {
      id: 'tx-1',
      type: 'expense',
      amount: 25000,
      categoryId: 'cat-food',
      walletId: 'w-dana',
      description: 'Lunch with Reimu',
      date: '2026-09-02',
      time: '12:30',
      source: 'manual',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 18000,
      categoryId: 'cat-transport',
      walletId: 'w-gopay',
      description: 'Transit to shrine gate',
      date: '2026-09-02',
      time: '14:15',
      source: 'notification',
    },
    {
      id: 'tx-3',
      type: 'income',
      amount: 250000,
      categoryId: 'cat-freelance',
      walletId: 'w-bank',
      description: 'Freelance Retainer',
      date: '2026-09-01',
      time: '17:00',
      source: 'manual',
    },
    {
      id: 'tx-4',
      type: 'transfer',
      amount: 100000,
      walletId: 'w-bank',
      destinationWalletId: 'w-dana',
      description: 'Bank to DANA Top-Up',
      date: '2026-09-01',
      time: '09:00',
      source: 'manual',
    },
  ];

  for (const tx of sampleTransactions) {
    await db.runAsync(
      `INSERT OR REPLACE INTO transactions (id, type, amount, category_id, wallet_id, destination_wallet_id, description, date, time, source, confirmed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?);`,
      [
        tx.id,
        tx.type,
        tx.amount,
        tx.categoryId || null,
        tx.walletId,
        tx.destinationWalletId || null,
        tx.description,
        tx.date,
        tx.time,
        tx.source,
        now,
        now,
      ]
    );
  }

  // 3. Budgets
  await db.runAsync(
    `INSERT OR REPLACE INTO budgets (id, category_id, monthly_limit, month, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ['b-food-2026-09', 'cat-food', 500000, '2026-09', now, now]
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO budgets (id, category_id, monthly_limit, month, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ['b-trans-2026-09', 'cat-transport', 300000, '2026-09', now, now]
  );

  // 4. Savings Goals
  await db.runAsync(
    `INSERT OR REPLACE INTO savings_goals (id, name, target_amount, current_amount, target_date, icon, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['g-pc', 'New PC', 7000000, 3500000, '2026-12-31', 'desktop-windows', '#FF3E00', now, now]
  );
}

/**
 * Resets the database to a completely clean, empty production state.
 */
export async function clearAllDatabaseData(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM budgets;
    DELETE FROM savings_goals;
    DELETE FROM wallets;
  `);
}
