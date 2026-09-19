export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  icon: string;
  color: string;
  badge?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewSavingsGoalInput {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  icon?: string;
  color?: string;
  badge?: string;
}
