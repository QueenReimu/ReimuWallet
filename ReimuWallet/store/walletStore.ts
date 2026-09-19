import { create } from 'zustand';
import { Wallet, NewWalletInput } from '../types/wallet';
import { getDatabase } from '../database/database';
import {
  getWallets,
  insertWallet,
  updateWallet,
  deleteWallet,
} from '../database/queries/wallets';

interface WalletState {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;

  fetchWallets: () => Promise<void>;
  createWallet: (input: NewWalletInput) => Promise<Wallet>;
  modifyWallet: (id: string, input: Partial<NewWalletInput>) => Promise<void>;
  removeWallet: (id: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  isLoading: false,
  error: null,

  fetchWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const list = await getWallets(db);
      set({ wallets: list, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load wallets', isLoading: false });
    }
  },

  createWallet: async (input: NewWalletInput) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const newWallet = await insertWallet(db, input);
      set((state) => ({
        wallets: [...state.wallets, newWallet],
        isLoading: false,
      }));
      return newWallet;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to create wallet', isLoading: false });
      throw err;
    }
  },

  modifyWallet: async (id: string, input: Partial<NewWalletInput>) => {
    try {
      const db = await getDatabase();
      await updateWallet(db, id, input);
      await get().fetchWallets();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to update wallet' });
      throw err;
    }
  },

  removeWallet: async (id: string) => {
    try {
      const db = await getDatabase();
      await deleteWallet(db, id);
      set((state) => ({
        wallets: state.wallets.filter((w) => w.id !== id),
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Failed to delete wallet' });
      throw err;
    }
  },
}));
