import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { getCategoryMeta } from '../../utils/categories';
import {
  TrendingDown,
  TrendingUp,
  Calendar as CalendarIcon,
  BarChart2,
  LineChart,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

interface AnalyticsViewProps {
  transactions: Transaction[];
}

// Helper to normalize transaction dates across all formats (YYYY-MM-DD, MM/DD/YYYY, ISO strings)
const parseTxLocalDate = (txDate: string): string => {
  if (!txDate) return '';
  const trimmed = String(txDate).trim();
  const matchIso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2].padStart(2, '0')}-${matchIso[3].padStart(2, '0')}`;
  }
  const matchUs = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchUs) {
    return `${matchUs[3]}-${matchUs[1].padStart(2, '0')}-${matchUs[2].padStart(2, '0')}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return trimmed.split('T')[0];
};

const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions }) => {
  const [chartTab, setChartTab] = useState<'spending' | 'income' | 'compare'>('spending');
  const [selectedCompareMonth, setSelectedCompareMonth] = useState<string | null>(null);
  const [period, setPeriod] = useState<'all' | 'month' | 'week' | 'year'>(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const hasThisMonth = transactions.some((t) => parseTxLocalDate(t.date).startsWith(currentMonthPrefix));
    return hasThisMonth ? 'month' : 'all';
  });
  const [trendViewMode, setTrendViewMode] = useState<'line' | 'bars'>('bars');
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
    label: string;
    value: number;
    dateStr: string;
  } | null>(null);

  // Filter transactions for spending & income
  const expenses = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense');
  }, [transactions]);

  const totalSpending = useMemo(() => {
    return expenses.reduce((acc, t) => acc + t.amount, 0);
  }, [expenses]);

  const incomes = useMemo(() => {
    return transactions.filter((t) => t.type === 'income');
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return incomes.reduce((acc, t) => acc + t.amount, 0);
  }, [incomes]);

  // Filter transactions based on active period
  const periodFilteredTxs = useMemo(() => {
    if (period === 'all') return transactions;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (period === 'month') {
      return transactions.filter((t) => parseTxLocalDate(t.date).startsWith(currentMonthPrefix));
    }

    if (period === 'year') {
      return transactions.filter((t) => parseTxLocalDate(t.date).startsWith(String(currentYear)));
    }

    // 'week': last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const minDateStr = formatLocalDate(weekAgo);
    return transactions.filter((t) => parseTxLocalDate(t.date) >= minDateStr);
  }, [transactions, period]);

  const periodExpenses = useMemo(() => {
    return periodFilteredTxs.filter((t) => t.type === 'expense');
  }, [periodFilteredTxs]);

  const periodSpending = useMemo(() => {
    return periodExpenses.reduce((acc, t) => acc + t.amount, 0);
  }, [periodExpenses]);

  const periodIncomes = useMemo(() => {
    return periodFilteredTxs.filter((t) => t.type === 'income');
  }, [periodFilteredTxs]);

  const periodIncomeTotal = useMemo(() => {
    return periodIncomes.reduce((acc, t) => acc + t.amount, 0);
  }, [periodIncomes]);

  // Active displayed total matching active tab & period
  const activeHeroTotal = chartTab === 'income' ? periodIncomeTotal : periodSpending;
  const activeAllTimeTotal = chartTab === 'income' ? totalIncome : totalSpending;

  // Daily Spending / Income data for Line and Bar Charts
  const barData = useMemo(() => {
    const sourceTxs = chartTab === 'income' ? incomes : expenses;
    const result: Array<{ label: string; dateStr: string; value: number }> = [];

    if (sourceTxs.length === 0) {
      // Empty placeholder days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        result.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          dateStr: formatLocalDate(d),
          value: 0,
        });
      }
      return result;
    }

    if (period === 'year') {
      const currentYear = new Date().getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 0; m < 12; m++) {
        const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const total = sourceTxs
          .filter((t) => parseTxLocalDate(t.date).startsWith(monthPrefix))
          .reduce((sum, t) => sum + t.amount, 0);
        result.push({
          label: monthNames[m],
          dateStr: monthPrefix,
          value: total,
        });
      }
      return result;
    }

    if (period === 'all') {
      // Collect dates with activity, sorted chronologically
      const dateMap: Record<string, number> = {};
      sourceTxs.forEach((t) => {
        const dStr = parseTxLocalDate(t.date);
        if (dStr) {
          dateMap[dStr] = (dateMap[dStr] || 0) + t.amount;
        }
      });

      const sortedDates = Object.keys(dateMap).sort();
      if (sortedDates.length === 0) {
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          result.push({
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            dateStr: formatLocalDate(d),
            value: 0,
          });
        }
        return result;
      }

      // If fewer than 7 days, pad days so line has nice visual context
      if (sortedDates.length === 1) {
        const activeDate = sortedDates[0];
        const [y, m, d] = activeDate.split('-').map(Number);
        for (let offset = -3; offset <= 3; offset++) {
          const dt = new Date(y, m - 1, d + offset);
          const dtStr = formatLocalDate(dt);
          result.push({
            label: `${dt.getMonth() + 1}/${dt.getDate()}`,
            dateStr: dtStr,
            value: dtStr === activeDate ? dateMap[activeDate] : 0,
          });
        }
        return result;
      }

      sortedDates.forEach((dStr) => {
        const parts = dStr.split('-');
        const label = parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : dStr;
        result.push({
          label,
          dateStr: dStr,
          value: dateMap[dStr],
        });
      });
      return result;
    }

    // Default 'week' and 'month':
    const daysToShow = period === 'week' ? 7 : Math.max(7, Math.min(31, new Date().getDate()));
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatLocalDate(d);
      const monthDayLabel = `${d.getMonth() + 1}/${d.getDate()}`;

      const dayTotal = sourceTxs
        .filter((t) => parseTxLocalDate(t.date) === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({
        label: monthDayLabel,
        dateStr,
        value: dayTotal,
      });
    }
    return result;
  }, [expenses, incomes, chartTab, period]);

  const maxBarValue = useMemo(() => {
    const maxVal = Math.max(...barData.map((b) => b.value), 0);
    if (maxVal === 0) return 30;
    // Provide comfortable headroom above highest point so line never clips top
    const withHeadroom = maxVal * 1.25;
    return Math.ceil(withHeadroom / 10) * 10 || Math.ceil(withHeadroom) || 30;
  }, [barData]);

  const hasAnyDataInView = useMemo(() => {
    return barData.some((b) => b.value > 0);
  }, [barData]);

  // SVG coordinates math for Line Chart
  const trendPoints = useMemo(() => {
    const N = barData.length;
    if (N === 0) return [];
    const paddingLeft = 45;
    const paddingRight = 25;
    const availableWidth = 500 - paddingLeft - paddingRight;
    const baselineY = 130;
    const availableHeight = 100;

    return barData.map((b, idx) => {
      const x = paddingLeft + (N > 1 ? (idx / (N - 1)) * availableWidth : availableWidth / 2);
      const ratio = maxBarValue > 0 ? Math.min(1, b.value / maxBarValue) : 0;
      const y = baselineY - ratio * availableHeight;
      return {
        x,
        y,
        value: b.value,
        label: b.label,
        dateStr: b.dateStr,
      };
    });
  }, [barData, maxBarValue]);

  // Smooth curve & area path generation
  const { linePath, areaPath } = useMemo(() => {
    if (trendPoints.length === 0) return { linePath: '', areaPath: '' };
    if (trendPoints.length === 1) {
      return {
        linePath: `M 45 ${trendPoints[0].y} L 475 ${trendPoints[0].y}`,
        areaPath: `M 45 ${trendPoints[0].y} L 475 ${trendPoints[0].y} L 475 130 L 45 130 Z`,
      };
    }

    let d = `M ${trendPoints[0].x.toFixed(1)} ${trendPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < trendPoints.length - 1; i++) {
      const p0 = trendPoints[Math.max(0, i - 1)];
      const p1 = trendPoints[i];
      const p2 = trendPoints[i + 1];
      const p3 = trendPoints[Math.min(trendPoints.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const area = `${d} L ${trendPoints[trendPoints.length - 1].x.toFixed(1)} 130 L ${trendPoints[0].x.toFixed(1)} 130 Z`;
    return { linePath: d, areaPath: area };
  }, [trendPoints]);

  // Category breakdown calculation (Matching Chart 3 clean horizontal style)
  const categoryStats = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; emoji: string; iconUrl?: string }> = {};

    periodExpenses.forEach((tx) => {
      const cat = getCategoryMeta(tx.category);
      if (!map[tx.category]) {
        map[tx.category] = {
          name: cat.name,
          amount: 0,
          color: cat.color,
          emoji: cat.emoji,
          iconUrl: cat.iconUrl,
        };
      }
      map[tx.category].amount += tx.amount;
    });

    const total = periodSpending || 1;
    return Object.entries(map)
      .map(([id, val]) => ({
        id,
        name: val.name,
        amount: val.amount,
        percentage: Math.round((val.amount / total) * 100),
        color: val.color,
        emoji: val.emoji,
        iconUrl: val.iconUrl,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, periodSpending]);

  // Accounts Breakdown calculation (Synchronized with active period expenses)
  const accountStats = useMemo(() => {
    const map: Record<string, number> = {};
    periodExpenses.forEach((tx) => {
      const acc = tx.paymentMethod || 'Other Account';
      map[acc] = (map[acc] || 0) + tx.amount;
    });
    const total = periodSpending || 1;
    return Object.entries(map)
      .map(([account, amount]) => ({
        account,
        amount,
        percentage: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, periodSpending]);

  // Monthly Comparison Analytics
  const monthComparisonStats = useMemo(() => {
    const now = new Date();
    const monthMap: Record<
      string,
      {
        monthKey: string;
        label: string;
        shortLabel: string;
        year: number;
        monthNum: number;
        expenses: number;
        income: number;
        net: number;
        txCount: number;
        categoryTotals: Record<string, number>;
      }
    > = {};

    // Generate past 6 calendar months as baseline
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const shortLabel = d.toLocaleDateString('en-US', { month: 'short' });
      monthMap[mKey] = {
        monthKey: mKey,
        label,
        shortLabel,
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        expenses: 0,
        income: 0,
        net: 0,
        txCount: 0,
        categoryTotals: {},
      };
    }

    // Populate with real transactions
    transactions.forEach((t) => {
      const dStr = parseTxLocalDate(t.date);
      if (!dStr) return;
      const mKey = dStr.slice(0, 7);
      if (!monthMap[mKey]) {
        const [yStr, mStr] = mKey.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        const d = new Date(y, m - 1, 1);
        monthMap[mKey] = {
          monthKey: mKey,
          label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          shortLabel: d.toLocaleDateString('en-US', { month: 'short' }),
          year: y,
          monthNum: m,
          expenses: 0,
          income: 0,
          net: 0,
          txCount: 0,
          categoryTotals: {},
        };
      }
      monthMap[mKey].txCount += 1;
      if (t.type === 'expense') {
        monthMap[mKey].expenses += t.amount;
        monthMap[mKey].categoryTotals[t.category] =
          (monthMap[mKey].categoryTotals[t.category] || 0) + t.amount;
      } else if (t.type === 'income') {
        monthMap[mKey].income += t.amount;
      }
    });

    const sortedMonths = Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    sortedMonths.forEach((m) => {
      m.net = m.income - m.expenses;
    });

    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const activeTargetKey = selectedCompareMonth || currentMonthKey;
    const targetIdx = sortedMonths.findIndex((m) => m.monthKey === activeTargetKey);
    const targetMonthStat =
      targetIdx >= 0 ? sortedMonths[targetIdx] : sortedMonths[sortedMonths.length - 1];

    // Previous month relative to target month
    const priorMonthStat =
      targetIdx > 0 ? sortedMonths[targetIdx - 1] : sortedMonths[Math.max(0, targetIdx - 1)];

    const expenseDiff = targetMonthStat.expenses - (priorMonthStat ? priorMonthStat.expenses : 0);
    const expensePct =
      priorMonthStat && priorMonthStat.expenses > 0
        ? (expenseDiff / priorMonthStat.expenses) * 100
        : null;

    const incomeDiff = targetMonthStat.income - (priorMonthStat ? priorMonthStat.income : 0);
    const incomePct =
      priorMonthStat && priorMonthStat.income > 0
        ? (incomeDiff / priorMonthStat.income) * 100
        : null;

    const maxVal = Math.max(
      ...sortedMonths.map((m) => Math.max(m.expenses, m.income)),
      30
    );
    const maxBarScale = Math.ceil((maxVal * 1.25) / 10) * 10 || 30;

    // Category shift between target and prior month
    const allCatKeys = new Set([
      ...Object.keys(targetMonthStat.categoryTotals || {}),
      ...Object.keys(priorMonthStat?.categoryTotals || {}),
    ]);

    const categoryShifts = Array.from(allCatKeys).map((catId) => {
      const meta = getCategoryMeta(catId);
      const curr = targetMonthStat.categoryTotals[catId] || 0;
      const prev = priorMonthStat?.categoryTotals[catId] || 0;
      const diff = curr - prev;
      const pct = prev > 0 ? ((diff / prev) * 100) : null;
      return {
        id: catId,
        name: meta.name,
        emoji: meta.emoji,
        iconUrl: meta.iconUrl,
        color: meta.color,
        currentAmount: curr,
        priorAmount: prev,
        diff,
        pct,
      };
    }).sort((a, b) => b.currentAmount - a.currentAmount);

    return {
      months: sortedMonths,
      targetMonthStat,
      priorMonthStat,
      expenseDiff,
      expensePct,
      incomeDiff,
      incomePct,
      maxBarScale,
      categoryShifts,
    };
  }, [transactions, selectedCompareMonth]);

  return (
    <div className="space-y-4 pb-24 px-3 sm:px-4 pt-3 max-w-3xl mx-auto w-full">
      {/* Title & Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-black text-[#1E293B]"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Analytics
          </h2>
          <p className="text-[11px] text-stone-500 font-bold">
            Cash flow trends, category breakdown & spending reports
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-700 shadow-xs">
          <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-transparent focus:outline-none cursor-pointer font-bold text-xs"
          >
            <option value="month">This Month</option>
            <option value="week">This Week</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Clean Tabs: Spending / Income / Compare Months */}
      <div className="p-1 rounded-2xl bg-stone-200/80 flex gap-1">
        <button
          onClick={() => setChartTab('spending')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
            chartTab === 'spending'
              ? 'bg-[#FCCE4C] text-[#1E293B] shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          <span>Spending</span> <span className="hidden sm:inline">Trend</span>
        </button>
        <button
          onClick={() => setChartTab('income')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
            chartTab === 'income'
              ? 'bg-[#FCCE4C] text-[#1E293B] shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          <span>Income</span> <span className="hidden sm:inline">Trend</span>
        </button>
        <button
          onClick={() => setChartTab('compare')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
            chartTab === 'compare'
              ? 'bg-[#FCCE4C] text-[#1E293B] shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          <Scale className="w-3.5 h-3.5 text-[#1E293B] flex-shrink-0" />
          <span>Compare</span> <span className="hidden sm:inline">Months</span>
        </button>
      </div>

      {/* Chart 1: Hero Stat Box with Trend Line / Bar Chart */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-stone-200/80 shadow-xs space-y-4 overflow-hidden w-full box-border">
        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-xs font-black text-stone-400 uppercase tracking-wider block"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              {chartTab === 'income' ? 'Total Income' : 'Total Spending'}{' '}
              <span className="text-[10px] font-bold text-stone-400 capitalize">
                ({period === 'all' ? 'All Time' : period === 'month' ? 'This Month' : period === 'week' ? 'This Week' : 'This Year'})
              </span>
            </span>
            <div
              className="text-3xl font-black text-[#1E293B] mt-0.5 tracking-tight"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              ${activeHeroTotal.toFixed(2)}
            </div>
            {period !== 'all' && activeHeroTotal === 0 && activeAllTimeTotal > 0 && (
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className="text-[11px] font-bold text-cyan-700 hover:underline mt-0.5 flex items-center gap-1 cursor-pointer"
              >
                <span>View all-time ${activeAllTimeTotal.toFixed(2)}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Line / Bars Chart View Toggle */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setTrendViewMode('line')}
                className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  trendViewMode === 'line'
                    ? 'bg-white text-cyan-800 font-black shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900 font-bold'
                }`}
                title="Line Chart"
              >
                <LineChart className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Line</span>
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMode('bars')}
                className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  trendViewMode === 'bars'
                    ? 'bg-white text-stone-900 font-black shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900 font-bold'
                }`}
                title="Bar Chart"
              >
                <BarChart2 className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Bars</span>
              </button>
            </div>

            {chartTab === 'income' ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{periodIncomes.length} Deposits</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-extrabold">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{periodExpenses.length} Records</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart Visual Container */}
        <div className="pt-2">
          {!hasAnyDataInView ? (
            <div className="h-44 sm:h-48 flex flex-col items-center justify-center p-4 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
              <LineChart className="w-8 h-8 text-stone-300 mb-1.5" />
              <p className="text-xs font-black text-stone-600">No {chartTab} in this period</p>
              <p className="text-[11px] text-stone-400 max-w-xs mt-0.5">
                {activeAllTimeTotal > 0
                  ? `You have $${activeAllTimeTotal.toFixed(2)} recorded in other periods.`
                  : 'Record expenses or income to display your cash flow trend curve.'}
              </p>
              {activeAllTimeTotal > 0 && period !== 'all' && (
                <button
                  type="button"
                  onClick={() => setPeriod('all')}
                  className="mt-2 px-3 py-1 bg-white border border-stone-300 hover:border-stone-400 rounded-xl text-xs font-extrabold text-stone-800 shadow-2xs cursor-pointer active:scale-95 transition-all"
                >
                  Switch to All Time
                </button>
              )}
            </div>
          ) : trendViewMode === 'line' ? (
            /* Smooth SVG Trend Line Chart */
            <div className="relative w-full h-44 sm:h-48 select-none pt-1">
              {/* Floating Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute z-30 pointer-events-none -top-1 transform -translate-x-1/2 bg-[#1E293B] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg border border-stone-700 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150"
                  style={{
                    left: `${Math.max(8, Math.min(92, (hoveredPoint.x / 500) * 100))}%`,
                  }}
                >
                  <span className="text-stone-300 text-[10px]">{hoveredPoint.label}</span>
                  <span className={`text-xs font-black ${chartTab === 'income' ? 'text-emerald-400' : 'text-cyan-300'}`}>
                    ${hoveredPoint.value.toFixed(2)}
                  </span>
                </div>
              )}

              <svg
                viewBox="0 0 500 160"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={chartTab === 'income' ? '#10B981' : '#0284C7'}
                      stopOpacity="0.35"
                    />
                    <stop
                      offset="85%"
                      stopColor={chartTab === 'income' ? '#10B981' : '#0284C7'}
                      stopOpacity="0.05"
                    />
                    <stop
                      offset="100%"
                      stopColor={chartTab === 'income' ? '#10B981' : '#0284C7'}
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {/* Horizontal guidelines */}
                <line x1="38" y1="20" x2="485" y2="20" stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
                <text x="8" y="24" fill="#94A3B8" fontSize="10" fontWeight="700">
                  ${maxBarValue}
                </text>

                <line x1="38" y1="75" x2="485" y2="75" stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
                <text x="8" y="79" fill="#94A3B8" fontSize="10" fontWeight="700">
                  ${Math.round(maxBarValue / 2)}
                </text>

                <line x1="38" y1="130" x2="485" y2="130" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x="8" y="134" fill="#94A3B8" fontSize="10" fontWeight="700">
                  $0
                </text>

                {/* Shaded Area Beneath the Curve */}
                {areaPath && (
                  <path d={areaPath} fill="url(#trendAreaGradient)" />
                )}

                {/* Primary Trend Line Curve */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={chartTab === 'income' ? '#059669' : '#0284C7'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points / Dots */}
                {trendPoints.map((pt, idx) => {
                  const isHovered = hoveredPoint?.index === idx;
                  const isPositive = pt.value > 0;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint({ index: idx, x: pt.x, y: pt.y, label: pt.label, value: pt.value, dateStr: pt.dateStr })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => setHoveredPoint({ index: idx, x: pt.x, y: pt.y, label: pt.label, value: pt.value, dateStr: pt.dateStr })}
                    >
                      {/* Touch target */}
                      <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                      {/* Highlight aura on hover or active point */}
                      {(isHovered || isPositive) && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 8 : 6}
                          fill={chartTab === 'income' ? '#10B981' : '#0284C7'}
                          opacity={isHovered ? 0.35 : 0.2}
                        />
                      )}

                      {/* Permanent Visible Amount Label for Positive Points */}
                      {isPositive && (
                        <g className="pointer-events-none">
                          <rect
                            x={pt.x - 22}
                            y={pt.y - 25}
                            width="44"
                            height="16"
                            rx="5"
                            fill="#1E293B"
                            stroke={chartTab === 'income' ? '#34D399' : '#38BDF8'}
                            strokeWidth="1"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 13}
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight="900"
                            fill={chartTab === 'income' ? '#34D399' : '#38BDF8'}
                          >
                            ${pt.value.toFixed(2)}
                          </text>
                        </g>
                      )}

                      {/* Main Data Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5.5 : isPositive ? 4.5 : 3}
                        fill="#FFFFFF"
                        stroke={chartTab === 'income' ? '#059669' : '#0284C7'}
                        strokeWidth={isHovered ? 3 : 2.5}
                      />

                      {/* Date label under point */}
                      <text
                        x={pt.x}
                        y="150"
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isHovered || isPositive ? '900' : '700'}
                        fill={isHovered ? '#1E293B' : isPositive ? '#334155' : '#94A3B8'}
                      >
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            /* True Graphical Bar Chart */
            <div className="relative w-full h-48 select-none pt-2 flex flex-col justify-between">
              {/* Graphical Layout with Dedicated Left Y-Axis */}
              <div className="relative flex-1 flex items-end pl-11 pr-2 pb-6 border-b-2 border-stone-200">
                {/* Horizontal Guidelines & Y-Axis Labels */}
                <div className="absolute inset-x-0 top-0 flex items-center pointer-events-none z-0">
                  <span className="w-10 text-[10px] font-bold text-stone-400 text-left">
                    ${maxBarValue}
                  </span>
                  <div className="flex-1 border-b border-dashed border-stone-200" />
                </div>
                <div className="absolute inset-x-0 top-1/2 flex items-center pointer-events-none z-0 -translate-y-1/2">
                  <span className="w-10 text-[10px] font-bold text-stone-400 text-left">
                    ${Math.round(maxBarValue / 2)}
                  </span>
                  <div className="flex-1 border-b border-dashed border-stone-200" />
                </div>
                <div className="absolute inset-x-0 bottom-6 flex items-center pointer-events-none z-0">
                  <span className="w-10 text-[10px] font-bold text-stone-400 text-left">
                    $0
                  </span>
                  <div className="flex-1 border-b border-stone-300" />
                </div>

                {/* Graphical Bars Container */}
                <div className="flex-1 h-full flex items-end justify-around gap-1.5 z-10 relative">
                  {barData.map((b, idx) => {
                    const heightPercent =
                      maxBarValue > 0
                        ? Math.min(100, Math.max(b.value > 0 ? 14 : 4, (b.value / maxBarValue) * 100))
                        : 4;
                    const hasValue = b.value > 0;

                    return (
                      <div
                        key={idx}
                        className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                        onClick={() =>
                          setHoveredPoint({
                            index: idx,
                            x: 0,
                            y: 0,
                            label: b.label,
                            value: b.value,
                            dateStr: b.dateStr,
                          })
                        }
                      >
                        {/* Permanent Graphical Amount Badge above Bar (e.g. $8.00) */}
                        {hasValue ? (
                          <div className="mb-1 px-1.5 py-0.5 rounded-md bg-[#1E293B] text-cyan-300 text-[10px] font-black border border-cyan-400/40 shadow-xs whitespace-nowrap animate-in fade-in group-hover:scale-105 transition-transform z-20">
                            ${b.value.toFixed(2)}
                          </div>
                        ) : (
                          <div className="mb-1 text-[9px] font-bold text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            $0
                          </div>
                        )}

                        {/* Rich 3D Rounded Graphical Bar */}
                        <div
                          className={`w-full max-w-[28px] sm:max-w-[34px] rounded-t-xl transition-all duration-300 shadow-sm border border-b-0 ${
                            chartTab === 'income'
                              ? hasValue
                                ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-300 border-emerald-400 shadow-emerald-200/50 group-hover:brightness-110'
                                : 'bg-stone-200/60 border-stone-300'
                              : hasValue
                              ? 'bg-gradient-to-t from-cyan-600 via-sky-500 to-amber-300 border-sky-400 shadow-cyan-200/50 group-hover:brightness-110'
                              : 'bg-stone-200/60 border-stone-300'
                          }`}
                          style={{
                            height: `${heightPercent}%`,
                            minHeight: hasValue ? '14px' : '4px',
                          }}
                        />

                        {/* Date Label under Bar (Smart non-overlapping display) */}
                        {(() => {
                          const shouldShow =
                            barData.length <= 7 ||
                            idx === 0 ||
                            idx === barData.length - 1 ||
                            hasValue ||
                            idx % Math.ceil(barData.length / 5) === 0;

                          return (
                            <div
                              className={`absolute -bottom-5.5 text-[10px] whitespace-nowrap transition-colors ${
                                shouldShow
                                  ? 'opacity-100 font-extrabold text-stone-500'
                                  : 'opacity-0 group-hover:opacity-100 font-bold text-stone-400'
                              } group-hover:text-stone-900`}
                            >
                              {b.label}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Category Breakdown Card (Made clean & streamlined like Chart 3) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-stone-200/80 shadow-xs space-y-3.5 overflow-hidden w-full box-border">
        <div className="flex items-center justify-between">
          <h3
            className="text-sm font-black text-[#1E293B]"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Category Breakdown
          </h3>
          <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full flex-shrink-0">
            {periodExpenses.length} Expenses
          </span>
        </div>

        {/* Clean, sleek horizontal list like Chart 3 */}
        <div className="space-y-2.5 pt-0.5">
          {categoryStats.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-4">No category expenses in this period</p>
          ) : (
            categoryStats.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#1E293B] flex items-center gap-1.5 truncate">
                    <CategoryIcon emoji={cat.emoji} iconUrl={cat.iconUrl} size={15} color={cat.color} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-black text-[#1E293B]">${cat.amount.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-stone-400">({cat.percentage}%)</span>
                  </div>
                </div>
                {/* Clean Progress Bar matching Chart 3 */}
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, cat.percentage)}%`,
                      backgroundColor: cat.color || '#0284C7',
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chart 3: Accounts & Payment Breakdown */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-stone-200/80 shadow-xs space-y-3.5 max-w-full box-border">
        <div className="flex items-center justify-between">
          <h3
            className="text-sm font-black text-[#1E293B] flex items-center gap-1.5"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            <CreditCard className="w-4 h-4 text-sky-600" />
            <span>Accounts & Payments Breakdown</span>
          </h3>
          <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
            Live Synced
          </span>
        </div>

        {accountStats.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-2">No account expense records</p>
        ) : (
          <div className="space-y-2.5">
            {accountStats.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#1E293B] flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-stone-400" />
                    <span>{item.account}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[#1E293B]">${item.amount.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-stone-400">({item.percentage}%)</span>
                  </div>
                </div>
                {/* Account progress bar */}
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
