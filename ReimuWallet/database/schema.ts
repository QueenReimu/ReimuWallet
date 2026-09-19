export const SQL_SCHEMA = {
  CREATE_WALLETS_TABLE: `
    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      initial_balance REAL NOT NULL DEFAULT 0,
      icon TEXT NOT NULL DEFAULT 'account-balance-wallet',
      color TEXT NOT NULL DEFAULT '#FF3E00',
      account_number TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,

  CREATE_CATEGORIES_TABLE: `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'expense' | 'income'
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,

  CREATE_TRANSACTIONS_TABLE: `
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL, -- 'income' | 'expense' | 'transfer'
      amount REAL NOT NULL,
      category_id TEXT,
      wallet_id TEXT NOT NULL,
      destination_wallet_id TEXT,
      description TEXT NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      time TEXT,          -- HH:mm
      receipt_uri TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      confirmed INTEGER NOT NULL DEFAULT 1,
      raw_notification_text TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON DELETE CASCADE,
      FOREIGN KEY (destination_wallet_id) REFERENCES wallets (id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    );
  `,

  CREATE_BUDGETS_TABLE: `
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      month TEXT NOT NULL, -- YYYY-MM
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    );
  `,

  CREATE_SAVINGS_GOALS_TABLE: `
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      target_date TEXT,
      icon TEXT NOT NULL DEFAULT 'savings',
      color TEXT NOT NULL DEFAULT '#FF3E00',
      badge TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,

  CREATE_SETTINGS_TABLE: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions (wallet_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets (month);
  `,
};
