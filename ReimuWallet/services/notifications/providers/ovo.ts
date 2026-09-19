import { TransactionType } from '../../../types/transaction';
import { ParsedNotificationResult } from './dana';

export function parseOvoNotification(title: string, text: string): ParsedNotificationResult | null {
  const content = `${title} ${text}`;
  const lower = content.toLowerCase();

  const isOvo = lower.includes('ovo') || lower.includes('grabpay');
  if (!isOvo) return null;

  const amountMatch = content.match(/Rp\s*([0-9.]+)/i);
  if (!amountMatch) return null;

  const rawAmountStr = amountMatch[1].replace(/\./g, '');
  const amount = parseInt(rawAmountStr, 10);
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
