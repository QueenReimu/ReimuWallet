import { create } from 'zustand';
import { Transaction, NewTransactionInput, TransactionFilter } from '../types/transaction';
import { getDatabase } from '../database/database';
import {
  getTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
} from '../database/queries/transactions';
import { getCurrentMonthString } from '../utils/dates';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  selectedMonth: string; // YYYY-MM
  filter: TransactionFilter;
  error: string | null;

  setSelectedMonth: (month: string) => void;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  fetchTransactions: () => Promise<void>;
  createTransaction: (input: NewTransactionInput) => Promise<Transaction>;
  modifyTransaction: (id: string, input: Partial<NewTransactionInput>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  selectedMonth: getCurrentMonthString(),
  filter: {},
  error: null,

  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
    get().fetchTransactions();
  },

  setFilter: (newFilter: Partial<TransactionFilter>) => {
    set((state) => ({ filter: { ...state.filter, ...newFilter } }));
    get().fetchTransactions();
  },

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const txs = await getTransactions(db, get().filter);
      set({ transactions: txs, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load transactions', isLoading: false });
    }
  },

  createTransaction: async (input: NewTransactionInput) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const newTx = await insertTransaction(db, input);
      set((state) => ({
        transactions: [newTx, ...state.transactions],
        isLoading: false,
      }));
      return newTx;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to create transaction', isLoading: false });
      throw err;
    }
  },

  modifyTransaction: async (id: string, input: Partial<NewTransactionInput>) => {
    try {
      const db = await getDatabase();
      await updateTransaction(db, id, input);
      await get().fetchTransactions();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to update transaction' });
      throw err;
    }
  },

  removeTransaction: async (id: string) => {
    try {
      const db = await getDatabase();
      await deleteTransaction(db, id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Failed to delete transaction' });
      throw err;
    }
  },
}));
