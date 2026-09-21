/**
 * Centralized Currency Utilities for Indonesian Rupiah (IDR)
 * Strictly formats according to Section 20 of specifications:
 * Rp 25.000, Rp 100.000, Rp 1.500.000
 */

export function formatRupiah(amount: number, withPrefix = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withPrefix ? 'Rp 0' : '0';
  }

  // Rounded to avoid floating point decimals in currency display
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('id-ID');

  return withPrefix ? `Rp ${formatted}` : formatted;
}

export function parseRupiahInput(input: string): number {
  if (!input) return 0;
  // Remove non-digit characters except negative sign
  const cleaned = input.replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatCompactRupiah(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return formatRupiah(amount);
}

/**
 * Strictly extracts numeric Rupiah amounts only from numbers accompanied by 'Rp', 'Rp.', or 'IDR'.
 *
 * Rules:
 * 1. Must explicitly have Rp, Rp., or IDR prefix/suffix.
 * 2. Examples:
 *    - Rp28.000 -> 28000
 *    - Rp 28.000 -> 28000
 *    - Rp. 28.000 -> 28000
 *    - Rp1.500.000 -> 1500000
 *    - Rp 1.500.000,00 -> 1500000
 *    - IDR 28.000 -> 28000
 *    - IDR 1.500.000 -> 1500000
 *    - IDR28000 -> 28000
 * 3. MUST NOT extract account numbers (e.g. Rekening 0148927492), phone numbers (0812345678),
 *    dates (2026-09-02), times (14:20), OTP codes (492019), or reference IDs.
 * 4. If no clear Rp or IDR is present, returns 0.
 */
export function extractRupiahAmount(text: string): number {
  if (!text || typeof text !== 'string') return 0;

  // Prefix pattern: (Rp|Rp.|IDR) followed by number
  const prefixRegex = /(?:^|[^\w])(?:rp\.?|idr)\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?|[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]{3,10}(?:,[0-9]{1,2})?)/gi;

  // Suffix pattern: Number followed by (IDR|Rp|Rp.)
  const suffixRegex = /(?:^|[^\w])([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?|[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]{3,10}(?:,[0-9]{1,2})?)\s*(?:rp\.?|idr)(?=[^\w]|$)/gi;

  const parseMatchedNumber = (numStr: string): number => {
    let clean = numStr.trim();
    if (clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(/,[0-9]+$/, '');
    } else if (clean.includes(',')) {
      if (/,[0-9]{3}/.test(clean)) {
        clean = clean.replace(/,/g, '').replace(/\.[0-9]+$/, '');
      } else {
        clean = clean.replace(/,[0-9]+$/, '');
      }
    }
    const val = parseInt(clean, 10);
    return !isNaN(val) && val > 0 ? val : 0;
  };

  const prefixMatches = [...text.matchAll(prefixRegex)];
  for (const m of prefixMatches) {
    if (m && m[1]) {
      const val = parseMatchedNumber(m[1]);
      if (val > 0) return val;
    }
  }

  const suffixMatches = [...text.matchAll(suffixRegex)];
  for (const m of suffixMatches) {
    if (m && m[1]) {
      const val = parseMatchedNumber(m[1]);
      if (val > 0) return val;
    }
  }

  return 0;
}

/**
 * Generates a fast deterministic hash of notification text and amount for anti-duplicate checks.
 */
export function generateNotificationHash(text: string, amount: number, dateStr?: string): string {
  const normalized = (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const dateKey = dateStr || new Date().toISOString().split('T')[0];
  return `notif_${Math.abs(hash)}_${amount}_${dateKey}`;
}

/**
 * Checks if a notification has already been processed to prevent duplicates.
 */
export function isDuplicateNotification(
  rawText: string,
  amount: number,
  existingTransactions: { rawNotificationText?: string; amount?: number }[],
  dateStr?: string
): boolean {
  if (!rawText || !rawText.trim()) return false;
  const normalizedIncoming = rawText.toLowerCase().replace(/\s+/g, ' ').trim();

  return existingTransactions.some((tx) => {
    if (tx.rawNotificationText) {
      const normalizedExisting = tx.rawNotificationText.toLowerCase().replace(/\s+/g, ' ').trim();
      if (normalizedExisting === normalizedIncoming && tx.amount === amount) {
        return true;
      }
    }
    return false;
  });
}
