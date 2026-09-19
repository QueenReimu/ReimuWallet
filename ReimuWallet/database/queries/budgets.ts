import * as SQLite from 'expo-sqlite';
import { Budget } from '../../types/budget';

export async function upsertBudget(
  db: SQLite.SQLiteDatabase,
  categoryId: string,
  monthlyLimit: number,
  month: string
): Promise<Budget> {
  const id = `b-${categoryId}-${month}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT OR REPLACE INTO budgets (id, category_id, monthly_limit, month, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, categoryId, monthlyLimit, month, now, now]
  );

  return {
    id,
    categoryId,
    monthlyLimit,
    month,
    createdAt: now,
    updatedAt: now,
  };
}

export async function deleteBudget(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM budgets WHERE id = ?;', [id]);
}

export async function getBudgetsForMonth(
  db: SQLite.SQLiteDatabase,
  month: string
): Promise<Budget[]> {
  const query = `
    SELECT 
      b.id, b.category_id as categoryId, b.monthly_limit as monthlyLimit, b.month,
      b.created_at as createdAt, b.updated_at as updatedAt,
      c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.month = ?
    ORDER BY b.monthly_limit DESC;
  `;

  return await db.getAllAsync<Budget>(query, [month]);
}
