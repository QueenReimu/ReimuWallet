import * as SQLite from 'expo-sqlite';
import { SavingsGoal, NewSavingsGoalInput } from '../../types/savings';

export async function insertSavingsGoal(
  db: SQLite.SQLiteDatabase,
  input: NewSavingsGoalInput
): Promise<SavingsGoal> {
  const id = `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO savings_goals (
      id, name, target_amount, current_amount, target_date, icon, color, badge, is_completed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?);`,
    [
      id,
      input.name,
      input.targetAmount,
      input.currentAmount || 0,
      input.targetDate || null,
      input.icon || 'savings',
      input.color || '#FF3E00',
      input.badge || null,
      now,
      now,
    ]
  );

  return {
    id,
    name: input.name,
    targetAmount: input.targetAmount,
    currentAmount: input.currentAmount || 0,
    targetDate: input.targetDate,
    icon: input.icon || 'savings',
    color: input.color || '#FF3E00',
    badge: input.badge,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateSavingsGoal(
  db: SQLite.SQLiteDatabase,
  id: string,
  input: Partial<SavingsGoal>
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE savings_goals SET
      name = COALESCE(?, name),
      target_amount = COALESCE(?, target_amount),
      current_amount = COALESCE(?, current_amount),
      target_date = COALESCE(?, target_date),
      icon = COALESCE(?, icon),
      color = COALESCE(?, color),
      badge = COALESCE(?, badge),
      is_completed = COALESCE(?, is_completed),
      updated_at = ?
    WHERE id = ?;`,
    [
      input.name ?? null,
      input.targetAmount ?? null,
      input.currentAmount ?? null,
      input.targetDate ?? null,
      input.icon ?? null,
      input.color ?? null,
      input.badge ?? null,
      input.isCompleted !== undefined ? (input.isCompleted ? 1 : 0) : null,
      now,
      id,
    ]
  );
}

export async function deleteSavingsGoal(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM savings_goals WHERE id = ?;', [id]);
}

export async function getSavingsGoals(db: SQLite.SQLiteDatabase): Promise<SavingsGoal[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM savings_goals ORDER BY is_completed ASC, created_at ASC;'
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    targetAmount: r.target_amount,
    currentAmount: r.current_amount,
    targetDate: r.target_date,
    icon: r.icon,
    color: r.color,
    badge: r.badge,
    isCompleted: r.is_completed === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}
