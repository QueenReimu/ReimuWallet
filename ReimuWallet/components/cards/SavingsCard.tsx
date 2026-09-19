import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SavingsGoal } from '../../types/savings';
import { Colors } from '../../constants/colors';
import { formatRupiah } from '../../utils/currency';

interface SavingsCardProps {
  goal: SavingsGoal;
  onPress?: () => void;
  onDeposit?: () => void;
}

export const SavingsCard: React.FC<SavingsCardProps> = ({
  goal,
  onPress,
  onDeposit,
}) => {
  const percentage =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${goal.color || Colors.dark.primary}15` },
            ]}
          >
            <MaterialIcons
              name={(goal.icon as any) || 'savings'}
              size={18}
              color={goal.color || Colors.dark.primary}
            />
          </View>
          <View>
            <Text style={styles.goalName}>{goal.name}</Text>
            {goal.targetDate && (
              <Text style={styles.dateText}>Target: {goal.targetDate}</Text>
            )}
          </View>
        </View>

        {goal.isCompleted ? (
          <View style={styles.completedBadge}>
            <MaterialIcons name="check-circle" size={14} color={Colors.dark.income} />
            <Text style={styles.completedText}>REACHED</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.depositBtn}
            onPress={onDeposit}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={14} color="#FFFFFF" />
            <Text style={styles.depositText}>Deposit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.currentAmount}>{formatRupiah(goal.currentAmount)}</Text>
        <Text style={styles.targetAmount}>of {formatRupiah(goal.targetAmount)}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: goal.isCompleted
                ? Colors.dark.income
                : goal.color || Colors.dark.primary,
            },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.percentText}>{percentage}% Completed</Text>
        <Text style={styles.remainingText}>
          {goal.isCompleted
            ? 'Goal Achieved!'
            : `${formatRupiah(Math.max(0, goal.targetAmount - goal.currentAmount))} to go`}
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
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.incomeSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.income,
  },
  completedText: {
    color: Colors.dark.income,
    fontSize: 9,
    fontWeight: '800',
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  depositText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  currentAmount: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  targetAmount: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.cardElevated,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  remainingText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
