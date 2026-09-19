import * as SQLite from 'expo-sqlite';
import { Wallet, NewWalletInput } from '../../types/wallet';

export async function insertWallet(
  db: SQLite.SQLiteDatabase,
  input: NewWalletInput
): Promise<Wallet> {
  const id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO wallets (
      id, name, type, initial_balance, icon, color, account_number, is_primary, is_locked, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?);`,
    [
      id,
      input.name,
      input.type,
      input.initialBalance || 0,
      input.icon || 'account-balance-wallet',
      input.color || '#FF3E00',
      input.accountNumber || null,
      input.isPrimary ? 1 : 0,
      now,
      now,
    ]
  );

  return {
    id,
    name: input.name,
    type: input.type,
    initialBalance: input.initialBalance || 0,
    balance: input.initialBalance || 0,
    icon: input.icon || 'account-balance-wallet',
    color: input.color || '#FF3E00',
    accountNumber: input.accountNumber,
    isPrimary: input.isPrimary || false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateWallet(
  db: SQLite.SQLiteDatabase,
  id: string,
  input: Partial<NewWalletInput>
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE wallets SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      initial_balance = COALESCE(?, initial_balance),
      icon = COALESCE(?, icon),
      color = COALESCE(?, color),
      account_number = COALESCE(?, account_number),
      is_primary = COALESCE(?, is_primary),
      updated_at = ?
    WHERE id = ?;`,
    [
      input.name ?? null,
      input.type ?? null,
      input.initialBalance ?? null,
      input.icon ?? null,
      input.color ?? null,
      input.accountNumber ?? null,
      input.isPrimary !== undefined ? (input.isPrimary ? 1 : 0) : null,
      now,
      id,
    ]
  );
}

export async function deleteWallet(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM wallets WHERE id = ?;', [id]);
}

export async function getWallets(db: SQLite.SQLiteDatabase): Promise<Wallet[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM wallets ORDER BY is_primary DESC, created_at ASC;'
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    initialBalance: r.initial_balance,
    balance: r.initial_balance, // Store will calculate dynamic derived balance
    icon: r.icon,
    color: r.color,
    accountNumber: r.account_number,
    isPrimary: r.is_primary === 1,
    isLocked: r.is_locked === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}
