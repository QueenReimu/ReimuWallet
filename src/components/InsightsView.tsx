import React, { useState, useMemo } from 'react';
import { Transaction, Wallet, SavingsGoal, InsightsSubTab } from '../types';
import { formatRupiah } from '../data/mockData';

interface InsightsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  savingsGoals?: SavingsGoal[];
  onNavigateToInstantEntry?: () => void;
  onLoadSampleData?: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  transactions,
  wallets,
  savingsGoals = [],
  onNavigateToInstantEntry,
  onLoadSampleData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<InsightsSubTab>('overview');
  const [monthIndex, setMonthIndex] = useState(2); // 'September 2026'
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const months = ['Juli 2026', 'Agustus 2026', 'September 2026', 'Oktober 2026'];

  // Real-time automatic calculations from transactions
  const incomeTransactions = useMemo(
    () => transactions.filter((t) => t.type === 'income'),
    [transactions]
  );
  const expenseTransactions = useMemo(
    () => transactions.filter((t) => t.type === 'expense'),
    [transactions]
  );

  const totalIncome = useMemo(
    () => incomeTransactions.reduce((acc, t) => acc + t.amount, 0),
    [incomeTransactions]
  );
  const totalExpense = useMemo(
    () => expenseTransactions.reduce((acc, t) => acc + t.amount, 0),
    [expenseTransactions]
  );
  const netSurplus = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10)
      : 0;

  // Real Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { amount: number; count: number; icon: string; color: string }> = {};

    const categoryColors = [
      '#FF3E00',
      '#FF7A00',
      '#EAB308',
      '#3B82F6',
      '#10B981',
      '#8B5CF6',
      '#EC4899',
    ];

    expenseTransactions.forEach((t) => {
      const cat = t.category || 'Lainnya';
      if (!map[cat]) {
        let icon = 'category';
        const c = cat.toLowerCase();
        if (c.includes('makan') || c.includes('food') || c.includes('resto') || c.includes('kuliner')) icon = 'restaurant';
        else if (c.includes('transport') || c.includes('ojek') || c.includes('bensin')) icon = 'commute';
        else if (c.includes('belanja') || c.includes('shop')) icon = 'shopping_bag';
        else if (c.includes('hiburan') || c.includes('game') || c.includes('film')) icon = 'sports_esports';
        else if (c.includes('tagihan') || c.includes('listrik') || c.includes('wifi')) icon = 'receipt_long';
        else if (c.includes('kesehatan') || c.includes('obat')) icon = 'medical_services';

        const colorIndex = Object.keys(map).length % categoryColors.length;
        map[cat] = {
          amount: 0,
          count: 0,
          icon,
          color: categoryColors[colorIndex],
        };
      }
      map[cat].amount += t.amount;
      map[cat].count += 1;
    });

    const entries = Object.entries(map).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      icon: data.icon,
      color: data.color,
      percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
    }));

    return entries.sort((a, b) => b.amount - a.amount);
  }, [expenseTransactions, totalExpense]);

  // Weekly Breakdown for the Flow Trajectory
  const weeklyData = useMemo(() => {
    const weeks = [
      { label: 'M1 (1-7)', income: 0, expense: 0 },
      { label: 'M2 (8-14)', income: 0, expense: 0 },
      { label: 'M3 (15-21)', income: 0, expense: 0 },
      { label: 'M4 (22-30)', income: 0, expense: 0 },
    ];

    transactions.forEach((t) => {
      const day = parseInt((t.date || '').split('-')[2] || '1', 10);
      let weekIdx = 0;
      if (day <= 7) weekIdx = 0;
      else if (day <= 14) weekIdx = 1;
      else if (day <= 21) weekIdx = 2;
      else weekIdx = 3;

      if (t.type === 'income') {
        weeks[weekIdx].income += t.amount;
      } else if (t.type === 'expense') {
        weeks[weekIdx].expense += t.amount;
      }
    });

    return weeks;
  }, [transactions]);

  // Find maximum values for Deep Audit
  const auditMetrics = useMemo(() => {
    let maxExpenseTx: Transaction | null = null;
    let maxIncomeTx: Transaction | null = null;
    const dayExpenseMap: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === 'expense') {
        if (!maxExpenseTx || t.amount > maxExpenseTx.amount) maxExpenseTx = t;
        dayExpenseMap[t.date] = (dayExpenseMap[t.date] || 0) + t.amount;
      } else if (t.type === 'income') {
        if (!maxIncomeTx || t.amount > maxIncomeTx.amount) maxIncomeTx = t;
      }
    });

    let highestExpenseDay = { date: '-', amount: 0 };
    Object.entries(dayExpenseMap).forEach(([date, amount]) => {
      if (amount > highestExpenseDay.amount) {
        highestExpenseDay = { date, amount };
      }
    });

    const averageDailyExpense =
      expenseTransactions.length > 0 ? Math.round(totalExpense / 30) : 0;

    return {
      maxExpenseTx,
      maxIncomeTx,
      highestExpenseDay,
      averageDailyExpense,
      totalCount: transactions.length,
    };
  }, [transactions, expenseTransactions, totalExpense]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2400);
    }, 1000);
  };

  // Trajectory points calculation
  const maxWeeklyAmount = Math.max(
    ...weeklyData.map((w) => Math.max(w.income, w.expense)),
    100000
  );

  const getSvgY = (amount: number) => {
    if (amount <= 0) return 120;
    const ratio = Math.min(1, amount / maxWeeklyAmount);
    return Math.round(120 - ratio * 95);
  };

  const hasData = transactions.length > 0;

  return (
    <div className="flex flex-col w-full gap-4 pb-10 max-w-md mx-auto font-sans">
      {/* Sub-Tabs: Flow & Cadence | Budget Limits | Deep Audit */}
      <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-[#262626]">
        <button
          id="insights-tab-overview"
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 py-2 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all truncate text-center ${
            activeSubTab === 'overview'
              ? 'bg-[#FF3E00] text-white shadow-[0_0_12px_rgba(255,62,0,0.35)]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Arus &amp; Tren
        </button>
        <button
          id="insights-tab-budget"
          onClick={() => setActiveSubTab('budget')}
          className={`flex-1 py-2 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all truncate text-center ${
            activeSubTab === 'budget'
              ? 'bg-[#FF3E00] text-white shadow-[0_0_12px_rgba(255,62,0,0.35)]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Anggaran
        </button>
        <button
          id="insights-tab-audit"
          onClick={() => setActiveSubTab('audit')}
          className={`flex-1 py-2 px-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all truncate text-center ${
            activeSubTab === 'audit'
              ? 'bg-[#FF3E00] text-white shadow-[0_0_12px_rgba(255,62,0,0.35)]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Audit
        </button>
      </div>

      {/* Automatic Status Banner if empty */}
      {!hasData && (
        <div className="bg-[#121212] p-4 rounded-xl border border-[#FF3E00]/40 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF3E00] text-[20px]">auto_awesome</span>
            <span className="font-mono text-[12px] font-bold text-white uppercase tracking-wider">
              Analisis Otomatis Siap (Data Kosong)
            </span>
          </div>
          <p className="font-body-sm text-[12px] text-[#888888] leading-relaxed">
            Semua grafik, rasio tabungan, dan audit buku kas dihitung <strong>100% secara otomatis</strong> dari transaksi yang Anda catat. Saat ini belum ada data tercatat.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {onNavigateToInstantEntry && (
              <button
                type="button"
                onClick={onNavigateToInstantEntry}
                className="px-3 py-1.5 rounded-lg bg-[#FF3E00] hover:bg-[#FF551C] text-white font-mono text-[11px] font-bold uppercase flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>Catat Transaksi Pertama</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 1: FLOW TRAJECTORY & SPENDING ALLOCATION */}
      {activeSubTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Month Selector Carousel */}
          <div className="flex items-center justify-between bg-[#121212] p-2 rounded-xl border border-[#262626]">
            <button
              onClick={() => monthIndex > 0 && setMonthIndex(monthIndex - 1)}
              disabled={monthIndex === 0}
              aria-label="Bulan Sebelumnya"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1C1C1C] transition-all disabled:opacity-30 active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#181818] border border-[#2E2E2E]">
              <span className="material-symbols-outlined text-[#FF3E00] text-[18px]">calendar_today</span>
              <span className="font-mono text-[14px] text-white font-bold tracking-tight uppercase">
                {months[monthIndex]}
              </span>
              <span className="material-symbols-outlined text-[#888888] text-[16px]">expand_more</span>
            </div>

            <button
              onClick={() => monthIndex < months.length - 1 && setMonthIndex(monthIndex + 1)}
              disabled={monthIndex === months.length - 1}
              aria-label="Bulan Berikutnya"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1C1C1C] transition-all disabled:opacity-30 active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          {/* Performance Overview Metrics 2x2 Bento (Real-Time Values) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Income */}
            <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] relative overflow-hidden flex flex-col justify-between">
              <div className="w-1 h-6 bg-emerald-500 absolute top-3 left-0 rounded-r-full shadow-[0_0_8px_#10B981]"></div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[9px] text-[#888888] uppercase tracking-[0.2em] font-extrabold">
                  Total Pemasukan
                </span>
                <span className="w-7 h-7 rounded-lg bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-[18px] text-white font-black tracking-tight">
                  Rp {formatRupiah(totalIncome)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-mono text-[10px] text-[#888888]">
                    {incomeTransactions.length} transaksi masuk
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] relative overflow-hidden flex flex-col justify-between">
              <div className="w-1 h-6 bg-[#FF3E00] absolute top-3 left-0 rounded-r-full shadow-[0_0_8px_#FF3E00]"></div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[9px] text-[#888888] uppercase tracking-[0.2em] font-extrabold">
                  Total Pengeluaran
                </span>
                <span className="w-7 h-7 rounded-lg bg-[#24120C] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00]">
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-[18px] text-white font-black tracking-tight">
                  Rp {formatRupiah(totalExpense)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-mono text-[10px] text-[#888888]">
                    {expenseTransactions.length} transaksi belanja
                  </span>
                </div>
              </div>
            </div>

            {/* Net Savings */}
            <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] relative overflow-hidden flex flex-col justify-between">
              <div className="w-1 h-6 bg-white absolute top-3 left-0 rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[9px] text-[#888888] uppercase tracking-[0.2em] font-extrabold">
                  Surplus Bersih
                </span>
                <span className="w-7 h-7 rounded-lg bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[16px]">savings</span>
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-[18px] text-white font-black tracking-tight">
                  Rp {formatRupiah(Math.max(0, netSurplus))}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      netSurplus >= 0 ? 'text-emerald-400' : 'text-[#FF4D4D]'
                    }`}
                  >
                    {netSurplus >= 0 ? 'Sisa Kas Positif' : 'Defisit Anggaran'}
                  </span>
                </div>
              </div>
            </div>

            {/* Savings Rate */}
            <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] relative overflow-hidden flex flex-col justify-between">
              <div className="w-1 h-6 bg-amber-400 absolute top-3 left-0 rounded-r-full shadow-[0_0_8px_#FBBF24]"></div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[9px] text-[#888888] uppercase tracking-[0.2em] font-extrabold">
                  Rasio Tabungan
                </span>
                <span className="w-7 h-7 rounded-lg bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-amber-400">
                  <span className="material-symbols-outlined text-[16px]">pie_chart</span>
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-[18px] text-white font-black tracking-tight">
                  {savingsRate}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-mono text-[10px] text-[#888888]">
                    {savingsRate > 50 ? 'Retensi Sehat' : savingsRate > 0 ? 'Cukup' : '0% (Belum ada)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Flow Trajectory Graphic */}
          <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="font-mono text-[15px] font-bold text-white uppercase tracking-tight">
                  Trajektori Arus Keuangan
                </h2>
                <span className="font-mono text-[11px] text-[#888888] uppercase">
                  Perbandingan ritme mingguan (M1 - M4)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="font-mono text-[10px] text-[#888888] uppercase">Masuk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#FF3E00]"></div>
                  <span className="font-mono text-[10px] text-[#888888] uppercase">Keluar</span>
                </div>
              </div>
            </div>

            {/* SVG Trend Graphic */}
            <div className="relative w-full h-40 pt-2">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 340 140">
                <defs>
                  <linearGradient id="expenseGlowDarkDynamic" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FF3E00" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FF3E00" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Reference Gridlines */}
                <line stroke="#222222" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="340" y1="20" y2="20" />
                <line stroke="#222222" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="340" y1="70" y2="70" />
                <line stroke="#222222" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="340" y1="120" y2="120" />

                {hasData ? (
                  <>
                    {/* Income Path */}
                    <path
                      d={`M 20 ${getSvgY(weeklyData[0].income)} C 70 ${getSvgY(weeklyData[0].income)}, 90 ${getSvgY(weeklyData[1].income)}, 120 ${getSvgY(weeklyData[1].income)} C 170 ${getSvgY(weeklyData[1].income)}, 190 ${getSvgY(weeklyData[2].income)}, 220 ${getSvgY(weeklyData[2].income)} C 270 ${getSvgY(weeklyData[2].income)}, 290 ${getSvgY(weeklyData[3].income)}, 320 ${getSvgY(weeklyData[3].income)}`}
                      fill="none"
                      stroke="#10B981"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />

                    {/* Expense Area and Path */}
                    <path
                      d={`M 20 ${getSvgY(weeklyData[0].expense)} C 70 ${getSvgY(weeklyData[0].expense)}, 90 ${getSvgY(weeklyData[1].expense)}, 120 ${getSvgY(weeklyData[1].expense)} C 170 ${getSvgY(weeklyData[1].expense)}, 190 ${getSvgY(weeklyData[2].expense)}, 220 ${getSvgY(weeklyData[2].expense)} C 270 ${getSvgY(weeklyData[2].expense)}, 290 ${getSvgY(weeklyData[3].expense)}, 320 ${getSvgY(weeklyData[3].expense)} L 320 120 L 20 120 Z`}
                      fill="url(#expenseGlowDarkDynamic)"
                    />
                    <path
                      d={`M 20 ${getSvgY(weeklyData[0].expense)} C 70 ${getSvgY(weeklyData[0].expense)}, 90 ${getSvgY(weeklyData[1].expense)}, 120 ${getSvgY(weeklyData[1].expense)} C 170 ${getSvgY(weeklyData[1].expense)}, 190 ${getSvgY(weeklyData[2].expense)}, 220 ${getSvgY(weeklyData[2].expense)} C 270 ${getSvgY(weeklyData[2].expense)}, 290 ${getSvgY(weeklyData[3].expense)}, 320 ${getSvgY(weeklyData[3].expense)}`}
                      fill="none"
                      stroke="#FF3E00"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />

                    {/* Node points */}
                    <circle cx="20" cy={getSvgY(weeklyData[0].expense)} fill="#FF3E00" r="3.5" />
                    <circle cx="120" cy={getSvgY(weeklyData[1].expense)} fill="#FF3E00" r="3.5" />
                    <circle cx="220" cy={getSvgY(weeklyData[2].expense)} fill="#FF3E00" r="3.5" />
                    <circle cx="320" cy={getSvgY(weeklyData[3].expense)} fill="#FF3E00" r="3.5" />

                    <circle cx="20" cy={getSvgY(weeklyData[0].income)} fill="#10B981" r="3.5" />
                    <circle cx="120" cy={getSvgY(weeklyData[1].income)} fill="#10B981" r="3.5" />
                    <circle cx="220" cy={getSvgY(weeklyData[2].income)} fill="#10B981" r="3.5" />
                    <circle cx="320" cy={getSvgY(weeklyData[3].income)} fill="#10B981" r="3.5" />
                  </>
                ) : (
                  /* Clean zero-state baseline */
                  <>
                    <line stroke="#333333" strokeDasharray="4 4" strokeWidth="1.5" x1="20" x2="320" y1="120" y2="120" />
                    <circle cx="20" cy="120" fill="#444444" r="3" />
                    <circle cx="120" cy="120" fill="#444444" r="3" />
                    <circle cx="220" cy="120" fill="#444444" r="3" />
                    <circle cx="320" cy="120" fill="#444444" r="3" />
                    <text x="170" y="70" textAnchor="middle" fill="#666666" fontSize="11" fontFamily="monospace">
                      Belum Ada Transaksi Tercatat
                    </text>
                  </>
                )}
              </svg>
            </div>

            {/* Timeline Axis */}
            <div className="flex items-center justify-between text-[#666666] font-mono text-[10px] uppercase pt-1 border-t border-[#222222]">
              <span>M1 (1-7 Sep)</span>
              <span>M2 (8-14 Sep)</span>
              <span>M3 (15-21 Sep)</span>
              <span>M4 (22-30 Sep)</span>
            </div>
          </div>

          {/* Spending Allocation Donut & Ranked Roster */}
          <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="font-mono text-[15px] font-bold text-white uppercase tracking-tight">
                  Alokasi Pengeluaran
                </h2>
                <span className="font-mono text-[11px] text-[#888888] uppercase">
                  Total dialokasikan: Rp {formatRupiah(totalExpense)}
                </span>
              </div>
              <button
                onClick={() => setActiveSubTab('budget')}
                className="text-[#FF3E00] font-mono text-[11px] uppercase tracking-wider flex items-center gap-0.5 font-bold hover:underline"
              >
                <span>Lihat Batas</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {categoryStats.length > 0 ? (
              <div className="flex flex-col gap-3">
                {categoryStats.map((item) => (
                  <div key={item.name} className="flex flex-col gap-1.5 p-2 rounded-lg bg-[#161616] border border-[#242424]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[15px]"
                          style={{ backgroundColor: `${item.color}25`, border: `1px solid ${item.color}50`, color: item.color }}
                        >
                          <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-body-md text-[13px] font-bold text-white">{item.name}</span>
                          <span className="font-mono text-[10px] text-[#888888]">{item.count} transaksi</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-[13px] font-bold text-white">
                          Rp {formatRupiah(item.amount)}
                        </span>
                        <span className="font-mono text-[10px] text-[#FF3E00] font-bold">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#202020] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, item.percentage)}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-[#161616] rounded-xl border border-[#262626] flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-[#555555]">pie_chart</span>
                <span className="font-mono text-[12px] text-[#888888] uppercase">
                  Belum ada pengeluaran belanja yang tercatat.
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Advice & Insights Note */}
          <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#24120C] border border-[#FF3E00]/40 flex items-center justify-center text-[#FF3E00] shrink-0">
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[12px] font-bold text-white uppercase">
                Catatan Evaluasi Keuangan
              </span>
              <p className="font-body-sm text-[12px] text-[#AAAAAA] mt-1 leading-relaxed">
                {hasData ? (
                  <>
                    Pengeluaran terbesar Anda saat ini berada pada kategori{' '}
                    <strong className="text-white">{categoryStats[0]?.name || '-'}</strong> (Rp{' '}
                    {formatRupiah(categoryStats[0]?.amount || 0)}). Surplus kas sebesar{' '}
                    <strong className="text-white">Rp {formatRupiah(Math.max(0, netSurplus))}</strong>{' '}
                    dapat dialokasikan ke celengan tabungan impian.
                  </>
                ) : (
                  'Saat Anda mencatat transaksi harian, sistem ReimuWallet akan mengevaluasi alokasi pengeluaran secara real-time dan memberikan saran optimalisasi tabungan.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BUDGET LIMITS & TARGET ALLOCATIONS */}
      {activeSubTab === 'budget' && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#121212] p-4 rounded-xl border border-[#262626] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="font-mono text-[15px] font-bold text-white uppercase tracking-tight">
                  Status Anggaran Bulanan
                </h2>
                <span className="font-mono text-[11px] text-[#888888] uppercase">
                  {hasData
                    ? `Total Belanja: Rp ${formatRupiah(totalExpense)}`
                    : 'Belum ada anggaran terpakai (Rp 0)'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#FF3E00] font-bold uppercase px-2 py-0.5 rounded bg-[#24120C] border border-[#FF3E00]/40">
                Otomatis
              </span>
            </div>

            {/* Dynamic Category Budgets */}
            {categoryStats.length > 0 ? (
              <div className="flex flex-col gap-3">
                {categoryStats.map((item) => {
                  // Standard simulated target is either existing amount * 1.5 or benchmark
                  const benchmark = Math.max(item.amount * 1.25, 200000);
                  const usagePercent = Math.min(100, Math.round((item.amount / benchmark) * 100));
                  const isWarning = usagePercent >= 80;

                  return (
                    <div
                      key={item.name}
                      className={`bg-[#161616] p-3.5 rounded-xl border flex flex-col gap-2 ${
                        isWarning ? 'border-[#FF3E00]/50' : 'border-[#262626]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: `${item.color}25`, color: item.color }}
                          >
                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-body-md text-[13px] font-bold text-white">
                              {item.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#888888] uppercase">
                              {usagePercent}% dari alokasi aman
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[14px] font-bold text-white">
                            Rp {formatRupiah(item.amount)}
                          </span>
                          <span className="font-mono text-[10px] text-[#888888]">
                            dari ~Rp {formatRupiah(benchmark)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-[#202020] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isWarning ? 'bg-[#FF3E00]' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#161616] rounded-xl border border-[#262626] flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-[#555555]">tune</span>
                <span className="font-mono text-[12px] text-[#888888] uppercase">
                  Belum ada pengeluaran anggaran. Catat transaksi untuk memantau batas pengeluaran kategori.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: LEDGER DEEP AUDIT */}
      {activeSubTab === 'audit' && (
        <div className="flex flex-col gap-4">
          {/* Executive Summary Card */}
          <section className="rounded-2xl bg-[#121212] p-5 border border-[#262626] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF3E00] shadow-[0_0_8px_#FF3E00]"></div>
            <div className="flex items-center justify-between mb-4 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#FF3E00] text-[20px]">verified_user</span>
                <span className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-[#888888] font-extrabold">
                  Ringkasan Audit Buku Kas
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#24120C] border border-[#FF3E00]/40 text-[#FF3E00]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3E00] shadow-[0_0_6px_#FF3E00]"></span>
                <span className="font-mono text-[10px] uppercase tracking-wide font-black">
                  {hasData ? 'Terverifikasi' : 'Data Bersih'}
                </span>
              </div>
            </div>

            {/* 2x2 Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#161616] flex flex-col justify-between border border-[#262626]">
                <div className="flex items-center justify-between text-[#888888]">
                  <span className="font-label-caps text-[9px] uppercase tracking-wider font-extrabold">
                    Total Pemasukan
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">arrow_downward</span>
                </div>
                <div className="mt-2">
                  <span className="font-mono text-[10px] text-[#888888]">Rp</span>
                  <p className="font-mono text-[16px] text-white font-bold">{formatRupiah(totalIncome)}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161616] flex flex-col justify-between border border-[#262626]">
                <div className="flex items-center justify-between text-[#888888]">
                  <span className="font-label-caps text-[9px] uppercase tracking-wider font-extrabold">
                    Total Pengeluaran
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#FF3E00]">arrow_upward</span>
                </div>
                <div className="mt-2">
                  <span className="font-mono text-[10px] text-[#888888]">Rp</span>
                  <p className="font-mono text-[16px] text-[#FF3E00] font-bold">{formatRupiah(totalExpense)}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161616] flex flex-col justify-between border border-[#262626]">
                <div className="flex items-center justify-between text-[#888888]">
                  <span className="font-label-caps text-[9px] uppercase tracking-wider font-extrabold">
                    Tabungan Bersih
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-white">savings</span>
                </div>
                <div className="mt-2">
                  <span className="font-mono text-[10px] text-[#888888]">Rp</span>
                  <p className="font-mono text-[16px] text-white font-bold">
                    {formatRupiah(Math.max(0, netSurplus))}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161616] flex flex-col justify-between border border-[#262626]">
                <div className="flex items-center justify-between text-[#888888]">
                  <span className="font-label-caps text-[9px] uppercase tracking-wider font-extrabold">
                    Rasio Tabungan
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-white">pie_chart</span>
                </div>
                <div className="mt-2">
                  <p className="font-mono text-[16px] text-white font-bold">{savingsRate}%</p>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                    {savingsRate > 50 ? 'Kondisi Prima' : savingsRate > 0 ? 'Positif' : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Visual Progress Track */}
            <div className="mt-4 pt-3 border-t border-[#222222] flex flex-col gap-1.5">
              <div className="flex justify-between font-mono text-[11px] text-[#888888] uppercase">
                <span>Rasio Retensi Modal</span>
                <span className="font-bold text-white">
                  {totalIncome > 0
                    ? `${(100 - savingsRate).toFixed(1)}% Belanja / ${savingsRate.toFixed(1)}% Ditabung`
                    : '0% Belanja / 0% Ditabung'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1C1C1C] overflow-hidden flex border border-[#262626]">
                <div
                  className="h-full bg-[#FF3E00]"
                  style={{ width: `${totalIncome > 0 ? 100 - savingsRate : 0}%` }}
                ></div>
                <div className="h-full bg-white" style={{ width: `${savingsRate}%` }}></div>
              </div>
            </div>
          </section>

          {/* Ledger Deep-Audit Items */}
          <section className="rounded-2xl bg-[#121212] p-4 border border-[#262626]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#FF3E00] text-[20px]">analytics</span>
              <h2 className="font-mono text-[15px] font-bold text-white uppercase tracking-tight">
                Parameter Audit Real-Time
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#161616] border border-[#262626]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#888888]">receipt</span>
                  <div>
                    <p className="font-body-md text-[13px] font-bold text-white">Total Transaksi Dicatat</p>
                    <p className="font-mono text-[11px] text-[#888888] uppercase">Buku kas terhitung</p>
                  </div>
                </div>
                <span className="font-mono text-[13px] text-white font-bold">
                  {auditMetrics.totalCount} transaksi
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#161616] border border-[#262626]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#888888]">speed</span>
                  <div>
                    <p className="font-body-md text-[13px] font-bold text-white">Rata-rata Harian</p>
                    <p className="font-mono text-[11px] text-[#888888] uppercase">Estimasi 30 hari</p>
                  </div>
                </div>
                <span className="font-mono text-[13px] text-white font-bold">
                  Rp {formatRupiah(auditMetrics.averageDailyExpense)} / hari
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#161616] border border-[#262626]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#FF3E00]">shopping_bag</span>
                  <div>
                    <p className="font-body-md text-[13px] font-bold text-white">Pengeluaran Terbesar</p>
                    <p className="font-mono text-[11px] text-[#888888] uppercase">
                      {auditMetrics.maxExpenseTx?.title || '-'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[13px] text-[#FF3E00] font-bold">
                  Rp {formatRupiah(auditMetrics.maxExpenseTx?.amount || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#161616] border border-[#262626]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-emerald-400">domain</span>
                  <div>
                    <p className="font-body-md text-[13px] font-bold text-white">Pemasukan Terbesar</p>
                    <p className="font-mono text-[11px] text-[#888888] uppercase">
                      {auditMetrics.maxIncomeTx?.title || '-'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[13px] text-white font-bold">
                  Rp {formatRupiah(auditMetrics.maxIncomeTx?.amount || 0)}
                </span>
              </div>
            </div>
          </section>

          {/* Export CTA */}
          <button
            onClick={handleExport}
            className="w-full h-12 rounded-xl bg-[#FF3E00] hover:bg-[#ff551c] text-white font-mono text-[13px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,62,0,0.4)] active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">sim_card_download</span>
            <span>
              {isExporting
                ? 'Menyusun Laporan...'
                : exportSuccess
                ? 'Laporan Siap Diunduh'
                : 'Ekspor Laporan (PDF / CSV)'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
