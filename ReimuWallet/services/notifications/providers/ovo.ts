import { TransactionType } from '../../../types/transaction';
import { extractRupiahAmount } from '../../../utils/currency';
import { ParsedNotificationResult } from './dana';

export function parseOvoNotification(title: string, text: string): ParsedNotificationResult | null {
  const content = `${title} ${text}`;
  const lower = content.toLowerCase();

  const isOvo = lower.includes('ovo') || lower.includes('grabpay');
  if (!isOvo) return null;

  // Strictly extract amount only from Rp or IDR formats
  const amount = extractRupiahAmount(content);
  if (!amount || amount <= 0) return null;

  let type: TransactionType = 'expense';
  let suggestedCategory = 'Other';
  let description = 'OVO Payment';

  if (lower.includes('top up') || lower.includes('isi saldo')) {
    type = 'transfer';
    description = 'OVO Top Up';
  } else if (lower.includes('transfer diterima') || lower.includes('uang masuk')) {
    type = 'income';
    description = 'OVO Money Received';
  } else {
    type = 'expense';
    if (lower.includes('grabfood')) {
      suggestedCategory = 'Food';
      description = 'GrabFood via OVO';
    } else if (lower.includes('grabbike') || lower.includes('grabcar')) {
      suggestedCategory = 'Transportation';
      description = 'Grab Transit via OVO';
    } else {
      suggestedCategory = 'Shopping';
      description = 'OVO Merchant Payment';
    }
  }

  return {
    provider: 'OVO',
    type,
    amount,
    description,
    suggestedCategory,
    suggestedWallet: 'OVO',
    confidence: 0.95,
  };
}
