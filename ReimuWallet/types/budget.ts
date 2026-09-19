export interface Budget {
  id: string;
  categoryId: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isExceeded: boolean;
  isWarning: boolean; // >= 85%
}
