import * as SQLite from 'expo-sqlite';
import { SQL_SCHEMA } from './schema';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants/categories';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await SQLite.openDatabaseAsync('reimuwallet.db');
    await initializeDatabase(dbInstance);
    return dbInstance;
  } catch (error) {
    console.warn('Native SQLite open failed, creating fallback connection', error);
    // In Expo Go or mock environment, handle gracefully
    throw error;
  }
}

export async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Run table creations
  await db.execAsync(SQL_SCHEMA.CREATE_WALLETS_TABLE);
  await db.execAsync(SQL_SCHEMA.CREATE_CATEGORIES_TABLE);
  await db.execAsync(SQL_SCHEMA.CREATE_TRANSACTIONS_TABLE);
  await db.execAsync(SQL_SCHEMA.CREATE_BUDGETS_TABLE);
  await db.execAsync(SQL_SCHEMA.CREATE_SAVINGS_GOALS_TABLE);
  await db.execAsync(SQL_SCHEMA.CREATE_SETTINGS_TABLE);
  await db.execAsync(SQL_SCHEMA.CREATE_INDEXES);

  // Initialize default categories if empty (essential for category lookups)
  const catCountResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories;'
  );

  if (!catCountResult || catCountResult.count === 0) {
    const now = new Date().toISOString();
    for (const c of [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
      await db.runAsync(
        `INSERT OR IGNORE INTO categories (id, name, type, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [c.id, c.name, c.type, c.icon, c.color, now, now]
      );
    }
  }
}
