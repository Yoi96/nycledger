import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { CATEGORIES } from '../../utils/categories';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  CalendarDays,
  ArrowRight,
  Receipt,
  Wallet,
  Scale,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
  onOpenAddForDate?: (dateStr: string) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onSelectTransaction,
  onOpenAddForDate,
}) => {
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    today.toISOString().split('T')[0]
  );

  // Total ledger balance across all recorded transactions
  const totalLedgerBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  // Month days calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
    const lastDayOfMonth = new Date(calendarYear, calendarMonth + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startWeekday = firstDayOfMonth.getDay(); // 0 is Sunday

    const days = [];

    // Prepend padding from previous month
    for (let i = 0; i < startWeekday; i++) {
      days.push({
        dayNumber: null,
        dateStr: '',
        isCurrentMonth: false,
        expense: 0,
        income: 0,
        balance: 0,
        txCount: 0,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;

      const dayTxs = transactions.filter((t) => t.date === dateStr);
      const dayExpense = dayTxs
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const dayIncome = dayTxs
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const dayBalance = +(dayIncome - dayExpense).toFixed(2);

      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        expense: dayExpense,
        income: dayIncome,
        balance: dayBalance,
        txCount: dayTxs.length,
      });
    }

    return days;
  }, [calendarYear, calendarMonth, transactions]);

  // Monthly stats for calendar
  const calendarMonthStats = useMemo(() => {
    const prefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
    const monthTxs = transactions.filter((t) => t.date.startsWith(prefix));

    const monthExpense = monthTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthIncome = monthTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthBalance = +(monthIncome - monthExpense).toFixed(2);

    // No-spend days: current month days with 0 expenses (up to today if current month)
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const isThisCurrentMonth =
      calendarYear === today.getFullYear() && calendarMonth === today.getMonth();
    const evaluateUpToDay = isThisCurrentMonth ? today.getDate() : lastDay;

    let noSpendDays = 0;
    for (let d = 1; d <= evaluateUpToDay; d++) {
      const dStr = `${prefix}-${String(d).padStart(2, '0')}`;
      const hasExpense = transactions.some((t) => t.date === dStr && t.type === 'expense');
      if (!hasExpense) noSpendDays++;
    }

    const avgDailyExpense =
      evaluateUpToDay > 0 ? +(monthExpense / evaluateUpToDay).toFixed(2) : 0;

    return {
      monthExpense,
      monthIncome,
      monthBalance,
      noSpendDays,
      avgDailyExpense,
      totalTxs: monthTxs.length,
    };
  }, [calendarYear, calendarMonth, transactions, today]);

  // Selected date transactions
  const selectedDateTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDateStr);
  }, [transactions, selectedDateStr]);

  const selectedDateTotals = useMemo(() => {
    const exp = selectedDateTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const inc = selectedDateTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = +(inc - exp).toFixed(2);
    return { expense: exp, income: inc, balance };
  }, [selectedDateTransactions]);

  // Calendar navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCalendarYear(today.getFullYear());
    setCalendarMonth(today.getMonth());
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF5] w-full h-full overflow-hidden animate-in fade-in duration-200">
      <div className="w-full flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto h-full">
        {/* Header matching Picture 3 */}
        <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-indigo-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-800 flex-shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-lg font-black text-[#1E293B] leading-none truncate"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Calendar Tool
              </h2>
              <p className="text-[8px] text-stone-500 font-semibold truncate mt-0.5">
                Daily Expense Calendar & No-Spend Streak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs flex-shrink-0 cursor-pointer"
            aria-label="Close Calendar"
          >
            <X className="w-4 h-4 text-[#1E293B]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Calendar Month Header & Navigation */}
          <div className="p-4 rounded-3xl bg-white border-2 border-stone-200/90 shadow-xs space-y-3.5">
            {/* Top row: Month switch + Today button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center border border-stone-300 active:scale-95 transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3
                  className="text-base font-black text-[#1E293B] tracking-tight"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  {monthNames[calendarMonth]} {calendarYear}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center border border-stone-300 active:scale-95 transition-all"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleGoToday}
                className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold active:scale-95 transition-all flex items-center gap-1 shadow-2xs"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Today</span>
              </button>
            </div>

            {/* Prominent Balance Banner */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/70 rounded-2xl border-2 border-indigo-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center text-indigo-700 shadow-2xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">
                    Month Net Balance
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-xl font-black tracking-tight ${
                        calendarMonthStats.monthBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                      style={{ fontFamily: 'Fredoka, sans-serif' }}
                    >
                      {calendarMonthStats.monthBalance >= 0 ? '+' : ''}${calendarMonthStats.monthBalance.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-bold text-stone-400">
                      ({calendarMonthStats.monthIncome >= calendarMonthStats.monthExpense ? 'Surplus' : 'Deficit'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-stone-600 border-l border-stone-200 pl-4">
                <div>
                  <span className="text-[10px] text-stone-400 block font-bold">
                    Total Balance (All Time)
                  </span>
                  <span
                    className={`font-black text-sm ${
                      totalLedgerBalance >= 0 ? 'text-[#1E293B]' : 'text-rose-600'
                    }`}
                    style={{ fontFamily: 'Fredoka, monospace' }}
                  >
                    ${totalLedgerBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Calendar 5 Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <div className="p-2 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] font-black uppercase text-stone-400 block">
                  Month Expenses
                </span>
                <span
                  className="text-sm font-black text-rose-600 block mt-0.5"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  -${calendarMonthStats.monthExpense.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] font-black uppercase text-stone-400 block">
                  Month Income
                </span>
                <span
                  className="text-sm font-black text-emerald-600 block mt-0.5"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  +${calendarMonthStats.monthIncome.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">
                  Net Balance
                </span>
                <span
                  className={`text-sm font-black block mt-0.5 ${
                    calendarMonthStats.monthBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  {calendarMonthStats.monthBalance >= 0 ? '+' : ''}${calendarMonthStats.monthBalance.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] font-black uppercase text-stone-400 block">
                  Daily Avg
                </span>
                <span
                  className="text-sm font-black text-[#1E293B] block mt-0.5"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  ${calendarMonthStats.avgDailyExpense.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-2xl bg-amber-50/80 border border-amber-200 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-amber-700 block flex items-center justify-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  No-Spend Days
                </span>
                <span
                  className="text-sm font-black text-amber-900 block mt-0.5"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  {calendarMonthStats.noSpendDays} days
                </span>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 text-center pt-2 border-t border-stone-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w, idx) => (
                <div
                  key={idx}
                  className={`text-[11px] font-black py-1 ${
                    idx === 0 || idx === 6 ? 'text-rose-500' : 'text-stone-500'
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={idx}
                      className="min-h-[58px] sm:min-h-[66px] rounded-xl bg-stone-50/40 border border-transparent"
                    />
                  );
                }

                const isSelected = cell.dateStr === selectedDateStr;
                const isCurrentToday =
                  cell.dateStr === today.toISOString().split('T')[0];
                const hasExpense = cell.expense > 0;
                const hasIncome = cell.income > 0;
                const hasActivity = hasExpense || hasIncome;
                const isNoSpend = !hasExpense && cell.dateStr <= today.toISOString().split('T')[0];

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[58px] sm:min-h-[66px] p-1 sm:p-1.5 rounded-xl text-left flex flex-col justify-between transition-all relative group border-2 ${
                      isSelected
                        ? 'border-[#1E293B] bg-amber-50 shadow-xs ring-2 ring-amber-300'
                        : isCurrentToday
                        ? 'border-indigo-400 bg-indigo-50/40 hover:bg-stone-50'
                        : 'border-stone-200/70 bg-white hover:border-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {/* Day number & Today / Star indicator */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-black leading-none ${
                          isCurrentToday
                            ? 'text-indigo-700 bg-indigo-100 px-1 py-0.5 rounded-md'
                            : 'text-stone-800'
                        }`}
                        style={{ fontFamily: 'Fredoka, sans-serif' }}
                      >
                        {cell.dayNumber}
                      </span>
                      {isNoSpend && cell.dayNumber !== null && (
                        <span
                          className="text-[9px] text-amber-500 font-bold"
                          title="No-spend day"
                        >
                          ⭐
                        </span>
                      )}
                    </div>

                    {/* Spend, Income and Balance Badge */}
                    <div className="w-full space-y-0.5 pt-0.5">
                      {hasExpense && (
                        <div
                          className="text-[7px] font-black text-rose-600 truncate leading-tight"
                          style={{ fontFamily: 'Fredoka, monospace' }}
                        >
                          -${cell.expense.toFixed(2)}
                        </div>
                      )}
                      {hasIncome && (
                        <div
                          className="text-[7px] font-black text-emerald-600 truncate leading-tight"
                          style={{ fontFamily: 'Fredoka, monospace' }}
                        >
                          +${cell.income.toFixed(2)}
                        </div>
                      )}

                      {/* Day Net Balance badge when there is activity */}
                      {hasActivity && (
                        <div
                          className={`text-[6px] font-black px-1 py-0.2 rounded truncate leading-tight ${
                            cell.balance >= 0
                              ? 'text-purple-700 bg-purple-100/60'
                              : 'text-stone-600 bg-stone-100'
                          }`}
                          style={{ fontFamily: 'Fredoka, monospace' }}
                          title={`Daily Net: ${cell.balance >= 0 ? '+' : ''}$${cell.balance.toFixed(2)}`}
                        >
                          {cell.balance >= 0 ? '+' : ''}${cell.balance.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector */}
          <div className="p-4 rounded-3xl bg-white border-2 border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-200 border-2 border-[#1E293B] flex items-center justify-center text-amber-900 shadow-2xs">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h4
                    className="text-sm font-black text-[#1E293B]"
                    style={{ fontFamily: 'Fredoka, sans-serif' }}
                  >
                    {selectedDateStr} Daily Cash Flow
                  </h4>
                  <p className="text-[10px] text-stone-500 font-bold">
                    {selectedDateTransactions.length} {selectedDateTransactions.length === 1 ? 'transaction' : 'transactions'} recorded
                  </p>
                </div>
              </div>

              {/* Day totals & Balance */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedDateTotals.expense > 0 && (
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    Expenses -${selectedDateTotals.expense.toFixed(2)}
                  </span>
                )}
                {selectedDateTotals.income > 0 && (
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Income +${selectedDateTotals.income.toFixed(2)}
                  </span>
                )}

                {/* Day Net Balance badge */}
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200">
                
                  <span className="text-[10px] font-black text-indigo-900">Daily Net:</span>
                  <span
                    className={`text-xs font-black ${
                      selectedDateTotals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                    style={{ fontFamily: 'Fredoka, monospace' }}
                  >
                    {selectedDateTotals.balance >= 0 ? '+' : ''}${selectedDateTotals.balance.toFixed(2)}
                  </span>
                </div>

                {onOpenAddForDate && (
                  <button
                    onClick={() => {
                      onOpenAddForDate(selectedDateStr);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#FCCE4C] hover:bg-[#FBBF24] text-[#1E293B] font-black text-xs border border-[#1E293B] active:scale-95 transition-all flex items-center gap-1 shadow-2xs"
                    title="Log transaction on this date"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Entry</span>
                  </button>
                )}
              </div>
            </div>

            {/* Transactions list on selected date */}
            {selectedDateTransactions.length === 0 ? (
              <div className="py-6 text-center space-y-1.5 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <span className="text-2xl">🌟</span>
                <div className="text-xs font-black text-stone-700">
                  {selectedDateStr <= today.toISOString().split('T')[0]
                    ? 'Great job! Zero expenses recorded on this date.'
                    : 'No transactions recorded for this date.'}
                </div>
                <p className="text-[10px] text-stone-400 max-w-xs mx-auto">
                  Daily Balance: $0.00. Click "Log Entry" above to add transactions.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateTransactions.map((tx) => {
                  const cat = CATEGORIES[tx.category] || CATEGORIES.miscellaneous;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        onSelectTransaction?.(tx);
                        onClose();
                      }}
                      className="p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border shadow-2xs overflow-hidden"
                          style={{ backgroundColor: `${cat.color}20`, borderColor: cat.color }}
                        >
                          <CategoryIcon emoji={cat.emoji} iconUrl={cat.iconUrl} size={20} color={cat.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-xs text-[#1E293B] truncate group-hover:text-indigo-800">
                            {tx.merchant}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-semibold mt-0.5 truncate">
                            <span>{cat.name}</span>
                            <span>•</span>
                            <span>{tx.paymentMethod}</span>
                            {tx.time && (
                              <>
                                <span>•</span>
                                <span>{tx.time}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`font-black text-sm ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-stone-900'
                          }`}
                          style={{ fontFamily: 'Fredoka, monospace' }}
                        >
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
