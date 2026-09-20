import { Transaction, Wallet, SavingsGoal, UserProfile } from '../types';

export interface BackupDataPayload {
  version: string;
  app: 'ReimuWallet';
  exportedAt: string;
  userProfile?: UserProfile;
  wallets: Wallet[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  theme?: string;
}

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  payload?: BackupDataPayload;
  stats?: {
    walletCount: number;
    transactionCount: number;
    goalCount: number;
    totalBalance?: number;
    userName?: string;
  };
}

export interface GenerateBackupOptions {
  wallets: Wallet[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  userProfile?: UserProfile;
  theme?: string;
}

export function generateBackupJson(
  walletsOrOptions: Wallet[] | GenerateBackupOptions,
  transactions?: Transaction[],
  savingsGoals?: SavingsGoal[],
  userProfile?: UserProfile,
  theme?: string
): string {
  let w: Wallet[];
  let t: Transaction[];
  let g: SavingsGoal[];
  let p: UserProfile | undefined;
  let th: string | undefined;

  if (Array.isArray(walletsOrOptions)) {
    w = walletsOrOptions;
    t = transactions || [];
    g = savingsGoals || [];
    p = userProfile;
    th = theme;
  } else {
    w = walletsOrOptions.wallets || [];
    t = walletsOrOptions.transactions || [];
    g = walletsOrOptions.savingsGoals || [];
    p = walletsOrOptions.userProfile;
    th = walletsOrOptions.theme;
  }

  const payload: BackupDataPayload = {
    version: '1.0.0',
    app: 'ReimuWallet',
    exportedAt: new Date().toISOString(),
    userProfile: p,
    wallets: w,
    transactions: t,
    savingsGoals: g,
    theme: th,
  };

  return JSON.stringify(payload, null, 2);
}

export function downloadBackupFile(jsonString: string, filename?: string) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const finalName = filename || `ReimuWallet_Backup_${dateStr}_${timeStr}.json`;
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function validateBackupJson(jsonInput: string | object): BackupValidationResult {
  try {
    let parsed: any;
    if (typeof jsonInput === 'string') {
      const trimmed = jsonInput.trim();
      if (!trimmed) {
        return { valid: false, error: 'Data JSON kosong. Silakan pilih berkas atau masukkan teks JSON.' };
      }
      parsed = JSON.parse(trimmed);
    } else {
      parsed = jsonInput;
    }

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Format berkas cadangan tidak valid (harus berupa objek JSON).' };
    }

    // Support nested { data: { ... } } if present
    const root = parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)
      ? parsed.data
      : parsed;

    // Support raw transactions array if exported as array
    if (Array.isArray(root)) {
      const isTransactions = root.every((item) => item && typeof item === 'object' && ('amount' in item || 'category' in item));
      if (isTransactions) {
        const payload: BackupDataPayload = {
          version: '1.0.0',
          app: 'ReimuWallet',
          exportedAt: new Date().toISOString(),
          wallets: [],
          transactions: root,
          savingsGoals: [],
          theme: 'dark',
        };
        return {
          valid: true,
          payload,
          stats: {
            walletCount: 0,
            transactionCount: root.length,
            goalCount: 0,
            totalBalance: 0,
          },
        };
      }
    }

    const rawWallets = Array.isArray(root.wallets) ? root.wallets : [];
    const rawTransactions = Array.isArray(root.transactions) ? root.transactions : [];
    const rawGoals = Array.isArray(root.savingsGoals)
      ? root.savingsGoals
      : Array.isArray(root.goals)
      ? root.goals
      : [];

    if (rawWallets.length === 0 && rawTransactions.length === 0 && rawGoals.length === 0) {
      return {
        valid: false,
        error: 'Berkas cadangan tidak berisi daftar dompet, transaksi kas, atau celengan yang dapat dipulihkan.',
      };
    }

    const totalBalance = rawWallets.reduce((acc: number, w: any) => acc + (Number(w.balance) || 0), 0);

    const payload: BackupDataPayload = {
      version: root.version || '1.0.0',
      app: 'ReimuWallet',
      exportedAt: root.exportedAt || new Date().toISOString(),
      userProfile: root.userProfile,
      wallets: rawWallets,
      transactions: rawTransactions,
      savingsGoals: rawGoals,
      theme: root.theme === 'light' ? 'light' : 'dark',
    };

    return {
      valid: true,
      payload,
      stats: {
        walletCount: payload.wallets.length,
        transactionCount: payload.transactions.length,
        goalCount: payload.savingsGoals.length,
        totalBalance,
        userName: payload.userProfile?.name,
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Gagal membaca berkas JSON: ${err?.message || 'Sintaks format JSON tidak valid'}`,
    };
  }
}
