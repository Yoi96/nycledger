import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  CreditCard,
  Store,
  FileText,
  Check,
  Camera,
  MapPin,
  Trash2,
  Eye,
  RefreshCw,
  ZoomIn,
  ChevronDown,
  Search,
  Tag,
  Settings,
  Plus,
  Receipt,
} from 'lucide-react';
import { CategoryId, PaymentMethod, Transaction, TransactionType, AIScanResult } from '../../types';
import {
  CATEGORIES,
  PRIMARY_CATEGORIES,
  PAYMENT_METHODS_LIST,
  getStoredCategories,
  getCategoryMeta,
  CategoryMeta,
} from '../../utils/categories';
import { CategoryIcon } from '../common/CategoryIcon';
import { AIVisionModal } from './AIVisionModal';

export interface LineItem {
  id: string;
  name: string;
  price: string;
}

const parseDetectedItems = (items?: string[]): LineItem[] => {
  if (!items || items.length === 0) return [];
  return items.map((raw, idx) => {
    const match = raw.match(/^(.*?)(?:\s*\(\$?([0-9.]+)\)|\s+\$?([0-9.]+)$)/);
    if (match) {
      const name = match[1].trim();
      const price = match[2] || match[3] || '';
      return { id: `item-${idx}-${Date.now()}-${Math.random()}`, name, price };
    }
    return { id: `item-${idx}-${Date.now()}-${Math.random()}`, name: raw.trim(), price: '' };
  });
};

export interface MerchantPrompt {
  id: string;
  label: string;
  name: string;
  categoryId: CategoryId | string;
  categoryName: string;
  categoryEmoji: string;
  paymentMethod?: PaymentMethod;
  transactionType?: TransactionType;
  keywords: string[];
}

export const MERCHANT_PROMPTS: MerchantPrompt[] = [
  // Housing & Living (Payment: Debit Card)
  { id: 'gas', label: 'Gas (Cooking/Heat)', name: 'Con Edison - Gas', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['gas', 'cooking gas', 'con edison gas', 'heating', 'national grid'] },
  { id: 'electric', label: 'Electricity Bill', name: 'Con Edison - Electricity', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['electricity', 'electric', 'power', 'con edison', 'light', 'electric bill'] },
  { id: 'verizon_fios', label: 'Verizon Fios', name: 'Verizon Fios Internet', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['verizon', 'fios', 'fiber', 'internet', 'wifi', 'broadband'] },
  { id: 'spectrum_net', label: 'Spectrum', name: 'Spectrum Internet', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['spectrum', 'charter', 'internet', 'wifi', 'cable'] },
  { id: 'optimum_net', label: 'Optimum / Altice', name: 'Optimum Internet', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['optimum', 'altice', 'internet', 'wifi', 'broadband'] },
  { id: 'astound_rcn', label: 'Astound / RCN', name: 'Astound Broadband', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['astound', 'rcn', 'internet', 'wifi', 'broadband'] },
  { id: 'nyc_mesh', label: 'NYC Mesh / 5G Home', name: 'NYC Mesh WiFi', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['nyc mesh', 'mesh', 't-mobile 5g', '5g home', 'wifi', 'internet'] },
  { id: 'furniture', label: 'Furniture & Decor', name: 'IKEA Furniture', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['furniture', 'ikea', 'bed', 'desk', 'chair', 'sofa', 'table', 'couch', 'mattress'] },
  { id: 'kitchen', label: 'Kitchenware & Utensils', name: 'Target Kitchenware', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['kitchenware', 'cookware', 'pots', 'pans', 'dishes', 'utensils', 'kitchen', 'plates'] },
  { id: 'rent', label: 'Apartment Rent', name: 'Apartment Rent', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['rent', 'lease', 'landlord', 'monthly rent', 'management'] },
  { id: 'water', label: 'Water & Sewer', name: 'NYC Water Board', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['water', 'sewer', 'water bill', 'dep'] },
  { id: 'cleaning', label: 'Home Supplies', name: 'Home Depot Supplies', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['supplies', 'cleaning', 'household', 'home depot', 'detergent'] },
  { id: 'repair', label: 'Hardware & Maintenance', name: 'Home Maintenance', categoryId: 'housing_living', categoryName: 'Housing & Living', categoryEmoji: '🏠', paymentMethod: 'Debit Card', keywords: ['hardware', 'repair', 'home depot', 'maintenance', 'tools', 'plumber'] },

  // Food and Beverages (Payment: Cash)
  { id: 'coffee', label: 'Coffee & Cafe', name: 'Starbucks Coffee', categoryId: 'food_beverages', categoryName: 'Food and Beverages', categoryEmoji: 'fastfood', paymentMethod: 'Cash', keywords: ['coffee', 'cafe', 'starbucks', 'espresso', 'latte', 'dunkin', 'tea'] },
  { id: 'fast_casual', label: 'Fast Casual Dining', name: 'Chipotle Mexican Grill', categoryId: 'food_beverages', categoryName: 'Food and Beverages', categoryEmoji: 'fastfood', paymentMethod: 'Cash', keywords: ['chipotle', 'burrito', 'bowl', 'tacos', 'mexican', 'lunch'] },
  { id: 'burgers', label: 'Burgers & Shakes', name: 'Shake Shack', categoryId: 'food_beverages', categoryName: 'Food and Beverages', categoryEmoji: 'fastfood', paymentMethod: 'Cash', keywords: ['shake shack', 'burger', 'fries', 'mcdonald', 'fast food'] },
  { id: 'groceries', label: 'Groceries', name: "Trader Joe's", categoryId: 'food_beverages', categoryName: 'Food and Beverages', categoryEmoji: 'fastfood', paymentMethod: 'Cash', keywords: ['trader joe', 'grocery', 'groceries', 'market', 'produce'] },
  { id: 'supermarket', label: 'Supermarket', name: 'Whole Foods Market', categoryId: 'food_beverages', categoryName: 'Food and Beverages', categoryEmoji: 'fastfood', paymentMethod: 'Cash', keywords: ['whole foods', 'supermarket', 'market', 'organic'] },
  { id: 'bodega', label: 'Bodega & Deli', name: 'NYC Bodega & Deli', categoryId: 'food_beverages', categoryName: 'Food and Beverages', categoryEmoji: 'fastfood', paymentMethod: 'Cash', keywords: ['bodega', 'deli', 'bagel', 'sandwich', 'breakfast', 'snack'] },
  { id: 'pizza', label: 'NYC Pizza', name: '2 Bros Pizza', categoryId: 'food_beverages', categoryName: 'Food and Beverages', categoryEmoji: 'fastfood', paymentMethod: 'Cash', keywords: ['pizza', 'slice', 'pie', 'italian', 'pizzeria'] },
  { id: 'restaurant', label: 'Dinner / Restaurant', name: 'Local Restaurant', categoryId: 'food_beverages', categoryName: 'Food and Beverages', categoryEmoji: 'fastfood', paymentMethod: 'Cash', keywords: ['restaurant', 'dinner', 'dining', 'takeout', 'doordash', 'uber eats'] },

  // Commute & Travel (Payment: Credit Card)
  { id: 'omny', label: 'Subway & Bus Fare', name: 'MTA / OMNY', categoryId: 'commute_travel', categoryName: 'Commute & Travel', categoryEmoji: '🚇', paymentMethod: 'Credit Card', keywords: ['mta', 'omny', 'subway', 'bus', 'train', 'metrocard', 'transit'] },
  { id: 'uber', label: 'Rideshare (Uber)', name: 'Uber', categoryId: 'commute_travel', categoryName: 'Commute & Travel', categoryEmoji: '🚇', paymentMethod: 'Credit Card', keywords: ['uber', 'rideshare', 'ride', 'car'] },
  { id: 'lyft', label: 'Rideshare (Lyft)', name: 'Lyft', categoryId: 'commute_travel', categoryName: 'Commute & Travel', categoryEmoji: '🚇', paymentMethod: 'Credit Card', keywords: ['lyft', 'rideshare', 'cab'] },
  { id: 'taxi', label: 'NYC Yellow Taxi', name: 'NYC Yellow Taxi', categoryId: 'commute_travel', categoryName: 'Commute & Travel', categoryEmoji: '🚇', paymentMethod: 'Credit Card', keywords: ['taxi', 'cab', 'yellow cab', 'curb'] },
  { id: 'rail', label: 'Commuter Rail', name: 'LIRR / Metro-North', categoryId: 'commute_travel', categoryName: 'Commute & Travel', categoryEmoji: '🚇', paymentMethod: 'Credit Card', keywords: ['lirr', 'metro north', 'amtrak', 'nj transit', 'train ticket'] },
  { id: 'parking', label: 'NYC Parking', name: 'NYC Parking Garage', categoryId: 'commute_travel', categoryName: 'Commute & Travel', categoryEmoji: '🚇', paymentMethod: 'Credit Card', keywords: ['parking', 'garage', 'meter', 'parkwhiz', 'spothero'] },
  { id: 'flight', label: 'Airport & Flight', name: 'JFK / Airport Travel', categoryId: 'commute_travel', categoryName: 'Commute & Travel', categoryEmoji: '🚇', paymentMethod: 'Credit Card', keywords: ['airport', 'jfk', 'lga', 'flight', 'airline', 'airtrain'] },

  // Shopping (Payment: Credit Card)
  { id: 'target_shop', label: 'Retail Store', name: 'Target', categoryId: 'shopping', categoryName: 'Shopping', categoryEmoji: '🛍️', paymentMethod: 'Credit Card', keywords: ['target', 'retail', 'essentials', 'department'] },
  { id: 'amazon', label: 'Online Shopping', name: 'Amazon', categoryId: 'shopping', categoryName: 'Shopping', categoryEmoji: '🛍️', paymentMethod: 'Credit Card', keywords: ['amazon', 'prime', 'online order', 'package'] },
  { id: 'uniqlo', label: 'Apparel & Clothing', name: 'Uniqlo NYC', categoryId: 'shopping', categoryName: 'Shopping', categoryEmoji: '🛍️', paymentMethod: 'Credit Card', keywords: ['uniqlo', 'clothing', 'clothes', 'shirt', 'pants', 'jacket'] },
  { id: 'zara', label: 'Fashion & Style', name: 'Zara', categoryId: 'shopping', categoryName: 'Shopping', categoryEmoji: '🛍️', paymentMethod: 'Credit Card', keywords: ['zara', 'fashion', 'shoes', 'dress', 'apparel'] },
  { id: 'apple', label: 'Electronics & Tech', name: 'Apple Store NYC', categoryId: 'shopping', categoryName: 'Shopping', categoryEmoji: '🛍️', paymentMethod: 'Credit Card', keywords: ['apple', 'best buy', 'electronics', 'gadgets', 'tech'] },

  // Income & Financial (Type: income)
  { id: 'salary', label: 'Payroll Salary', name: 'Direct Deposit Payroll', categoryId: 'income_financial', categoryName: 'Income & Financial', categoryEmoji: '💰', paymentMethod: 'Checking Account', transactionType: 'income', keywords: ['salary', 'paycheck', 'payroll', 'wage', 'direct deposit', 'earnings'] },
  { id: 'freelance', label: 'Freelance Income', name: 'Freelance Client Payment', categoryId: 'income_financial', categoryName: 'Income & Financial', categoryEmoji: '💰', paymentMethod: 'Checking Account', transactionType: 'income', keywords: ['freelance', 'contract', 'client payment', 'consulting'] },
  { id: 'dividend', label: 'Dividends & Yield', name: 'Investment Dividend / Interest', categoryId: 'income_financial', categoryName: 'Income & Financial', categoryEmoji: '💰', paymentMethod: 'Checking Account', transactionType: 'income', keywords: ['dividend', 'interest', 'investment', 'yield', 'stock'] },
  { id: 'bonus', label: 'Annual Bonus', name: 'Performance Bonus', categoryId: 'income_financial', categoryName: 'Income & Financial', categoryEmoji: '💰', paymentMethod: 'Checking Account', transactionType: 'income', keywords: ['bonus', 'commission', 'incentive'] },
  { id: 'refund', label: 'Tax / Return Refund', name: 'Refund Deposit', categoryId: 'income_financial', categoryName: 'Income & Financial', categoryEmoji: '💰', paymentMethod: 'Checking Account', transactionType: 'income', keywords: ['refund', 'return deposit', 'tax refund', 'reimbursement'] },

  // Health & Personal Care (Payment: Debit Card)
  { id: 'duane_reade', label: 'Pharmacy & Drugs', name: 'Duane Reade / Walgreens', categoryId: 'health_personal_care', categoryName: 'Health & Personal Care', categoryEmoji: '💊', paymentMethod: 'Debit Card', keywords: ['duane reade', 'walgreens', 'pharmacy', 'prescription', 'medicine'] },
  { id: 'cvs', label: 'CVS Pharmacy', name: 'CVS Pharmacy', categoryId: 'health_personal_care', categoryName: 'Health & Personal Care', categoryEmoji: '💊', paymentMethod: 'Debit Card', keywords: ['cvs', 'medicine', 'vitamins', 'pills'] },
  { id: 'urgent_care', label: 'Urgent Care / Clinic', name: 'CityMD Urgent Care', categoryId: 'health_personal_care', categoryName: 'Health & Personal Care', categoryEmoji: '💊', paymentMethod: 'Credit Card', keywords: ['citymd', 'urgent care', 'clinic', 'doctor', 'copay'] },
  { id: 'dental', label: 'Dental Care', name: 'Dental Care Clinic', categoryId: 'health_personal_care', categoryName: 'Health & Personal Care', categoryEmoji: '💊', paymentMethod: 'Debit Card', keywords: ['dental', 'dentist', 'teeth cleaning'] },

  // Lifestyle & Entertainment (Payment: Credit Card)
  { id: 'cinema', label: 'Movie Theater', name: 'AMC Theatres', categoryId: 'lifestyle_entertainment', categoryName: 'Lifestyle & Entertainment', categoryEmoji: '🎬', paymentMethod: 'Credit Card', keywords: ['amc', 'regal', 'cinema', 'movie', 'film'] },
  { id: 'streaming', label: 'Digital Streaming', name: 'Netflix / Spotify', categoryId: 'lifestyle_entertainment', categoryName: 'Lifestyle & Entertainment', categoryEmoji: '🎬', paymentMethod: 'Credit Card', keywords: ['netflix', 'spotify', 'hulu', 'subscription', 'streaming'] },
  { id: 'broadway', label: 'Broadway Theatre', name: 'Broadway Show Tickets', categoryId: 'lifestyle_entertainment', categoryName: 'Lifestyle & Entertainment', categoryEmoji: '🎬', paymentMethod: 'Credit Card', keywords: ['broadway', 'theatre', 'musical', 'play', 'ticket'] },
  { id: 'museum', label: 'Museum / Exhibition', name: 'The Met Museum', categoryId: 'lifestyle_entertainment', categoryName: 'Lifestyle & Entertainment', categoryEmoji: '🎬', paymentMethod: 'Credit Card', keywords: ['met', 'museum', 'moma', 'gallery', 'exhibit'] },

  // Pets (Payment: Credit Card)
  { id: 'petco', label: 'Pet Store', name: 'Petco NYC', categoryId: 'pets', categoryName: 'Pets', categoryEmoji: '🐱', paymentMethod: 'Credit Card', keywords: ['petco', 'petsmart', 'pet food', 'cat food', 'dog food', 'pet supply'] },
  { id: 'vet', label: 'Veterinary Clinic', name: 'NYC Vet Care Hospital', categoryId: 'pets', categoryName: 'Pets', categoryEmoji: '🐱', paymentMethod: 'Credit Card', keywords: ['vet', 'veterinary', 'animal hospital', 'cat care'] },

  // Make Up (Payment: Credit Card)
  { id: 'sephora', label: 'Cosmetics & Beauty', name: 'Sephora', categoryId: 'make_up', categoryName: 'Make Up', categoryEmoji: '💄', paymentMethod: 'Credit Card', keywords: ['sephora', 'makeup', 'cosmetics', 'lipstick', 'skincare', 'perfume'] },
  { id: 'ulta', label: 'Beauty Supply', name: 'Ulta Beauty', categoryId: 'make_up', categoryName: 'Make Up', categoryEmoji: '💄', paymentMethod: 'Credit Card', keywords: ['ulta', 'beauty', 'hair care', 'lotion'] },
];

export function detectCategoryFromMerchant(text: string): {
  catId: string;
  catName: string;
  payment?: PaymentMethod;
  type?: TransactionType;
} | null {
  const query = text.trim().toLowerCase();
  if (!query || query.length < 2) return null;

  // 1. Check Housing & Living (Payment: Debit Card)
  const housingKeywords = [
    'gas', 'cooking gas', 'electric', 'electricity', 'con ed', 'coned', 'power bill',
    'internet', 'wifi', 'spectrum', 'verizon', 'fios', 'optimum', 'broadband',
    'furniture', 'ikea', 'sofa', 'desk', 'chair', 'bed', 'mattress', 'couch',
    'kitchenware', 'cookware', 'pots', 'pans', 'dishes', 'utensils', 'plates', 'cutlery',
    'rent', 'landlord', 'lease', 'apartment rent', 'water bill', 'water board',
    'home depot', 'hardware', 'maintenance', 'repair', 'plumber'
  ];
  if (housingKeywords.some((kw) => query.includes(kw))) {
    return { catId: 'housing_living', catName: 'Housing & Living', payment: 'Debit Card' };
  }

  // 2. Check Commute & Travel (Payment: Credit Card, Merchant: MTA/OMNY)
  const commuteKeywords = [
    'mta', 'omny', 'subway', 'metrocard', 'bus fare', 'train', 'transit',
    'uber', 'lyft', 'taxi', 'yellow cab', 'curb', 'rideshare',
    'lirr', 'metro-north', 'metro north', 'amtrak', 'nj transit', 'airtrain',
    'jfk', 'lga', 'ewr', 'flight', 'airline', 'parking', 'garage', 'commute'
  ];
  if (commuteKeywords.some((kw) => query.includes(kw))) {
    return { catId: 'commute_travel', catName: 'Commute & Travel', payment: 'Credit Card' };
  }

  // 3. Check Food and Beverages (Payment: Cash)
  const foodKeywords = [
    'starbucks', 'coffee', 'cafe', 'dunkin', 'espresso', 'latte', 'tea',
    'chipotle', 'shake shack', 'mcdonald', 'burger', 'pizza', 'tacos', 'burrito',
    'restaurant', 'dining', 'lunch', 'dinner', 'breakfast', 'brunch', 'food',
    'trader joe', 'whole foods', 'grocery', 'groceries', 'supermarket', 'market',
    'bodega', 'deli', 'bagel', 'bakery', 'doordash', 'uber eats', 'grubhub'
  ];
  if (foodKeywords.some((kw) => query.includes(kw))) {
    return { catId: 'food_beverages', catName: 'Food and Beverages', payment: 'Cash' };
  }

  // 4. Check Income & Financial (Type: income)
  const incomeKeywords = [
    'salary', 'paycheck', 'payroll', 'direct deposit', 'wage', 'wages',
    'dividend', 'interest income', 'stock return', 'bonus', 'commission',
    'freelance', 'client payment', 'tax refund', 'refund deposit'
  ];
  if (incomeKeywords.some((kw) => query.includes(kw))) {
    return {
      catId: 'income_financial',
      catName: 'Income & Financial',
      payment: 'Checking Account',
      type: 'income',
    };
  }

  // 5. Check Make Up (Payment: Credit Card)
  const makeupKeywords = ['sephora', 'ulta', 'makeup', 'cosmetics', 'lipstick', 'skincare', 'perfume'];
  if (makeupKeywords.some((kw) => query.includes(kw))) {
    return { catId: 'make_up', catName: 'Make Up', payment: 'Credit Card' };
  }

  // 6. Check Pets (Payment: Credit Card)
  const petKeywords = ['petco', 'petsmart', 'chewy', 'vet', 'veterinary', 'pet food', 'cat food', 'dog food'];
  if (petKeywords.some((kw) => query.includes(kw))) {
    return { catId: 'pets', catName: 'Pets', payment: 'Credit Card' };
  }

  // 7. Check Health & Personal Care (Payment: Debit Card)
  const healthKeywords = [
    'cvs', 'walgreens', 'duane reade', 'pharmacy', 'prescription', 'medicine',
    'doctor', 'clinic', 'urgent care', 'citymd', 'hospital', 'dentist',
    'dental', 'optometry', 'glasses', 'copay'
  ];
  if (healthKeywords.some((kw) => query.includes(kw))) {
    return { catId: 'health_personal_care', catName: 'Health & Personal Care', payment: 'Debit Card' };
  }

  // 8. Check Lifestyle & Entertainment (Payment: Credit Card)
  const entertainmentKeywords = [
    'amc', 'regal', 'cinema', 'movie', 'film', 'broadway', 'theatre',
    'netflix', 'spotify', 'hulu', 'disney+', 'concert', 'ticket', 'museum', 'moma', 'met'
  ];
  if (entertainmentKeywords.some((kw) => query.includes(kw))) {
    return { catId: 'lifestyle_entertainment', catName: 'Lifestyle & Entertainment', payment: 'Credit Card' };
  }

  // 9. Check Shopping (Payment: Credit Card)
  const shoppingKeywords = [
    'target', 'amazon', 'walmart', 'uniqlo', 'zara', 'h&m', 'clothing',
    'clothes', 'shoes', 'sneakers', 'apparel', 'apple store', 'best buy',
    'shopping', 'fashion', 'mall'
  ];
  if (shoppingKeywords.some((kw) => query.includes(kw))) {
    return { catId: 'shopping', catName: 'Shopping', payment: 'Credit Card' };
  }

  return null;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialTransaction?: Transaction | null;
  defaultDate?: string;
  onOpenCategoryManager?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction = null,
  defaultDate,
  onOpenCategoryManager,
}) => {
  const isEditing = !!initialTransaction;

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<CategoryId>('food_beverages');
  const [categoriesList, setCategoriesList] = useState<CategoryMeta[]>([]);
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const merchantRef = useRef<HTMLDivElement>(null);
  const [merchant, setMerchant] = useState<string>('');
  const [isMerchantFocused, setIsMerchantFocused] = useState<boolean>(false);
  const [date, setDate] = useState<string>(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [location, setLocation] = useState<string>('New York, NY');
  const [note, setNote] = useState<string>('');
  const [taxStr, setTaxStr] = useState<string>('');
  const [tipsStr, setTipsStr] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [isAIVisionOpen, setIsAIVisionOpen] = useState(false);
  const [autoFilledBadge, setAutoFilledBadge] = useState<boolean>(false);

  // Lightbox / Image Viewer state
  const [isViewingFullImage, setIsViewingFullImage] = useState(false);

  useEffect(() => {
    const updateList = () => {
      setCategoriesList(getStoredCategories());
    };
    updateList();
    window.addEventListener('categories-updated', updateList);
    return () => window.removeEventListener('categories-updated', updateList);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (merchantRef.current && !merchantRef.current.contains(e.target as Node)) {
        setIsMerchantFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with initialTransaction when opened
  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmountStr(initialTransaction.amount.toString());
      const initCat = initialTransaction.category || 'food_beverages';
      setCategory(initCat);
      setCategorySearch(getCategoryMeta(initCat).name);
      setMerchant(initialTransaction.merchant);
      setDate(initialTransaction.date);
      setPaymentMethod(initialTransaction.paymentMethod || 'Credit Card');
      setLocation(initialTransaction.location || 'New York, NY');
      setNote(initialTransaction.note || '');
      setTaxStr(initialTransaction.tax ? initialTransaction.tax.toString() : '');
      setTipsStr(initialTransaction.tips ? initialTransaction.tips.toString() : '');
      setLineItems(parseDetectedItems(initialTransaction.detectedItems));
      setReceiptImage(initialTransaction.receiptImage);
    } else {
      setType('expense');
      setAmountStr('');
      setCategory('food_beverages');
      setCategorySearch(getCategoryMeta('food_beverages').name);
      setMerchant('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setPaymentMethod('Cash');
      setLocation('New York, NY');
      setNote('');
      setTaxStr('');
      setTipsStr('');
      setLineItems([]);
      setReceiptImage(undefined);
    }
    setIsViewingFullImage(false);
    setIsDropdownOpen(false);
    setIsMerchantFocused(false);
  }, [initialTransaction, isOpen, defaultDate]);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categoriesList;
    return categoriesList.filter((c) => {
      return (
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.emoji.includes(query)
      );
    });
  }, [categoriesList, categorySearch]);

  const hasExactMatch = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    return categoriesList.some(
      (c) => c.name.toLowerCase() === query || c.id.toLowerCase() === query
    );
  }, [categoriesList, categorySearch]);

  const currentCategoryMeta = useMemo(() => {
    return getCategoryMeta(category);
  }, [category, categoriesList]);

  // Line Items Handlers (Item 1, Item 2...)
  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random()}`, name: '', price: '' },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'name' | 'price', value: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const itemsSubtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const val = parseFloat(item.price);
      return !isNaN(val) && val > 0 ? sum + val : sum;
    }, 0);
  }, [lineItems]);

  const [autoDetectedBadge, setAutoDetectedBadge] = useState<string | null>(null);

  const categoryPrompts = useMemo(() => {
    const c = category.toLowerCase();
    const cName = (currentCategoryMeta?.name || '').toLowerCase();
    return MERCHANT_PROMPTS.filter((p) => {
      const pCat = p.categoryId.toLowerCase();
      const pName = p.categoryName.toLowerCase();
      return (
        pCat === c ||
        pName === cName ||
        (c.includes('housing') && pCat.includes('housing')) ||
        (c.includes('food') && pCat.includes('food')) ||
        (c.includes('commute') && pCat.includes('commute')) ||
        (c.includes('shop') && pCat.includes('shop')) ||
        (c.includes('income') && pCat.includes('income')) ||
        (c.includes('health') && pCat.includes('health')) ||
        (c.includes('entertain') && pCat.includes('entertain')) ||
        (c.includes('pet') && pCat.includes('pet')) ||
        (c.includes('make_up') && pCat.includes('make_up'))
      );
    });
  }, [category, currentCategoryMeta]);

  const filteredMerchantPrompts = useMemo(() => {
    const query = merchant.trim().toLowerCase();
    if (!query) {
      return categoryPrompts.length > 0 ? categoryPrompts : MERCHANT_PROMPTS.slice(0, 10);
    }
    return MERCHANT_PROMPTS.filter((p) => {
      return (
        p.label.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query) ||
        p.keywords.some(
          (kw) =>
            kw.toLowerCase().includes(query) || query.includes(kw.toLowerCase())
        )
      );
    });
  }, [categoryPrompts, merchant]);

  const handleMerchantChange = (value: string) => {
    setMerchant(value);
    setIsMerchantFocused(true);

    // Auto-detect Category following user's typing
    const detected = detectCategoryFromMerchant(value);
    if (detected) {
      setCategory(detected.catId);
      setCategorySearch(detected.catName);
      if (detected.payment) {
        setPaymentMethod(detected.payment);
      }
      if (detected.type) {
        setType(detected.type);
      }
      setAutoDetectedBadge(detected.catName);
    } else {
      setAutoDetectedBadge(null);
    }
  };

  const handleSelectPrompt = (prompt: MerchantPrompt) => {
    setMerchant(prompt.name);
    setCategory(prompt.categoryId);
    setCategorySearch(prompt.categoryName);
    if (prompt.paymentMethod) {
      setPaymentMethod(prompt.paymentMethod);
    }
    if (prompt.transactionType) {
      setType(prompt.transactionType);
    }
    setAutoDetectedBadge(prompt.categoryName);
    setIsMerchantFocused(false);
  };

  const handleSelectCategory = (catId: string, catName: string) => {
    setCategory(catId);
    setCategorySearch(catName);
    setIsDropdownOpen(false);

    const lowerId = catId.toLowerCase();
    const lowerName = catName.toLowerCase();

    // 1. User choose Income & Financial auto becomes income
    if (
      lowerId === 'income_financial' ||
      lowerId.includes('income') ||
      lowerName.includes('income')
    ) {
      setType('income');
      setPaymentMethod('Checking Account');
    }

    // 2. Food & Beverages auto: cash
    if (
      lowerId === 'food_beverages' ||
      lowerId.includes('food') ||
      lowerName.includes('food') ||
      lowerName.includes('beverage')
    ) {
      setPaymentMethod('Cash');
    }

    // 3. Commute & Travel's Merchant/Payee set MTA/OMNY and Payment set Credit Card
    if (
      lowerId === 'commute_travel' ||
      lowerId.includes('commute') ||
      lowerId.includes('travel') ||
      lowerName.includes('commute') ||
      lowerName.includes('travel')
    ) {
      setPaymentMethod('Credit Card');
      setMerchant('MTA/OMNY');
    }

    // 4. Housing & Living's Payment set Debit Card and activate prompt suggestions
    if (
      lowerId === 'housing_living' ||
      lowerId.includes('housing') ||
      lowerId.includes('living') ||
      lowerName.includes('housing') ||
      lowerName.includes('living')
    ) {
      setPaymentMethod('Debit Card');
      setIsMerchantFocused(true);
    }
  };

  const handleApplyItemsSubtotalToAmount = () => {
    if (itemsSubtotal > 0) {
      setAmountStr(itemsSubtotal.toFixed(2));
    }
  };

  const handleAutoCountTax = (rate = 0.08875) => {
    const base = parseFloat(amountStr) || itemsSubtotal;
    if (!isNaN(base) && base > 0) {
      const calc = Math.round(base * rate * 100) / 100;
      setTaxStr(calc.toFixed(2));
    }
  };

  const handleQuickTip = (pct: number) => {
    const base = parseFloat(amountStr) || itemsSubtotal;
    if (!isNaN(base) && base > 0) {
      const calc = Math.round(base * pct * 100) / 100;
      setTipsStr(calc.toFixed(2));
    }
  };

  const handleApplyTaxAndTipToTotal = () => {
    const base = parseFloat(amountStr) || 0;
    const tax = parseFloat(taxStr) || 0;
    const tip = parseFloat(tipsStr) || 0;
    const total = Math.round((base + tax + tip) * 100) / 100;
    setAmountStr(total.toFixed(2));
  };

  if (!isOpen) return null;

  const handleApplyAIResult = (result: AIScanResult, previewImg?: string) => {
    setType(result.type);
    setAmountStr(result.amount.toFixed(2));
    setCategory(result.category);
    setCategorySearch(getCategoryMeta(result.category).name);
    setMerchant(result.merchant);
    setDate(result.date);
    setPaymentMethod(result.paymentMethod);
    setNote(result.note);
    setLineItems(parseDetectedItems(result.items));
    setReceiptImage(previewImg);
    setAutoFilledBadge(true);

    setTimeout(() => {
      setAutoFilledBadge(false);
    }, 4000);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers onChange
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    const catInfo = CATEGORIES[category] || CATEGORIES.miscellaneous;

    const parsedTax = parseFloat(taxStr);
    const validTax = !isNaN(parsedTax) && parsedTax > 0 ? Math.round(parsedTax * 100) / 100 : undefined;

    const parsedTips = parseFloat(tipsStr);
    const validTips = !isNaN(parsedTips) && parsedTips > 0 ? Math.round(parsedTips * 100) / 100 : undefined;

    const serializedItems = lineItems
      .filter((item) => item.name.trim() || item.price.trim())
      .map((item) => {
        const name = item.name.trim() || 'Item';
        const priceNum = parseFloat(item.price);
        if (!isNaN(priceNum) && item.price.trim()) {
          return `${name} ($${priceNum.toFixed(2)})`;
        }
        return name;
      });

    if (validTax) {
      serializedItems.push(`Sales Tax: $${validTax.toFixed(2)}`);
    }
    if (validTips) {
      serializedItems.push(`Gratuity / Tip: $${validTips.toFixed(2)}`);
    }

    onSave(
      {
        type,
        amount: Math.round(amountNum * 100) / 100,
        category,
        categoryName: catInfo.name,
        merchant: merchant.trim() || (type === 'income' ? 'Paycheck/Deposit' : 'Local Merchant'),
        date,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        paymentMethod,
        location: location.trim() || 'New York, NY',
        note: note.trim() || undefined,
        tax: validTax,
        tips: validTips,
        receiptImage,
        scannedByAI: serializedItems.length > 0 || !!receiptImage,
        detectedItems: serializedItems.length > 0 ? serializedItems : undefined,
      },
      initialTransaction?.id
    );

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-[#FDFBF5] rounded-3xl border-3 border-[#1E293B] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-amber-50/50">
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-black text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {isEditing ? 'Edit Transaction' : 'Add Transaction'}
              </span>
              {isEditing && (
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-300">
                  Editing
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsAIVisionOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-[#FCCE4C] hover:bg-[#ebd05a] text-[#1E293B] font-extrabold text-xs border-2 border-[#1E293B] flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1E293B]" />
                  AI Vision
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border-2 border-[#1E293B]/20 shadow-xs"
              >
                <X className="w-4 h-4 text-[#1E293B]" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* AI Auto-fill notification banner */}
            {autoFilledBadge && (
              <div className="p-3 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2 animate-bounce">
                <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>AI Vision has recognized receipt & amount, fields filled automatically!</span>
              </div>
            )}

            {/* Expense vs Income Toggle */}
            <div className="grid grid-cols-2 p-1 bg-stone-200/70 rounded-2xl border border-stone-300">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  if (category === 'income_financial') {
                    setCategory('food_beverages');
                    setCategorySearch(getCategoryMeta('food_beverages').name);
                  }
                }}
                className={`py-2 text-xs font-black rounded-xl transition-all ${
                  type === 'expense'
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('income_financial');
                  setCategorySearch(getCategoryMeta('income_financial').name);
                }}
                className={`py-2 text-xs font-black rounded-xl transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount input */}
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-500 uppercase tracking-wider">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-stone-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-stone-200 rounded-2xl text-2xl font-black text-[#1E293B] focus:border-[#FCCE4C] outline-hidden transition-colors"
                  style={{ fontFamily: 'Fredoka, monospace' }}
                />
              </div>
            </div>

            {/* Sales Tax & Tips Box (Auto count tax or user can type by themselves) */}
            {type === 'expense' && (
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border-2 border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-700" />
                    Sales Tax & Tips (Optional)
                  </span>
                  <span className="text-[10px] text-stone-500 font-semibold">
                    Type manually or auto count
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Sales Tax Input with Auto-count Button */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-stone-600">
                        Sales Tax ($)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAutoCountTax(0.08875)}
                        className="text-[10px] font-black text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-2 py-0.5 rounded-lg border border-amber-400 flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Auto count standard NYC 8.875% tax"
                      >
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>Auto NYC 8.875%</span>
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Type tax (e.g. 2.15)"
                        value={taxStr}
                        onChange={(e) => setTaxStr(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-white border-2 border-stone-200 rounded-xl text-xs font-bold text-[#1E293B] focus:border-amber-400 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Tips Input with Quick Percentages */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-stone-600">
                        Tips / Gratuity ($)
                      </label>
                      <div className="flex items-center gap-1">
                        {[0.15, 0.18, 0.20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleQuickTip(pct)}
                            className="text-[10px] font-bold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 px-1.5 py-0.5 rounded-md border border-stone-200 active:scale-95 transition-colors cursor-pointer"
                          >
                            {(pct * 100).toFixed(0)}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Type tips (e.g. 3.00)"
                        value={tipsStr}
                        onChange={(e) => setTipsStr(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-white border-2 border-stone-200 rounded-xl text-xs font-bold text-[#1E293B] focus:border-amber-400 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Subtotal + Tax + Tip Summary & One-Click Apply */}
                {(parseFloat(taxStr) > 0 || parseFloat(tipsStr) > 0) && (
                  <div className="flex items-center justify-between pt-2 border-t border-amber-200 text-xs">
                    <span className="text-stone-600 font-bold">
                      Subtotal + Tax + Tip:{' '}
                      <span className="text-[#1E293B] font-black">
                        ${((parseFloat(amountStr) || 0) + (parseFloat(taxStr) || 0) + (parseFloat(tipsStr) || 0)).toFixed(2)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyTaxAndTipToTotal}
                      className="text-[11px] font-black text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg border border-amber-400 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      Update Total Amount
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Category Dropdown & Combobox */}
            <div className="space-y-1.5" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-stone-400" />
                  <span>Category</span>
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Manage Categories</span>
                  </button>
                )}
              </div>

              {/* Combobox Input Box */}
              <div className="relative">
                <div
                  className={`w-full flex items-center bg-white border-2 rounded-2xl p-1.5 sm:p-2 transition-all ${
                    isDropdownOpen
                      ? 'border-[#1E293B] ring-2 ring-amber-300/70 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Current Selected Emoji or Custom Icon Badge */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border mr-2 shadow-2xs overflow-hidden"
                    style={{
                      backgroundColor: `${currentCategoryMeta.color}20`,
                      borderColor: currentCategoryMeta.color,
                    }}
                  >
                    <CategoryIcon
                      emoji={currentCategoryMeta.emoji}
                      iconUrl={currentCategoryMeta.iconUrl}
                      size={20}
                      color={currentCategoryMeta.color}
                    />
                  </div>

                  {/* Searchable / Typable input */}
                  <input
                    type="text"
                    value={categorySearch}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredCategories.length > 0) {
                          handleSelectCategory(filteredCategories[0].id, filteredCategories[0].name);
                        } else if (categorySearch.trim()) {
                          handleSelectCategory(categorySearch.trim(), categorySearch.trim());
                        }
                      } else if (e.key === 'Escape') {
                        setIsDropdownOpen(false);
                      }
                    }}
                    placeholder="Type or select category (auto-filters or type custom name)"
                    className="flex-1 bg-transparent text-xs sm:text-sm font-black text-[#1E293B] outline-hidden placeholder:text-stone-400 placeholder:font-normal"
                  />

                  {/* Clear & Dropdown icons */}
                  <div className="flex items-center gap-1 pr-1">
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategorySearch('');
                          setIsDropdownOpen(true);
                        }}
                        className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="p-1 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-[#1E293B] rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    {/* Custom Category Quick Action if user typed something new */}
                    {categorySearch.trim().length > 0 && !hasExactMatch && (
                      <button
                        type="button"
                        onClick={() => {
                          const customName = categorySearch.trim();
                          handleSelectCategory(customName, customName);
                        }}
                        className="w-full p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-left text-xs font-black flex items-center justify-between transition-colors mb-1"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base flex-shrink-0">✨</span>
                          <span className="truncate">Use custom category: "{categorySearch.trim()}"</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold flex-shrink-0">
                          + Custom
                        </span>
                      </button>
                    )}

                    {/* Filtered items */}
                    {filteredCategories.length === 0 ? (
                      <div className="py-4 text-center text-xs text-stone-400 font-bold">
                        No preset category matched, click above to use custom category
                      </div>
                    ) : (
                      filteredCategories.map((c) => {
                        const isSelected = category === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCategory(c.id, c.name)}
                            className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all ${
                              isSelected
                                ? 'bg-amber-100/80 border border-amber-300 font-black shadow-2xs'
                                : 'hover:bg-stone-100 border border-transparent font-bold text-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CategoryIcon
                                emoji={c.emoji}
                                iconUrl={c.iconUrl}
                                size={18}
                                color={c.color}
                              />
                              <span className="text-xs truncate">{c.name}</span>
                              {c.isCustom && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: c.color }}
                              />
                              {isSelected && <Check className="w-4 h-4 text-[#1E293B]" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Merchant Name */}
            <div className="space-y-1 relative" ref={merchantRef}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-stone-400" />
                  Merchant / Payee
                </label>
                {autoDetectedBadge ? (
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 animate-in fade-in">
                    ✨ Category: {autoDetectedBadge}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                    💡 Smart Prompts Enabled
                  </span>
                )}
              </div>

              {/* Prompt chips for current Category */}
              {categoryPrompts.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                    <CategoryIcon emoji={currentCategoryMeta?.emoji || 'fastfood'} iconUrl={currentCategoryMeta?.iconUrl} size={13} color={currentCategoryMeta?.color} />
                    <span>Prompts:</span>
                  </span>
                  {categoryPrompts.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPrompt(item)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-stone-900 font-bold border border-stone-200 hover:border-amber-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Type merchant (e.g. Gas, Electricity, Subway, Starbucks, Rent...)"
                value={merchant}
                onFocus={() => setIsMerchantFocused(true)}
                onChange={(e) => handleMerchantChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-200 rounded-2xl text-xs font-bold text-[#1E293B] focus:border-[#FCCE4C] outline-hidden"
              />

              {/* Dynamic Suggestions based on user typing or current category */}
              {isMerchantFocused && filteredMerchantPrompts.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-2xl border-2 border-stone-300 shadow-xl p-2 max-h-52 overflow-y-auto space-y-1">
                  <div className="flex items-center justify-between px-1.5 py-0.5 text-[10px] font-bold text-stone-600 border-b border-stone-100">
                    <span className="flex items-center gap-1">
                      <span>💡 Suggested Prompts</span>
                      {merchant.trim() ? (
                        <span className="text-amber-800 font-black">(Matching "{merchant.trim()}")</span>
                      ) : (
                        <span className="text-stone-500 font-normal">({currentCategoryMeta?.name})</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMerchantFocused(false)}
                      className="text-stone-400 hover:text-stone-700 text-[10px] cursor-pointer"
                    >
                      ✕ Close
                    </button>
                  </div>
                  {filteredMerchantPrompts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPrompt(p)}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CategoryIcon emoji={p.categoryEmoji} size={18} className="flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-black text-stone-900 block truncate">{p.label}</span>
                          <span className="text-[11px] text-stone-500 font-medium block truncate">{p.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">
                          {p.categoryName}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          Select
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date & Payment Method (Two columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border-2 border-stone-200 rounded-2xl text-xs font-bold text-[#1E293B] focus:border-[#FCCE4C] outline-hidden"
                />
              </div>

              {/* Payment Method - Complete 21 user options */}
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                  Payment
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2.5 bg-white border-2 border-stone-200 rounded-2xl text-xs font-bold text-[#1E293B] focus:border-[#FCCE4C] outline-hidden truncate"
                >
                  {PAYMENT_METHODS_LIST.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                Location
              </label>
              <input
                type="text"
                placeholder="New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-200 rounded-2xl text-xs font-bold text-[#1E293B] focus:border-[#FCCE4C] outline-hidden"
              />
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-200 rounded-2xl text-xs font-bold text-[#1E293B] focus:border-[#FCCE4C] outline-hidden"
              />
            </div>

            {/* Items Breakdown (Item 1, Item 2, etc.) */}
            <div className="space-y-2 p-3.5 bg-amber-50/70 rounded-2xl border-2 border-stone-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-700" />
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider">
                    Line Items
                  </label>
                  {lineItems.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      {lineItems.length} items
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {itemsSubtotal > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyItemsSubtotalToAmount}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-200/80 hover:bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 transition-colors flex items-center gap-1"
                      title="Apply items sum to amount"
                    >
                      <span>Apply sum: ${itemsSubtotal.toFixed(2)}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-xs border border-amber-400 flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              {lineItems.length === 0 ? (
                <div className="p-3 text-center bg-white/70 rounded-xl border border-dashed border-stone-300 space-y-1">
                  <p className="text-xs font-bold text-stone-500">
                    No individual line items added (Optional Item 1, Item 2...)
                  </p>
                  <p className="text-[10px] text-stone-400">
                    Track individual item expenses (e.g. Latte $5.50, Croissant $3.80)
                  </p>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-1 px-3 py-1 rounded-lg bg-white hover:bg-stone-50 text-stone-700 font-black text-xs border border-stone-300 shadow-2xs inline-flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3 text-amber-600" />
                    <span>+ Add Item 1</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {lineItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-stone-200 shadow-2xs group"
                    >
                      {/* Item Index Badge */}
                      <span
                        className="text-[11px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ fontFamily: 'Fredoka, sans-serif' }}
                      >
                        Item {idx + 1}
                      </span>

                      {/* Item Name Input */}
                      <input
                        type="text"
                        placeholder="Item name (e.g. Americano, Bagel)"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1 text-xs font-bold bg-stone-50 border border-stone-200 rounded-lg focus:border-amber-400 focus:bg-white outline-hidden"
                      />

                      {/* Item Price Input */}
                      <div className="relative w-20 flex-shrink-0">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-stone-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                          className="w-full pl-5 pr-1.5 py-1 text-xs font-bold bg-stone-50 border border-stone-200 rounded-lg focus:border-amber-400 focus:bg-white outline-hidden text-right"
                          style={{ fontFamily: 'Fredoka, monospace' }}
                        />
                      </div>

                      {/* Delete Item Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors flex-shrink-0"
                        title={`Delete Item ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add next item button at bottom */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-black text-amber-800 hover:text-amber-950 flex items-center gap-1 py-0.5 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Item {lineItems.length + 1}</span>
                    </button>

                    {itemsSubtotal > 0 && (
                      <span className="text-[11px] font-black text-stone-600">
                        Items Subtotal: <span className="text-amber-900">${itemsSubtotal.toFixed(2)}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Image Management: Click to view, Delete, Replace/Upload */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-stone-400" />
                  Receipt / Image
                </label>
                {receiptImage && (
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Receipt Attached (Click to expand)
                  </span>
                )}
              </div>

              {receiptImage ? (
                <div className="p-3 bg-white rounded-2xl border-2 border-stone-200 flex items-center justify-between gap-3 shadow-xs">
                  {/* Clickable thumbnail to view full image with red (X) delete badge */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsViewingFullImage(true)}
                      className="relative group w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#1E293B] shadow-xs cursor-pointer block"
                      title="Click to view image"
                    >
                      <img
                        src={receiptImage}
                        alt="Receipt"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="w-5 h-5" />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptImage(undefined);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md border-2 border-white transition-all active:scale-90"
                      title="Delete image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action buttons: View, Replace, Delete */}
                  <div className="flex-1 space-y-1.5">
                    <div className="text-xs font-bold text-[#1E293B]">
                      Receipt Image Uploaded
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Full */}
                      <button
                        type="button"
                        onClick={() => setIsViewingFullImage(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-300 flex items-center gap-1 active:scale-95 transition-all"
                        title="View Full Image"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-stone-600" />
                        <span>View</span>
                      </button>

                      {/* Replace file input */}
                      <label className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1 cursor-pointer active:scale-95 transition-all">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Replace</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileChange}
                        />
                      </label>

                      {/* Delete image */}
                      <button
                        type="button"
                        onClick={() => setReceiptImage(undefined)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1 active:scale-95 transition-all"
                        title="Delete receipt image"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="w-full p-4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#1E293B] bg-white flex items-center justify-center gap-2 cursor-pointer transition-colors group">
                  <Camera className="w-5 h-5 text-stone-400 group-hover:text-[#1E293B] transition-colors" />
                  <span className="text-xs font-bold text-stone-600 group-hover:text-[#1E293B]">
                    Click to upload or take receipt photo (Upload or Snap Receipt)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#FCCE4C] hover:bg-[#ebd05a] border-2 border-[#1E293B] text-[#1E293B] font-black text-base shadow-[0_4px_0_#1E293B] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 mt-3"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              <Check className="w-5 h-5" />
              <span>{isEditing ? 'Save Changes' : 'Save Transaction'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Lightbox / Full Image Viewer Modal */}
      {isViewingFullImage && receiptImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-2xl max-h-[90vh] bg-stone-950 p-2 rounded-3xl border-3 border-stone-700 shadow-2xl flex flex-col items-center">
            {/* Top Close Button */}
            <button
              onClick={() => setIsViewingFullImage(false)}
              className="absolute -top-3.5 -right-3.5 w-9 h-9 rounded-full bg-white text-stone-900 flex items-center justify-center border-2 border-[#1E293B] shadow-lg active:scale-95 transition-all z-10"
              title="Close image view"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={receiptImage}
              alt="Receipt Preview Full"
              className="max-h-[82vh] max-w-full rounded-2xl object-contain"
            />

            <div className="w-full flex items-center justify-between pt-2 px-2 text-white/80 text-xs">
              <span className="font-bold">Receipt Preview</span>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleImageFileChange(e);
                      setIsViewingFullImage(false);
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    setReceiptImage(undefined);
                    setIsViewingFullImage(false);
                  }}
                  className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Vision Scanner Modal */}
      <AIVisionModal
        isOpen={isAIVisionOpen}
        onClose={() => setIsAIVisionOpen(false)}
        onApplyResult={handleApplyAIResult}
      />
    </>
  );
};
