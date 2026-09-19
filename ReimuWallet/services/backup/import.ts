import { backupFileSchema } from '../../utils/validation';
import { BackupDataPayload } from './export';

export interface ValidationImportResult {
  valid: boolean;
  error?: string;
  data?: BackupDataPayload;
  stats?: {
    walletCount: number;
    transactionCount: number;
    budgetCount: number;
    savingsCount: number;
  };
}

export function validateAndParseBackup(jsonString: string): ValidationImportResult {
  try {
    const raw = JSON.parse(jsonString);
    const parsed = backupFileSchema.safeParse(raw);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return {
        valid: false,
        error: `Invalid backup file format: ${issue?.path.join('.')} - ${issue?.message}`,
      };
    }

    const payload = raw as BackupDataPayload;

    if (!Array.isArray(payload.wallets) || !Array.isArray(payload.transactions)) {
      return {
        valid: false,
        error: 'Backup file must contain valid wallets and transactions arrays.',
      };
    }

    return {
      valid: true,
      data: payload,
      stats: {
        walletCount: payload.wallets.length,
        transactionCount: payload.transactions.length,
        budgetCount: payload.budgets?.length || 0,
        savingsCount: payload.savingsGoals?.length || 0,
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Failed to parse JSON backup: ${err?.message || 'Invalid syntax'}`,
    };
  }
}
