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
}

export interface NotificationSample {
  id: string;
  institution: string;
  text: string;
  description: string;
}

export const SAMPLE_NOTIFICATIONS: NotificationSample[] = [
  {
    id: 'sample-dana-rp28000',
    institution: 'DANA',
    text: 'DANA: Pembayaran sebesar Rp 28.000 ke Kopi Kenangan telah berhasil.',
    description: 'Format Rp 28.000 (Spasi) → Rp 28.000',
  },
  {
    id: 'sample-gopay-rp28000-nospace',
    institution: 'GoPay',
    text: 'GoPay: Pembayaran sebesar Rp28.000 ke Kopi Kenangan sukses.',
    description: 'Format Rp28.000 (Tanpa Spasi) → Rp 28.000',
  },
  {
    id: 'sample-bca-rp1500000',
    institution: 'BCA',
    text: 'BCA: M-Transfer Masuk sebesar Rp1.500.000 dari PT SOLUSI TEKNOLOGI.',
    description: 'Format Rp1.500.000 (Jutaan) → Rp 1.500.000',
  },
  {
    id: 'sample-mandiri-idr',
    institution: 'Mandiri',
    text: 'Livin by Mandiri: Transaksi Debit IDR 28.000 di HokBen berhasil.',
    description: 'Format IDR 28.000 → Rp 28.000',
  },
  {
    id: 'sample-negative-noref',
    institution: 'SMS Bank (Tanpa Rp/IDR)',
    text: 'SMS Notifikasi: Kode OTP 492019 berlaku s/d 2026-09-02 jam 14:20 ke Rekening 0148927492 Ref 9823491 Telp 08123456789.',
    description: 'Uji Angka Bukan Nominal (Rekening/OTP/Tanggal) → Ditolak (0)',
  },
  {
    id: 'sample-shopee-belanja',
    institution: 'ShopeePay',
    text: 'ShopeePay: Pembayaran sebesar Rp 85.000 di Tokopedia / Shopee Store berhasil.',
    description: 'ShopeePay Belanja Rp 85.000',
  },
  {
    id: 'sample-brimo-transfer',
    institution: 'BRI',
    text: 'BRImo: Transfer keluar sebesar Rp 150.000 ke Rekening BCA telah diproses.',
    description: 'BRImo Transfer Keluar Rp 150.000',
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
  existingTransactions: { rawNotification?: string; notificationHash?: string; amount?: number; status?: string }[],
  dateStr?: string
): boolean {
  if (!rawText || !rawText.trim()) return false;
  const hash = generateNotificationHash(rawText, amount, dateStr);
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

/**
 * Intelligent Indonesian Bank / E-Wallet Notification Parser
 * Returns null if no clear Rp/IDR nominal is detected.
 */
export function parseFinancialNotification(
  rawText: string,
  wallets: Wallet[] = []
): ParsedNotificationResult | null {
  const text = rawText.trim();
  if (!text) return null;

  // 1. Extract Amount - strictly requiring Rp or IDR
  const amount = extractRupiahAmount(text);
  if (!amount || amount <= 0) {
    return null;
  }

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

  // 2. Determine Transaction Type
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

  // 4. Extract Merchant / Counterparty / Title & Intelligent Merchant Database
  let title = 'Transaction';

  // Indonesian Merchant Knowledge Base for Precise Recognition & Auto-Categorization
  interface KnownMerchantInfo {
    name: string;
    category: string;
    keywords: string[];
    forceType?: 'expense' | 'income' | 'transfer';
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

  // Check matching against known Indonesian merchants
  let matchedMerchant: KnownMerchantInfo | undefined = undefined;
  for (const m of KNOWN_MERCHANTS) {
    if (m.keywords.some((k) => lower.includes(k))) {
      matchedMerchant = m;
      title = m.name;
      break;
    }
  }

  // Look for target keywords like "ke", "di", "a/n", "untuk" if title is still default
  if (!matchedMerchant) {
    const merchantRegex = /(?:ke|di|a\/n|merchant|untuk|pada|toko)\s+([A-Za-z0-9\s&'.-]{2,30}?)(?:\s+(?:telah|sebesar|berhasil|via|senilai|pada|menggunakan|\.|,|$))/i;
    const merchantMatch = text.match(merchantRegex);

    if (merchantMatch && merchantMatch[1]) {
      const rawMerchant = merchantMatch[1].trim();
      const cleanMerchant = rawMerchant
        .replace(/^(rekening|merchant|toko|akun)\s+/i, '')
        .replace(/[0-9]{6,}/g, '')
        .trim();

      if (cleanMerchant.length >= 2) {
        title = cleanMerchant;
      }
    }
  }

  // Fallbacks for general categories if not yet set
  if (title === 'Transaction') {
    if (type === 'income') title = 'Pemasukan / Top Up Saldo';
    else if (type === 'transfer') title = 'Transfer Bank';
    else title = `Pembayaran ${institution}`;
  }

  // 5. Intelligent Category Mapping
  let category = 'Lainnya';
  if (matchedMerchant) {
    category = matchedMerchant.category;
  } else if (type === 'income') {
    category = 'Pemasukan';
  } else if (type === 'transfer') {
    category = 'Transfer';
  } else {
    const titleLower = title.toLowerCase();
    if (
      titleLower.includes('kopi') ||
      titleLower.includes('cafe') ||
      titleLower.includes('warung') ||
      titleLower.includes('resto') ||
      titleLower.includes('makan') ||
      lower.includes('makan') ||
      lower.includes('resto')
    ) {
      category = 'Makanan & Minuman';
    } else if (
      titleLower.includes('market') ||
      titleLower.includes('mart') ||
      titleLower.includes('toko') ||
      titleLower.includes('belanja')
    ) {
      category = 'Belanja';
    } else if (
      titleLower.includes('trans') ||
      titleLower.includes('ride') ||
      titleLower.includes('car') ||
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

