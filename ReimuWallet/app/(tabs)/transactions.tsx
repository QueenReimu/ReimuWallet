import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { TransactionRow } from '../../components/transactions/TransactionRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTransactionStore } from '../../store/transactionStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Colors } from '../../constants/colors';
import {
  getCurrentMonthString,
  formatMonthYearHeader,
  getPreviousMonth,
  getNextMonth,
  formatDisplayDate,
} from '../../utils/dates';
import { TransactionType } from '../../types/transaction';

export default function TransactionsScreen() {
  const router = useRouter();
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    removeTransaction,
    fetchTransactions,
  } = useTransactionStore();
  const { isBalanceHidden } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');

  useEffect(() => {
    fetchTransactions();
  }, [selectedMonth]);

  const filteredTransactions = transactions.filter((tx) => {
    // Month filter
    if (!tx.date.startsWith(selectedMonth)) return false;
    // Type filter
    if (selectedType !== 'all' && tx.type !== selectedType) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.categoryName?.toLowerCase().includes(q);
      const matchWallet = tx.walletName?.toLowerCase().includes(q);
      return matchDesc || matchCat || matchWallet;
    }
    return true;
  });

  // Group transactions by date
  const groupedByDate: Record<string, typeof transactions> = {};
  for (const tx of filteredTransactions) {
    if (!groupedByDate[tx.date]) {
      groupedByDate[tx.date] = [];
    }
    groupedByDate[tx.date].push(tx);
  }

  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  const handleDelete = (id: string, desc: string) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to remove "${desc}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeTransaction(id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Transaction Ledger"
        subtitle="IMMUTABLE HISTORY"
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/modal/new-transaction')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

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

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={18} color={Colors.dark.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search descriptions, merchants..."
          placeholderTextColor={Colors.dark.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={16} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['all', 'expense', 'income', 'transfer'] as const).map((t) => {
          const isActive = selectedType === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabChip, isActive && styles.activeTabChip]}
              onPress={() => setSelectedType(t)}
            >
              <Text style={[styles.tabChipText, isActive && styles.activeTabChipText]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ledger List */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
      >
        {sortedDates.length === 0 ? (
          <EmptyState
            icon="search-off"
            title="No Records Found"
            description="No transactions match your current filter and month selection."
            actionLabel="Add Transaction"
            onAction={() => router.push('/modal/new-transaction')}
          />
        ) : (
          sortedDates.map((dateStr) => {
            const txsOnDate = groupedByDate[dateStr];
            return (
              <View key={dateStr} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText}>{formatDisplayDate(dateStr)}</Text>
                  <Text style={styles.txCountText}>{txsOnDate.length} entries</Text>
                </View>

                {txsOnDate.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    isBalanceHidden={isBalanceHidden}
                    onPress={() => router.push({ pathname: '/modal/new-transaction', params: { id: tx.id } })}
                    onLongPress={() => handleDelete(tx.id, tx.description)}
                  />
                ))}
              </View>
            );
          })
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  activeTabChip: {
    backgroundColor: Colors.dark.primarySubtle,
    borderColor: Colors.dark.primary,
  },
  tabChipText: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeTabChipText: {
    color: Colors.dark.primary,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dateHeaderText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  txCountText: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
