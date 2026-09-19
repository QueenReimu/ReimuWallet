import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../data/mockData';

interface SurplusPieChartProps {
  transactions: Transaction[];
  selectedPeriod: 'Sep' | '30Days';
  onChangePeriod: (period: 'Sep' | '30Days') => void;
  onNavigateToAnalytics?: () => void;
  onRecordNew?: () => void;
}

interface SliceData {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
  startAngle: number;
  endAngle: number;
}

export const SurplusPieChart: React.FC<SurplusPieChartProps> = ({
  transactions,
  selectedPeriod,
  onChangePeriod,
  onNavigateToAnalytics,
  onRecordNew,
}) => {
  const [chartMode, setChartMode] = useState<'ringkas' | 'kategori'>('ringkas');
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  // Compute real income and expenses from transactions (No hardcoded mock fallbacks)
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const hasData = totalIncome > 0 || totalExpense > 0;
  const netSurplus = Math.max(0, totalIncome - totalExpense);

  const surplusPct = totalIncome > 0 ? (netSurplus / totalIncome) * 100 : 0;
  const expensePct = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : totalExpense > 0 ? 100 : 0;

  // Category expenses for detailed mode
  const categoryExpenses: Record<string, { amount: number; icon: string; color: string }> = {
    Makanan: { amount: 0, icon: 'restaurant', color: '#FF5E36' },
    Hiburan: { amount: 0, icon: 'sports_esports', color: '#38BDF8' },
    Transportasi: { amount: 0, icon: 'commute', color: '#FBBF24' },
    Belanja: { amount: 0, icon: 'shopping_bag', color: '#F472B6' },
    Lainnya: { amount: 0, icon: 'category', color: '#A78BFA' },
  };

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category.toLowerCase();
      if (cat.includes('makan') || cat.includes('food')) categoryExpenses.Makanan.amount += t.amount;
      else if (cat.includes('hiburan') || cat.includes('game') || cat.includes('leisure')) categoryExpenses.Hiburan.amount += t.amount;
      else if (cat.includes('transport') || cat.includes('ojek') || cat.includes('transit')) categoryExpenses.Transportasi.amount += t.amount;
      else if (cat.includes('belanja') || cat.includes('shopping')) categoryExpenses.Belanja.amount += t.amount;
      else categoryExpenses.Lainnya.amount += t.amount;
    });

  // Build slices based on mode
  let slices: SliceData[] = [];
  const GAP_DEG = 3; // visual separation gap between slices

  if (!hasData) {
    slices = [
      {
        id: 'empty',
        name: 'Belum Ada Data',
        amount: 0,
        percentage: 0,
        color: '#2A2A2A',
        icon: 'donut_large',
        startAngle: 0,
        endAngle: 360,
      },
    ];
  } else if (chartMode === 'ringkas') {
    const surplusAngleSpan = totalIncome > 0 ? Math.max(10, (surplusPct / 100) * 360) : 0;
    const expenseAngleSpan = 360 - surplusAngleSpan;

    if (netSurplus > 0) {
      slices.push({
        id: 'surplus',
        name: 'Surplus Bersih',
        amount: netSurplus,
        percentage: surplusPct,
        color: '#10B981',
        icon: 'savings',
        startAngle: GAP_DEG / 2,
        endAngle: surplusAngleSpan - GAP_DEG / 2,
      });
    }

    if (totalExpense > 0) {
      slices.push({
        id: 'expense',
        name: 'Total Beban Keluar',
        amount: totalExpense,
        percentage: expensePct,
        color: '#FF5E36',
        icon: 'trending_down',
        startAngle: (netSurplus > 0 ? surplusAngleSpan : 0) + GAP_DEG / 2,
        endAngle: 360 - GAP_DEG / 2,
      });
    }
  } else {
    // Multi-category breakdown + Surplus
    let currentAngle = 0;
    const surplusAngleSpan = (surplusPct / 100) * 360;

    if (netSurplus > 0) {
      slices.push({
        id: 'surplus',
        name: 'Surplus Bersih',
        amount: netSurplus,
        percentage: surplusPct,
        color: '#10B981',
        icon: 'savings',
        startAngle: currentAngle + GAP_DEG / 2,
        endAngle: currentAngle + surplusAngleSpan - GAP_DEG / 2,
      });
      currentAngle += surplusAngleSpan;
    }

    const divisor = totalIncome > 0 ? totalIncome : totalExpense > 0 ? totalExpense : 1;
    Object.entries(categoryExpenses).forEach(([catName, data]) => {
      if (data.amount > 0) {
        const catPct = (data.amount / divisor) * 100;
        const angleSpan = (catPct / 100) * (360 - (netSurplus > 0 ? surplusAngleSpan : 0));
        if (angleSpan > 2) {
          slices.push({
            id: catName.toLowerCase(),
            name: catName,
            amount: data.amount,
            percentage: catPct,
            color: data.color,
            icon: data.icon,
            startAngle: currentAngle + GAP_DEG / 2,
            endAngle: currentAngle + angleSpan - GAP_DEG / 2,
          });
          currentAngle += angleSpan;
        }
      }
    });
  }

  // Polar to Cartesian conversion
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Generate SVG donut arc path
  const describeArc = (
    x: number,
    y: number,
    rInner: number,
    rOuter: number,
    startAngle: number,
    endAngle: number
  ) => {
    const delta = Math.min(Math.max(endAngle - startAngle, 0.1), 359.99);
    const effectiveEnd = startAngle + delta;

    const startOuter = polarToCartesian(x, y, rOuter, effectiveEnd);
    const endOuter = polarToCartesian(x, y, rOuter, startAngle);
    const startInner = polarToCartesian(x, y, rInner, startAngle);
    const endInner = polarToCartesian(x, y, rInner, effectiveEnd);

    const arcSweep = delta > 180 ? 1 : 0;

    return [
      'M', startOuter.x, startOuter.y,
      'A', rOuter, rOuter, 0, arcSweep, 0, endOuter.x, endOuter.y,
      'L', startInner.x, startInner.y,
      'A', rInner, rInner, 0, arcSweep, 1, endInner.x, endInner.y,
      'Z',
    ].join(' ');
  };

  const activeSlice = slices.find((s) => s.id === hoveredSliceId) || slices[0];

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#151921] p-4 border border-[#28303F]">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-label-caps text-[9px] uppercase text-[#94A3B8] tracking-[0.15em] font-bold">
              Diagram Pie Surplus
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
          <h2 className="font-mono text-[14px] text-[#F1F5F9] font-bold">
            Rasio Surplus vs Beban
          </h2>
        </div>

        {/* Period Selector Toggle */}
        <div className="flex items-center bg-[#1C222D] p-0.5 rounded-lg border border-[#28303F]">
          <button
            type="button"
            onClick={() => onChangePeriod('Sep')}
            className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              selectedPeriod === 'Sep'
                ? 'bg-[#FF5E36] text-white font-bold'
                : 'text-[#94A3B8] font-semibold hover:text-white'
            }`}
          >
            Sep 2026
          </button>
          <button
            type="button"
            onClick={() => onChangePeriod('30Days')}
            className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              selectedPeriod === '30Days'
                ? 'bg-[#FF5E36] text-white font-bold'
                : 'text-[#94A3B8] font-semibold hover:text-white'
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Mode View Filter Tabs */}
      <div className="flex items-center justify-between py-1 px-1.5 rounded-xl bg-[#1C222D] border border-[#28303F]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setChartMode('ringkas')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              chartMode === 'ringkas'
                ? 'bg-[#28303F] text-white'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Porsi Ringkas
          </button>
          <button
            type="button"
            onClick={() => setChartMode('kategori')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              chartMode === 'kategori'
                ? 'bg-[#28303F] text-white'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Rinci Kategori
          </button>
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px] font-bold pr-1">
          {hasData ? (
            surplusPct >= 50 ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>+{surplusPct.toFixed(1)}% SEHAT</span>
              </span>
            ) : surplusPct > 0 ? (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <span>+{surplusPct.toFixed(1)}% STABIL</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#FF5E36]">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>DEFISIT KAS</span>
              </span>
            )
          ) : (
            <span className="flex items-center gap-1 text-[#94A3B8]">
              <span className="material-symbols-outlined text-[14px]">circle</span>
              <span>KOSONG (SIAP CATAT)</span>
            </span>
          )}
        </div>
      </div>

      {/* Interactive Pie SVG Visualizer */}
      <div className="relative flex flex-col items-center justify-center py-2">
        <svg
          className="w-52 h-52 overflow-visible select-none"
          viewBox="0 0 220 220"
        >
          {/* Background circle track */}
          <circle
            cx="110"
            cy="110"
            r="78"
            fill="none"
            stroke={hasData ? '#1C222D' : '#28303F'}
            strokeWidth="32"
            strokeDasharray={hasData ? undefined : '4 4'}
          />

          {/* Slices */}
          {hasData &&
            slices.map((slice) => {
              const isHovered = hoveredSliceId === slice.id;
              const rOuter = isHovered ? 83 : 79;
              const rInner = isHovered ? 45 : 47;
              const pathData = describeArc(110, 110, rInner, rOuter, slice.startAngle, slice.endAngle);

              return (
                <path
                  key={slice.id}
                  d={pathData}
                  fill={slice.color}
                  fillOpacity={hoveredSliceId && !isHovered ? 0.45 : 0.95}
                  stroke={isHovered ? '#FFFFFF' : '#151921'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredSliceId(slice.id)}
                  onMouseLeave={() => setHoveredSliceId(null)}
                  onClick={() => setHoveredSliceId(hoveredSliceId === slice.id ? null : slice.id)}
                />
              );
            })}

          {/* Donut Center Core Readout */}
          <circle
            cx="110"
            cy="110"
            r="44"
            fill="#151921"
            stroke="#28303F"
            strokeWidth="1.5"
            className="transition-colors"
          />
        </svg>

        {/* Dynamic Center Badge Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hasData ? (
            <>
              <span
                className="font-mono text-[20px] font-black tracking-tight"
                style={{ color: activeSlice.color }}
              >
                {activeSlice.id === 'surplus' ? '+' : ''}
                {activeSlice.percentage.toFixed(1)}%
              </span>
              <span className="font-label-caps text-[8px] uppercase tracking-[0.15em] text-[#94A3B8] font-bold mt-0.5">
                {activeSlice.name}
              </span>
              <span className="font-mono text-[10px] text-[#CBD5E1] font-bold">
                Rp {formatRupiah(activeSlice.amount)}
              </span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[24px] text-[#64748B]">
                donut_large
              </span>
              <span className="font-mono text-[14px] text-[#F1F5F9] font-bold mt-0.5">Rp 0</span>
              <span className="font-label-caps text-[8px] uppercase tracking-[0.15em] text-[#94A3B8] font-semibold">
                Belum Ada Catatan
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Interactive Cards */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* Surplus Card */}
        <button
          type="button"
          onClick={() => hasData && setHoveredSliceId(hoveredSliceId === 'surplus' ? null : 'surplus')}
          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
            hoveredSliceId === 'surplus'
              ? 'bg-emerald-500/15 border-emerald-500/60'
              : 'bg-[#1C222D] border-[#28303F] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">
                Surplus Bersih
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-emerald-400">
              {hasData ? `${surplusPct.toFixed(1)}%` : '0%'}
            </span>
          </div>
          <span className="font-mono text-[13px] font-bold text-[#F1F5F9]">
            Rp {formatRupiah(netSurplus)}
          </span>
          <span className="font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
            {hasData ? 'Tersimpan di Brankas' : 'Belum Ada Pemasukan'}
          </span>
        </button>

        {/* Expense Card */}
        <button
          type="button"
          onClick={() => hasData && setHoveredSliceId(hoveredSliceId === 'expense' ? null : 'expense')}
          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
            hoveredSliceId === 'expense'
              ? 'bg-[#FF5E36]/15 border-[#FF5E36]/60'
              : 'bg-[#1C222D] border-[#28303F] hover:border-[#FF5E36]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5E36]"></span>
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">
                Total Keluar
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#FF5E36]">
              {hasData ? `${expensePct.toFixed(1)}%` : '0%'}
            </span>
          </div>
          <span className="font-mono text-[13px] font-bold text-[#F1F5F9]">
            Rp {formatRupiah(totalExpense)}
          </span>
          <span className="font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
            {transactions.filter((t) => t.type === 'expense').length} Transaksi Beban
          </span>
        </button>
      </div>

      {/* Bottom Health Indicator Banner */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-[#1C222D] border border-[#28303F]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[15px]">
              {hasData ? 'health_and_safety' : 'receipt_long'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#CBD5E1]">
            {hasData
              ? `Pemasukan Rp ${formatRupiah(totalIncome)} dialokasikan dengan prima.`
              : 'Buku kas kosong. Tekan tombol untuk mulai mencatat transaksi.'}
          </span>
        </div>
        {hasData ? (
          onNavigateToAnalytics && (
            <button
              type="button"
              onClick={onNavigateToAnalytics}
              className="font-label-caps text-[9px] uppercase tracking-wider text-[#FF5E36] hover:underline font-bold shrink-0"
            >
              Detail
            </button>
          )
        ) : (
          onRecordNew && (
            <button
              type="button"
              onClick={onRecordNew}
              className="font-label-caps text-[9px] uppercase tracking-wider text-[#FF5E36] hover:underline font-bold shrink-0"
            >
              + Catat
            </button>
          )
        )}
      </div>
    </div>
  );
};
