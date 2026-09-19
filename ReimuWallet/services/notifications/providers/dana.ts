import { TransactionType } from '../../../types/transaction';
import { parseRupiahInput } from '../../../utils/currency';

export interface ParsedNotificationResult {
  provider: string;
  type: TransactionType;
  amount: number;
  description: string;
  suggestedCategory: string;
  suggestedWallet: string;
  confidence: number;
}

export function parseDanaNotification(title: string, text: string): ParsedNotificationResult | null {
  const content = `${title} ${text}`;
  const isDana =
    content.toLowerCase().includes('dana') ||
    title.toLowerCase().includes('dana');

  if (!isDana && !content.includes('Pembayaran berhasil') && !content.includes('Kirim Uang')) {
    return null;
  }

  // Look for amount: "sebesar Rp 25.000" or "Rp25.000" or "Rp. 25.000"
  const amountMatch = content.match(/Rp\s*([0-9.]+)/i);
  if (!amountMatch) return null;

  const rawAmountStr = amountMatch[1].replace(/\./g, '');
  const amount = parseInt(rawAmountStr, 10);
  if (!amount || amount <= 0) return null;

  // Determine Type & Description
  let type: TransactionType = 'expense';
  let suggestedCategory = 'Other';
  let description = 'DANA Transaction';

  const lower = content.toLowerCase();
  if (lower.includes('menerima') || lower.includes('kiriman uang') || lower.includes('uang masuk') || lower.includes('cashback')) {
    type = 'income';
    suggestedCategory = 'Bonus';
    description = 'DANA Money Received';
  } else if (lower.includes('top up') || lower.includes('isi saldo')) {
    type = 'transfer';
    description = 'DANA Balance Top Up';
  } else {
    type = 'expense';
    // Check merchant
    const merchantMatch = content.match(/ke\s+([^.,\n]+)/i);
    if (merchantMatch) {
      const merchant = merchantMatch[1].trim();
      description = `Payment to ${merchant}`;
      const mLower = merchant.toLowerCase();
      if (mLower.includes('kopi') || mLower.includes('food') || mLower.includes('cafe') || mLower.includes('makan') || mLower.includes('restoran')) {
        suggestedCategory = 'Food';
      } else if (mLower.includes('mart') || mLower.includes('supermarket') || mLower.includes('alfa') || mLower.includes('indo')) {
        suggestedCategory = 'Shopping';
      } else if (mLower.includes('game') || mLower.includes('steam') || mLower.includes('playstation')) {
        suggestedCategory = 'Gaming';
      } else {
        suggestedCategory = 'Shopping';
      }
    } else {
      description = 'DANA QRIS Payment';
      suggestedCategory = 'Shopping';
    }
  }

  return {
    provider: 'DANA',
    type,
    amount,
    description,
    suggestedCategory,
    suggestedWallet: 'DANA',
    confidence: 0.95,
  };
}
