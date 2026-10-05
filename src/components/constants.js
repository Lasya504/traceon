/**
 * Category icon & color mapping (Minimal)
 */
export const CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#FF8A80' },
  { name: 'Transport', icon: '🚌', color: '#6EA8FE' },
  { name: 'Shopping', icon: '🛍️', color: '#B39DDB' },
  { name: 'Bills & Utilities', icon: '⚡', color: '#FFD166' },
  { name: 'Education', icon: '📚', color: '#67D4E8' },
  { name: 'Entertainment', icon: '🎬', color: '#F48FB1' },
  { name: 'Others', icon: '🔗', color: '#94A3B8' },
];

export const PAYMENT_MODES = [
  { name: 'UPI', icon: '📱' },
  { name: 'Cash', icon: '💵' },
  { name: 'Card', icon: '💳' },
  { name: 'Bank Transfer', icon: '🏦' }
];

export function getCategoryMeta(name) {
  if (name === 'Income') {
    return { icon: '💰', color: '#34A853' };
  }
  return CATEGORIES.find((c) => c.name === name) || CATEGORIES[6];
}

export function getPaymentModeMeta(name) {
  return PAYMENT_MODES.find((p) => p.name === name) || PAYMENT_MODES[0];
}
