import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { formatRupiah } from '../../utils/currency';
import { CategoryDistributionItem } from '../../services/finance/statistics';

interface AnalyticsOverviewProps {
  income: number;
  expenses: number;
  categoryDistribution: CategoryDistributionItem[];
  savingsRate: number;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  income,
  expenses,
  categoryDistribution,
  savingsRate,
}) => {
  const maxCashflow = Math.max(income, expenses, 1);
  const incomeWidth = Math.round((income / maxCashflow) * 100);
  const expenseWidth = Math.round((expenses / maxCashflow) * 100);

  return (
    <View style={styles.container}>
      {/* Cashflow Comparison Bar */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>CASHFLOW COMPARISON</Text>

        <View style={styles.barItem}>
          <View style={styles.barLabelRow}>
            <Text style={styles.barLabel}>Income</Text>
            <Text style={[styles.barValue, { color: Colors.dark.income }]}>
              {formatRupiah(income)}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${incomeWidth}%`, backgroundColor: Colors.dark.income },
              ]}
            />
          </View>
        </View>

        <View style={styles.barItem}>
          <View style={styles.barLabelRow}>
            <Text style={styles.barLabel}>Expenses</Text>
            <Text style={[styles.barValue, { color: Colors.dark.expense }]}>
              {formatRupiah(expenses)}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${expenseWidth}%`, backgroundColor: Colors.dark.expense },
              ]}
            />
          </View>
        </View>

        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>SAVINGS RATE</Text>
          <Text style={[styles.rateValue, { color: savingsRate > 0 ? Colors.dark.income : Colors.dark.textSecondary }]}>
            {savingsRate}%
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>EXPENSE BY CATEGORY</Text>

        {categoryDistribution.length === 0 ? (
          <Text style={styles.emptyText}>No expense data for this period</Text>
        ) : (
          categoryDistribution.map((cat) => (
            <View key={cat.categoryId} style={styles.categoryRow}>
              <View style={styles.catHeader}>
                <View style={styles.catNameRow}>
                  <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
                <Text style={styles.catAmount}>{formatRupiah(cat.amount)}</Text>
              </View>

              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${cat.percentage}%`, backgroundColor: cat.color },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
  },
  cardTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  barItem: {
    marginBottom: 12,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
  },
  barValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.cardElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    marginTop: 4,
  },
  rateLabel: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  categoryRow: {
    marginBottom: 12,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '600',
  },
  catAmount: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
