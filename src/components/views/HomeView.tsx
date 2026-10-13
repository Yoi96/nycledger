import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { CATEGORIES } from '../../utils/categories';
import {
  CreditCard,
  UtensilsCrossed,
  Bot,
  Grid,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Bus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckSquare,
  Plus,
} from 'lucide-react';
import cuteCatSkyline from '../../assets/images/cute_cat_skyline_1791725358582.jpg';
import { CategoryIcon, FastfoodVector } from '../common/CategoryIcon';
import { CatHead } from '../common/CatMascot';

interface HomeViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onSeeAllTransactions: () => void;
  onOpenOMNY: () => void;
  onOpenQuickMeal: () => void;
  onOpenAIAdvisor: () => void;
  onOpenTools: () => void;
  onOpenAddAI: () => void;
  onOpenTodoList?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  transactions,
  onSelectTransaction,
  onSeeAllTransactions,
  onOpenOMNY,
  onOpenQuickMeal,
  onOpenAIAdvisor,
  onOpenTools,
  onOpenAddAI,
  onOpenTodoList,
}) => {
  const [viewScope, setViewScope] = useState<'month' | 'total'>('total');

  // 1. All-time calculations strictly based on transactions
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalBalance = totalIncome - totalExpenses;

  // 2. Current Month calculations strictly based on transactions
  const activeMonthKey = useMemo(() => {
    if (transactions.length > 0) {
      const dates = transactions
        .map((t) => t.date)
        .filter(Boolean)
        .sort()
        .reverse();
      if (dates[0]) return dates[0].slice(0, 7);
    }
    return new Date().toISOString().slice(0, 7);
  }, [transactions]);

  const monthLabel = useMemo(() => {
    try {
      const [y, m] = activeMonthKey.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return activeMonthKey;
    }
  }, [activeMonthKey]);

  const monthTxs = useMemo(() => {
    return transactions.filter((t) => (t.date || '').startsWith(activeMonthKey));
  }, [transactions, activeMonthKey]);

  const monthIncome = useMemo(() => {
    return monthTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxs]);

  const monthExpenses = useMemo(() => {
    return monthTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxs]);

  const monthBalance = monthIncome - monthExpenses;

  const activeBalance = viewScope === 'month' ? monthBalance : totalBalance;
  const isNegative = activeBalance < 0;
  const formattedActiveBalance = `${isNegative ? '-' : ''}$${Math.abs(activeBalance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const recentTxs = transactions.slice(0, 5);

  return (
    <div className="space-y-4 pb-24 px-3 sm:px-4 pt-3 max-w-full box-border overflow-x-hidden">
      {/* 1. Total Balance Card: Cute Cat & NYC Skyline Background */}
      <div className="relative rounded-3xl border-3 border-[#1E293B] shadow-[0_5px_0_#1E293B] overflow-hidden min-h-[200px] flex flex-col justify-between p-4 sm:p-5 max-w-full box-border bg-[#FFFDF8]">
        {/* Background Image: cute_cat_skyline illustration */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 pointer-events-none"
          style={{
            backgroundImage: `url(${cuteCatSkyline})`,
            backgroundPosition: 'center 25%',
            opacity: 0.85,
          }}
        />
        {/* Soft subtle tint for clean contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-transparent to-white/30 pointer-events-none" />

        {/* Top Row: Scope Selector (All Time vs This Month) */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center bg-white/90 p-0.5 rounded-full border border-stone-300 shadow-xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewScope('total')}
              className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                viewScope === 'total'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-[#1E293B]'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setViewScope('month')}
              className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                viewScope === 'month'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-[#1E293B]'
              }`}
            >
              This Month ({monthLabel})
            </button>
          </div>
        </div>

        {/* Middle: Live Balance Amount in crisp light frosted badge */}
        <div className="relative z-10 my-auto py-2">
          <div className="inline-block px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-stone-200 shadow-sm">
            <div className="text-[10px] sm:text-[11px] font-black text-stone-500 uppercase tracking-wider mb-0.5">
              {viewScope === 'month' ? `Balance for the Month (${monthLabel})` : 'Total Balance'}
            </div>
            <div
              className={`text-3xl sm:text-4xl font-black tracking-tight ${
                isNegative ? 'text-rose-600' : 'text-[#1E293B]'
              }`}
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              {formattedActiveBalance}
            </div>
          </div>

          {/* Sub Income, Expense, and Balance Stats */}
          {viewScope === 'total' ? (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 pt-2 border-t border-stone-300/60">
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 border border-stone-200 shadow-2xs flex flex-col justify-between min-w-0">
                <div className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-tight leading-tight">
                  Total Income
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-black text-emerald-700 truncate mt-0.5">
                  +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 border border-stone-200 shadow-2xs flex flex-col justify-between min-w-0">
                <div className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-tight leading-tight">
                  Total Expenses
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-black text-rose-600 truncate mt-0.5">
                  -${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 border border-stone-200 shadow-2xs flex flex-col justify-between min-w-0">
                <div className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-tight leading-tight">
                  Total Balance
                </div>
                <div className={`text-[11px] sm:text-xs md:text-sm font-black truncate mt-0.5 ${totalBalance < 0 ? 'text-rose-600' : 'text-amber-800'}`}>
                  {totalBalance < 0 ? '-' : ''}${Math.abs(totalBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 pt-2 border-t border-stone-300/60">
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 border border-stone-200 shadow-2xs flex flex-col justify-between min-w-0">
                <div className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-tight leading-tight">
                  Income (Month)
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-black text-emerald-700 truncate mt-0.5">
                  +${monthIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 border border-stone-200 shadow-2xs flex flex-col justify-between min-w-0">
                <div className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-tight leading-tight">
                  Expense (Month)
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-black text-rose-600 truncate mt-0.5">
                  -${monthExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 border border-stone-200 shadow-2xs flex flex-col justify-between min-w-0">
                <div className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-tight leading-tight">
                  Balance (Month)
                </div>
                <div className={`text-[11px] sm:text-xs md:text-sm font-black truncate mt-0.5 ${monthBalance < 0 ? 'text-rose-600' : 'text-amber-800'}`}>
                  {monthBalance < 0 ? '-' : ''}${Math.abs(monthBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Quick Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {/* OMNY Tool */}
        <button
          onClick={onOpenOMNY}
          className="p-2.5 rounded-2xl bg-white border-2 border-stone-200 hover:border-[#1E293B] hover:shadow-sm active:scale-95 transition-all flex flex-col items-center gap-1.5 text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 group-hover:scale-110 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <span
            className="text-[11px] font-extrabold text-[#1E293B] leading-tight"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            OMNY Tool
          </span>
        </button>

        {/* Quick Meal */}
        <button
          onClick={onOpenQuickMeal}
          className="p-2.5 rounded-2xl bg-white border-2 border-stone-200 hover:border-[#1E293B] hover:shadow-sm active:scale-95 transition-all flex flex-col items-center gap-1.5 text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 group-hover:scale-110 transition-transform">
            <FastfoodVector size={20} color="#B45309" />
          </div>
          <span
            className="text-[11px] font-extrabold text-[#1E293B] leading-tight"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Quick Meal
          </span>
        </button>

        {/* AI Advisor */}
        <button
          onClick={onOpenAIAdvisor}
          className="p-2.5 rounded-2xl bg-white border-2 border-stone-200 hover:border-[#1E293B] hover:shadow-sm active:scale-95 transition-all flex flex-col items-center gap-1.5 text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-800 group-hover:scale-110 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <span
            className="text-[11px] font-extrabold text-[#1E293B] leading-tight"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            AI Advisor
          </span>
        </button>

        {/* More Tools */}
        <button
          onClick={onOpenTools}
          className="p-2.5 rounded-2xl bg-white border-2 border-stone-200 hover:border-[#1E293B] hover:shadow-sm active:scale-95 transition-all flex flex-col items-center gap-1.5 text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 group-hover:scale-110 transition-transform">
            <Grid className="w-5 h-5" />
          </div>
          <span
            className="text-[11px] font-extrabold text-[#1E293B] leading-tight"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            More Tools
          </span>
        </button>
      </div>

      {/* 3. AI Quick Vision Scan Banner */}
      <div
        onClick={onOpenAddAI}
        className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] cursor-pointer hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FCCE4C] border-2 border-[#1E293B] flex items-center justify-center shadow-xs group-hover:rotate-6 transition-transform">
            <Sparkles className="w-5 h-5 text-[#1E293B]" />
          </div>
          <div>
            <h4
              className="text-xs font-black text-[#1E293B] flex items-center gap-1.5"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              AI Receipt & Item Scanner
              <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                HOT
              </span>
            </h4>
            <p className="text-[11px] text-stone-600 font-medium">
              Snap receipts or items for instant offline auto-entry
            </p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-xl bg-[#1E293B] text-white text-[11px] font-bold flex items-center gap-1">
          Scan
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 3.5 Daily To-Do Planner Shortcut */}
      {onOpenTodoList && (
        <div
          onClick={onOpenTodoList}
          className="p-3 rounded-2xl bg-[#EEF4EB] border-2 border-emerald-900/15 shadow-2xs hover:border-emerald-600 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h4
                className="text-xs font-black text-[#1E293B] flex items-center gap-1.5 leading-tight"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Daily To-Do Planner
                <span className="text-[9px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300">
                  New
                </span>
              </h4>
              <p className="text-[11px] text-stone-600 font-medium truncate">
                NYC checklist, subway commutes & daily deadlines
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-stone-700 text-[10px] font-extrabold flex items-center gap-1 flex-shrink-0 shadow-2xs">
            Open
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* 4. Recent Transactions List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3
            className="text-sm font-black text-[#1E293B]"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Recent Transactions
          </h3>
          <button
            onClick={onSeeAllTransactions}
            className="text-xs font-bold text-stone-500 hover:text-[#1E293B] flex items-center gap-0.5"
          >
            See All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white border-2 border-dashed border-stone-300 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 flex items-center justify-center">
              <CatHead size={48} />
            </div>
            <div className="space-y-0.5">
              <h4
                className="font-black text-sm text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                No Transactions Yet
              </h4>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                Your NYC ledger is ready! Record your real everyday purchases, subway rides, or income below.
              </p>
            </div>
            <button
              onClick={onOpenAddAI}
              className="mt-1 px-4 py-2 bg-[#FCCE4C] hover:bg-[#ebd05a] text-[#1E293B] font-black text-xs rounded-xl border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Record First Expense / Income</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTxs.map((tx) => {
              const cat = CATEGORIES[tx.category] || CATEGORIES.other;
              const isNegative = tx.type === 'expense';
              const formattedDate = new Date(tx.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-3 rounded-2xl bg-white border-2 border-stone-200/90 hover:border-[#FCCE4C] hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border ${cat.iconBg} border-stone-200 shadow-xs`}
                    >
                      {tx.merchant.toLowerCase().includes('subway') || tx.category === 'transportation' ? (
                        <Bus className="w-5 h-5 text-teal-700" />
                      ) : tx.category === 'shopping' ? (
                        <ShoppingBag className="w-5 h-5 text-rose-700" />
                      ) : tx.type === 'income' ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <CategoryIcon
                          emoji={cat.emoji}
                          iconUrl={cat.iconUrl}
                          color={cat.color}
                          size={22}
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-[#1E293B] group-hover:text-amber-800 transition-colors">
                        {tx.merchant}
                      </div>
                      <div className="text-[11px] font-semibold text-stone-400">
                        {tx.categoryName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-sm tracking-tight ${
                        isNegative ? 'text-rose-500' : 'text-emerald-600'
                      }`}
                      style={{ fontFamily: 'Fredoka, monospace' }}
                    >
                      {isNegative ? '-' : '+'}${tx.amount.toFixed(2)}
                    </div>
                    <div className="text-[11px] font-semibold text-stone-400">
                      {formattedDate}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
