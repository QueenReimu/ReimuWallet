import { TransactionType, Wallet } from '../types';

export interface ParsedNotificationResult {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  walletName: string;
  matchedWalletId?: string;
  note: string;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
  institution: string;
}

export interface NotificationSample {
  id: string;
  institution: string;
  text: string;
  description: string;
}

export const SAMPLE_NOTIFICATIONS: NotificationSample[] = [
  {
    id: 'sample-dana-kopi',
    institution: 'DANA',
    text: 'DANA: Pembayaran sebesar Rp 25.000 ke Kopi Kenangan telah berhasil.',
    description: 'DANA Pembayaran Kopi Kenangan (QRIS)',
  },
  {
    id: 'sample-bca-tokopedia',
    institution: 'BCA',
    text: 'BCA: M-Transfer Berhasil ke Rekening 0148927492 a/n TOKOPEDIA sebesar Rp 150.000.',
    description: 'BCA M-Transfer Belanja Tokopedia',
  },
  {
    id: 'sample-gopay-hokben',
    institution: 'GoPay',
    text: 'GoPay: Kamu telah membayar Rp 38.000 di HokBen via QRIS.',
    description: 'GoPay Makan di HokBen via QRIS',
  },
  {
    id: 'sample-mandiri-superindo',
    institution: 'Mandiri',
    text: 'Livin by Mandiri: Transaksi Debit Rp 125.000 di SUPERINDO berhasil.',
    description: 'Livin Mandiri Belanja Supermarket Superindo',
  },
  {
    id: 'sample-ovo-grabfood',
    institution: 'OVO',
    text: 'OVO: Transaksi berhasil! Pembayaran Rp 54.000 ke GrabFood.',
    description: 'OVO Pesan Antar Makanan GrabFood',
  },
  {
    id: 'sample-shopee-indomaret',
    institution: 'ShopeePay',
    text: 'ShopeePay: Pembayaran sebesar Rp 65.000 di Indomaret berhasil.',
    description: 'ShopeePay Belanja Minimarket Indomaret',
  },
  {
    id: 'sample-dana-transferin',
    institution: 'DANA',
    text: 'DANA: Saldo sebesar Rp 500.000 berhasil ditambahkan dari Transfer Bank BCA.',
    description: 'DANA Top-Up Saldo dari Bank BCA',
  },
  {
    id: 'sample-brimo-warung',
    institution: 'BRI',
    text: 'BRImo: Transaksi QRIS senilai Rp 18.500 di Warung Barokah telah diproses.',
    description: 'BRImo QRIS Jajan di Warung Makan',
  },
];

/**
 * Parses numeric Rupiah amounts from text strings
 * Handles: Rp 25.000, Rp. 150.000, 25000, IDR 75.000, etc.
 */
export function extractRupiahAmount(text: string): number {
  // Try matching Rp / IDR / sebesar / senilai formats
  const regexRp = /(?:Rp\.?|IDR|sebesar|senilai|nominal)?\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?|[0-9]{4,10})/i;
  const match = text.match(regexRp);

  if (match && match[1]) {
    // Remove dots and convert comma decimals
    const cleanNum = match[1].replace(/\./g, '').replace(/,[0-9]+$/, '');
    const parsed = parseInt(cleanNum, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Fallback: search any number with dot grouping like 25.000 or 150.000
  const groupedMatch = text.match(/([0-9]{1,3}(?:\.[0-9]{3})+)/);
  if (groupedMatch && groupedMatch[1]) {
    const cleanNum = groupedMatch[1].replace(/\./g, '');
    const parsed = parseInt(cleanNum, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return 0;
}

/**
 * Intelligent Indonesian Bank / E-Wallet Notification Parser
 */
export function parseFinancialNotification(
  rawText: string,
  wallets: Wallet[] = []
): ParsedNotificationResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Identify Financial Institution / Source
  let institution = 'Unknown';
  let matchedWallet: Wallet | undefined;

  if (lower.includes('dana')) {
    institution = 'DANA';
  } else if (lower.includes('bca')) {
    institution = 'BCA';
  } else if (lower.includes('gopay') || lower.includes('gojek')) {
    institution = 'GoPay';
  } else if (lower.includes('mandiri') || lower.includes('livin')) {
    institution = 'Mandiri';
  } else if (lower.includes('ovo')) {
    institution = 'OVO';
  } else if (lower.includes('shopee')) {
    institution = 'ShopeePay';
  } else if (lower.includes('bri') || lower.includes('brimo')) {
    institution = 'BRI';
  } else if (lower.includes('jago')) {
    institution = 'Bank Jago';
  }

  // Find corresponding wallet from user's active wallets
  if (wallets.length > 0) {
    matchedWallet = wallets.find((w) => {
      const wName = w.name.toLowerCase();
      if (institution !== 'Unknown' && wName.includes(institution.toLowerCase())) return true;
      if (lower.includes(wName)) return true;
      return false;
    });

    if (!matchedWallet) {
      // Fallback: pick ewallet or primary wallet
      matchedWallet =
        wallets.find((w) => (institution === 'DANA' || institution === 'GoPay' || institution === 'OVO') && w.type === 'ewallet') ||
        wallets.find((w) => w.isPrimary) ||
        wallets[0];
    }
  }

  const walletName = matchedWallet?.name || (institution !== 'Unknown' ? institution : 'DANA Balance');

  // 2. Extract Amount
  const amount = extractRupiahAmount(text);

  // 3. Determine Transaction Type
  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('berhasil ditambahkan') ||
    lower.includes('menerima transfer') ||
    lower.includes('transfer masuk') ||
    lower.includes('dana diterima') ||
    lower.includes('saldo bertambah') ||
    lower.includes('top up') ||
    lower.includes('cashback') ||
    lower.includes('gaji') ||
    lower.includes('kredit');

  const isTransfer =
    !isIncome &&
    (lower.includes('m-transfer') ||
      lower.includes('transfer ke') ||
      lower.includes('kirim uang ke') ||
      lower.includes('pindah dana'));

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  // 4. Extract Merchant / Counterparty / Title
  let title = 'Transaction';

  // Look for target keywords like "ke", "di", "a/n", "untuk"
  const merchantRegex = /(?:ke|di|a\/n|merchant|untuk|pada|toko)\s+([A-Za-z0-9\s&'.-]{2,30}?)(?:\s+(?:telah|sebesar|berhasil|via|senilai|pada|menggunakan|\.|,|$))/i;
  const merchantMatch = text.match(merchantRegex);

  if (merchantMatch && merchantMatch[1]) {
    const rawMerchant = merchantMatch[1].trim();
    // Clean up unwanted noise words
    const cleanMerchant = rawMerchant
      .replace(/^(rekening|merchant|toko|akun)\s+/i, '')
      .replace(/[0-9]{6,}/g, '')
      .trim();

    if (cleanMerchant.length >= 2) {
      title = cleanMerchant;
    }
  }

  // Fallbacks for common apps if pattern didn't catch it
  if (title === 'Transaction') {
    if (lower.includes('kopi kenangan')) title = 'Kopi Kenangan';
    else if (lower.includes('tokopedia')) title = 'Tokopedia';
    else if (lower.includes('hokben')) title = 'HokBen';
    else if (lower.includes('superindo')) title = 'Superindo';
    else if (lower.includes('grabfood')) title = 'GrabFood';
    else if (lower.includes('indomaret')) title = 'Indomaret';
    else if (lower.includes('alfamart')) title = 'Alfamart';
    else if (lower.includes('starbucks')) title = 'Starbucks';
    else if (lower.includes('janji jiwa')) title = 'Janji Jiwa';
    else if (lower.includes('mcdonald')) title = "McDonald's";
    else if (lower.includes('kfc')) title = 'KFC';
    else if (type === 'income') title = 'Pemasukan / Top Up Saldo';
    else if (type === 'transfer') title = 'Transfer Bank';
    else title = `Pembayaran ${institution}`;
  }

  // 5. Intelligent Category Mapping
  let category = 'Lainnya';
  const titleLower = title.toLowerCase();

  if (type === 'income') {
    category = 'Pemasukan';
  } else if (type === 'transfer') {
    category = 'Transfer';
  } else if (
    titleLower.includes('kopi') ||
    titleLower.includes('cafe') ||
    titleLower.includes('kenangan') ||
    titleLower.includes('hokben') ||
    titleLower.includes('grabfood') ||
    titleLower.includes('gofood') ||
    titleLower.includes('starbucks') ||
    titleLower.includes('janji jiwa') ||
    titleLower.includes('warung') ||
    titleLower.includes('mcd') ||
    titleLower.includes('kfc') ||
    titleLower.includes('resto') ||
    titleLower.includes('makan') ||
    lower.includes('makan') ||
    lower.includes('resto')
  ) {
    category = 'Makanan & Minuman';
  } else if (
    titleLower.includes('superindo') ||
    titleLower.includes('indomaret') ||
    titleLower.includes('alfamart') ||
    titleLower.includes('hypermart') ||
    titleLower.includes('sayur')
  ) {
    category = 'Makanan & Minuman';
  } else if (
    titleLower.includes('tokopedia') ||
    titleLower.includes('shopee') ||
    titleLower.includes('lazada') ||
    titleLower.includes('blibli')
  ) {
    category = 'Belanja';
  } else if (
    titleLower.includes('grab') ||
    titleLower.includes('gojek') ||
    titleLower.includes('mrt') ||
    titleLower.includes('krl') ||
    titleLower.includes('tiket') ||
    titleLower.includes('parkir')
  ) {
    category = 'Transportasi';
  } else if (
    lower.includes('pln') ||
    lower.includes('listrik') ||
    lower.includes('pulsa') ||
    lower.includes('telkom') ||
    lower.includes('bpjs')
  ) {
    category = 'Tagihan';
  }

  // Determine parsing confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (amount > 0 && title !== 'Transaction' && institution !== 'Unknown') {
    confidence = 'high';
  } else if (amount > 0) {
    confidence = 'medium';
  }

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId: matchedWallet?.id,
    note: `Otomatis dari notifikasi ${institution}`,
    rawText: text,
    confidence,
    institution,
  };
}
