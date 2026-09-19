import { Wallet } from '../../types/wallet';
import { Transaction } from '../../types/transaction';

/**
 * Calculates the current real balance of a specific wallet based on:
 * initialBalance + confirmed incomes - confirmed expenses - outgoing transfers + incoming transfers
 */
export function calculateWalletBalance(wallet: Wallet, transactions: Transaction[]): number {
  let balance = wallet.initialBalance || 0;

  for (const tx of transactions) {
    if (!tx.confirmed) continue;

    if (tx.walletId === wallet.id) {
      if (tx.type === 'income') {
        balance += tx.amount;
      } else if (tx.type === 'expense') {
        balance -= tx.amount;
      } else if (tx.type === 'transfer') {
        // Outgoing transfer from this wallet
        balance -= tx.amount;
      }
    }

    // Incoming transfer into this wallet
    if (tx.type === 'transfer' && tx.destinationWalletId === wallet.id) {
      balance += tx.amount;
    }
  }

  return balance;
}

/**
 * Calculates the sum of all wallet balances (Total Assets / Net Worth)
 */
export function calculateTotalAssets(wallets: Wallet[], transactions: Transaction[]): number {
  return wallets.reduce((total, wallet) => {
    return total + calculateWalletBalance(wallet, transactions);
  }, 0);
}
