import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { BalanceHeroCard } from '../../components/cards/BalanceHeroCard';
import { WalletCard } from '../../components/cards/WalletCard';
import { TransactionRow } from '../../components/transactions/TransactionRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import { useSettingsStore } from '../../store/settingsStore';
import { calculateTotalAssets, calculateWalletBalance } from '../../services/finance/balance';
import { calculateMonthlyFinanceSummary } from '../../services/finance/monthly';
import { Colors } from '../../constants/colors';
import { getCurrentMonthString } from '../../utils/dates';

export default function DashboardScreen() {
  const router = useRouter();
  const { transactions, fetchTransactions, isLoading: txLoading } = useTransactionStore();
  const { wallets, fetchWallets, isLoading: walletLoading } = useWalletStore();
  const {
    isBalanceHidden,
    toggleHideBalance,
    detectedNotifications,
  } = useSettingsStore();

  const currentMonth = getCurrentMonthString();

  useEffect(() => {
    fetchWallets();
    fetchTransactions();
  }, []);

  const onRefresh = async () => {
    await Promise.all([fetchWallets(), fetchTransactions()]);
  };

  const totalAssets = calculateTotalAssets(wallets, transactions);
  const monthlySummary = calculateMonthlyFinanceSummary(currentMonth, transactions);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <Header
        title="ReimuWallet"
        subtitle="SOVEREIGN LEDGER"
        rightAction={
          detectedNotifications.length > 0 ? (
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => router.push('/modal/detected-review')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="notifications-active" size={18} color="#FFFFFF" />
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{detectedNotifications.length}</Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={txLoading || walletLoading}
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
          />
        }
      >
        {/* Hero Card */}
        <BalanceHeroCard
          totalAssets={totalAssets}
          monthlyIncome={monthlySummary.income}
          monthlyExpenses={monthlySummary.expenses}
          isBalanceHidden={isBalanceHidden}
          onToggleHideBalance={toggleHideBalance}
          onAddExpense={() =>
            router.push({ pathname: '/modal/new-transaction', params: { type: 'expense' } })
          }
          onAddIncome={() =>
            router.push({ pathname: '/modal/new-transaction', params: { type: 'income' } })
          }
          onTransfer={() =>
            router.push({ pathname: '/modal/new-transaction', params: { type: 'transfer' } })
          }
        />

        {/* Wallets Carousel Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SOVEREIGN WALLETS</Text>
          <TouchableOpacity
            onPress={() => router.push('/modal/new-wallet')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionAction}>+ Add Wallet</Text>
          </TouchableOpacity>
        </View>

        {wallets.length === 0 ? (
          <View style={styles.emptyWalletsBox}>
            <Text style={styles.emptyWalletsText}>No wallets configured yet</Text>
            <TouchableOpacity
              style={styles.addWalletBtn}
              onPress={() => router.push('/modal/new-wallet')}
            >
              <Text style={styles.addWalletBtnText}>Create Main Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.walletsScroll}
            contentContainerStyle={styles.walletsScrollContent}
          >
            {wallets.map((w) => {
              const liveBalance = calculateWalletBalance(w, transactions);
              return (
                <WalletCard
                  key={w.id}
                  wallet={w}
                  balance={liveBalance}
                  isBalanceHidden={isBalanceHidden}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/transactions',
                      params: { walletId: w.id },
                    });
                  }}
                />
              );
            })}
          </ScrollView>
        )}

        {/* Recent Transactions Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          {transactions.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/transactions')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="Clean Slate"
            description="Your financial ledger is completely clean. Tap below to log your first transaction."
            actionLabel="Add Transaction"
            onAction={() =>
              router.push({ pathname: '/modal/new-transaction', params: { type: 'expense' } })
            }
          />
        ) : (
          recentTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              isBalanceHidden={isBalanceHidden}
            />
          ))
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  alertBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: 'center',
  },
  alertBadgeText: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionAction: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  walletsScroll: {
    marginHorizontal: -16,
  },
  walletsScrollContent: {
    paddingHorizontal: 16,
  },
  emptyWalletsBox: {
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyWalletsText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  addWalletBtn: {
    backgroundColor: Colors.dark.cardElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  addWalletBtnText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
