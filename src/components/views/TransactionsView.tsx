import React, { useState, useMemo } from 'react';
import { Transaction, CategoryId, PaymentMethod } from '../../types';
import { CATEGORIES, getStoredCategories } from '../../utils/categories';
import {
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Bus,
  ArrowDownLeft,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

interface TransactionsViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAdd: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onSelectTransaction,
  onOpenAdd,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedAccount, setSelectedAccount] = useState<PaymentMethod | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Dynamic synchronized accounts list from all transactions and standard methods
  const allAccounts = useMemo(() => {
    const set = new Set<string>();
    // Priority 1: All accounts actually present in user transactions
    transactions.forEach((tx) => {
      if (tx.paymentMethod && tx.paymentMethod.trim()) {
        set.add(tx.paymentMethod.trim());
      }
    });
    // Priority 2: Standard accounts
    const standardAccounts = [
      'Credit Card',
      'Debit Card',
      'Checking Account',
      'Apple Pay',
      'Cash',
      'OMNY Card',
      'NYC Card',
      'Chase Bank',
    ];
    standardAccounts.forEach((acc) => set.add(acc));
    return Array.from(set);
  }, [transactions]);

  // Dynamic synchronized categories from getStoredCategories() + any custom categories in transactions
  const allCategories = useMemo(() => {
    const stored = getStoredCategories();
    const map = new Map<string, { id: string; name: string; emoji: string; iconUrl?: string }>();
    stored.forEach((c) => map.set(c.id, { id: c.id, name: c.name, emoji: c.emoji, iconUrl: c.iconUrl }));
    transactions.forEach((tx) => {
      if (tx.category && !map.has(tx.category)) {
        map.set(tx.category, {
          id: tx.category,
          name: tx.categoryName || tx.category,
          emoji: '🏷️',
        });
      }
    });
    return Array.from(map.values());
  }, [transactions]);

// Helper to match any date format in search bar (US slash, European, dot, dash, natural month name, year, relative)
function matchesAllDateFormat(txDate: string, rawQuery: string): boolean {
  if (!txDate || !rawQuery) return false;
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;

  if (txDate.toLowerCase().includes(q)) return true;

  const parts = txDate.split('-');
  if (parts.length !== 3) return false;

  const yearNum = parseInt(parts[0], 10);
  const monthNum = parseInt(parts[1], 10);
  const dayNum = parseInt(parts[2], 10);

  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) return false;

  const d = new Date(yearNum, monthNum - 1, dayNum);
  const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
  const monthLong = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const weekdayLong = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const yStr = parts[0];
  const mStr = parts[1];
  const dStr = parts[2];
  const shortYear = yStr.slice(2);

  // Relative keywords
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (q === 'today' && txDate === todayStr) return true;
  if (q === 'yesterday' && txDate === yesterdayStr) return true;

  // Month-only searches
  if (q === monthShort || q === monthLong) return true;
  if (monthLong.startsWith(q) && q.length >= 3) return true;

  // Weekday searches
  if (q === weekdayShort || q === weekdayLong) return true;

  // Year search
  if (q === yStr) return true;

  // Formats generated for this transaction
  const candidateFormats = [
    `${monthNum}/${dayNum}/${yearNum}`,
    `${mStr}/${dStr}/${yearNum}`,
    `${monthNum}/${dayNum}/${shortYear}`,
    `${mStr}/${dStr}/${shortYear}`,
    `${monthNum}/${dayNum}`,
    `${mStr}/${dStr}`,
    `${dayNum}/${monthNum}/${yearNum}`,
    `${dStr}/${mStr}/${yearNum}`,
    `${dayNum}/${monthNum}/${shortYear}`,
    `${dStr}/${mStr}/${shortYear}`,
    `${dayNum}/${monthNum}`,
    `${dStr}/${mStr}`,
    `${yearNum}.${mStr}.${dStr}`,
    `${yearNum}.${monthNum}.${dayNum}`,
    `${monthNum}.${dayNum}.${yearNum}`,
    `${mStr}.${dStr}.${yearNum}`,
    `${monthNum}.${dayNum}`,
    `${mStr}.${dStr}`,
    `${dayNum}.${monthNum}`,
    `${dStr}.${mStr}`,
    `${monthNum}-${dayNum}-${yearNum}`,
    `${mStr}-${dStr}-${yearNum}`,
    `${monthNum}-${dayNum}`,
    `${mStr}-${dStr}`,
    `${dayNum}-${monthNum}`,
    `${dStr}-${mStr}`,
    `${monthShort} ${dayNum}`,
    `${monthShort} ${dStr}`,
    `${monthLong} ${dayNum}`,
    `${monthLong} ${dStr}`,
    `${dayNum} ${monthShort}`,
    `${dStr} ${monthShort}`,
    `${dayNum} ${monthLong}`,
    `${dStr} ${monthLong}`,
    `${monthShort} ${yearNum}`,
    `${monthLong} ${yearNum}`,
    `${yearNum} ${monthShort}`,
    `${yearNum} ${monthLong}`,
    `${monthShort} ${dayNum}, ${yearNum}`,
    `${monthLong} ${dayNum}, ${yearNum}`,
    `${monthShort} ${dayNum} ${yearNum}`,
    `${monthLong} ${dayNum} ${yearNum}`,
  ];

  for (const fmt of candidateFormats) {
    const fLower = fmt.toLowerCase();
    if (fLower === q || fLower.includes(q) || q.includes(fLower)) {
      return true;
    }
  }

  // Delimiter-agnostic numeric matching
  const queryNums = q.match(/\d+/g);
  if (queryNums) {
    if (queryNums.length === 2) {
      const n1 = parseInt(queryNums[0], 10);
      const n2 = parseInt(queryNums[1], 10);
      if ((n1 === monthNum && n2 === dayNum) || (n1 === dayNum && n2 === monthNum)) {
        return true;
      }
      if (n1 === monthNum && (n2 === yearNum || n2 === parseInt(shortYear, 10))) {
        return true;
      }
    } else if (queryNums.length === 3) {
      const n1 = parseInt(queryNums[0], 10);
      const n2 = parseInt(queryNums[1], 10);
      const n3 = parseInt(queryNums[2], 10);
      const fullYearMatch = (y: number) => y === yearNum || y === parseInt(shortYear, 10);

      if (fullYearMatch(n1) && n2 === monthNum && n3 === dayNum) return true;
      if (n1 === monthNum && n2 === dayNum && fullYearMatch(n3)) return true;
      if (n1 === dayNum && n2 === monthNum && fullYearMatch(n3)) return true;
    }
  }

  return false;
}

  // Filtered & Sorted Transactions
  const filteredTxs = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search query with full date format support
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchMerchant = tx.merchant.toLowerCase().includes(q);
          const currentCat = CATEGORIES[tx.category];
          const catName = (currentCat?.name || tx.categoryName || '').toLowerCase();
          const matchCat = catName.includes(q);
          const matchAccount = (tx.paymentMethod || '').toLowerCase().includes(q);
          const matchNote = (tx.note || '').toLowerCase().includes(q);
          const matchDate = matchesAllDateFormat(tx.date, q);
          if (!matchMerchant && !matchCat && !matchAccount && !matchNote && !matchDate) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
          return false;
        }

        // Account filter
        if (selectedAccount !== 'all' && tx.paymentMethod !== selectedAccount) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount_asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, searchTerm, selectedCategory, selectedAccount, sortBy]);

  // Group by Month (e.g., "Oct 2025")
  const groupedTxs = useMemo(() => {
    const groups: { [key: string]: { monthLabel: string; totalExpense: number; items: Transaction[] } } = {};

    filteredTxs.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!groups[key]) {
        groups[key] = { monthLabel, totalExpense: 0, items: [] };
      }
      groups[key].items.push(tx);
      if (tx.type === 'expense') {
        groups[key].totalExpense += tx.amount;
      }
    });

    return Object.values(groups);
  }, [filteredTxs]);

  return (
    <div className="space-y-4 pb-24 px-3 sm:px-4 pt-3 max-w-full box-border overflow-x-hidden">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-black text-[#1E293B]"
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          Transactions
        </h2>
        <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
          {filteredTxs.length} items
        </span>
      </div>

      {/* Search Input */}
      <div className="relative max-w-full">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search merchant, date, category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border-2 border-stone-200 focus:border-[#FCCE4C] focus:outline-none text-xs font-semibold text-stone-800 placeholder:text-stone-400 shadow-xs transition-colors box-border"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Dropdown Pills (Wrapped cleanly, zero overflow) */}
      <div className="flex flex-wrap items-center gap-2 max-w-full box-border pb-1">
        {/* Category Filter */}
        <div className="relative flex-1 min-w-[110px] max-w-full">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CategoryId | 'all')}
            className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl bg-white border-2 border-stone-200 text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#1E293B] cursor-pointer truncate"
          >
            <option value="all">All Categories ({allCategories.length})</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <Filter className="w-3 h-3 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Account Filter (Synchronized with user transaction accounts) */}
        <div className="relative flex-1 min-w-[110px] max-w-full">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value as PaymentMethod | 'all')}
            className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-xl bg-white border-2 border-stone-200 text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#1E293B] cursor-pointer truncate"
          >
            <option value="all">All Accounts ({allAccounts.length})</option>
            {allAccounts.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>
          <Filter className="w-3 h-3 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Sorting Toggle - Compact label so button fits cleanly without clipping */}
        <button
          onClick={() => {
            if (sortBy === 'date_desc') setSortBy('amount_desc');
            else if (sortBy === 'amount_desc') setSortBy('amount_asc');
            else setSortBy('date_desc');
          }}
          className="flex-shrink-0 px-2.5 py-1.5 rounded-xl bg-white border-2 border-stone-200 text-xs font-bold text-[#1E293B] flex items-center gap-1 hover:border-[#1E293B] whitespace-nowrap cursor-pointer active:scale-95 transition-all shadow-2xs"
          title="Toggle Sorting (Newest, Highest, Lowest)"
        >
          <ArrowUpDown className="w-3 h-3 text-stone-500 flex-shrink-0" />
          <span>{sortBy === 'date_desc' ? 'Newest' : sortBy === 'amount_desc' ? 'Highest' : 'Lowest'}</span>
        </button>
      </div>

      {/* Grouped Transactions List */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-stone-300 space-y-3">
            <div className="text-3xl">🗽</div>
            <p className="font-extrabold text-[#1E293B] text-sm">No Transactions Yet</p>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Your ledger is completely clean! Tap below to record your first expense, subway ride, or income.
            </p>
            <button
              onClick={onOpenAdd}
              className="mt-1 px-4 py-2.5 rounded-2xl bg-[#FCCE4C] hover:bg-[#ebd05a] border-3 border-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black text-[#1E293B] cursor-pointer"
            >
              + Record First Transaction
            </button>
          </div>
        ) : groupedTxs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-stone-300 space-y-2">
            <div className="text-3xl">🔍</div>
            <p className="font-extrabold text-[#1E293B] text-sm">No matching transactions found</p>
            <p className="text-xs text-stone-400">Try adjusting search terms or clearing category filters</p>
            <button
              onClick={onOpenAdd}
              className="mt-2 px-4 py-2 rounded-xl bg-[#FCCE4C] border-2 border-[#1E293B] text-xs font-bold text-[#1E293B]"
            >
              + Record Transaction
            </button>
          </div>
        ) : (
          groupedTxs.map((group, idx) => (
            <div key={idx} className="space-y-2">
              {/* Group Header */}
              <div className="flex items-center justify-between px-1">
                <span
                  className="text-xs font-black text-[#1E293B]"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  {group.monthLabel}
                </span>
                <span className="text-xs font-bold text-rose-500">
                  Total: -${group.totalExpense.toFixed(2)}
                </span>
              </div>

              {/* Transactions in group */}
              <div className="space-y-2">
                {group.items.map((tx) => {
                  const cat = CATEGORIES[tx.category] || CATEGORIES.other;
                  const displayCatName = cat?.name || tx.categoryName;
                  const isNegative = tx.type === 'expense';
                  const formattedDate = new Date(tx.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="p-3 rounded-2xl bg-white border-2 border-stone-200 hover:border-[#FCCE4C] hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99] max-w-full box-border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 border ${cat.iconBg} border-stone-200 shadow-xs overflow-hidden`}
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
                              size={22}
                              color={cat.color}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-sm text-[#1E293B] group-hover:text-amber-800 transition-colors truncate">
                            {tx.merchant}
                          </div>
                          <div className="text-[11px] font-semibold text-stone-400 truncate">
                            {displayCatName} • {tx.paymentMethod}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 pl-2">
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};
