import { Transaction, TransactionType, Wallet } from '../types';

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
  packageName?: string;
  timestamp?: number;
}

export interface ParseNotificationOptions {
  packageName?: string;
  title?: string;
  timestamp?: number;
}

export interface NotificationSample {
  id: string;
  institution: string;
  packageName: string;
  text: string;
  description: string;
  expectedType?: TransactionType | 'rejected';
}

/**
 * Registry of Supported Financial Applications with their official Android package names.
 */
export interface SupportedAppPackage {
  id: string;
  name: string;
  packageName: string;
  alternativePackages?: string[];
  type: 'ewallet' | 'bank';
  match: (pkg: string) => boolean;
}

export const SUPPORTED_APP_PACKAGES: SupportedAppPackage[] = [
  {
    id: 'dana',
    name: 'DANA',
    packageName: 'id.dana',
    type: 'ewallet',
    match: (pkg) => pkg.includes('dana'),
  },
  {
    id: 'gopay',
    name: 'GoPay',
    packageName: 'com.gojek.app',
    alternativePackages: ['com.gopay.wallet'],
    type: 'ewallet',
    match: (pkg) => pkg.includes('gojek') || pkg.includes('gopay'),
  },
  {
    id: 'ovo',
    name: 'OVO',
    packageName: 'ovo.id',
    type: 'ewallet',
    match: (pkg) => pkg.includes('ovo'),
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    packageName: 'com.shopee.id',
    alternativePackages: ['com.shopeepay.id'],
    type: 'ewallet',
    match: (pkg) => pkg.includes('shopee'),
  },
  {
    id: 'linkaja',
    name: 'LinkAja',
    packageName: 'com.telkom.mwallet',
    alternativePackages: ['linkaja'],
    type: 'ewallet',
    match: (pkg) => pkg.includes('telkom.mwallet') || pkg.includes('linkaja'),
  },
  {
    id: 'bca',
    name: 'BCA (BCA mobile / myBCA)',
    packageName: 'com.bca',
    alternativePackages: ['mybca'],
    type: 'bank',
    match: (pkg) => pkg.includes('bca') || pkg.includes('mybca'),
  },
  {
    id: 'mandiri',
    name: 'Mandiri (Livin)',
    packageName: 'id.co.mandiri.livin',
    alternativePackages: ['com.bankmandiri.mandirionline'],
    type: 'bank',
    match: (pkg) => pkg.includes('mandiri') || pkg.includes('livin'),
  },
  {
    id: 'bri',
    name: 'BRI (BRImo)',
    packageName: 'id.co.bri.brimo',
    type: 'bank',
    match: (pkg) => pkg.includes('bri') || pkg.includes('brimo'),
  },
  {
    id: 'bni',
    name: 'BNI (wondr / BNI Mobile)',
    packageName: 'id.co.bni.wondr',
    alternativePackages: ['src.com.bni'],
    type: 'bank',
    match: (pkg) => pkg.includes('bni') || pkg.includes('wondr'),
  },
  {
    id: 'jago',
    name: 'Bank Jago',
    packageName: 'com.jago.digitalbanking',
    type: 'bank',
    match: (pkg) => pkg.includes('jago'),
  },
  {
    id: 'seabank',
    name: 'SeaBank',
    packageName: 'com.seabank.id',
    type: 'bank',
    match: (pkg) => pkg.includes('seabank'),
  },
];

export const SAMPLE_NOTIFICATIONS: NotificationSample[] = [
  // 1. DANA Expense & Income
  {
    id: 'sample-dana-expense',
    institution: 'DANA',
    packageName: 'id.dana',
    text: 'DANA: Pembayaran sebesar Rp 28.000 ke Kopi Kenangan telah berhasil.',
    description: 'DANA Pengeluaran Rp 28.000 di Kopi Kenangan',
    expectedType: 'expense',
  },
  {
    id: 'sample-dana-income',
    institution: 'DANA',
    packageName: 'id.dana',
    text: 'DANA: Kamu menerima uang sebesar Rp 150.000 dari Ahmad Fauzi.',
    description: 'DANA Pemasukan (Transfer Masuk) Rp 150.000',
    expectedType: 'income',
  },

  // 2. GoPay Expense & Income
  {
    id: 'sample-gopay-expense',
    institution: 'GoPay',
    packageName: 'com.gojek.app',
    text: 'GoPay: Pembayaran sebesar Rp28.000 ke Kopi Kenangan sukses.',
    description: 'GoPay Pengeluaran Rp 28.000 (Tanpa spasi)',
    expectedType: 'expense',
  },
  {
    id: 'sample-gopay-income',
    institution: 'GoPay',
    packageName: 'com.gojek.app',
    text: 'GoPay: Saldo bertambah Rp 200.000 dari Top Up BCA.',
    description: 'GoPay Pemasukan / Top Up Rp 200.000',
    expectedType: 'income',
  },

  // 3. OVO Expense & Income
  {
    id: 'sample-ovo-expense',
    institution: 'OVO',
    packageName: 'ovo.id',
    text: 'OVO: Pembayaran di HokBen sebesar Rp 45.000 berhasil dilakukan.',
    description: 'OVO Pengeluaran Rp 45.000 di HokBen',
    expectedType: 'expense',
  },
  {
    id: 'sample-ovo-income',
    institution: 'OVO',
    packageName: 'ovo.id',
    text: 'OVO: Kamu menerima transfer OVO Cash sebesar Rp 100.000 dari Budi.',
    description: 'OVO Pemasukan (Transfer Masuk) Rp 100.000',
    expectedType: 'income',
  },

  // 4. ShopeePay Expense & Income
  {
    id: 'sample-shopee-expense',
    institution: 'ShopeePay',
    packageName: 'com.shopee.id',
    text: 'ShopeePay: Pembayaran sebesar Rp 85.000 di Indomaret berhasil.',
    description: 'ShopeePay Pengeluaran Rp 85.000',
    expectedType: 'expense',
  },
  {
    id: 'sample-shopee-income',
    institution: 'ShopeePay',
    packageName: 'com.shopee.id',
    text: 'ShopeePay: Dana sebesar Rp 250.000 berhasil ditambahkan ke ShopeePay.',
    description: 'ShopeePay Pemasukan Rp 250.000',
    expectedType: 'income',
  },

  // 5. LinkAja Expense & Income
  {
    id: 'sample-linkaja-expense',
    institution: 'LinkAja',
    packageName: 'com.telkom.mwallet',
    text: 'LinkAja: Pembayaran sebesar Rp 35.000 di Alfamart telah berhasil.',
    description: 'LinkAja Pengeluaran Rp 35.000',
    expectedType: 'expense',
  },
  {
    id: 'sample-linkaja-income',
    institution: 'LinkAja',
    packageName: 'com.telkom.mwallet',
    text: 'LinkAja: Terima dana Rp 75.000 dari Dian Lestari berhasil.',
    description: 'LinkAja Pemasukan Rp 75.000',
    expectedType: 'income',
  },

  // 6. Bank BCA
  {
    id: 'sample-bca-income',
    institution: 'BCA',
    packageName: 'com.bca',
    text: 'BCA: M-Transfer Masuk sebesar Rp1.500.000 dari PT SOLUSI TEKNOLOGI.',
    description: 'BCA Transfer Masuk (Pemasukan) Rp 1.500.000',
    expectedType: 'income',
  },
  {
    id: 'sample-bca-expense',
    institution: 'BCA',
    packageName: 'com.bca',
    text: 'BCA: m-Transfer ke 0148927492 a/n SITI RAHMA sebesar Rp 350.000 Berhasil.',
    description: 'BCA Transfer Keluar (Pengeluaran) Rp 350.000',
    expectedType: 'expense',
  },

  // 7. Bank Mandiri
  {
    id: 'sample-mandiri-idr',
    institution: 'Mandiri',
    packageName: 'id.co.mandiri.livin',
    text: 'Livin by Mandiri: Transaksi Debit IDR 28.000 di HokBen berhasil.',
    description: 'Mandiri Livin Pengeluaran IDR 28.000',
    expectedType: 'expense',
  },

  // 8. Bank BRI
  {
    id: 'sample-brimo-transfer',
    institution: 'BRI',
    packageName: 'id.co.bri.brimo',
    text: 'BRImo: Transfer keluar sebesar Rp 150.000 ke Rekening BCA telah diproses.',
    description: 'BRImo Transfer Keluar Rp 150.000',
    expectedType: 'expense',
  },

  // NEGATIVE TEST SAMPLES (Must be rejected / ignored)
  {
    id: 'sample-negative-otp',
    institution: 'DANA (OTP Negatif)',
    packageName: 'id.dana',
    text: 'DANA: Kode OTP kamu adalah 492019. JANGAN BERIKAN KODE INI KEPADA SIAPAPUN termasuk pihak DANA.',
    description: 'Uji Kode OTP / Verifikasi → Wajib Diabaikan (Bukan Transaksi)',
    expectedType: 'rejected',
  },
  {
    id: 'sample-negative-promo',
    institution: 'GoPay (Promo Negatif)',
    packageName: 'com.gojek.app',
    text: 'GoPay Promo: Dapatkan cashback hingga Rp 50.000 dan diskon 50% untuk transaksi GoFood hari ini!',
    description: 'Uji Penawaran Promo & Voucher → Wajib Diabaikan (Bukan Transaksi)',
    expectedType: 'rejected',
  },
  {
    id: 'sample-negative-login',
    institution: 'OVO (Keamanan Akun Negatif)',
    packageName: 'ovo.id',
    text: 'OVO Security: Terdeteksi login baru pada perangkat SM-G998B di Jakarta. Jika bukan Anda, segera ganti PIN.',
    description: 'Uji Peringatan Login / Keamanan Akun → Wajib Diabaikan',
    expectedType: 'rejected',
  },
  {
    id: 'sample-negative-saldo',
    institution: 'Mandiri (Info Saldo Negatif)',
    packageName: 'id.co.mandiri.livin',
    text: 'Livin by Mandiri: Sisa saldo rekening Anda saat ini adalah IDR 4.250.000. Cek mutasi lengkap di aplikasi.',
    description: 'Uji Info Sisa Saldo Rutin (Bukan Mutasi) → Wajib Diabaikan',
    expectedType: 'rejected',
  },
  {
    id: 'sample-negative-reminder',
    institution: 'BCA (Reminder Negatif)',
    packageName: 'com.bca',
    text: 'BCA Info: Pengingat tagihan Kartu Kredit Anda akan jatuh tempo pada 25-09-2026. Hindari denda.',
    description: 'Uji Pengingat / Reminder Tagihan → Wajib Diabaikan',
    expectedType: 'rejected',
  },
];

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
  // Preceded by non-word boundary or start of string
  // Matches: Rp28.000, Rp 28.000, Rp. 28.000, Rp1.500.000, IDR 28.000, etc.
  const prefixRegex = /(?:^|[^\w])(?:rp\.?|idr)\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?|[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]{3,10}(?:,[0-9]{1,2})?)/gi;

  // Suffix pattern: Number followed by (IDR|Rp|Rp.)
  const suffixRegex = /(?:^|[^\w])([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?|[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]{3,10}(?:,[0-9]{1,2})?)\s*(?:rp\.?|idr)(?=[^\w]|$)/gi;

  const parseMatchedNumber = (numStr: string): number => {
    let clean = numStr.trim();
    // If it has dots as thousand separators (standard Indonesian: 28.000 or 1.500.000)
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
 * Identifies and blocks notifications that are not genuine transaction events:
 * - OTP & Security codes
 * - Marketing offers, promos, vouchers, and coupons
 * - Login alerts and device access notifications
 * - Routine balance check notifications ("Sisa saldo anda saat ini...")
 * - Reminders and general app announcements
 */
export function isNonTransactionNotification(
  text: string,
  title: string = ''
): { ignored: boolean; reason?: string } {
  const combined = `${title} ${text}`.toLowerCase();

  // 1. OTP & Security Codes
  if (
    combined.includes('otp') ||
    combined.includes('kode verifikasi') ||
    combined.includes('kode keamanan') ||
    combined.includes('kode rahasia') ||
    combined.includes('one-time password') ||
    combined.includes('verification code') ||
    combined.includes('jangan berikan kode') ||
    combined.includes('security code') ||
    combined.includes('pin baru') ||
    combined.includes('reset pin') ||
    combined.includes('kata sandi')
  ) {
    return { ignored: true, reason: 'OTP / Security Verification Code' };
  }

  // 2. Login, new session, security alerts
  if (
    combined.includes('login berhasil') ||
    combined.includes('perangkat baru') ||
    combined.includes('sesi login') ||
    combined.includes('keamanan akun') ||
    combined.includes('logged in from') ||
    combined.includes('aktivasi akun') ||
    combined.includes('verifikasi wajah') ||
    combined.includes('ganti nomor hp') ||
    combined.includes('security alert')
  ) {
    return { ignored: true, reason: 'Login / Security Alert' };
  }

  // 3. Marketing, Promo, Discounts, Vouchers (unless actual cashback/reward received)
  const isActualCashbackReceived =
    (combined.includes('cashback') || combined.includes('reward')) &&
    (combined.includes('diterima') ||
      combined.includes('berhasil ditambahkan') ||
      combined.includes('telah masuk') ||
      combined.includes('kamu dapat'));

  if (!isActualCashbackReceived) {
    if (
      combined.includes('promo') ||
      combined.includes('diskon') ||
      combined.includes('voucher') ||
      combined.includes('cashback s.d') ||
      combined.includes('cashback hingga') ||
      combined.includes('penawaran spesial') ||
      combined.includes('special offer') ||
      combined.includes('kupon belanja') ||
      combined.includes('klaim reward') ||
      combined.includes('dapatkan cashback') ||
      combined.includes('dapatkan bonus') ||
      combined.includes('flash sale') ||
      combined.includes('berhadiah') ||
      combined.includes('poin kamu') ||
      combined.includes('undian')
    ) {
      return { ignored: true, reason: 'Promo / Marketing Offer' };
    }
  }

  // 4. Routine balance checks & generic alerts (e.g. "Sisa saldo Anda...")
  if (
    combined.includes('sisa saldo anda') ||
    combined.includes('saldo anda saat ini') ||
    combined.includes('cek saldo') ||
    combined.includes('saldo rekening anda') ||
    combined.includes('pengingat tagihan') ||
    combined.includes('tagihan akan jatuh tempo') ||
    combined.includes('jatuh tempo pada') ||
    combined.includes('selamat datang') ||
    combined.includes('update aplikasi') ||
    combined.includes('fitur baru') ||
    combined.includes('selesaikan profil') ||
    combined.includes('atur limit transaksi')
  ) {
    // Only block if there is no explicit transaction execution wording
    const hasExecutionWord =
      combined.includes('berhasil') ||
      combined.includes('telah berhasil') ||
      combined.includes('sukses') ||
      combined.includes('debit') ||
      combined.includes('kredit') ||
      combined.includes('transfer masuk') ||
      combined.includes('transfer keluar');

    if (!hasExecutionWord) {
      return { ignored: true, reason: 'Informational Alert / Saldo Reminder' };
    }
  }

  return { ignored: false };
}

/**
 * Generates a fast deterministic hash of notification text, amount, and package for anti-duplicate checks.
 */
export function generateNotificationHash(
  text: string,
  amount: number,
  dateStr?: string,
  packageName?: string
): string {
  const normalized = `${packageName || ''}_${(text || '').toLowerCase().replace(/\s+/g, ' ').trim()}`;
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
  existingTransactions: {
    rawNotification?: string;
    notificationHash?: string;
    amount?: number;
    status?: string;
    title?: string;
    date?: string;
  }[],
  dateStr?: string,
  packageName?: string
): boolean {
  if (!rawText || !rawText.trim()) return false;
  const hash = generateNotificationHash(rawText, amount, dateStr, packageName);
  const normalizedIncoming = rawText.toLowerCase().replace(/\s+/g, ' ').trim();

  return existingTransactions.some((tx) => {
    if (tx.status === 'rejected') return false;
    if (tx.notificationHash && tx.notificationHash === hash) {
      return true;
    }
    if (tx.rawNotification) {
      const normalizedExisting = tx.rawNotification.toLowerCase().replace(/\s+/g, ' ').trim();
      if (normalizedExisting === normalizedIncoming && tx.amount === amount) {
        return true;
      }
    }
    return false;
  });
}

// Indonesian Merchant Knowledge Base for Precise Recognition & Auto-Categorization
interface KnownMerchantInfo {
  name: string;
  category: string;
  keywords: string[];
}

const KNOWN_MERCHANTS: KnownMerchantInfo[] = [
  // Makanan & Minuman
  { name: 'Kopi Kenangan', category: 'Makanan & Minuman', keywords: ['kopi kenangan', 'kenangan coffee'] },
  { name: 'Fore Coffee', category: 'Makanan & Minuman', keywords: ['fore coffee', 'fore'] },
  { name: 'Starbucks', category: 'Makanan & Minuman', keywords: ['starbucks', 'sbux'] },
  { name: 'Point Coffee', category: 'Makanan & Minuman', keywords: ['point coffee'] },
  { name: 'Janji Jiwa', category: 'Makanan & Minuman', keywords: ['janji jiwa', 'jiwa toast'] },
  { name: 'Tomoro Coffee', category: 'Makanan & Minuman', keywords: ['tomoro coffee', 'tomoro'] },
  { name: 'Mixue', category: 'Makanan & Minuman', keywords: ['mixue'] },
  { name: 'Chatime', category: 'Makanan & Minuman', keywords: ['chatime'] },
  { name: 'Haus! Indonesia', category: 'Makanan & Minuman', keywords: ['haus!'] },
  { name: 'Kopi Soe', category: 'Makanan & Minuman', keywords: ['kopi soe'] },
  { name: 'HokBen', category: 'Makanan & Minuman', keywords: ['hokben', 'hoka hoka bento'] },
  { name: 'KFC', category: 'Makanan & Minuman', keywords: ['kfc', 'kentucky fried'] },
  { name: "McDonald's", category: 'Makanan & Minuman', keywords: ['mcdonald', 'mcd'] },
  { name: 'Mie Gacoan', category: 'Makanan & Minuman', keywords: ['gacoan', 'mie gacoan'] },
  { name: 'Richeese Factory', category: 'Makanan & Minuman', keywords: ['richeese', 'richeese factory'] },
  { name: 'Solaria', category: 'Makanan & Minuman', keywords: ['solaria'] },
  { name: 'Burger King', category: 'Makanan & Minuman', keywords: ['burger king', 'bk'] },
  { name: 'Pizza Hut', category: 'Makanan & Minuman', keywords: ['pizza hut', 'phd'] },
  { name: "Domino's Pizza", category: 'Makanan & Minuman', keywords: ['dominos', "domino's"] },
  { name: 'A&W Restaurant', category: 'Makanan & Minuman', keywords: ['a&w'] },
  { name: 'Yoshinoya', category: 'Makanan & Minuman', keywords: ['yoshinoya'] },
  { name: 'Marugame Udon', category: 'Makanan & Minuman', keywords: ['marugame udon', 'marugame'] },
  { name: 'Subway', category: 'Makanan & Minuman', keywords: ['subway'] },
  { name: 'J.CO Donuts', category: 'Makanan & Minuman', keywords: ['j.co', 'jco'] },
  { name: "Roti'O", category: 'Makanan & Minuman', keywords: ["roti'o", 'rotio'] },
  { name: 'Holland Bakery', category: 'Makanan & Minuman', keywords: ['holland bakery', 'holland'] },
  { name: 'GrabFood', category: 'Makanan & Minuman', keywords: ['grabfood'] },
  { name: 'GoFood', category: 'Makanan & Minuman', keywords: ['gofood'] },
  { name: 'ShopeeFood', category: 'Makanan & Minuman', keywords: ['shopeefood'] },

  // Belanja & Kebutuhan Harian
  { name: 'Indomaret', category: 'Belanja', keywords: ['indomaret', 'klikindomaret'] },
  { name: 'Alfamart', category: 'Belanja', keywords: ['alfamart', 'alfagift'] },
  { name: 'Alfamidi', category: 'Belanja', keywords: ['alfamidi'] },
  { name: 'Superindo', category: 'Belanja', keywords: ['superindo', 'super indo'] },
  { name: 'Hypermart', category: 'Belanja', keywords: ['hypermart'] },
  { name: 'Transmart', category: 'Belanja', keywords: ['transmart', 'carrefour'] },
  { name: 'Sayurbox', category: 'Belanja', keywords: ['sayurbox'] },
  { name: 'Astro', category: 'Belanja', keywords: ['astro', 'astronauts'] },
  { name: 'Tokopedia', category: 'Belanja', keywords: ['tokopedia'] },
  { name: 'Shopee', category: 'Belanja', keywords: ['shopee', 'shopeepay merchant'] },
  { name: 'TikTok Shop', category: 'Belanja', keywords: ['tiktok shop', 'tiktok'] },
  { name: 'Blibli', category: 'Belanja', keywords: ['blibli'] },
  { name: 'Lazada', category: 'Belanja', keywords: ['lazada'] },
  { name: 'Uniqlo', category: 'Belanja', keywords: ['uniqlo'] },
  { name: 'Miniso', category: 'Belanja', keywords: ['miniso'] },
  { name: 'KKV', category: 'Belanja', keywords: ['kkv'] },
  { name: 'Ace Hardware', category: 'Belanja', keywords: ['ace hardware', 'ace'] },
  { name: 'Gramedia', category: 'Belanja', keywords: ['gramedia'] },

  // Transportasi & Bensin
  { name: 'Pertamina SPBU', category: 'Transportasi', keywords: ['pertamina', 'mypertamina', 'spbu pertamina', 'spbu'] },
  { name: 'Shell SPBU', category: 'Transportasi', keywords: ['shell', 'shell spbu'] },
  { name: 'BP AKR SPBU', category: 'Transportasi', keywords: ['bp-akr', 'bp akr', 'spbu bp'] },
  { name: 'Gojek Transport', category: 'Transportasi', keywords: ['goride', 'gocar', 'gojek'] },
  { name: 'Grab Transport', category: 'Transportasi', keywords: ['grabbike', 'grabcar', 'grab'] },
  { name: 'Maxim', category: 'Transportasi', keywords: ['maxim'] },
  { name: 'Bluebird Taxi', category: 'Transportasi', keywords: ['bluebird', 'blue bird'] },
  { name: 'MRT Jakarta', category: 'Transportasi', keywords: ['mrt jakarta', 'mrt'] },
  { name: 'KRL Commuterline', category: 'Transportasi', keywords: ['krl', 'commuter line', 'commuterline'] },
  { name: 'Kereta Cepat Whoosh', category: 'Transportasi', keywords: ['whoosh', 'kereta cepat'] },
  { name: 'KAI Kereta Api', category: 'Transportasi', keywords: ['kai access', 'kai', 'kereta api'] },
  { name: 'Tiket.com', category: 'Transportasi', keywords: ['tiket.com'] },
  { name: 'Traveloka', category: 'Transportasi', keywords: ['traveloka'] },
  { name: 'Parkir Kendaraan', category: 'Transportasi', keywords: ['parkir', 'secure parking', 'sky parking'] },
  { name: 'Tarif Tol Jasa Marga', category: 'Transportasi', keywords: ['jasa marga', 'gerbang tol', 'tarif tol'] },

  // Tagihan & Utilitas
  { name: 'PLN Listrik', category: 'Tagihan', keywords: ['pln', 'token listrik', 'tagihan listrik', 'listrik pln'] },
  { name: 'BPJS Kesehatan', category: 'Tagihan', keywords: ['bpjs kesehatan', 'bpjs'] },
  { name: 'PDAM Air', category: 'Tagihan', keywords: ['pdam', 'tagihan air'] },
  { name: 'IndiHome Telkom', category: 'Tagihan', keywords: ['indihome', 'telkom indihome'] },
  { name: 'Biznet Internet', category: 'Tagihan', keywords: ['biznet'] },
  { name: 'First Media', category: 'Tagihan', keywords: ['first media'] },
  { name: 'MyRepublic', category: 'Tagihan', keywords: ['myrepublic'] },
  { name: 'Pulsa Telkomsel', category: 'Tagihan', keywords: ['telkomsel', 'by.u', 'kartu halo'] },
  { name: 'Pulsa Indosat IM3', category: 'Tagihan', keywords: ['indosat', 'im3'] },
  { name: 'Pulsa XL Axiata', category: 'Tagihan', keywords: ['xl axiata', 'axis'] },
  { name: 'Pulsa Tri Indonesia', category: 'Tagihan', keywords: ['tri indonesia', 'tri 3'] },

  // Hiburan & Langganan
  { name: 'Netflix', category: 'Hiburan', keywords: ['netflix'] },
  { name: 'Spotify', category: 'Hiburan', keywords: ['spotify'] },
  { name: 'YouTube Premium', category: 'Hiburan', keywords: ['youtube', 'google youtube'] },
  { name: 'Disney+ Hotstar', category: 'Hiburan', keywords: ['disney+', 'hotstar'] },
  { name: 'Apple Services', category: 'Hiburan', keywords: ['apple.com', 'itunes', 'icloud'] },
  { name: 'Google Play', category: 'Hiburan', keywords: ['google play', 'google games'] },
  { name: 'Steam Games', category: 'Hiburan', keywords: ['steam', 'steampowered'] },
  { name: 'Cinema XXI', category: 'Hiburan', keywords: ['cinema xxi', 'cinema 21', 'xxi'] },
  { name: 'CGV Cinemas', category: 'Hiburan', keywords: ['cgv cinemas', 'cgv'] },

  // Kesehatan & Medis
  { name: 'Halodoc', category: 'Kesehatan', keywords: ['halodoc'] },
  { name: 'Alodokter', category: 'Kesehatan', keywords: ['alodokter'] },
  { name: 'Apotek Kimia Farma', category: 'Kesehatan', keywords: ['kimia farma'] },
  { name: 'Apotek K-24', category: 'Kesehatan', keywords: ['k-24', 'k24', 'apotek k24'] },
  { name: 'Prodia Lab', category: 'Kesehatan', keywords: ['prodia'] },
];

/**
 * Helper to extract merchant / counterparty name and infer category.
 */
function extractTitleAndCategory(
  text: string,
  type: TransactionType,
  institution: string
): { title: string; category: string } {
  const lower = text.toLowerCase();

  // 1. Check known merchants
  for (const m of KNOWN_MERCHANTS) {
    if (m.keywords.some((k) => lower.includes(k))) {
      return { title: m.name, category: m.category };
    }
  }

  // 2. Look for target pattern: "ke/di/dari [Name]"
  const pattern = /(?:ke|di|a\/n|dari|merchant|toko)\s+([A-Za-z0-9\s&'.-]{2,30}?)(?:\s+(?:telah|sebesar|berhasil|sukses|via|senilai|pada|menggunakan|\.|,|$))/i;
  const match = text.match(pattern);

  let title = '';
  if (match && match[1]) {
    const raw = match[1].trim();
    const clean = raw.replace(/^(rekening|merchant|toko|akun|pt|cv)\s+/i, '').replace(/[0-9]{6,}/g, '').trim();
    if (clean.length >= 2) {
      title = clean;
    }
  }

  // Fallbacks
  if (!title) {
    if (type === 'income') {
      title = `Pemasukan ${institution}`;
    } else if (type === 'transfer') {
      title = `Transfer ${institution}`;
    } else {
      title = `Pembayaran ${institution}`;
    }
  }

  // Infer category
  let category = 'Lainnya';
  if (type === 'income') {
    category = 'Pemasukan';
  } else if (type === 'transfer') {
    category = 'Transfer';
  } else {
    const tLower = title.toLowerCase();
    if (tLower.includes('kopi') || tLower.includes('cafe') || tLower.includes('warung') || tLower.includes('resto') || tLower.includes('makan') || lower.includes('makan')) {
      category = 'Makanan & Minuman';
    } else if (tLower.includes('market') || tLower.includes('mart') || tLower.includes('toko') || tLower.includes('belanja')) {
      category = 'Belanja';
    } else if (tLower.includes('trans') || tLower.includes('ride') || tLower.includes('car') || tLower.includes('parkir')) {
      category = 'Transportasi';
    } else if (lower.includes('pln') || lower.includes('listrik') || lower.includes('pulsa') || lower.includes('telkom') || lower.includes('bpjs')) {
      category = 'Tagihan';
    }
  }

  return { title, category };
}

/**
 * Matches a transaction to an existing wallet in the user's wallet list.
 */
function matchUserWallet(
  institution: string,
  wallets: Wallet[],
  text: string
): { walletName: string; matchedWalletId?: string } {
  if (wallets.length === 0) {
    return { walletName: institution };
  }

  const lowerText = text.toLowerCase();
  const lowerInst = institution.toLowerCase();

  // Try matching by institution name or wallet type
  const found =
    wallets.find((w) => w.name.toLowerCase().includes(lowerInst)) ||
    wallets.find((w) => lowerText.includes(w.name.toLowerCase())) ||
    wallets.find((w) => w.type === 'ewallet' && (lowerInst === 'dana' || lowerInst === 'gopay' || lowerInst === 'ovo' || lowerInst === 'shopeepay' || lowerInst === 'linkaja')) ||
    wallets.find((w) => w.isPrimary) ||
    wallets[0];

  return {
    walletName: found?.name || institution,
    matchedWalletId: found?.id,
  };
}

// ----------------------------------------------------------------------------
// PACKAGE-SPECIFIC PARSER FUNCTIONS
// ----------------------------------------------------------------------------

interface RawParserInput {
  title: string;
  text: string;
  combined: string;
  amount: number;
  wallets: Wallet[];
  packageName: string;
}

/**
 * 1. DANA Parser (Package: id.dana)
 */
function parseDanaPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  // Validate transaction indicator
  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('menerima') ||
    lower.includes('pembayaran') ||
    lower.includes('kirim uang') ||
    lower.includes('qris') ||
    lower.includes('top up');

  if (!hasTransactionIndicator) return null;

  // Determine income vs expense
  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('kamu menerima') ||
    lower.includes('menerima uang') ||
    lower.includes('dana diterima') ||
    lower.includes('saldo dana berhasil ditambah') ||
    lower.includes('berhasil ditambahkan') ||
    lower.includes('top up') ||
    lower.includes('cashback telah masuk') ||
    lower.includes('kiriman uang');

  const isTransfer = !isIncome && (lower.includes('kirim uang ke') || lower.includes('transfer ke'));

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'DANA');
  const { walletName, matchedWalletId } = matchUserWallet('DANA', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi DANA (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'DANA',
    packageName,
  };
}

/**
 * 2. GoPay Parser (Package: com.gojek.app / com.gopay.wallet)
 */
function parseGopayPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('sukses') ||
    lower.includes('berhasil') ||
    lower.includes('pembayaran') ||
    lower.includes('bertambah') ||
    lower.includes('transfer masuk') ||
    lower.includes('kamu telah membayar') ||
    lower.includes('top up');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('transfer masuk') ||
    lower.includes('saldo gopay bertambah') ||
    lower.includes('saldo bertambah') ||
    lower.includes('top up gopay') ||
    lower.includes('cashback');

  const isTransfer = !isIncome && lower.includes('transfer ke');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'GoPay');
  const { walletName, matchedWalletId } = matchUserWallet('GoPay', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi GoPay (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'GoPay',
    packageName,
  };
}

/**
 * 3. OVO Parser (Package: ovo.id)
 */
function parseOvoPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('pembayaran') ||
    lower.includes('menerima transfer') ||
    lower.includes('top up');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('menerima transfer') ||
    lower.includes('dana masuk') ||
    lower.includes('top up ovo') ||
    lower.includes('ovo cash bertambah') ||
    lower.includes('cashback');

  const isTransfer = !isIncome && lower.includes('transfer ke');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'OVO');
  const { walletName, matchedWalletId } = matchUserWallet('OVO', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi OVO (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'OVO',
    packageName,
  };
}

/**
 * 4. ShopeePay Parser (Package: com.shopee.id / com.shopeepay.id)
 */
function parseShopeePayPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('pembayaran') ||
    lower.includes('transfer masuk') ||
    lower.includes('dana sebesar') ||
    lower.includes('isi saldo');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('transfer masuk') ||
    lower.includes('berhasil ditambahkan') ||
    lower.includes('kamu menerima') ||
    lower.includes('isi saldo') ||
    lower.includes('cashback');

  const isTransfer = !isIncome && lower.includes('transfer ke');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'ShopeePay');
  const { walletName, matchedWalletId } = matchUserWallet('ShopeePay', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi ShopeePay (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'ShopeePay',
    packageName,
  };
}

/**
 * 5. LinkAja Parser (Package: com.telkom.mwallet / linkaja)
 */
function parseLinkAjaPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('terima dana') ||
    lower.includes('pembayaran') ||
    lower.includes('telah diproses');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('terima dana') ||
    lower.includes('isi saldo') ||
    lower.includes('transfer masuk') ||
    lower.includes('cashback');

  const isTransfer = !isIncome && lower.includes('kirim saldo');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'LinkAja');
  const { walletName, matchedWalletId } = matchUserWallet('LinkAja', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi LinkAja (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'LinkAja',
    packageName,
  };
}

/**
 * 6. Bank BCA Parser (Package: com.bca / mybca)
 */
function parseBcaPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('m-transfer') ||
    lower.includes('masuk') ||
    lower.includes('debit') ||
    lower.includes('kredit');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('transfer masuk') ||
    lower.includes('m-transfer masuk') ||
    lower.includes('dana masuk') ||
    lower.includes('kredit');

  const isTransfer = !isIncome && lower.includes('m-transfer ke');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'BCA');
  const { walletName, matchedWalletId } = matchUserWallet('BCA', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi Bank BCA (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'BCA',
    packageName,
  };
}

/**
 * 7. Bank Mandiri Parser (Package: id.co.mandiri.livin / com.bankmandiri.mandirionline)
 */
function parseMandiriPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('debit') ||
    lower.includes('kredit') ||
    lower.includes('transfer');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('dana masuk') ||
    lower.includes('transfer masuk') ||
    lower.includes('kredit') ||
    lower.includes('terima transfer');

  const isTransfer = !isIncome && lower.includes('transfer ke');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'Mandiri');
  const { walletName, matchedWalletId } = matchUserWallet('Mandiri', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi Livin by Mandiri (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'Mandiri',
    packageName,
  };
}

/**
 * 8. Bank BRI Parser (Package: id.co.bri.brimo)
 */
function parseBriPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('telah diproses') ||
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('transaksi masuk') ||
    lower.includes('transfer keluar');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('transaksi masuk') ||
    lower.includes('transfer masuk') ||
    lower.includes('kredit');

  const isTransfer = !isIncome && lower.includes('transfer keluar');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'BRI');
  const { walletName, matchedWalletId } = matchUserWallet('BRI', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi BRImo (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'BRI',
    packageName,
  };
}

/**
 * 9. Bank BNI Parser (Package: id.co.bni.wondr / src.com.bni)
 */
function parseBniPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('transfer') ||
    lower.includes('pembayaran');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome = lower.includes('transfer masuk') || lower.includes('dana masuk') || lower.includes('kredit');
  const isTransfer = !isIncome && (lower.includes('transfer keluar') || lower.includes('transfer ke'));

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'BNI');
  const { walletName, matchedWalletId } = matchUserWallet('BNI', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi BNI (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'BNI',
    packageName,
  };
}

/**
 * 10. Bank Jago Parser (Package: com.jago.digitalbanking)
 */
function parseJagoPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('uang keluar') ||
    lower.includes('uang masuk') ||
    lower.includes('kamu menerima') ||
    lower.includes('baru saja keluar');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome = lower.includes('uang masuk') || lower.includes('kamu menerima') || lower.includes('kantong bertambah');
  const isTransfer = !isIncome && lower.includes('transfer ke');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'Bank Jago');
  const { walletName, matchedWalletId } = matchUserWallet('Bank Jago', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi Bank Jago (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'Bank Jago',
    packageName,
  };
}

/**
 * 11. SeaBank Parser (Package: com.seabank.id)
 */
function parseSeabankPackage(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('transfer masuk') ||
    lower.includes('transfer keluar') ||
    lower.includes('bunga harian');

  if (!hasTransactionIndicator) return null;

  let type: TransactionType = 'expense';
  const isIncome = lower.includes('transfer masuk') || lower.includes('bunga harian') || lower.includes('dana masuk');
  const isTransfer = !isIncome && lower.includes('transfer keluar');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, 'SeaBank');
  const { walletName, matchedWalletId } = matchUserWallet('SeaBank', wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi SeaBank (${packageName})`,
    rawText: combined,
    confidence: 'high',
    institution: 'SeaBank',
    packageName,
  };
}

/**
 * Fallback generic financial parser for other payment/banking notifications.
 */
function parseGenericFinancial(input: RawParserInput): ParsedNotificationResult | null {
  const { combined, amount, wallets, packageName } = input;
  const lower = combined.toLowerCase();

  const hasExplicitTransactionIndicator =
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('pembayaran') ||
    lower.includes('transfer') ||
    lower.includes('debit') ||
    lower.includes('kredit') ||
    lower.includes('terima uang') ||
    lower.includes('kirim uang');

  if (!hasExplicitTransactionIndicator) return null;

  let institution = 'Payment';
  if (lower.includes('dana')) institution = 'DANA';
  else if (lower.includes('gopay') || lower.includes('gojek')) institution = 'GoPay';
  else if (lower.includes('ovo')) institution = 'OVO';
  else if (lower.includes('shopee')) institution = 'ShopeePay';
  else if (lower.includes('linkaja')) institution = 'LinkAja';
  else if (lower.includes('bca')) institution = 'BCA';
  else if (lower.includes('mandiri')) institution = 'Mandiri';
  else if (lower.includes('bri')) institution = 'BRI';
  else if (lower.includes('bni')) institution = 'BNI';
  else if (lower.includes('jago')) institution = 'Bank Jago';
  else if (lower.includes('seabank')) institution = 'SeaBank';

  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('berhasil ditambahkan') ||
    lower.includes('menerima transfer') ||
    lower.includes('transfer masuk') ||
    lower.includes('dana diterima') ||
    lower.includes('saldo bertambah') ||
    lower.includes('top up') ||
    lower.includes('cashback') ||
    lower.includes('kredit');

  const isTransfer = !isIncome && lower.includes('transfer ke');

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  const { title, category } = extractTitleAndCategory(combined, type, institution);
  const { walletName, matchedWalletId } = matchUserWallet(institution, wallets, combined);

  return {
    title,
    amount,
    type,
    category,
    walletName,
    matchedWalletId,
    note: `Notifikasi Aplikasi Keuangan (${packageName || 'Local'})`,
    rawText: combined,
    confidence: 'medium',
    institution,
    packageName,
  };
}

// ----------------------------------------------------------------------------
// PRIMARY NOTIFICATION PARSER ENTRY POINT
// ----------------------------------------------------------------------------

/**
 * Intelligent Indonesian Bank / E-Wallet Notification Parser
 *
 * Rules:
 * 1. Checks if notification is OTP, promo, login, saldo biasa, or reminder; if so, returns null.
 * 2. Strictly extracts numeric Rupiah amounts with Rp or IDR. If missing or 0, returns null.
 * 3. Uses package-name-based parsers to handle format differences between apps accurately.
 * 4. Categorizes income, expense, or transfer.
 * 5. Everything runs locally in memory with zero external network transmission.
 */
export function parseFinancialNotification(
  rawText: string,
  wallets: Wallet[] = [],
  options?: ParseNotificationOptions | string
): ParsedNotificationResult | null {
  const text = (rawText || '').trim();
  if (!text) return null;

  // Resolve options (backwards-compatible if options is a packageName string)
  let opt: ParseNotificationOptions = {};
  if (typeof options === 'string') {
    opt = { packageName: options };
  } else if (options && typeof options === 'object') {
    opt = options;
  }

  const title = (opt.title || '').trim();
  const packageName = (opt.packageName || '').trim().toLowerCase();
  const combined = title ? `${title}: ${text}` : text;

  // 1. Ignore non-transaction alerts: OTP, Promo, Login, Saldo Biasa, Reminder
  const nonTxCheck = isNonTransactionNotification(text, title);
  if (nonTxCheck.ignored) {
    return null;
  }

  // 2. Strict Amount Extraction: requires Rp or IDR prefix/suffix
  const amount = extractRupiahAmount(combined);
  if (!amount || amount <= 0) {
    return null;
  }

  const parserInput: RawParserInput = {
    title,
    text,
    combined,
    amount,
    wallets,
    packageName: opt.packageName || '',
  };

  // 3. Package Name Routed Parsing
  if (packageName) {
    if (packageName.includes('dana')) {
      const res = parseDanaPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('gojek') || packageName.includes('gopay')) {
      const res = parseGopayPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('ovo')) {
      const res = parseOvoPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('shopee')) {
      const res = parseShopeePayPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('telkom.mwallet') || packageName.includes('linkaja')) {
      const res = parseLinkAjaPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('bca') || packageName.includes('mybca')) {
      const res = parseBcaPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('mandiri') || packageName.includes('livin')) {
      const res = parseMandiriPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('bri') || packageName.includes('brimo')) {
      const res = parseBriPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('bni') || packageName.includes('wondr')) {
      const res = parseBniPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('jago')) {
      const res = parseJagoPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
    if (packageName.includes('seabank')) {
      const res = parseSeabankPackage(parserInput);
      if (res) return { ...res, timestamp: opt.timestamp };
    }
  }

  // 4. Auto-detect from text content if package name was not provided or didn't match
  const lower = combined.toLowerCase();
  if (lower.includes('dana')) {
    const res = parseDanaPackage({ ...parserInput, packageName: 'id.dana' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('gopay') || lower.includes('gojek')) {
    const res = parseGopayPackage({ ...parserInput, packageName: 'com.gojek.app' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('ovo')) {
    const res = parseOvoPackage({ ...parserInput, packageName: 'ovo.id' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('shopee')) {
    const res = parseShopeePayPackage({ ...parserInput, packageName: 'com.shopee.id' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('linkaja')) {
    const res = parseLinkAjaPackage({ ...parserInput, packageName: 'com.telkom.mwallet' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('bca') || lower.includes('mybca')) {
    const res = parseBcaPackage({ ...parserInput, packageName: 'com.bca' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('mandiri') || lower.includes('livin')) {
    const res = parseMandiriPackage({ ...parserInput, packageName: 'id.co.mandiri.livin' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('bri') || lower.includes('brimo')) {
    const res = parseBriPackage({ ...parserInput, packageName: 'id.co.bri.brimo' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('bni') || lower.includes('wondr')) {
    const res = parseBniPackage({ ...parserInput, packageName: 'id.co.bni.wondr' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('jago')) {
    const res = parseJagoPackage({ ...parserInput, packageName: 'com.jago.digitalbanking' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }
  if (lower.includes('seabank')) {
    const res = parseSeabankPackage({ ...parserInput, packageName: 'com.seabank.id' });
    if (res) return { ...res, timestamp: opt.timestamp };
  }

  // 5. Fallback generic financial parser
  const genericRes = parseGenericFinancial(parserInput);
  if (genericRes) {
    return { ...genericRes, timestamp: opt.timestamp };
  }

  return null;
}

/**
 * Default list of keywords for Auto-Approve Whitelist.
 */
export const DEFAULT_AUTO_APPROVE_WHITELIST: string[] = [
  'Netflix',
  'Spotify',
  'PLN',
  'Indomaret',
  'Tokopedia',
  'Kopi Kenangan',
  'Pertamina',
];

/**
 * Checks whether a detected notification qualifies for Auto-Approve based on user's whitelist.
 */
export function checkAutoApproveMatch(
  title: string,
  rawText: string,
  whitelist: string[]
): { isMatched: boolean; matchedKeyword?: string } {
  if (!whitelist || whitelist.length === 0) return { isMatched: false };
  const lowerTitle = title.toLowerCase();
  const lowerText = rawText.toLowerCase();

  for (const keyword of whitelist) {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) continue;
    if (lowerTitle.includes(trimmed) || lowerText.includes(trimmed)) {
      return { isMatched: true, matchedKeyword: keyword.trim() };
    }
  }

  return { isMatched: false };
}
