export type WalletType = 'cash' | 'bank' | 'ewallet' | 'vault' | 'savings';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number; // Current calculated or cached balance
  initialBalance: number;
  icon: string;
  color: string;
  accountNumber?: string;
  isPrimary?: boolean;
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewWalletInput {
  name: string;
  type: WalletType;
  initialBalance?: number;
  icon?: string;
  color?: string;
  accountNumber?: string;
  isPrimary?: boolean;
}
