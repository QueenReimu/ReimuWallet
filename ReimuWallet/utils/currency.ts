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
