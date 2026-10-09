/**
 * Category icon & color mapping (Calm Editorial Palette)
 */
export const CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#EA580C', bg: '#FFF7ED' },
  { name: 'Transport', icon: '🚌', color: '#0284C7', bg: '#F0F9FF' },
  { name: 'Shopping', icon: '🛍️', color: '#7C3AED', bg: '#F5F3FF' },
  { name: 'Bills & Utilities', icon: '⚡', color: '#D97706', bg: '#FFFBEB' },
  { name: 'Education', icon: '📚', color: '#0D9488', bg: '#F0FDFA' },
  { name: 'Entertainment', icon: '🎬', color: '#DB2777', bg: '#FDF2F8' },
  { name: 'Others', icon: '🔗', color: '#475569', bg: '#F1F5F9' },
];

export const PAYMENT_MODES = [
  { name: 'UPI', icon: '📱' },
  { name: 'Cash', icon: '💵' },
  { name: 'Card', icon: '💳' },
  { name: 'Bank Transfer', icon: '🏦' }
];

export function getCategoryMeta(name) {
  if (name === 'Income') {
    return { icon: '💰', color: '#16A34A', bg: '#F0FDF4' };
  }
  return CATEGORIES.find((c) => c.name === name) || CATEGORIES[6];
}

export function getPaymentModeMeta(name) {
  return PAYMENT_MODES.find((p) => p.name === name) || PAYMENT_MODES[0];
}
