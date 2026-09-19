import { create } from 'zustand';
import { Budget } from '../types/budget';
import { getDatabase } from '../database/database';
import { getBudgetsForMonth, upsertBudget, deleteBudget } from '../database/queries/budgets';

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;

  fetchBudgets: (month: string) => Promise<void>;
  saveBudget: (categoryId: string, monthlyLimit: number, month: string) => Promise<void>;
  removeBudget: (id: string, month: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async (month: string) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const list = await getBudgetsForMonth(db, month);
      set({ budgets: list, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load budgets', isLoading: false });
    }
  },

  saveBudget: async (categoryId: string, monthlyLimit: number, month: string) => {
    try {
      const db = await getDatabase();
      await upsertBudget(db, categoryId, monthlyLimit, month);
      await get().fetchBudgets(month);
    } catch (err: any) {
      set({ error: err?.message || 'Failed to save budget' });
      throw err;
    }
  },

  removeBudget: async (id: string, month: string) => {
    try {
      const db = await getDatabase();
      await deleteBudget(db, id);
      await get().fetchBudgets(month);
    } catch (err: any) {
      set({ error: err?.message || 'Failed to delete budget' });
      throw err;
    }
  },
}));
