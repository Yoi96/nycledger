import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  Tag,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  CategoryMeta,
  getStoredCategories,
  saveStoredCategories,
  resetStoredCategories,
} from '../../utils/categories';
import { CategoryIcon } from '../common/CategoryIcon';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

const PRESET_ICONS = [
  'fastfood',
  'restaurant',
  'local_cafe',
  'coffee',
  'ramen_dining',
  'lunch_dining',
  'dinner_dining',
  'bakery_dining',
  'local_pizza',
  'cake',
  'icecream',
  'local_bar',
  'liquor',
  'local_drink',
  'kitchen',
  'takeout_dining',
  'outdoor_grill',
  'dining',
  'home',
  'apartment',
  'shopping_bag',
  'shopping_cart',
  'local_grocery_store',
  'directions_subway',
  'movie',
  'payments',
  'local_pharmacy',
  'card_giftcard',
  'pets',
  'directions_car',
  'flight',
  'menu_book',
  'sports_soccer',
  'fitness_center',
  'wine_bar',
  'park',
  'laptop_mac',
  'headphones',
  'palette',
  'local_gas_station',
  'category',
];

const PRESET_COLORS = [
  { hex: '#F97316', label: 'Orange' },
  { hex: '#06B6D4', label: 'Cyan' },
  { hex: '#EC4899', label: 'Pink' },
  { hex: '#3B82F6', label: 'Blue' },
  { hex: '#0D9488', label: 'Teal' },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#16A34A', label: 'Green' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#E11D48', label: 'Rose' },
  { hex: '#64748B', label: 'Slate' },
  { hex: '#D97706', label: 'Yellow' },
  { hex: '#6366F1', label: 'Indigo' },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editIconUrl, setEditIconUrl] = useState<string | undefined>(undefined);
  const [editColor, setEditColor] = useState('');

  // Add new category
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('fastfood');
  const [newIconUrl, setNewIconUrl] = useState<string | undefined>(undefined);
  const [newColor, setNewColor] = useState('#F97316');

  // Delete confirm state
  const [deletingCat, setDeletingCat] = useState<CategoryMeta | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadCategories = () => {
    const list = getStoredCategories();
    setCategories([...list]);
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setEditingId(null);
      setIsAdding(false);
      setDeletingCat(null);
      setConfirmReset(false);
      setNotification(null);
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  const handleImageFile = (file: File, callback: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 64; // lightweight thumbnail
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          callback(canvas.toDataURL('image/png'));
        } else {
          callback(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleStartEdit = (cat: CategoryMeta) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditEmoji(cat.emoji);
    setEditIconUrl(cat.iconUrl);
    setEditColor(cat.color);
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditEmoji('');
    setEditIconUrl(undefined);
    setEditColor('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      showToast('Category name cannot be empty');
      return;
    }

    const updated = categories.map((cat) => {
      if (cat.id === id) {
        return {
          ...cat,
          name: editName.trim(),
          emoji: editEmoji.trim() || '🏷️',
          iconUrl: editIconUrl,
          color: editColor || cat.color,
        };
      }
      return cat;
    });

    setCategories(updated);
    saveStoredCategories(updated);
    handleCancelEdit();
    onCategoriesChanged?.();
    showToast('Category changes saved successfully!');
  };

  const handleCreateCategory = () => {
    if (!newName.trim()) {
      showToast('Please enter a category name');
      return;
    }

    const id = `cat_custom_${Date.now()}`;
    const newCat: CategoryMeta = {
      id,
      name: newName.trim(),
      emoji: newEmoji.trim() || 'fastfood',
      iconUrl: newIconUrl,
      color: newColor,
      badgeBg: 'bg-purple-50 text-purple-700',
      badgeBorder: 'border-purple-200',
      iconBg: 'bg-purple-100 text-purple-600',
      isCustom: true,
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    saveStoredCategories(updated);
    setIsAdding(false);
    setNewName('');
    setNewEmoji('fastfood');
    setNewIconUrl(undefined);
    setNewColor('#F97316');
    onCategoriesChanged?.();
    showToast(`Category "${newCat.name}" created!`);
  };

  const confirmDeleteCategory = () => {
    if (!deletingCat) return;
    if (categories.length <= 1) {
      showToast('At least one category must be kept');
      setDeletingCat(null);
      return;
    }

    const updated = categories.filter((c) => c.id !== deletingCat.id);
    setCategories(updated);
    saveStoredCategories(updated);
    if (editingId === deletingCat.id) handleCancelEdit();
    onCategoriesChanged?.();
    showToast(`Category "${deletingCat.name}" removed`);
    setDeletingCat(null);
  };

  const confirmResetDefaults = () => {
    const resetList = resetStoredCategories();
    setCategories([...resetList]);
    handleCancelEdit();
    setIsAdding(false);
    setConfirmReset(false);
    onCategoriesChanged?.();
    showToast('Restored default categories!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF5] w-full h-full overflow-hidden animate-in fade-in duration-200">
      <div className="w-full flex-1 flex flex-col overflow-hidden max-w-2xl mx-auto h-full">
        {/* Header matching Picture 3 */}
        <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-amber-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="text-lg font-black text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Category Manager
              </h2>
              <p className="text-[10px] text-stone-500 font-semibold">
                Edit Category Names, Icons & Custom Colors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs cursor-pointer"
            aria-label="Close Category Manager"
          >
            <X className="w-4 h-4 text-[#1E293B]" />
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold text-center animate-in slide-in-from-top flex items-center justify-center gap-1.5 shadow-sm">
            <Check className="w-3.5 h-3.5" />
            {notification}
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-full box-border">
          {/* Top Actions: Add Category & Reset */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setIsAdding(!isAdding);
                if (!isAdding) handleCancelEdit();
              }}
              className="px-3.5 py-2 rounded-2xl bg-[#FCCE4C] hover:bg-amber-400 border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] active:translate-y-0.5 text-xs font-black text-[#1E293B] flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Close Form' : 'New Custom Category'}</span>
            </button>

            <button
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-[11px] font-bold text-stone-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              <span>Restore Defaults</span>
            </button>
          </div>

          {/* New Category Form */}
          {isAdding && (
            <div className="p-4 bg-white rounded-3xl border-2 border-amber-400 shadow-md space-y-3.5 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900 border-b border-amber-100 pb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Create Custom Category</span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-black text-[#1E293B] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gym, Coffee, Books, Tech..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border-2 border-stone-200 text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#1E293B] focus:bg-white"
                />
              </div>

              {/* Icon / Emoji Selection with Custom Typing & Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-[#1E293B]">
                    Choose or Enter Icon / Emoji
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addFileInputRef.current?.click()}
                      className="px-2 py-0.5 rounded-lg bg-sky-100 hover:bg-sky-200 border border-sky-300 text-[10px] font-bold text-sky-800 flex items-center gap-1 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Custom Icon</span>
                    </button>
                    <input
                      type="file"
                      ref={addFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFile(file, (url) => setNewIconUrl(url));
                      }}
                    />
                  </div>
                </div>

                {/* Current Selected / Custom Preview Row */}
                <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-2xl border border-stone-200 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-amber-400 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
                    {newIconUrl ? (
                      <img src={newIconUrl} alt="Custom Icon" className="w-7 h-7 object-contain" />
                    ) : (
                      <CategoryIcon emoji={newEmoji} size={24} color={newColor} />
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      placeholder="Icon name (e.g. fastfood) or emoji"
                      value={newEmoji}
                      onChange={(e) => {
                        setNewEmoji(e.target.value);
                        setNewIconUrl(undefined);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                      maxLength={40}
                    />
                    {newIconUrl && (
                      <button
                        type="button"
                        onClick={() => setNewIconUrl(undefined)}
                        className="px-2 py-1 text-[10px] rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset Icons Grid */}
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-2 bg-stone-50 rounded-2xl border border-stone-200 max-h-32 overflow-y-auto">
                  {PRESET_ICONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      title={em}
                      onClick={() => {
                        setNewEmoji(em);
                        setNewIconUrl(undefined);
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base hover:scale-110 active:scale-95 transition-all ${
                        newEmoji === em && !newIconUrl
                          ? 'bg-amber-300 border-2 border-[#1E293B] shadow-xs'
                          : 'hover:bg-white'
                      }`}
                    >
                      <CategoryIcon emoji={em} size={20} color={newColor} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Tag */}
              <div>
                <label className="block text-xs font-black text-[#1E293B] mb-1.5">
                  Color Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewColor(c.hex)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newColor === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-[#1E293B]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-4 py-1.5 rounded-xl bg-[#FCCE4C] hover:bg-amber-400 border-2 border-[#1E293B] text-xs font-black text-[#1E293B] shadow-xs active:scale-95"
                >
                  Create Category
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <span className="text-xs font-black text-stone-400 uppercase tracking-wider px-1">
              Active Categories ({categories.length})
            </span>

            <div className="space-y-2">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;

                if (isEditing) {
                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 bg-amber-50/80 rounded-2xl border-2 border-[#1E293B] shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-900">
                          Editing Category
                        </span>
                        <button
                          onClick={handleCancelEdit}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Name input */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Category Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border-2 border-stone-300 text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#1E293B]"
                        />
                      </div>

                      {/* Icon / Emoji Row */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-stone-600">
                            Icon Emoji or Image
                          </label>
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="px-2 py-0.5 rounded-lg bg-sky-100 hover:bg-sky-200 border border-sky-300 text-[10px] font-bold text-sky-800 flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Image</span>
                          </button>
                          <input
                            type="file"
                            ref={editFileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageFile(file, (url) => setEditIconUrl(url));
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 mb-2">
                          <div className="w-9 h-9 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center text-lg flex-shrink-0">
                            {editIconUrl ? (
                              <img src={editIconUrl} alt="Icon" className="w-6 h-6 object-contain" />
                            ) : (
                              <CategoryIcon emoji={editEmoji} size={22} color={editColor || '#64748B'} />
                            )}
                          </div>
                          <input
                            type="text"
                            value={editEmoji}
                            onChange={(e) => {
                              setEditEmoji(e.target.value);
                              setEditIconUrl(undefined);
                            }}
                            placeholder="Icon name (e.g. fastfood) or emoji"
                            className="flex-1 px-2 py-1 text-xs font-bold rounded-lg border border-stone-200"
                            maxLength={40}
                          />
                          {editIconUrl && (
                            <button
                              type="button"
                              onClick={() => setEditIconUrl(undefined)}
                              className="px-2 py-0.5 text-[10px] rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>

                        {/* Presets */}
                        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-1.5 bg-white rounded-xl border border-stone-200 max-h-24 overflow-y-auto">
                          {PRESET_ICONS.slice(0, 30).map((em) => (
                            <button
                              key={em}
                              type="button"
                              title={em}
                              onClick={() => {
                                setEditEmoji(em);
                                setEditIconUrl(undefined);
                              }}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                                editEmoji === em && !editIconUrl ? 'bg-amber-300' : 'hover:bg-stone-100'
                              }`}
                            >
                              <CategoryIcon emoji={em} size={18} color={editColor || '#64748B'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Tag */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Color Tag
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setEditColor(c.hex)}
                              className={`w-5 h-5 rounded-full ${
                                editColor === c.hex ? 'scale-125 ring-2 ring-offset-1 ring-[#1E293B]' : ''
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Edit actions */}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200/60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-3.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  );
                }

                // Normal row
                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-white rounded-2xl border-2 border-stone-200 hover:border-amber-400 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg flex-shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}40`,
                        }}
                      >
                        <CategoryIcon emoji={cat.emoji} iconUrl={cat.iconUrl} size={24} color={cat.color} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-[#1E293B] truncate">
                            {cat.name}
                          </span>
                          {cat.isCustom && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold">
                              Custom
                            </span>
                          )}
                          {cat.iconUrl && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded font-bold">
                              Photo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-[10px] text-stone-400 font-semibold truncate">
                            ID: {cat.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-2 rounded-xl text-stone-500 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingCat(cat)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* In-App Delete Confirmation Modal */}
        {deletingCat && (
          <div className="absolute inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 border-3 border-[#1E293B] shadow-2xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-rose-100 border-2 border-rose-300 text-rose-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-[#1E293B]">
                Delete Category "{deletingCat.name}"?
              </h3>
              <p className="text-xs text-stone-500">
                Existing past transactions using this category will be preserved. Are you sure you want to remove it?
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeletingCat(null)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-700 shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* In-App Reset Confirmation Modal */}
        {confirmReset && (
          <div className="absolute inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 border-3 border-[#1E293B] shadow-2xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-700 mx-auto flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-[#1E293B]">
                Restore Preset Categories?
              </h3>
              <p className="text-xs text-stone-500">
                This will reset category settings to default presets and clear custom-added categories.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetDefaults}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-black text-xs hover:bg-amber-600 shadow-xs"
                >
                  Confirm Restore
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
