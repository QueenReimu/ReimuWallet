/**
 * Currency Formatting Utilities
 * Automatically converts typed number inputs into formatted IDR currency with thousand separators.
 * Example: typing "10000" automatically becomes "10,000" (IDR Rupiah).
 */

export function formatCurrencyInput(value: string | number): string {
  if (value === undefined || value === null || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  // Formats 10000 -> 10,000 as requested ("misal kalau saya mengetik 10000 otomatis menjadi idr rupiah 10,000")
  return num.toLocaleString('en-US');
}

export function parseCurrencyInput(value: string | number): number {
  if (value === undefined || value === null || value === '') return 0;
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return 0;
  const num = parseInt(digits, 10);
  return isNaN(num) ? 0 : num;
}

export function formatRupiahDisplay(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
