import { TransactionType } from '../../../types/transaction';
import { extractRupiahAmount } from '../../../utils/currency';
import { ParsedNotificationResult } from './dana';

export function parseGopayNotification(title: string, text: string): ParsedNotificationResult | null {
  const content = `${title} ${text}`;
  const lower = content.toLowerCase();

  const isGoPay =
    lower.includes('gopay') ||
    lower.includes('gojek') ||
    lower.includes('gofood') ||
    lower.includes('goride') ||
    lower.includes('gocar');

  if (!isGoPay) return null;

  // Strictly extract amount only from Rp or IDR formats
  const amount = extractRupiahAmount(content);
  if (!amount || amount <= 0) return null;

  let type: TransactionType = 'expense';
  let suggestedCategory = 'Other';
  let description = 'GoPay Payment';

  if (lower.includes('transfer') && (lower.includes('dapet') || lower.includes('masuk') || lower.includes('diterima'))) {
    type = 'income';
    suggestedCategory = 'Salary';
    description = 'GoPay Transfer In';
  } else if (lower.includes('top up') || lower.includes('isi saldo')) {
    type = 'transfer';
    description = 'GoPay Top Up';
  } else if (lower.includes('gofood') || lower.includes('food')) {
    type = 'expense';
    suggestedCategory = 'Food';
    description = 'GoFood Delivery';
  } else if (lower.includes('goride') || lower.includes('gocar') || lower.includes('ride')) {
    type = 'expense';
    suggestedCategory = 'Transportation';
    description = 'GoRide / GoCar Transit';
  } else {
    type = 'expense';
    suggestedCategory = 'Shopping';
    description = 'GoPay QRIS Payment';
  }

  return {
    provider: 'GoPay',
    type,
    amount,
    description,
    suggestedCategory,
    suggestedWallet: 'GoPay',
    confidence: 0.95,
  };
}
