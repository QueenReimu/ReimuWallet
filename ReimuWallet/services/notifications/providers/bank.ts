import { TransactionType } from '../../../types/transaction';
import { extractRupiahAmount } from '../../../utils/currency';
import { ParsedNotificationResult } from './dana';

export function parseBankNotification(title: string, text: string): ParsedNotificationResult | null {
  const content = `${title} ${text}`;
  const lower = content.toLowerCase();

  const isBca = lower.includes('bca') || lower.includes('m-bca') || lower.includes('mybca');
  const isMandiri = lower.includes('livin') || lower.includes('mandiri');
  const isBri = lower.includes('brimo') || lower.includes('bri');
  const isBni = lower.includes('bni');

  if (!isBca && !isMandiri && !isBri && !isBni && !lower.includes('qris')) {
    return null;
  }

  const bankName = isBca ? 'BCA' : isMandiri ? 'Mandiri' : isBri ? 'BRI' : isBni ? 'BNI' : 'Bank';

  // Strictly extract amount only from Rp or IDR formats
  const amount = extractRupiahAmount(content);
  if (!amount || amount <= 0) return null;

  let type: TransactionType = 'expense';
  let suggestedCategory = 'Other';
  let description = `${bankName} Transaction`;

  if (content.includes(' CR ') || lower.includes('masuk') || lower.includes('kredit')) {
    type = 'income';
    suggestedCategory = 'Salary';
    description = `${bankName} Incoming Transfer`;
  } else if (lower.includes('qris')) {
    type = 'expense';
    suggestedCategory = 'Food';
    description = `${bankName} QRIS Payment`;
  } else if (content.includes(' DB ') || lower.includes('debit') || lower.includes('keluar')) {
    type = 'expense';
    suggestedCategory = 'Bills';
    description = `${bankName} Debit Transfer`;
  }

  return {
    provider: bankName,
    type,
    amount,
    description,
    suggestedCategory,
    suggestedWallet: bankName,
    confidence: 0.9,
  };
}
