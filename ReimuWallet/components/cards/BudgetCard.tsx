import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { formatRupiah } from '../../utils/currency';

interface BudgetCardProps {
  categoryName: string;
  categoryIcon?: string;
  monthlyLimit: number;
  spent: number;
  onPress?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  categoryName,
  categoryIcon = 'receipt-long',
  monthlyLimit,
  spent,
  onPress,
}) => {
  const remaining = Math.max(0, monthlyLimit - spent);
  const percentage = monthlyLimit > 0 ? Math.min(100, Math.round((spent / monthlyLimit) * 100)) : 0;
  const isExceeded = spent > monthlyLimit;
  const isWarning = percentage >= 85 && !isExceeded;

  const barColor = isExceeded
    ? Colors.dark.expense
    : isWarning
    ? Colors.dark.warning
    : Colors.dark.income;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.catInfo}>
          <View style={styles.iconCircle}>
            <MaterialIcons name={(categoryIcon as any) || 'category'} size={16} color={Colors.dark.primary} />
          </View>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: `${barColor}15`, borderColor: barColor },
          ]}
        >
          <Text style={[styles.statusText, { color: barColor }]}>
            {isExceeded ? 'OVER BUDGET' : isWarning ? 'WARNING' : 'HEALTHY'}
          </Text>
        </View>
      </View>

      {/* Numerical Stats */}
      <View style={styles.amountRow}>
        <View>
          <Text style={styles.label}>SPENT</Text>
          <Text style={styles.amountValue}>{formatRupiah(spent)}</Text>
        </View>
        <View style={styles.rightAlign}>
          <Text style={styles.label}>LIMIT</Text>
          <Text style={styles.limitValue}>{formatRupiah(monthlyLimit)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.percentageText}>{percentage}% used</Text>
        <Text style={styles.remainingText}>
          {isExceeded
            ? `Exceeded by ${formatRupiah(spent - monthlyLimit)}`
            : `${formatRupiah(remaining)} left`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountValue: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  limitValue: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.cardElevated,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentageText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  remainingText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
