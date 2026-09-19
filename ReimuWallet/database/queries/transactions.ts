import * as SQLite from 'expo-sqlite';
import { Transaction, NewTransactionInput, TransactionFilter } from '../../types/transaction';

export async function insertTransaction(
  db: SQLite.SQLiteDatabase,
  input: NewTransactionInput
): Promise<Transaction> {
  const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (
      id, type, amount, category_id, wallet_id, destination_wallet_id,
      description, date, time, receipt_uri, source, confirmed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.type,
      input.amount,
      input.categoryId || null,
      input.walletId,
      input.destinationWalletId || null,
      input.description,
      input.date,
      input.time || null,
      input.receiptUri || null,
      input.source || 'manual',
      input.confirmed !== undefined ? (input.confirmed ? 1 : 0) : 1,
      now,
      now,
    ]
  );

  return {
    id,
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    walletId: input.walletId,
    destinationWalletId: input.destinationWalletId,
    description: input.description,
    date: input.date,
    time: input.time,
    receiptUri: input.receiptUri,
    source: input.source || 'manual',
    confirmed: input.confirmed !== undefined ? input.confirmed : true,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateTransaction(
  db: SQLite.SQLiteDatabase,
  id: string,
  input: Partial<NewTransactionInput>
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE transactions SET
      type = COALESCE(?, type),
      amount = COALESCE(?, amount),
      category_id = COALESCE(?, category_id),
      wallet_id = COALESCE(?, wallet_id),
      destination_wallet_id = COALESCE(?, destination_wallet_id),
      description = COALESCE(?, description),
      date = COALESCE(?, date),
      time = COALESCE(?, time),
      receipt_uri = COALESCE(?, receipt_uri),
      updated_at = ?
    WHERE id = ?;`,
    [
      input.type ?? null,
      input.amount ?? null,
      input.categoryId ?? null,
      input.walletId ?? null,
      input.destinationWalletId ?? null,
      input.description ?? null,
      input.date ?? null,
      input.time ?? null,
      input.receiptUri ?? null,
      now,
      id,
    ]
  );
}

export async function deleteTransaction(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
}

export async function getTransactions(
  db: SQLite.SQLiteDatabase,
  filter?: TransactionFilter
): Promise<Transaction[]> {
  let query = `
    SELECT 
      t.id, t.type, t.amount, t.category_id as categoryId,
      t.wallet_id as walletId, t.destination_wallet_id as destinationWalletId,
      t.description, t.date, t.time, t.receipt_uri as receiptUri,
      t.source, t.confirmed, t.created_at as createdAt, t.updated_at as updatedAt,
      c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor,
      w.name as walletName,
      dw.name as destinationWalletName
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN wallets w ON t.wallet_id = w.id
    LEFT JOIN wallets dw ON t.destination_wallet_id = dw.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filter?.searchQuery) {
    query += ` AND (t.description LIKE ? OR c.name LIKE ? OR w.name LIKE ?)`;
    const term = `%${filter.searchQuery}%`;
    params.push(term, term, term);
  }

  if (filter?.type && filter.type !== 'all') {
    query += ` AND t.type = ?`;
    params.push(filter.type);
  }

  if (filter?.walletId) {
    query += ` AND (t.wallet_id = ? OR t.destination_wallet_id = ?)`;
    params.push(filter.walletId, filter.walletId);
  }

  if (filter?.categoryId) {
    query += ` AND t.category_id = ?`;
    params.push(filter.categoryId);
  }

  if (filter?.month) {
    query += ` AND t.date LIKE ?`;
    params.push(`${filter.month}%`);
  }

  query += ` ORDER BY t.date DESC, t.created_at DESC;`;

  const rows = await db.getAllAsync<any>(query, params);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    categoryIcon: r.categoryIcon,
    categoryColor: r.categoryColor,
    walletId: r.walletId,
    walletName: r.walletName,
    destinationWalletId: r.destinationWalletId,
    destinationWalletName: r.destinationWalletName,
    description: r.description,
    date: r.date,
    time: r.time,
    receiptUri: r.receiptUri,
    source: r.source,
    confirmed: r.confirmed === 1,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
