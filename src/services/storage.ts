import { Transaction, BudgetConfig, OMNYState, QuickMealItem, PaymentMethod } from '../types';
import { TodoItem } from '../types/todo';
import * as XLSX from 'xlsx';
import {
  CategoryMeta,
  getStoredCategories,
  saveStoredCategories,
  resetStoredCategories,
  getCategoryMeta,
} from '../utils/categories';

const STORAGE_KEYS = {
  TRANSACTIONS: 'nyc_ledger_transactions_v1',
  BUDGET: 'nyc_ledger_budget_v1',
  OMNY: 'nyc_ledger_omny_v1',
  USER_PROFILE: 'nyc_ledger_user_profile_v1',
  QUICK_MEALS: 'nyc_ledger_quick_meals_v1',
  TODOS: 'nyc_ledger_todos_v1',
};

export const MTA_FARE = 3.0; // Current MTA NYC Transit Fare is $3.00

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGET: BudgetConfig = {
  monthlyTotal: 2500.0,
  categories: [
    { categoryId: 'housing_living', name: 'Housing & Living', budget: 1200, spent: 0.0 },
    { categoryId: 'food_beverages', name: 'Food and Beverages', budget: 600, spent: 0.0 },
    { categoryId: 'shopping', name: 'Shopping', budget: 200, spent: 0.0 },
    { categoryId: 'commute_travel', name: 'Commute & Travel', budget: 200, spent: 0.0 },
    { categoryId: 'lifestyle_entertainment', name: 'Lifestyle & Entertainment', budget: 200, spent: 0.0 },
    { categoryId: 'health_personal_care', name: 'Health & Personal Care', budget: 150, spent: 0.0 },
    { categoryId: 'make_up', name: 'Make Up', budget: 100, spent: 0.0 },
    { categoryId: 'pets', name: 'Pets', budget: 100, spent: 0.0 },
    { categoryId: 'gifts', name: 'Gifts', budget: 50, spent: 0.0 },
    { categoryId: 'miscellaneous', name: 'Miscellaneous', budget: 100, spent: 0.0 },
  ],
};

export const INITIAL_OMNY: OMNYState = {
  balance: 0.0,
  weeklyRides: 0,
  fareCapThreshold: 12,
  farePrice: 3.0,
  recentRides: [],
};

export const INITIAL_QUICK_MEALS: QuickMealItem[] = [
  {
    id: 'meal-1',
    name: 'NYC Classic Cheese Slice',
    emoji: '🍕',
    price: 3.5,
    location: "Joe's Pizza / 2 Bros",
    tag: 'Budget Saver',
    items: ['1x NY Cheese Slice ($3.50)'],
  },
  {
    id: 'meal-2',
    name: 'Halal Cart Chicken over Rice',
    emoji: '🥙',
    price: 8.5,
    location: 'Midtown 53rd & 6th',
    tag: 'Filling Combo',
    items: ['Chicken over Rice with White Sauce & Hot Sauce ($8.50)'],
  },
  {
    id: 'meal-3',
    name: 'Bodega Bagel & Cream Cheese',
    emoji: '🥯',
    price: 4.25,
    location: 'Local NYC Bodega',
    tag: 'Classic Breakfast',
    items: ['Toasted Everything Bagel with Scallion Cream Cheese ($4.25)'],
  },
  {
    id: 'meal-4',
    name: 'Chinatown Dumplings',
    emoji: '🥟',
    price: 5.0,
    location: 'Mosco St, Chinatown',
    tag: 'Great Value',
    items: ['6x Pan-fried Pork & Chive Dumplings ($5.00)'],
  },
  {
    id: 'meal-5',
    name: 'Street Hot Pretzel & Nuts',
    emoji: '🥨',
    price: 4.0,
    location: 'Central Park / Broadway Cart',
    tag: 'Street Snack',
    items: ['Warm Salted Pretzel ($4.00)'],
  },
];

export const INITIAL_TODOS: TodoItem[] = [];

const LEGACY_SAMPLE_TX_IDS = new Set([
  'tx-0', 'tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7', 'tx-8', 'tx-9',
]);
const LEGACY_SAMPLE_TODO_IDS = new Set([
  'todo-1', 'todo-2', 'todo-3', 'todo-4', 'todo-5', 'todo-6', 'todo-7',
]);
const LEGACY_SAMPLE_OMNY_IDS = new Set([
  'omny-1', 'omny-2', 'omny-3', 'omny-4',
]);

// Local storage management
export const LocalDB = {
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data === null) {
        this.saveTransactions([]);
        return [];
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        let changed = false;

        // Auto-purge any legacy sample transactions
        const nonSample = parsed.filter((t: Transaction) => {
          if (LEGACY_SAMPLE_TX_IDS.has(t.id)) {
            changed = true;
            return false;
          }
          return true;
        });

        const cleaned = nonSample.map((t: Transaction) => {
          const updated = { ...t };
          // Auto-migrate legacy food_dining and drinks categories to food_beverages
          if (
            (updated.category as string) === 'food_dining' ||
            (updated.category as string) === 'food_drink' ||
            (updated.category as string) === 'drinks' ||
            updated.categoryName === 'Food & Dining'
          ) {
            changed = true;
            updated.category = 'food_beverages';
            updated.categoryName = 'Food and Beverages';
          }

          const loc = (updated.location || '').toLowerCase();
          const merch = (updated.merchant || '').toLowerCase();
          if (
            merch.includes('location access blocked') ||
            merch.includes('geolocation not supported') ||
            loc.includes('location access blocked')
          ) {
            changed = true;
            updated.merchant = updated.merchant.includes('OMNY') ? 'MTA OMNY (Local Transit)' : updated.merchant;
            updated.location = 'Local Transit';
          }
          return updated;
        });
        if (changed) {
          try {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cleaned));
          } catch {
            // ignore
          }
        }
        return cleaned;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveTransactions(txs: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  },

  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const fullTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
    };
    const current = this.getTransactions();
    const updated = [fullTx, ...current];
    this.saveTransactions(updated);
    this.updateBudgetAfterTx(fullTx);
    this.syncOMNYWithTransaction(fullTx, 'add');
    return fullTx;
  },

  updateTransaction(tx: Transaction): void {
    const current = this.getTransactions();
    const index = current.findIndex((t) => t.id === tx.id);
    if (index !== -1) {
      const oldTx = current[index];
      current[index] = tx;
      this.saveTransactions([...current]);
      this.syncOMNYWithTransaction(tx, 'update', oldTx);
    }
  },

  deleteTransaction(id: string): void {
    const current = this.getTransactions();
    const target = current.find((t) => t.id === id);
    const filtered = current.filter((t) => t.id !== id);
    this.saveTransactions(filtered);
    if (target) {
      this.syncOMNYWithTransaction(target, 'delete');
    }
  },

  getBudget(): BudgetConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (!data) {
        this.saveBudget(INITIAL_BUDGET);
        return INITIAL_BUDGET;
      }
      const parsed: BudgetConfig = JSON.parse(data);
      if (parsed && Array.isArray(parsed.categories)) {
        let budgetChanged = false;
        parsed.categories = parsed.categories.map((c) => {
          if (
            (c.categoryId as string) === 'food_dining' ||
            (c.categoryId as string) === 'food_drink' ||
            c.name === 'Food & Dining'
          ) {
            budgetChanged = true;
            return {
              ...c,
              categoryId: 'food_beverages',
              name: 'Food and Beverages',
            };
          }
          return c;
        });
        if (budgetChanged) {
          this.saveBudget(parsed);
        }
      }
      return parsed;
    } catch {
      return INITIAL_BUDGET;
    }
  },

  saveBudget(budget: BudgetConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
    } catch (e) {
      console.error('Failed to save budget', e);
    }
  },

  updateBudgetAfterTx(tx: Transaction): void {
    if (tx.type !== 'expense') return;
    const budget = this.getBudget();
    const cat = budget.categories.find((c) => c.categoryId === tx.category);
    if (cat) {
      cat.spent += tx.amount;
      this.saveBudget(budget);
    }
  },

  getOMNY(): OMNYState {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OMNY);
      if (!data) {
        this.saveOMNY(INITIAL_OMNY);
        return INITIAL_OMNY;
      }
      const parsed: OMNYState = JSON.parse(data);
      // Ensure fareCapThreshold is 12
      parsed.fareCapThreshold = 12;

      let changed = false;

      // Filter out legacy sample rides
      if (Array.isArray(parsed.recentRides)) {
        const filteredRides = parsed.recentRides.filter((r) => !LEGACY_SAMPLE_OMNY_IDS.has(r.id));
        if (filteredRides.length !== parsed.recentRides.length) {
          changed = true;
          parsed.recentRides = filteredRides;
          if (parsed.balance === 30.0 && parsed.weeklyRides === 8) {
            parsed.balance = 0.0;
            parsed.weeklyRides = 0;
          }
        }
      }

      // Synchronize weekly rides directly from transactions occurring in current MTA weekly window (Monday to Sunday)
      const weekRidesFromTxs = this.getTransitRidesThisWeek();
      if (weekRidesFromTxs > 0) {
        parsed.weeklyRides = Math.max(parsed.weeklyRides || 0, Math.min(30, weekRidesFromTxs));
      } else if (parsed.recentRides.length === 0 && parsed.weeklyRides === 8) {
        parsed.weeklyRides = 0;
        changed = true;
      }

      // Clean up any legacy blocked location strings
      if (Array.isArray(parsed.recentRides)) {
        parsed.recentRides = parsed.recentRides.map((ride) => {
          const st = (ride.station || '').toLowerCase();
          if (
            st.includes('location access') ||
            st.includes('geolocation not supported') ||
            st.includes('blocked or unavailable')
          ) {
            changed = true;
            return {
              ...ride,
              station: 'Local Transit',
            };
          }
          return ride;
        });
      }

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEYS.OMNY, JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }

      return parsed;
    } catch {
      return INITIAL_OMNY;
    }
  },

  getTransitRidesThisWeek(txs?: Transaction[]): number {
    try {
      const list = txs || this.getTransactions();
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const mondayStr = monday.toISOString().split('T')[0];
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const sundayStr = sunday.toISOString().split('T')[0];

      return list.filter((t) => {
        if (t.type !== 'expense') return false;
        if (t.date < mondayStr || t.date > sundayStr) return false;
        const m = t.merchant.toLowerCase();
        const n = (t.note || '').toLowerCase();
        const isReload = m.includes('reload') || m.includes('top-up') || n.includes('top-up');
        if (isReload) return false;
        return (
          t.paymentMethod === 'OMNY Card' ||
          m.includes('omny') ||
          m.includes('mta') ||
          m.includes('subway') ||
          (t.category === 'commute_travel' && (n.includes('subway') || n.includes('ride') || n.includes('fare') || n.includes('tap')))
        );
      }).length;
    } catch {
      return 0;
    }
  },

  saveOMNY(omny: OMNYState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.OMNY, JSON.stringify(omny));
    } catch (e) {
      console.error('Failed to save OMNY state', e);
    }
  },

  /**
   * Automatically adjusts OMNY balance and weekly rides when transactions are added/edited/deleted
   */
  syncOMNYWithTransaction(tx: Transaction, action: 'add' | 'update' | 'delete', oldTx?: Transaction): void {
    // If the transaction was directly dispatched by OMNY Tool tap or reload,
    // the state was already updated directly in tapOMNY / reloadOMNY.
    if (action === 'add' && tx.note && tx.note.includes('[omny-direct]')) {
      return;
    }

    const isOMNYRelated = (t: Transaction) =>
      t.paymentMethod === 'OMNY Card' ||
      t.merchant.toLowerCase().includes('omny') ||
      t.merchant.toLowerCase().includes('mta') ||
      t.merchant.toLowerCase().includes('subway');

    const isReload = (t: Transaction) =>
      t.merchant.toLowerCase().includes('reload') ||
      t.merchant.toLowerCase().includes('top-up') ||
      (t.note && t.note.toLowerCase().includes('top-up'));

    const state = this.getOMNY();

    if (action === 'add') {
      if (isReload(tx)) {
        // User recharged OMNY card
        state.balance = +(state.balance + tx.amount).toFixed(2);
      } else if (isOMNYRelated(tx) && tx.type === 'expense') {
        // One subway ride taken
        state.weeklyRides = Math.min(30, state.weeklyRides + 1);
        if (tx.paymentMethod === 'OMNY Card') {
          state.balance = Math.max(0, +(state.balance - tx.amount).toFixed(2));
        }
      }
    } else if (action === 'delete') {
      if (isReload(tx)) {
        state.balance = Math.max(0, +(state.balance - tx.amount).toFixed(2));
      } else if (isOMNYRelated(tx) && tx.type === 'expense') {
        // Ride deleted, reduce progress
        state.weeklyRides = Math.max(0, state.weeklyRides - 1);
        if (tx.paymentMethod === 'OMNY Card') {
          state.balance = +(state.balance + tx.amount).toFixed(2);
        }
      }
    } else if (action === 'update' && oldTx) {
      // Revert old
      if (isReload(oldTx)) {
        state.balance = Math.max(0, +(state.balance - oldTx.amount).toFixed(2));
      }
      // Apply new
      if (isReload(tx)) {
        state.balance = +(state.balance + tx.amount).toFixed(2);
      }
    }

    this.saveOMNY(state);
  },

  getOMNYFare(): number {
    const state = this.getOMNY();
    return typeof state.farePrice === 'number' && state.farePrice > 0 ? state.farePrice : MTA_FARE;
  },

  setOMNYFare(newFare: number): number {
    const state = this.getOMNY();
    const validFare = Math.max(0.01, +(newFare.toFixed(2)));
    state.farePrice = validFare;
    this.saveOMNY(state);
    return validFare;
  },

  tapOMNY(stationName = 'Local Transit', customFare?: number): { success: boolean; cost: number; isFreeFareCap: boolean } {
    const state = this.getOMNY();
    const isFreeFareCap = state.weeklyRides >= state.fareCapThreshold;
    const baseFare = typeof customFare === 'number' && customFare > 0
      ? customFare
      : (typeof state.farePrice === 'number' && state.farePrice > 0 ? state.farePrice : MTA_FARE);
    const cost = isFreeFareCap ? 0 : +(baseFare.toFixed(2));

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let usedPaymentMethod: PaymentMethod = 'OMNY Card';
    if (!isFreeFareCap && cost > 0) {
      if (state.balance >= cost) {
        state.balance = Math.max(0, +(state.balance - cost).toFixed(2));
        usedPaymentMethod = 'OMNY Card';
      } else {
        // If balance is below fare, tap still succeeds via contactless payment (Credit Card / Contactless)
        // Deduct whatever is left from OMNY balance
        state.balance = 0;
        usedPaymentMethod = 'Credit Card';
      }
    }

    state.weeklyRides = Math.min(30, state.weeklyRides + 1);
    state.recentRides.unshift({
      id: 'omny-' + Date.now(),
      type: stationName.toLowerCase().includes('bus') ? 'Bus' : 'Subway',
      station: stationName,
      time: timeStr,
      date: dateStr,
      amount: cost,
    });
    if (state.recentRides.length > 20) state.recentRides.pop();
    this.saveOMNY(state);

    if (cost > 0) {
      this.addTransaction({
        type: 'expense',
        amount: cost,
        category: 'commute_travel',
        categoryName: 'Commute & Travel',
        merchant: `MTA OMNY (${stationName})`,
        date: now.toISOString().split('T')[0],
        time: timeStr,
        paymentMethod: usedPaymentMethod,
        location: stationName.includes(',') ? stationName : `${stationName}, New York, NY`,
        note: `Subway tap ride ($${cost.toFixed(2)}) [omny-direct]`,
        scannedByAI: true,
        detectedItems: [`MTA Tap & Go Ride fare: $${cost.toFixed(2)}`],
      });
    }

    return { success: true, cost, isFreeFareCap };
  },

  reloadOMNY(amount: number, recordTransaction = true, method: PaymentMethod = 'Credit Card'): number {
    const state = this.getOMNY();
    state.balance = +(state.balance + amount).toFixed(2);
    this.saveOMNY(state);

    if (recordTransaction && amount > 0) {
      const now = new Date();
      this.addTransaction({
        type: 'expense',
        amount,
        category: 'commute_travel',
        categoryName: 'Commute & Travel',
        merchant: 'OMNY Card Reload',
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        paymentMethod: method,
        location: 'MTA OMNY Online',
        note: `OMNY Top-up +$${amount.toFixed(2)} [omny-direct]`,
        scannedByAI: false,
      });
    }

    return state.balance;
  },

  setOMNYBalance(newBalance: number): number {
    const state = this.getOMNY();
    state.balance = Math.max(0, +newBalance.toFixed(2));
    this.saveOMNY(state);
    return state.balance;
  },

  setOMNYWeeklyRides(rides: number): number {
    const state = this.getOMNY();
    state.weeklyRides = Math.max(0, Math.min(50, Math.floor(rides)));
    this.saveOMNY(state);
    return state.weeklyRides;
  },

  exportAllDataJSON(): string {
    const rawTxs = this.getTransactions();
    const formattedTxs = rawTxs.map((t, idx) => ({
      ...t,
      id: `${idx + 1}`,
      rawId: t.id,
      exportId: idx + 1,
    }));
    const payload = {
      appName: 'NYC Ledger',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      isOfflineStorage: true,
      transactions: formattedTxs,
      budget: this.getBudget(),
      omny: this.getOMNY(),
      quickMeals: this.getQuickMeals(),
    };
    return JSON.stringify(payload, null, 2);
  },

  exportToCSV(): string {
    const txs = this.getTransactions();
    const headers = ['ID', 'Type', 'Amount', 'Category', 'Merchant', 'Date', 'Time', 'PaymentMethod', 'Note', 'Location'];
    const rows = txs.map((t, idx) => [
      idx + 1, // Sequential numerical ID starting from 1
      t.type,
      t.amount.toFixed(2),
      `"${(t.categoryName || '').replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      t.date,
      t.time || '',
      t.paymentMethod || '',
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${(t.location || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  importDataJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.transactions)) {
        this.saveTransactions(data.transactions);
      }
      if (data.budget) {
        this.saveBudget(data.budget);
      }
      if (data.omny) {
        this.saveOMNY(data.omny);
      }
      if (Array.isArray(data.quickMeals)) {
        this.saveQuickMeals(data.quickMeals);
      }
      return true;
    } catch {
      return false;
    }
  },

  async importFromExcelOrCSV(file: File): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return { success: false, count: 0, error: 'No valid worksheet found in file' };
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rawRows.length < 2) {
        return { success: false, count: 0, error: 'File is empty or contains no data rows' };
      }

      const headers = rawRows[0].map((h) => String(h || '').trim().toLowerCase());

      const findCol = (...keywords: string[]) => {
        return headers.findIndex((h) => keywords.some((k) => h.includes(k.toLowerCase())));
      };

      const idIdx = findCol('id', 'transaction_id', 'tx_id', 'serial', 'reference');
      const typeIdx = findCol('type', 'expense_type', 'flow', 'kind');
      const amountIdx = findCol('amount', 'price', 'total', 'cost', 'spend', 'value');
      const categoryIdx = findCol('category', 'category_name', 'tag', 'class');
      const merchantIdx = findCol('merchant', 'payee', 'title', 'name', 'description', 'vendor', 'store');
      const dateIdx = findCol('date', 'time', 'transaction_date', 'timestamp', 'posted_date');
      const timeIdx = findCol('time', 'hour', 'clock');
      const paymentMethodIdx = findCol('payment', 'paymentmethod', 'account', 'card', 'method');
      const noteIdx = findCol('note', 'memo', 'comment', 'remark', 'details');
      const locationIdx = findCol('location', 'city', 'address', 'place');

      const existingTxs = this.getTransactions();
      const existingIds = new Set(existingTxs.map((t) => t.id));
      const newTxs: Transaction[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        let rawAmount = amountIdx !== -1 ? row[amountIdx] : null;
        if (rawAmount === undefined || rawAmount === null || rawAmount === '') continue;

        let amount =
          typeof rawAmount === 'number'
            ? Math.abs(rawAmount)
            : parseFloat(String(rawAmount).replace(/[^0-9.-]/g, ''));
        if (isNaN(amount) || amount === 0) continue;

        let type: 'expense' | 'income' = 'expense';
        if (typeIdx !== -1 && row[typeIdx]) {
          const typeStr = String(row[typeIdx]).toLowerCase();
          if (typeStr.includes('income') || typeStr.includes('deposit') || typeStr.includes('credit') || typeStr.includes('+')) {
            type = 'income';
          }
        } else if (typeof rawAmount === 'number' && rawAmount < 0) {
          type = 'expense';
        }

        const merchant =
          merchantIdx !== -1 && row[merchantIdx]
            ? String(row[merchantIdx]).trim()
            : 'Imported Record';

        let rawCat = categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]).trim() : '';
        let categoryId: string = 'other';
        let categoryName: string = rawCat || 'Other';
        if (rawCat) {
          const meta = getCategoryMeta(rawCat);
          categoryId = meta.id;
          categoryName = meta.name;
        }

        let date = new Date().toISOString().split('T')[0];
        if (dateIdx !== -1 && row[dateIdx]) {
          const val = row[dateIdx];
          if (typeof val === 'number') {
            const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
            if (!isNaN(dateObj.getTime())) {
              date = dateObj.toISOString().split('T')[0];
            }
          } else {
            const parsed = new Date(String(val));
            if (!isNaN(parsed.getTime())) {
              date = parsed.toISOString().split('T')[0];
            }
          }
        }

        const time =
          timeIdx !== -1 && row[timeIdx] ? String(row[timeIdx]).trim() : '12:00 PM';

        const paymentMethod =
          paymentMethodIdx !== -1 && row[paymentMethodIdx]
            ? String(row[paymentMethodIdx]).trim()
            : 'Credit Card';

        const note = noteIdx !== -1 && row[noteIdx] ? String(row[noteIdx]).trim() : '';
        const location =
          locationIdx !== -1 && row[locationIdx] ? String(row[locationIdx]).trim() : '';

        let id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
        if (!id || existingIds.has(id)) {
          id = `tx-excel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        }
        existingIds.add(id);

        newTxs.push({
          id,
          type,
          amount,
          category: categoryId as any,
          categoryName,
          merchant,
          date,
          time,
          paymentMethod: paymentMethod as any,
          note,
          location,
          createdAt: Date.now(),
        });
      }

      if (newTxs.length === 0) {
        return {
          success: false,
          count: 0,
          error: 'Failed to parse valid transactions from file (please check column headers or amounts)',
        };
      }

      const merged = [...newTxs, ...existingTxs];
      this.saveTransactions(merged);
      try {
        window.dispatchEvent(new CustomEvent('app_data_reset'));
      } catch {}

      return { success: true, count: newTxs.length };
    } catch (e: any) {
      console.error('Failed to import Excel/CSV', e);
      return { success: false, count: 0, error: e?.message || 'Failed to read Excel/CSV file' };
    }
  },

  getQuickMeals(): QuickMealItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUICK_MEALS);
      if (!data) {
        this.saveQuickMeals(INITIAL_QUICK_MEALS);
        return INITIAL_QUICK_MEALS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_QUICK_MEALS;
    }
  },

  saveQuickMeals(meals: QuickMealItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUICK_MEALS, JSON.stringify(meals));
    } catch (e) {
      console.error('Failed to save quick meals:', e);
    }
  },

  addQuickMeal(meal: Omit<QuickMealItem, 'id'>): QuickMealItem {
    const meals = this.getQuickMeals();
    const newMeal: QuickMealItem = {
      ...meal,
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    meals.unshift(newMeal);
    this.saveQuickMeals(meals);
    return newMeal;
  },

  updateQuickMeal(id: string, updates: Partial<QuickMealItem>): boolean {
    const meals = this.getQuickMeals();
    const idx = meals.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    meals[idx] = { ...meals[idx], ...updates };
    this.saveQuickMeals(meals);
    return true;
  },

  deleteQuickMeal(id: string): boolean {
    const meals = this.getQuickMeals();
    const filtered = meals.filter((m) => m.id !== id);
    this.saveQuickMeals(filtered);
    return true;
  },

  resetQuickMeals(): QuickMealItem[] {
    this.saveQuickMeals(INITIAL_QUICK_MEALS);
    return INITIAL_QUICK_MEALS;
  },

  changeToPreviousDayData(): { count: number; date: string } {
    const txs = this.getTransactions();
    const yesterday = new Date(Date.now() - 86400000);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    let targetDateStr = yStr;

    if (txs.length > 0) {
      // Shift all existing transaction dates back by 1 calendar day
      const updated = txs.map((t) => {
        const parts = (t.date || '').split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          d.setDate(d.getDate() - 1);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const newDateStr = `${y}-${m}-${day}`;
          targetDateStr = newDateStr;
          return {
            ...t,
            date: newDateStr,
            createdAt: (t.createdAt || Date.now()) - 86400000,
          };
        }
        return t;
      });
      this.saveTransactions(updated);

      // Also shift OMNY recent rides back by 1 day if any
      const omny = this.getOMNY();
      if (omny.recentRides && omny.recentRides.length > 0) {
        omny.recentRides = omny.recentRides.map((r) => {
          const parts = (r.date || '').split('-').map(Number);
          if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            d.setDate(d.getDate() - 1);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return {
              ...r,
              date: `${y}-${m}-${day}`,
            };
          }
          return r;
        });
        this.saveOMNY(omny);
      }

      try {
        window.dispatchEvent(new CustomEvent('app_data_reset'));
      } catch {}

      return { count: updated.length, date: targetDateStr };
    } else {
      // If no transactions currently exist, populate demo records dated yesterday
      const now = Date.now();
      const demoTxs: Transaction[] = [
        {
          id: `tx-prev-${now}-1`,
          type: 'expense',
          amount: 3.0,
          category: 'commute_travel',
          categoryName: 'Commute & Travel',
          merchant: 'MTA OMNY (Subway tap)',
          date: yStr,
          time: '08:45',
          paymentMethod: 'OMNY Card',
          location: 'Times Sq - 42 St',
          note: 'Morning subway ride to office',
          createdAt: yesterday.getTime() - 3600000 * 8,
        },
        {
          id: `tx-prev-${now}-2`,
          type: 'expense',
          amount: 14.5,
          category: 'food_beverages',
          categoryName: 'Food and Beverages',
          merchant: "Joe's Pizza & Drink",
          date: yStr,
          time: '12:30',
          paymentMethod: 'Apple Pay',
          location: 'Greenwich Village',
          note: 'NYC classic cheese slices & drink',
          createdAt: yesterday.getTime() - 3600000 * 4,
        },
        {
          id: `tx-prev-${now}-3`,
          type: 'expense',
          amount: 5.75,
          category: 'food_beverages',
          categoryName: 'Food and Beverages',
          merchant: 'Blue Bottle Coffee',
          date: yStr,
          time: '15:15',
          paymentMethod: 'Credit Card',
          location: 'Bryant Park',
          note: 'Iced oat latte',
          createdAt: yesterday.getTime() - 3600000 * 2,
        },
        {
          id: `tx-prev-${now}-4`,
          type: 'expense',
          amount: 3.0,
          category: 'commute_travel',
          categoryName: 'Commute & Travel',
          merchant: 'MTA OMNY (Subway tap)',
          date: yStr,
          time: '18:20',
          paymentMethod: 'OMNY Card',
          location: 'Grand Central - 42 St',
          note: 'Evening commute back home',
          createdAt: yesterday.getTime() - 3600000,
        },
        {
          id: `tx-prev-${now}-5`,
          type: 'expense',
          amount: 28.0,
          category: 'shopping',
          categoryName: 'Shopping',
          merchant: "Trader Joe's",
          date: yStr,
          time: '19:10',
          paymentMethod: 'Debit Card',
          location: 'Union Square',
          note: 'Groceries and snacks',
          createdAt: yesterday.getTime(),
        },
      ];

      this.saveTransactions(demoTxs);
      this.saveBudget(INITIAL_BUDGET);

      const omny = this.getOMNY();
      omny.recentRides = [
        {
          id: `omny-prev-${now}-1`,
          type: 'Subway',
          station: 'Times Sq - 42 St',
          time: '08:45',
          date: yStr,
          amount: 3.0,
        },
        {
          id: `omny-prev-${now}-2`,
          type: 'Subway',
          station: 'Grand Central - 42 St',
          time: '18:20',
          date: yStr,
          amount: 3.0,
        },
      ];
      omny.weeklyRides = 2;
      this.saveOMNY(omny);

      try {
        window.dispatchEvent(new CustomEvent('app_data_reset'));
      } catch {}

      return { count: demoTxs.length, date: targetDateStr };
    }
  },

  resetAll(): void {
    this.changeToPreviousDayData();
  },

  clearAllData(): void {
    // Overwrite with empty lists explicitly
    this.saveTransactions([]);
    this.saveBudget({
      monthlyTotal: 0,
      categories: [],
    });
    this.saveOMNY({
      balance: 0,
      weeklyRides: 0,
      fareCapThreshold: 12,
      recentRides: [],
    });
    this.saveQuickMeals([]);
    this.saveTodos([]);
    try {
      window.dispatchEvent(new CustomEvent('app_data_reset'));
    } catch {}
  },

  getCategories(): CategoryMeta[] {
    return getStoredCategories();
  },

  saveCategories(categories: CategoryMeta[]): void {
    saveStoredCategories(categories);
  },

  resetCategories(): CategoryMeta[] {
    return resetStoredCategories();
  },

  getTodos(): TodoItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TODOS);
      if (!data) {
        this.saveTodos([]);
        return [];
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((t: TodoItem) => !LEGACY_SAMPLE_TODO_IDS.has(t.id));
        if (filtered.length !== parsed.length) {
          this.saveTodos(filtered);
        }
        return filtered;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveTodos(todos: TodoItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
      try {
        window.dispatchEvent(new CustomEvent('todos_updated', { detail: todos }));
      } catch {}
    } catch (e) {
      console.error('Failed to save todos to localStorage', e);
    }
  },

  addTodo(item: Omit<TodoItem, 'id' | 'createdAt'>): TodoItem {
    const full: TodoItem = {
      ...item,
      id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
    };
    const current = this.getTodos();
    const updated = [full, ...current];
    this.saveTodos(updated);
    return full;
  },

  toggleTodo(id: string): boolean {
    const todos = this.getTodos();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    todos[idx].completed = !todos[idx].completed;
    this.saveTodos(todos);
    return todos[idx].completed;
  },

  updateTodo(item: TodoItem): boolean {
    const todos = this.getTodos();
    const idx = todos.findIndex((t) => t.id === item.id);
    if (idx === -1) return false;
    todos[idx] = { ...todos[idx], ...item };
    this.saveTodos(todos);
    return true;
  },

  deleteTodo(id: string): boolean {
    const todos = this.getTodos();
    const filtered = todos.filter((t) => t.id !== id);
    this.saveTodos(filtered);
    return true;
  },

  resetTodos(): TodoItem[] {
    this.saveTodos(INITIAL_TODOS);
    return INITIAL_TODOS;
  },
};
