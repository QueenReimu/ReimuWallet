import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { BudgetCard } from '../../components/cards/BudgetCard';
import { SavingsCard } from '../../components/cards/SavingsCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useBudgetStore } from '../../store/budgetStore';
import { useSavingsStore } from '../../store/savingsStore';
import { useTransactionStore } from '../../store/transactionStore';
import { Colors } from '../../constants/colors';
import { getCurrentMonthString, formatMonthYearHeader } from '../../utils/dates';
import { formatRupiah } from '../../utils/currency';

export default function BudgetsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'budgets' | 'savings'>('budgets');
  const currentMonth = getCurrentMonthString();

  const { budgets, fetchBudgets, removeBudget } = useBudgetStore();
  const { goals, fetchGoals, addDeposit, removeGoal } = useSavingsStore();
  const { transactions } = useTransactionStore();

  useEffect(() => {
    fetchBudgets(currentMonth);
    fetchGoals();
  }, [currentMonth]);

  // Calculate spent per budget category
  const getCategorySpent = (categoryId: string) => {
    return transactions
      .filter(
        (tx) =>
          tx.confirmed &&
          tx.type === 'expense' &&
          tx.categoryId === categoryId &&
          tx.date.startsWith(currentMonth)
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const handleDepositPrompt = (goalId: string, goalName: string) => {
    Alert.prompt
      ? Alert.prompt(
          'Deposit to Goal',
          `Enter deposit amount for ${goalName} (in Rupiah):`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Deposit',
              onPress: async (val) => {
                const num = parseInt(val?.replace(/\D/g, '') || '0', 10);
                if (num > 0) {
                  await addDeposit(goalId, num);
                }
              },
            },
          ],
          'plain-text',
          '',
          'numeric'
        )
      : (async () => {
          // Fallback deposit of 50.000
          await addDeposit(goalId, 50000);
        })();
  };

  const handleDeleteBudget = (budgetId: string, catName: string) => {
    Alert.alert('Remove Budget', `Delete budget limit for ${catName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeBudget(budgetId, currentMonth);
        },
      },
    ]);
  };

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + getCategorySpent(b.categoryId), 0);

  return (
    <View style={styles.container}>
      <Header
        title="Budgets & Goals"
        subtitle="CAPITAL ALLOCATION"
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (activeTab === 'budgets') {
                router.push('/modal/new-budget');
              } else {
                router.push('/modal/new-savings');
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Segment Selector */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'budgets' && styles.activeSegmentBtn]}
          onPress={() => setActiveTab('budgets')}
        >
          <Text style={[styles.segmentText, activeTab === 'budgets' && styles.activeSegmentText]}>
            MONTHLY BUDGETS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'savings' && styles.activeSegmentBtn]}
          onPress={() => setActiveTab('savings')}
        >
          <Text style={[styles.segmentText, activeTab === 'savings' && styles.activeSegmentText]}>
            SAVINGS GOALS
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'budgets' ? (
          <>
            {/* Overview Banner */}
            {budgets.length > 0 && (
              <View style={styles.budgetOverviewCard}>
                <View style={styles.boTop}>
                  <Text style={styles.boLabel}>{formatMonthYearHeader(currentMonth)} ALLOCATION</Text>
                  <Text style={styles.boAmount}>
                    {formatRupiah(totalBudgetSpent)} / {formatRupiah(totalBudgetLimit)}
                  </Text>
                </View>
                <View style={styles.boTrack}>
                  <View
                    style={[
                      styles.boFill,
                      {
                        width: `${totalBudgetLimit > 0 ? Math.min(100, (totalBudgetSpent / totalBudgetLimit) * 100) : 0}%`,
                        backgroundColor:
                          totalBudgetSpent > totalBudgetLimit
                            ? Colors.dark.expense
                            : Colors.dark.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {budgets.length === 0 ? (
              <EmptyState
                icon="pie-chart"
                title="No Budgets Defined"
                description="Set strict monthly limits per category to guard your financial sovereignty."
                actionLabel="Create Budget"
                onAction={() => router.push('/modal/new-budget')}
              />
            ) : (
              budgets.map((b) => {
                const spent = getCategorySpent(b.categoryId);
                return (
                  <BudgetCard
                    key={b.id}
                    categoryName={b.categoryName || 'Category'}
                    categoryIcon={b.categoryIcon}
                    monthlyLimit={b.monthlyLimit}
                    spent={spent}
                    onPress={() => handleDeleteBudget(b.id, b.categoryName || 'Category')}
                  />
                );
              })
            )}
          </>
        ) : (
          <>
            {goals.length === 0 ? (
              <EmptyState
                icon="savings"
                title="No Savings Goals"
                description="Track long-term financial targets and milestones with dedicated savings pots."
                actionLabel="Create Goal"
                onAction={() => router.push('/modal/new-savings')}
              />
            ) : (
              goals.map((g) => (
                <SavingsCard
                  key={g.id}
                  goal={g}
                  onDeposit={() => handleDepositPrompt(g.id, g.name)}
                  onPress={() => {
                    Alert.alert('Savings Goal', g.name, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete Goal',
                        style: 'destructive',
                        onPress: async () => await removeGoal(g.id),
                      },
                    ]);
                  }}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  activeSegmentBtn: {
    backgroundColor: Colors.dark.primarySubtle,
    borderColor: Colors.dark.primary,
  },
  segmentText: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  activeSegmentText: {
    color: Colors.dark.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  budgetOverviewCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    marginBottom: 16,
  },
  boTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  boLabel: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  boAmount: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  boTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.cardElevated,
    overflow: 'hidden',
  },
  boFill: {
    height: '100%',
    borderRadius: 3,
  },
});
