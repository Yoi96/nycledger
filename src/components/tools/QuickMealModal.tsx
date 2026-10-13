import React, { useState, useEffect } from 'react';
import {
  X,
  UtensilsCrossed,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Check,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Tag,
} from 'lucide-react';
import { LocalDB } from '../../services/storage';
import { QuickMealItem, PaymentMethod } from '../../types';
import { FastfoodVector } from '../common/CategoryIcon';

interface QuickMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
}

const COMMON_EMOJIS = ['🍕', '🥙', '🥯', '🥟', '🥨', '🥪', '🥗', '🍜', '🍱', '🍔', '☕', '🧋', '🍰', '🌮'];
const COMMON_TAGS = ['Breakfast', 'Lunch', 'Brunch', 'Dinner', 'Snacks'];
const PAYMENT_OPTIONS: PaymentMethod[] = ['Cash', 'Apple Pay', 'Debit Card', 'Credit Card', 'WeChat Pay', 'Alipay', 'Other'];

export const QuickMealModal: React.FC<QuickMealModalProps> = ({
  isOpen,
  onClose,
  onLogged,
}) => {
  const [meals, setMeals] = useState<QuickMealItem[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍕');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [tag, setTag] = useState('Budget Saver');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  // Interactive feedback
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loggedMealId, setLoggedMealId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const loadMeals = () => {
    const list = LocalDB.getQuickMeals();
    setMeals(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadMeals();
      setIsEditorOpen(false);
      setEditingId(null);
      setConfirmDeleteId(null);
      setLoggedMealId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Open editor for creating a new meal
  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setEmoji('🥪');
    setPrice('');
    setLocation('New York, NY');
    setTag('Breakfast');
    setPaymentMethod('Cash');
    setFormError('');
    setIsEditorOpen(true);
  };

  // Open editor to edit an existing meal
  const handleOpenEdit = (meal: QuickMealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(meal.id);
    setName(meal.name);
    setEmoji(meal.emoji || '🍕');
    setPrice(meal.price.toString());
    setLocation(meal.location || '');
    setTag(meal.tag || 'Meal');
    setPaymentMethod(meal.paymentMethod || 'Cash');
    setFormError('');
    setIsEditorOpen(true);
  };

  // Save changes (Add or Update)
  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (!name.trim()) {
      setFormError('Please enter a meal name');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Please enter a valid price');
      return;
    }

    if (editingId) {
      // Update existing
      LocalDB.updateQuickMeal(editingId, {
        name: name.trim(),
        emoji: emoji || '🍕',
        price: parsedPrice,
        location: location.trim() || 'New York, NY',
        tag: tag.trim() || 'Meal',
        paymentMethod,
        items: [`1x ${name.trim()} ($${parsedPrice.toFixed(2)})`],
      });
    } else {
      // Add new
      LocalDB.addQuickMeal({
        name: name.trim(),
        emoji: emoji || '🍕',
        price: parsedPrice,
        location: location.trim() || 'New York, NY',
        tag: tag.trim() || 'Meal',
        paymentMethod,
        items: [`1x ${name.trim()} ($${parsedPrice.toFixed(2)})`],
      });
    }

    loadMeals();
    setIsEditorOpen(false);
    setEditingId(null);
  };

  // Reduce / Delete meal
  const handleDeleteMeal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      LocalDB.deleteQuickMeal(id);
      loadMeals();
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      // Auto reset confirm state after 3 seconds
      setTimeout(() => {
        setConfirmDeleteId((curr) => (curr === id ? null : curr));
      }, 3500);
    }
  };

  // Reset to default presets (safe in-app action without window.confirm)
  const handleResetDefaults = () => {
    const defs = LocalDB.resetQuickMeals();
    setMeals(defs);
    setConfirmDeleteId(null);
  };

  // One-click quick log into transactions
  const handleQuickLog = (meal: QuickMealItem) => {
    LocalDB.addTransaction({
      type: 'expense',
      amount: meal.price,
      category: 'food_beverages',
      categoryName: 'Food and Beverages',
      merchant: meal.name.replace(/\s*\(.*?\)\s*/g, '').trim(),
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: meal.paymentMethod || 'Cash',
      location: meal.location || 'New York, NY',
      note: `Quick Meal logged: ${meal.name}`,
      scannedByAI: true,
      detectedItems: meal.items || [`${meal.name} ($${meal.price.toFixed(2)})`],
    });

    setLoggedMealId(meal.id);
    onLogged();

    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF5] w-full h-full overflow-hidden animate-in fade-in duration-200">
      <div className="w-full flex-1 flex flex-col overflow-hidden max-w-2xl mx-auto h-full">
        {/* Header */}
        <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-amber-50/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {isEditorOpen ? (
              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center border-2 border-[#1E293B]/20 active:scale-95 transition-all shadow-xs"
                title="Back to list"
              >
                <ArrowLeft className="w-4 h-4 text-[#1E293B]" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-[#1E293B] flex items-center justify-center text-amber-900 shadow-xs">
                <FastfoodVector size={18} color="#78350F" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg font-black text-[#1E293B]"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  {isEditorOpen ? (editingId ? 'Edit Meal' : 'Add Custom Meal') : 'Quick Meals'}
                </h2>
                {!isEditorOpen && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-[#1E293B]/30">
                    {meals.length} items
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 font-bold">
                {isEditorOpen ? 'Customize meal name, icon, price, and location' : 'One-tap entry for regular meals • Fully customizable'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditorOpen && (
              <button
                onClick={handleOpenAdd}
                className="px-3 py-1.5 rounded-xl bg-[#FCCE4C] hover:bg-[#FBBF24] border-2 border-[#1E293B] text-[#1E293B] font-black text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
                title="Add Meal"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Meal</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border-2 border-[#1E293B]/20 shadow-xs"
              title="Close"
            >
              <X className="w-4 h-4 text-[#1E293B]" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {isEditorOpen ? (
            /* ================= EDIT / ADD FORM ================= */
            <form onSubmit={handleSaveMeal} className="space-y-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold animate-in fade-in">
                  {formError}
                </div>
              )}

              {/* Emoji selector */}
              <div>
                <label className="block text-xs font-black text-[#1E293B] mb-1.5">
                  Meal Icon (Emoji)
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 border-2 border-stone-200 rounded-2xl">
                  {COMMON_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all ${
                        emoji === e
                          ? 'bg-[#FCCE4C] border-2 border-[#1E293B] scale-110 shadow-xs'
                          : 'hover:bg-white hover:border border-stone-300'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Name */}
              <div>
                <label className="block text-xs font-black text-[#1E293B] mb-1.5">
                  Meal Name *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-lg">{emoji}</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sweetgreen Salad Bowl / Halal Cart / Bagel"
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-white border-2 border-[#1E293B]/30 focus:border-[#1E293B] font-bold text-sm text-[#1E293B] outline-none"
                  />
                </div>
              </div>

              {/* Price & Tag row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1E293B] mb-1.5">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border-2 border-[#1E293B]/30 focus:border-[#1E293B] font-black text-sm text-[#1E293B] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1E293B] mb-1.5">
                    Special Tag
                  </label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="e.g. Work Lunch"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border-2 border-[#1E293B]/30 focus:border-[#1E293B] font-bold text-xs text-[#1E293B] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Tag suggestions */}
              <div>
                <span className="text-[11px] font-bold text-stone-500 mb-1 block">Quick Tag Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition-all ${
                        tag === t
                          ? 'bg-amber-200 border-[#1E293B] text-amber-900'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location & Payment Method row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1E293B] mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Chinatown / Midtown"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border-2 border-[#1E293B]/30 focus:border-[#1E293B] font-bold text-xs text-[#1E293B] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1E293B] mb-1.5">
                    Default Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#1E293B]/30 focus:border-[#1E293B] font-bold text-xs text-[#1E293B] outline-none"
                  >
                    {PAYMENT_OPTIONS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl border-2 border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#FCCE4C] hover:bg-[#FBBF24] border-2 border-[#1E293B] text-[#1E293B] font-black text-xs shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : 'Confirm Add'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= MEALS LIST (EDIT, ADD, REDUCE) ================= */
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-stone-600 font-bold">
                  Tap any meal to log instantly:
                </span>
                <button
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 hover:text-stone-800 transition-colors"
                  title="Reset to default NYC meal presets"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Presets</span>
                </button>
              </div>

              {meals.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-stone-300 space-y-3">
                  <div className="text-3xl">🍽️</div>
                  <div className="font-extrabold text-stone-700 text-sm">
                    No Quick Meals yet
                  </div>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Click "Add Meal" above to customize your favorites, or restore initial NYC combo presets!
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={handleOpenAdd}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FCCE4C] border-2 border-[#1E293B] text-[#1E293B] font-black text-xs shadow-xs"
                    >
                      Add First Meal
                    </button>
                    <button
                      onClick={() => {
                        const defs = LocalDB.resetQuickMeals();
                        setMeals(defs);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-bold text-xs"
                    >
                      Restore Defaults
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {meals.map((meal) => {
                    const isLogged = loggedMealId === meal.id;
                    const isConfirmingDelete = confirmDeleteId === meal.id;

                    return (
                      <div
                        key={meal.id}
                        className={`group p-3 rounded-2xl bg-white border-2 transition-all flex items-center justify-between gap-3 ${
                          isLogged
                            ? 'border-emerald-500 bg-emerald-50/60 shadow-md'
                            : 'border-stone-200 hover:border-[#1E293B] hover:shadow-xs'
                        }`}
                      >
                        {/* Left: Emoji + Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                            {meal.emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-sm text-[#1E293B] truncate">
                              {meal.name}
                            </div>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              {meal.tag && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200/60">
                                  {meal.tag}
                                </span>
                              )}
                              {meal.location && (
                                <span className="text-[11px] text-stone-500 flex items-center gap-0.5 truncate max-w-[150px]">
                                  <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                                  <span className="truncate">{meal.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Price + Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Price */}
                          <span
                            className="font-black text-sm text-stone-900 pr-1"
                            style={{ fontFamily: 'Fredoka, monospace' }}
                          >
                            ${meal.price.toFixed(2)}
                          </span>

                          {/* Quick Log button */}
                          <button
                            onClick={() => handleQuickLog(meal)}
                            className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] border active:scale-95 transition-all flex items-center gap-1 shadow-xs ${
                              isLogged
                                ? 'bg-emerald-500 text-white border-emerald-600 scale-105'
                                : 'bg-[#FCCE4C] hover:bg-[#FBBF24] text-[#1E293B] border-[#1E293B]'
                            }`}
                            title="Quick log to ledger"
                          >
                            {isLogged ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Logged</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Log</span>
                              </>
                            )}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={(e) => handleOpenEdit(meal, e)}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-amber-100 hover:border-amber-300 text-stone-600 hover:text-amber-900 border border-stone-200 flex items-center justify-center transition-colors active:scale-95"
                            title="Edit meal"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reduce / Delete button */}
                          <button
                            onClick={(e) => handleDeleteMeal(meal.id, e)}
                            className={`px-1.5 py-1 rounded-lg border text-xs font-bold transition-all active:scale-95 flex items-center gap-0.5 ${
                              isConfirmingDelete
                                ? 'bg-rose-500 text-white border-rose-600 animate-pulse text-[10px]'
                                : 'bg-stone-100 hover:bg-rose-100 hover:border-rose-300 text-stone-500 hover:text-rose-700 border-stone-200 w-7 h-7 justify-center'
                            }`}
                            title={isConfirmingDelete ? 'Click to confirm delete' : 'Delete item'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isConfirmingDelete && <span>Delete?</span>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Note */}
        {!isEditorOpen && (
          <div className="px-4 py-2.5 bg-stone-100/80 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-bold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>100% offline local storage with immediate sync</span>
            </span>
            <span className="text-stone-400">NYC Daily Budget & Meal Assistant</span>
          </div>
        )}
      </div>
    </div>
  );
};
