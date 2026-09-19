import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { formatRupiah } from '../../utils/currency';

interface BalanceHeroCardProps {
  totalAssets: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  isBalanceHidden: boolean;
  onToggleHideBalance: () => void;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onTransfer: () => void;
}

export const BalanceHeroCard: React.FC<BalanceHeroCardProps> = ({
  totalAssets,
  monthlyIncome,
  monthlyExpenses,
  isBalanceHidden,
  onToggleHideBalance,
  onAddExpense,
  onAddIncome,
  onTransfer,
}) => {
  return (
    <View style={styles.card}>
      {/* Top Accent Strip */}
      <View style={styles.accentStrip} />

      <View style={styles.content}>
        {/* Header Label + Visibility Toggle */}
        <View style={styles.labelRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>TOTAL ASSETS</Text>
          </View>
          <TouchableOpacity
            onPress={onToggleHideBalance}
            activeOpacity={0.7}
            style={styles.eyeButton}
            accessibilityLabel={isBalanceHidden ? 'Show balance' : 'Hide balance'}
          >
            <MaterialIcons
              name={isBalanceHidden ? 'visibility-off' : 'visibility'}
              size={18}
              color={Colors.dark.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Hero Amount */}
        <Text style={styles.amountText}>
          {isBalanceHidden ? 'Rp ••••••••' : formatRupiah(totalAssets)}
        </Text>

        {/* Month Cashflow Row */}
        <View style={styles.cashflowRow}>
          {/* Income */}
          <View style={styles.cashflowCol}>
            <View style={styles.cfHeader}>
              <MaterialIcons name="arrow-downward" size={14} color={Colors.dark.income} />
              <Text style={styles.cfLabel}>INCOME</Text>
            </View>
            <Text style={[styles.cfValue, { color: Colors.dark.income }]}>
              {isBalanceHidden ? '••••••' : `+${formatRupiah(monthlyIncome)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Expense */}
          <View style={styles.cashflowCol}>
            <View style={styles.cfHeader}>
              <MaterialIcons name="arrow-upward" size={14} color={Colors.dark.expense} />
              <Text style={styles.cfLabel}>EXPENSES</Text>
            </View>
            <Text style={[styles.cfValue, { color: Colors.dark.expense }]}>
              {isBalanceHidden ? '••••••' : `-${formatRupiah(monthlyExpenses)}`}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.expenseBtn]}
            onPress={onAddExpense}
            activeOpacity={0.8}
          >
            <MaterialIcons name="remove" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.incomeBtn]}
            onPress={onAddIncome}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.transferBtn]}
            onPress={onTransfer}
            activeOpacity={0.8}
          >
            <MaterialIcons name="swap-horiz" size={18} color={Colors.dark.text} />
            <Text style={[styles.actionText, { color: Colors.dark.text }]}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  accentStrip: {
    height: 3,
    backgroundColor: Colors.dark.primary,
  },
  content: {
    padding: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tagText: {
    color: Colors.dark.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  eyeButton: {
    padding: 4,
  },
  amountText: {
    color: Colors.dark.text,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  cashflowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  cashflowCol: {
    flex: 1,
  },
  cfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  cfLabel: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cfValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  expenseBtn: {
    backgroundColor: Colors.dark.primary,
  },
  incomeBtn: {
    backgroundColor: Colors.dark.income,
  },
  transferBtn: {
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
