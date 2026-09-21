import { Transaction, Wallet, SavingsGoal, UserProfile } from '../types';
import { formatRupiah } from '../data/mockData';

/**
 * Universal Mobile & Desktop file sharing/downloading helper.
 * On Android Capacitor / WebView:
 * 1. Checks and uses navigator.share({ files: [...] }) -> Opens Android native Share sheet / Save to files / Drive / WhatsApp.
 * 2. If rejected or not supported, tries direct blob anchor with download attribute.
 * 3. Fallback to Data URI anchor.
 * 4. Fallback to clipboard copy if requested.
 */
export async function exportFileToDevice(
  content: string | Blob,
  filename: string,
  mimeType: string,
  shareTitle: string = 'Ekspor Berkas Reimu Wallet'
): Promise<{ success: boolean; method: 'share' | 'download' | 'copy'; error?: string }> {
  try {
    const blob = typeof content === 'string'
      ? new Blob([content], { type: `${mimeType};charset=utf-8` })
      : content;

    // 1. Direct Blob URL download (Reliable, synchronous browser download trigger)
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      return { success: true, method: 'download' };
    } catch (blobErr) {
      // If Blob URL download fails, try next methods
    }

    // 2. Fallback: Data URI download for text (JSON / CSV / HTML)
    if (typeof content === 'string') {
      try {
        const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, method: 'download' };
      } catch (dataErr) {
        // Continue to Web Share
      }
    }

    // 3. Optional Web Share API fallback
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const file = new File([blob], filename, { type: mimeType });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: `Berkas ${filename} dari aplikasi Reimu Wallet`,
          });
          return { success: true, method: 'share' };
        }
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return { success: true, method: 'share' };
        }
      }
    }

    // 4. Fallback: Copy to clipboard if text content
    if (typeof content === 'string' && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      return { success: true, method: 'copy' };
    }

    return {
      success: false,
      method: 'download',
      error: 'Tidak dapat menyimpan atau mengunduh berkas di perangkat ini.',
    };
  } catch (err: any) {
    return {
      success: false,
      method: 'download',
      error: err?.message || 'Terjadi kesalahan saat menyimpan berkas.',
    };
  }
}

/**
 * Generate clean standard CSV text for transactions ledger.
 */
export function generateLedgerCsv(transactions: Transaction[], wallets: Wallet[] = []): string {
  const headers = [
    'ID',
    'Tanggal',
    'Waktu',
    'Judul Transaksi',
    'Tipe',
    'Kategori',
    'Nominal (Rp)',
    'Sumber Dompet',
    'Tujuan Transfer',
    'Catatan',
  ];

  const rows = transactions.map((t) => {
    const typeLabel =
      t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer';
    return [
      escapeCsvCell(t.id),
      escapeCsvCell(t.date || ''),
      escapeCsvCell(t.time || ''),
      escapeCsvCell(t.title),
      escapeCsvCell(typeLabel),
      escapeCsvCell(t.category),
      t.amount.toString(),
      escapeCsvCell(t.wallet),
      escapeCsvCell(t.targetWallet || ''),
      escapeCsvCell(t.note || ''),
    ].join(',');
  });

  // Prepend UTF-8 BOM so Excel opens Indonesian letters and accents cleanly
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

function escapeCsvCell(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Generate printable / PDF-ready HTML report with modern high-contrast styling.
 * When rendered in a pop-up or iframe, it triggers window.print() or can be saved directly as PDF.
 */
export function generatePrintableReportHtml(options: {
  transactions: Transaction[];
  wallets: Wallet[];
  savingsGoals?: SavingsGoal[];
  userProfile?: UserProfile;
  periodName?: string;
}): string {
  const { transactions, wallets, savingsGoals = [], userProfile, periodName = 'September 2026' } = options;

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSurplus = totalIncome - totalExpense;
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const rowsHtml = transactions
    .slice(0, 200)
    .map((t, idx) => {
      const isIncome = t.type === 'income';
      const isTransfer = t.type === 'transfer';
      const amountColor = isIncome ? '#10B981' : isTransfer ? '#3B82F6' : '#FF3E00';
      const prefix = isIncome ? '+Rp ' : isTransfer ? '⇄ Rp ' : '-Rp ';

      return `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 8px 10px; font-family: monospace; font-size: 11px; color: #6B7280;">${idx + 1}</td>
        <td style="padding: 8px 10px; font-family: monospace; font-size: 12px; color: #374151;">${t.date || '-'}</td>
        <td style="padding: 8px 10px; font-size: 13px; font-weight: 600; color: #111827;">${t.title}</td>
        <td style="padding: 8px 10px; font-size: 11px; font-family: monospace; color: #4B5563;">${t.category}</td>
        <td style="padding: 8px 10px; font-size: 11px; font-family: monospace; color: #4B5563;">${t.wallet}${t.targetWallet ? ' → ' + t.targetWallet : ''}</td>
        <td style="padding: 8px 10px; font-family: monospace; font-size: 12px; font-weight: bold; text-align: right; color: ${amountColor};">
          ${prefix}${formatRupiah(t.amount)}
        </td>
      </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Keuangan Reimu Wallet - ${periodName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media print {
      body { margin: 0; padding: 15px; color: #000; background: #FFF; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #F9FAFB;
      color: #111827;
      line-height: 1.4;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      padding: 12px;
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6B7280;
      font-weight: 700;
    }
    .stat-val {
      font-size: 18px;
      font-family: monospace;
      font-weight: 700;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #F3F4F6;
      padding: 10px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4B5563;
      border-bottom: 2px solid #D1D5DB;
    }
    .btn {
      background: #FF3E00;
      color: #FFF;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #111827; color: #FFF; padding: 14px 20px; border-radius: 12px;">
    <div>
      <strong style="font-size: 15px; color: #FF5E36;">Reimu Wallet</strong>
      <span style="font-size: 13px; color: #9CA3AF; margin-left: 8px;">Pratinjau Cetak / PDF Laporan Keuangan</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn" onclick="window.print()">Cetak / Simpan PDF</button>
      <button style="background: #374151; color: #FFF; border: none; border-radius: 8px; padding: 10px 14px; font-size: 13px; cursor: pointer;" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #E5E7EB; padding-bottom: 16px;">
    <div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #111827;">Laporan Buku Kas &amp; Keuangan</h1>
      <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">
        Pemilik: <strong>${userProfile?.name || 'Pengguna'}</strong> &bull; Periode: <strong>${periodName}</strong>
      </p>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 11px; font-family: monospace; color: #9CA3AF;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</span>
      <div style="font-size: 12px; font-weight: bold; color: #FF3E00; margin-top: 2px;">Aplikasi Reimu Wallet</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-label">Total Pemasukan</div>
      <div class="stat-val" style="color: #10B981;">Rp ${formatRupiah(totalIncome)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Total Pengeluaran</div>
      <div class="stat-val" style="color: #FF3E00;">Rp ${formatRupiah(totalExpense)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Surplus Kas Bersih</div>
      <div class="stat-val" style="color: ${netSurplus >= 0 ? '#111827' : '#DC2626'};">Rp ${formatRupiah(netSurplus)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Total Saldo Likuiditas</div>
      <div class="stat-val" style="color: #2563EB;">Rp ${formatRupiah(totalBalance)}</div>
    </div>
  </div>

  <div class="card">
    <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #374151;">
      Rincian Riwayat Transaksi (${transactions.length} Catatan)
    </h3>
    <table>
      <thead>
        <tr>
          <th style="width: 40px;">No</th>
          <th style="width: 95px;">Tanggal</th>
          <th>Deskripsi Transaksi</th>
          <th style="width: 110px;">Kategori</th>
          <th style="width: 120px;">Dompet</th>
          <th style="width: 140px; text-align: right;">Nominal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <div style="margin-top: 30px; text-align: center; color: #9CA3AF; font-size: 11px; font-family: monospace;">
    Laporan ini dibuat secara otomatis dari basis data lokal Reimu Wallet &bull; Bebas PIN &bull; Privasi Penuh
  </div>
</body>
</html>`;
}

/**
 * Trigger browser/webview print or PDF download
 */
export function openPrintableReport(htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Allow styles to load before auto printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  } else {
    // If pop-up blocked on mobile, load into temporary hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 5000);
      }, 500);
    }
  }
}
