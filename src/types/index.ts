export type TransactionType = 'expense' | 'income';

export type CategoryId =
  | 'housing_living'
  | 'food_beverages'
  | 'commute_travel'
  | 'lifestyle_entertainment'
  | 'income_financial'
  | 'miscellaneous'
  | 'health_personal_care'
  | 'gifts'
  | 'pets'
  | 'make_up'
  | string; // for backward compatibility

export type PaymentMethod =
  | 'Cash'
  | 'Debit Card'
  | 'Credit Card'
  | 'OMNY Card'
  | 'PayPal'
  | 'Google Pay'
  | 'Apple Pay'
  | 'Samsung Pay'
  | 'Venmo'
  | 'Zelle'
  | 'Cash App'
  | 'Alipay'
  | 'WeChat Pay'
  | 'Checking Account'
  | 'Savings Account'
  | 'Check (Paper checks)'
  | 'Wire Transfer'
  | 'Gift Card / Prepaid Card'
  | 'BNPL (Klarna, Affirm, Afterpay)'
  | 'Cryptocurrency Wallet'
  | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: CategoryId;
  categoryName: string;
  merchant: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod: PaymentMethod;
  location?: string;
  note?: string;
  tax?: number;
  tips?: number;
  receiptImage?: string; // base64 or sample identifier
  scannedByAI?: boolean;
  detectedItems?: string[];
  createdAt: number;
}

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  iconName: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface CategoryBudget {
  categoryId: CategoryId;
  name: string;
  budget: number;
  spent: number;
}

export interface BudgetConfig {
  monthlyTotal: number;
  categories: CategoryBudget[];
}

export interface OMNYState {
  balance: number;
  weeklyRides: number; // 12 max fare cap
  fareCapThreshold: number; // 12 rides
  farePrice?: number; // Customizable ticket fee (defaults to 3.00, allows custom user fare)
  recentRides: {
    id: string;
    type: 'Subway' | 'Bus';
    station: string;
    time: string;
    date: string;
    amount: number;
  }[];
}

export interface AIScanResult {
  merchant: string;
  amount: number;
  category: CategoryId;
  categoryName: string;
  date: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  items: string[];
  note: string;
  confidence: number;
  source: 'offline-local-vision' | 'gemini-3.8-flash';
}

export interface QuickMealItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  location: string;
  tag: string;
  paymentMethod?: PaymentMethod;
  items?: string[];
}
