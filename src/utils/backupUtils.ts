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
  const finalName = filename || `ReimuWallet_Backup_${dateStr}.json`;
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateBackupJson(jsonString: string): BackupValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Format file cadangan tidak valid (bukan objek JSON).' };
    }

    if (!Array.isArray(parsed.wallets) && !Array.isArray(parsed.transactions)) {
      return {
        valid: false,
        error: 'File cadangan harus memiliki setidaknya daftar dompet atau transaksi yang valid.',
      };
    }

    const payload: BackupDataPayload = {
      version: parsed.version || '1.0.0',
      app: 'ReimuWallet',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      userProfile: parsed.userProfile,
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [],
      theme: parsed.theme === 'light' ? 'light' : 'dark',
    };

    return {
      valid: true,
      payload,
      stats: {
        walletCount: payload.wallets.length,
        transactionCount: payload.transactions.length,
        goalCount: payload.savingsGoals.length,
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Gagal membaca file JSON: ${err?.message || 'Sintaks tidak valid'}`,
    };
  }
}
