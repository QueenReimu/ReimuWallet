import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { AnalyticsOverview } from '../../components/charts/AnalyticsOverview';
import { useTransactionStore } from '../../store/transactionStore';
import { Colors } from '../../constants/colors';
import { formatRupiah } from '../../utils/currency';
import {
  getCurrentMonthString,
  formatMonthYearHeader,
  getPreviousMonth,
  getNextMonth,
} from '../../utils/dates';
import { calculateMonthlyFinanceSummary } from '../../services/finance/monthly';
import { calculateCategoryDistribution } from '../../services/finance/statistics';

export default function AnalyticsScreen() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const { transactions } = useTransactionStore();

  const summary = calculateMonthlyFinanceSummary(selectedMonth, transactions);
  const categoryDistribution = calculateCategoryDistribution(transactions, selectedMonth);

  return (
    <View style={styles.container}>
      <Header title="Financial Insights" subtitle="AGGREGATE METRICS" />

      {/* Month Navigator */}
      <View style={styles.monthBar}>
        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
        >
          <MaterialIcons name="chevron-left" size={20} color={Colors.dark.text} />
        </TouchableOpacity>

        <Text style={styles.monthText}>{formatMonthYearHeader(selectedMonth)}</Text>

        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => setSelectedMonth(getNextMonth(selectedMonth))}
        >
          <MaterialIcons name="chevron-right" size={20} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>NET SAVINGS</Text>
            <Text
              style={[
                styles.metricValue,
                { color: summary.savings >= 0 ? Colors.dark.income : Colors.dark.expense },
              ]}
            >
              {summary.savings >= 0 ? `+${formatRupiah(summary.savings)}` : formatRupiah(summary.savings)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>DAILY AVERAGE</Text>
            <Text style={styles.metricValue}>{formatRupiah(summary.averageDailySpending)}</Text>
          </View>
        </View>

        {/* Charts and Breakdown */}
        <AnalyticsOverview
          income={summary.income}
          expenses={summary.expenses}
          categoryDistribution={categoryDistribution}
          savingsRate={summary.savingsRate}
        />

        {/* Notable Highlights Card */}
        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>NOTABLE HIGHLIGHTS</Text>

          <View style={styles.highlightRow}>
            <Text style={styles.highlightKey}>Largest Expense</Text>
            <Text style={styles.highlightVal}>
              {summary.largestExpense
                ? `${summary.largestExpense.description} (${formatRupiah(summary.largestExpense.amount)})`
                : 'None'}
            </Text>
          </View>

          <View style={styles.highlightRow}>
            <Text style={styles.highlightKey}>Largest Income</Text>
            <Text style={styles.highlightVal}>
              {summary.largestIncome
                ? `${summary.largestIncome.description} (${formatRupiah(summary.largestIncome.amount)})`
                : 'None'}
            </Text>
          </View>

          <View style={styles.highlightRow}>
            <Text style={styles.highlightKey}>Primary Outflow Category</Text>
            <Text style={styles.highlightVal}>
              {summary.mostExpensiveCategory
                ? `${summary.mostExpensiveCategory.name} (${formatRupiah(summary.mostExpensiveCategory.amount)})`
                : 'None'}
            </Text>
          </View>

          <View style={styles.highlightRow}>
            <Text style={styles.highlightKey}>Total Recorded Entries</Text>
            <Text style={styles.highlightVal}>{summary.transactionCount} transactions</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 12,
  },
  metricLabel: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metricValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  highlightCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
  },
  highlightTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  highlightKey: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  highlightVal: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
});
