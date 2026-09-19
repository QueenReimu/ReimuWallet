import { create } from 'zustand';
import { SavingsGoal, NewSavingsGoalInput } from '../types/savings';
import { getDatabase } from '../database/database';
import {
  getSavingsGoals,
  insertSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '../database/queries/savings';

interface SavingsState {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;

  fetchGoals: () => Promise<void>;
  createGoal: (input: NewSavingsGoalInput) => Promise<SavingsGoal>;
  addDeposit: (id: string, amount: number) => Promise<void>;
  withdrawDeposit: (id: string, amount: number) => Promise<void>;
  modifyGoal: (id: string, input: Partial<SavingsGoal>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const list = await getSavingsGoals(db);
      set({ goals: list, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load savings goals', isLoading: false });
    }
  },

  createGoal: async (input: NewSavingsGoalInput) => {
    try {
      const db = await getDatabase();
      const newGoal = await insertSavingsGoal(db, input);
      set((state) => ({ goals: [...state.goals, newGoal] }));
      return newGoal;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to create goal' });
      throw err;
    }
  },

  addDeposit: async (id: string, amount: number) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;

    const nextAmount = goal.currentAmount + amount;
    const isCompleted = nextAmount >= goal.targetAmount;

    const db = await getDatabase();
    await updateSavingsGoal(db, id, { currentAmount: nextAmount, isCompleted });
    await get().fetchGoals();
  },

  withdrawDeposit: async (id: string, amount: number) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;

    const nextAmount = Math.max(0, goal.currentAmount - amount);
    const isCompleted = nextAmount >= goal.targetAmount;

    const db = await getDatabase();
    await updateSavingsGoal(db, id, { currentAmount: nextAmount, isCompleted });
    await get().fetchGoals();
  },

  modifyGoal: async (id: string, input: Partial<SavingsGoal>) => {
    try {
      const db = await getDatabase();
      await updateSavingsGoal(db, id, input);
      await get().fetchGoals();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to update goal' });
      throw err;
    }
  },

  removeGoal: async (id: string) => {
    try {
      const db = await getDatabase();
      await deleteSavingsGoal(db, id);
      set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
    } catch (err: any) {
      set({ error: err?.message || 'Failed to delete goal' });
      throw err;
    }
  },
}));
