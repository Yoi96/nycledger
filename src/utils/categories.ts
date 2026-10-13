import { CategoryId } from '../types';

export interface CategoryMeta {
  id: CategoryId | string;
  name: string;
  emoji: string;
  iconUrl?: string; // Optional custom uploaded icon image data URL
  color: string;
  badgeBg: string;
  badgeBorder: string;
  iconBg: string;
  isCustom?: boolean;
}

export const DEFAULT_PRIMARY_CATEGORIES: CategoryMeta[] = [
  {
    id: 'food_beverages',
    name: 'Food and Beverages',
    emoji: 'fastfood',
    color: '#F97316',
    badgeBg: 'bg-orange-50 text-orange-700',
    badgeBorder: 'border-orange-200',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'housing_living',
    name: 'Housing & Living',
    emoji: 'home',
    color: '#3B82F6',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeBorder: 'border-blue-200',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    emoji: 'shopping_bag',
    color: '#EC4899',
    badgeBg: 'bg-pink-50 text-pink-700',
    badgeBorder: 'border-pink-200',
    iconBg: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'commute_travel',
    name: 'Commute & Travel',
    emoji: 'directions_subway',
    color: '#0D9488',
    badgeBg: 'bg-teal-50 text-teal-700',
    badgeBorder: 'border-teal-200',
    iconBg: 'bg-teal-100 text-teal-600',
  },
  {
    id: 'lifestyle_entertainment',
    name: 'Lifestyle & Entertainment',
    emoji: 'movie',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-50 text-purple-700',
    badgeBorder: 'border-purple-200',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'income_financial',
    name: 'Income & Financial',
    emoji: 'payments',
    color: '#16A34A',
    badgeBg: 'bg-green-50 text-green-700',
    badgeBorder: 'border-green-200',
    iconBg: 'bg-green-100 text-green-600',
  },
  {
    id: 'health_personal_care',
    name: 'Health & Personal Care',
    emoji: 'local_pharmacy',
    color: '#14B8A6',
    badgeBg: 'bg-teal-50 text-teal-700',
    badgeBorder: 'border-teal-200',
    iconBg: 'bg-teal-100 text-teal-600',
  },
  {
    id: 'gifts',
    name: 'Gifts',
    emoji: 'card_giftcard',
    color: '#F43F5E',
    badgeBg: 'bg-rose-50 text-rose-700',
    badgeBorder: 'border-rose-200',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'pets',
    name: 'Pets',
    emoji: 'pets',
    color: '#F59E0B',
    badgeBg: 'bg-amber-50 text-amber-700',
    badgeBorder: 'border-amber-200',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'make_up',
    name: 'Make Up',
    emoji: 'brush',
    color: '#E11D48',
    badgeBg: 'bg-rose-50 text-rose-700',
    badgeBorder: 'border-rose-200',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    emoji: 'category',
    color: '#64748B',
    badgeBg: 'bg-slate-50 text-slate-700',
    badgeBorder: 'border-slate-200',
    iconBg: 'bg-slate-100 text-slate-600',
  },
];

export const DEFAULT_CATEGORIES_MAP: Record<string, CategoryMeta> =
  DEFAULT_PRIMARY_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {} as Record<string, CategoryMeta>);

export const LEGACY_ALIASES: Record<string, string> = {
  drinks: 'food_beverages',
  food_drink: 'food_beverages',
  transportation: 'commute_travel',
  groceries: 'food_beverages',
  entertainment: 'lifestyle_entertainment',
  health: 'health_personal_care',
  utilities: 'housing_living',
  income: 'income_financial',
  other: 'miscellaneous',
};

const CATEGORIES_STORAGE_KEY = 'nyc_ledger_categories_v2';

// Safe localStorage loader with automatic schema and ID migration
export function getStoredCategories(): CategoryMeta[] {
  if (typeof window === 'undefined') return [...DEFAULT_PRIMARY_CATEGORIES];
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_PRIMARY_CATEGORIES));
      return [...DEFAULT_PRIMARY_CATEGORIES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let changed = false;
      // Filter out duplicate drinks and migrate legacy IDs and icons
      const EMOJI_TO_ICON_MAP: Record<string, string> = {
        '🍽️': 'fastfood',
        '🍜': 'fastfood',
        '🍔': 'fastfood',
        '🏠': 'home',
        '🛍️': 'shopping_bag',
        '🚇': 'directions_subway',
        '🎬': 'movie',
        '💰': 'payments',
        '💊': 'local_pharmacy',
        '🎁': 'card_giftcard',
        '🐱': 'pets',
        '💄': 'brush',
        '📦': 'category',
      };

      const migrated = parsed
        .filter((c) => c.id !== 'drinks')
        .map((c) => {
          let updated = { ...c };
          if (
            c.id === 'food_dining' ||
            c.id === 'food_drink' ||
            c.name === 'Food & Dining'
          ) {
            changed = true;
            updated.id = 'food_beverages';
            updated.name = 'Food and Beverages';
            updated.emoji = 'fastfood';
          }
          if (updated.id === 'food_beverages') {
            if (updated.emoji !== 'fastfood' || updated.name !== 'Food and Beverages') {
              changed = true;
              updated.name = 'Food and Beverages';
              updated.emoji = 'fastfood';
            }
          }
          // Modernize standard emojis to icon style if applicable
          if (updated.emoji && EMOJI_TO_ICON_MAP[updated.emoji]) {
            changed = true;
            updated.emoji = EMOJI_TO_ICON_MAP[updated.emoji];
          }
          return updated;
        });

      if (changed) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(migrated));
      }
      return migrated;
    }
  } catch (e) {
    console.error('Failed to parse stored categories', e);
  }
  return [...DEFAULT_PRIMARY_CATEGORIES];
}

export function saveStoredCategories(categories: CategoryMeta[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('categories-updated'));
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function resetStoredCategories(): CategoryMeta[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_PRIMARY_CATEGORIES));
    window.dispatchEvent(new Event('categories-updated'));
  }
  return [...DEFAULT_PRIMARY_CATEGORIES];
}

export function getCategoryMeta(id: CategoryId | string): CategoryMeta {
  if (!id) return DEFAULT_CATEGORIES_MAP.miscellaneous;
  const targetId = LEGACY_ALIASES[id] || id;

  const stored = getStoredCategories();
  const found = stored.find(
    (c) => c.id === targetId || c.name.toLowerCase() === targetId.toLowerCase()
  );
  if (found) return found;

  if (DEFAULT_CATEGORIES_MAP[targetId]) {
    return DEFAULT_CATEGORIES_MAP[targetId];
  }

  // Dynamic custom category fallback
  return {
    id: targetId,
    name: targetId,
    emoji: '🏷️',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-50 text-purple-700',
    badgeBorder: 'border-purple-200',
    iconBg: 'bg-purple-100 text-purple-600',
    isCustom: true,
  };
}

// Proxied CATEGORIES object so existing code like CATEGORIES[tx.category] works reactively and dynamically
export const CATEGORIES: Record<string, CategoryMeta> = new Proxy(
  {} as Record<string, CategoryMeta>,
  {
    get(_target, prop: string) {
      return getCategoryMeta(prop);
    },
    has(_target, prop: string) {
      return true;
    },
    ownKeys() {
      return getStoredCategories().map((c) => c.id);
    },
    getOwnPropertyDescriptor(_target, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: getCategoryMeta(prop as string),
      };
    },
  }
);

export const PRIMARY_CATEGORIES: CategoryMeta[] = DEFAULT_PRIMARY_CATEGORIES;

export const PAYMENT_METHODS_LIST: string[] = [
  'Cash',
  'Debit Card',
  'Credit Card',
  'OMNY Card',
  'PayPal',
  'Google Pay',
  'Apple Pay',
  'Samsung Pay',
  'Venmo',
  'Zelle',
  'Cash App',
  'Alipay',
  'WeChat Pay',
  'Checking Account',
  'Savings Account',
  'Check (Paper checks)',
  'Wire Transfer',
  'Gift Card / Prepaid Card',
  'BNPL (Klarna, Affirm, Afterpay)',
  'Cryptocurrency Wallet',
  'Other',
];
