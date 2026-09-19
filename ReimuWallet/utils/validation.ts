import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive({ message: 'Amount must be greater than Rp 0' }),
  categoryId: z.string().optional(),
  walletId: z.string().min(1, { message: 'Please select a source wallet' }),
  destinationWalletId: z.string().optional(),
  description: z.string().min(1, { message: 'Description is required' }).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' }),
  time: z.string().optional(),
  receiptUri: z.string().optional(),
  source: z.enum(['manual', 'notification', 'import']).default('manual'),
  confirmed: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.type === 'transfer') {
      return !!data.destinationWalletId && data.destinationWalletId !== data.walletId;
    }
    return true;
  },
  {
    message: 'Destination wallet cannot be the same as the source wallet for transfers',
    path: ['destinationWalletId'],
  }
);

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const walletSchema = z.object({
  name: z.string().min(1, { message: 'Wallet name is required' }).max(50),
  type: z.enum(['cash', 'bank', 'ewallet', 'vault', 'savings']),
  initialBalance: z.number().default(0),
  icon: z.string().default('account-balance-wallet'),
  color: z.string().default('#FF3E00'),
  accountNumber: z.string().max(30).optional(),
  isPrimary: z.boolean().default(false),
});

export type WalletFormData = z.infer<typeof walletSchema>;

export const budgetSchema = z.object({
  categoryId: z.string().min(1, { message: 'Category is required' }),
  monthlyLimit: z.number().positive({ message: 'Budget limit must be greater than Rp 0' }),
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: 'Month format must be YYYY-MM' }),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

export const savingsGoalSchema = z.object({
  name: z.string().min(1, { message: 'Goal title is required' }).max(60),
  targetAmount: z.number().positive({ message: 'Target amount must be greater than Rp 0' }),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().optional(),
  icon: z.string().default('savings'),
  color: z.string().default('#FF3E00'),
  badge: z.string().optional(),
});

export type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>;

export const backupFileSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  app: z.literal('ReimuWallet'),
  wallets: z.array(z.any()),
  transactions: z.array(z.any()),
  budgets: z.array(z.any()).optional(),
  savingsGoals: z.array(z.any()).optional(),
  categories: z.array(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});
