export interface DefaultCategory {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string; // MaterialIcons or Ionicons name
  color: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { id: 'cat-food', name: 'Food', type: 'expense', icon: 'restaurant', color: '#FF3E00' },
  { id: 'cat-transport', name: 'Transportation', type: 'expense', icon: 'commute', color: '#F59E0B' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#EC4899' },
  { id: 'cat-gaming', name: 'Gaming', type: 'expense', icon: 'sports-esports', color: '#8B5CF6' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'movie', color: '#EF4444' },
  { id: 'cat-education', name: 'Education', type: 'expense', icon: 'school', color: '#3B82F6' },
  { id: 'cat-bills', name: 'Bills', type: 'expense', icon: 'receipt-long', color: '#6B7280' },
  { id: 'cat-health', name: 'Health', type: 'expense', icon: 'medical-services', color: '#10B981' },
  { id: 'cat-other-exp', name: 'Other', type: 'expense', icon: 'more-horiz', color: '#9CA3AF' },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'payments', color: '#10B981' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', icon: 'work', color: '#06B6D4' },
  { id: 'cat-business', name: 'Business', type: 'income', icon: 'storefront', color: '#3B82F6' },
  { id: 'cat-bonus', name: 'Bonus', type: 'income', icon: 'card-giftcard', color: '#F59E0B' },
  { id: 'cat-other-inc', name: 'Other', type: 'income', icon: 'savings', color: '#10B981' },
];
