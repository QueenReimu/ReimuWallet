import * as SQLite from 'expo-sqlite';
import { DefaultCategory } from '../../constants/categories';

export async function getAllCategories(db: SQLite.SQLiteDatabase): Promise<DefaultCategory[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT id, name, type, icon, color FROM categories ORDER BY type ASC, name ASC;'
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as 'expense' | 'income',
    icon: r.icon,
    color: r.color,
  }));
}

export async function insertCustomCategory(
  db: SQLite.SQLiteDatabase,
  category: Omit<DefaultCategory, 'id'>
): Promise<DefaultCategory> {
  const id = `cat-custom-${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO categories (id, name, type, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, category.name, category.type, category.icon, category.color, now, now]
  );

  return {
    id,
    ...category,
  };
}
