import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Transaction } from '../../types/transaction';
import { Colors } from '../../constants/colors';
import { formatRupiah } from '../../utils/currency';

interface TransactionRowProps {
  transaction: Transaction;
  isBalanceHidden: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  isBalanceHidden,
  onPress,
  onLongPress,
}) => {
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  const typeColor = isIncome
    ? Colors.dark.income
    : isExpense
    ? Colors.dark.expense
    : Colors.dark.transfer;

  const typeIcon: keyof typeof MaterialIcons.glyphMap = isIncome
    ? 'arrow-downward'
    : isExpense
    ? 'arrow-upward'
    : 'swap-horiz';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconWrapper, { backgroundColor: `${typeColor}15` }]}>
          <MaterialIcons name={typeIcon} size={18} color={typeColor} />
        </View>

        <View style={styles.metaCol}>
          <Text style={styles.titleText} numberOfLines={1}>
            {transaction.description || 'Transaction'}
          </Text>

          <View style={styles.subMetaRow}>
            {transaction.categoryName ? (
              <Text style={styles.categoryText}>{transaction.categoryName}</Text>
            ) : null}

            {transaction.categoryName && <Text style={styles.dot}>•</Text>}

            <Text style={styles.walletText}>
              {isTransfer
                ? `${transaction.walletName || 'Wallet'} → ${transaction.destinationWalletName || 'Target'}`
                : transaction.walletName || 'Wallet'}
            </Text>

            {transaction.source === 'notification' && (
              <>
                <Text style={styles.dot}>•</Text>
                <View style={styles.notifBadge}>
                  <Text style={styles.notifText}>AUTO</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text style={[styles.amountText, { color: typeColor }]}>
          {isBalanceHidden
            ? '••••••'
            : isIncome
            ? `+${formatRupiah(transaction.amount)}`
            : isExpense
            ? `-${formatRupiah(transaction.amount)}`
            : formatRupiah(transaction.amount)}
        </Text>

        {transaction.time && <Text style={styles.timeText}>{transaction.time}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metaCol: {
    flex: 1,
  },
  titleText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  dot: {
    color: Colors.dark.textMuted,
    fontSize: 10,
  },
  walletText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  notifBadge: {
    backgroundColor: Colors.dark.primarySubtle,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  notifText: {
    color: Colors.dark.primary,
    fontSize: 8,
    fontWeight: '800',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  timeText: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
