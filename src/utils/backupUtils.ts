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

export function cleanAndRepairJsonString(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // Strip Markdown code blocks if the user copied from chat or markdown: ```json ... ```
  if (str.startsWith('```')) {
    str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Remove potential UTF-8 Byte Order Mark (BOM) or zero-width spaces
  str = str.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');

  // If already parseable, return immediately
  try {
    JSON.parse(str);
    return str;
  } catch (initialErr) {
    // Attempt repairs
  }

  // Handle smart quotes / curly quotes that mobile keyboards often substitute
  str = str
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  // Fix "unterminated string in JSON" or truncated text:
  // Count unescaped quotes to check if a string literal was left open
  let inString = false;
  let isEscaped = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (ch === '\\') {
      isEscaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{' || ch === '[') {
        stack.push(ch);
      } else if (ch === '}' && stack.length && stack[stack.length - 1] === '{') {
        stack.pop();
      } else if (ch === ']' && stack.length && stack[stack.length - 1] === '[') {
        stack.pop();
      }
    }
  }

  // If loop ended inside an open string literal, close it
  if (inString) {
    str += '"';
  }

  // Remove trailing commas before closing braces/brackets e.g. ", }" -> " }"
  str = str.replace(/,\s*([}\]])/g, '$1');

  // Close any unclosed object/array brackets
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') str += '}';
    else if (last === '[') str += ']';
  }

  return str;
}

export function downloadBackupFile(jsonString: string, filename?: string): boolean {
  const dateStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const finalName = filename || `ReimuWallet_Backup_${dateStr}_${timeStr}.json`;

  try {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    link.setAttribute('download', finalName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    return true;
  } catch (err) {
    try {
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (dataErr) {
      console.error('Direct download failed:', dataErr);
      return false;
    }
  }
}

export async function shareOrSaveBackupFile(
  jsonString: string,
  filename?: string
): Promise<{ success: boolean; method: 'share' | 'download' | 'copy'; error?: string }> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const finalName = filename || `ReimuWallet_Backup_${dateStr}_${timeStr}.json`;

  // 1. First prioritize direct file download (Standard across all browsers, webviews, and Android)
  const downloaded = downloadBackupFile(jsonString, finalName);
  if (downloaded) {
    return { success: true, method: 'download' };
  }

  // 2. Try Web Share API as secondary method if direct download failed
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([jsonString], finalName, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Cadangan Reimu Wallet',
          text: `Berkas cadangan data keuangan Reimu Wallet (${finalName})`,
        });
        return { success: true, method: 'share' };
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        return { success: true, method: 'share' };
      }
      // Transient error like user gesture missing, ignore silently
    }
  }

  // 3. Final fallback: copy text to clipboard
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(jsonString);
      return { success: true, method: 'copy' };
    }
  } catch (clipErr: any) {
    // Clipboard failed
  }

  return {
    success: false,
    method: 'download',
    error: 'Tidak dapat mengunduh atau menyalin file di perangkat ini.',
  };
}

export function validateBackupJson(jsonInput: string | object): BackupValidationResult {
  try {
    let parsed: any;
    if (typeof jsonInput === 'string') {
      const trimmed = jsonInput.trim();
      if (!trimmed) {
        return { valid: false, error: 'Data JSON kosong. Silakan pilih berkas atau masukkan teks JSON.' };
      }
      
      try {
        parsed = JSON.parse(trimmed);
      } catch (firstErr) {
        // Attempt clean and repair (fixes unterminated strings, smart quotes, trailing commas, truncated brackets)
        const repaired = cleanAndRepairJsonString(trimmed);
        parsed = JSON.parse(repaired);
      }
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
