import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { useWalletStore } from '../../store/walletStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useBudgetStore } from '../../store/budgetStore';
import { useSavingsStore } from '../../store/savingsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getDatabase } from '../../database/database';
import { seedDevelopmentSampleData, clearAllDatabaseData } from '../../database/migrations';
import { generateJsonBackup, generateCsvTransactions } from '../../services/backup/export';
import { validateAndParseBackup } from '../../services/backup/import';
import { runFinancialAccuracyTest } from '../../tests/financialCalculations.test';
import { Colors } from '../../constants/colors';
import { APP_CONFIG } from '../../constants/config';

export default function VaultScreen() {
  const router = useRouter();
  const { wallets, fetchWallets, removeWallet } = useWalletStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { budgets, fetchBudgets } = useBudgetStore();
  const { goals, fetchGoals } = useSavingsStore();
  const {
    isBalanceHidden,
    toggleHideBalance,
    isBiometricEnabled,
    setBiometricEnabled,
  } = useSettingsStore();

  const [testResult, setTestResult] = useState<string | null>(null);

  const handleExportJson = async () => {
    try {
      const json = generateJsonBackup(wallets, transactions, budgets, goals);
      await Share.share({
        title: 'ReimuWallet Backup',
        message: json,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not export backup');
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = generateCsvTransactions(transactions);
      await Share.share({
        title: 'ReimuWallet Ledger CSV',
        message: csv,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not export CSV');
    }
  };

  const handleSeedSampleData = async () => {
    Alert.alert(
      'Generate Sample Data',
      'This will populate sample wallets, transactions, and budgets for previewing and testing. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            const db = await getDatabase();
            await seedDevelopmentSampleData(db);
            await Promise.all([fetchWallets(), fetchTransactions(), fetchBudgets('2026-09'), fetchGoals()]);
            Alert.alert('Success', 'Sample financial data generated successfully.');
          },
        },
      ]
    );
  };

  const handleClearDatabase = async () => {
    Alert.alert(
      'Factory Reset Enclave',
      'Are you sure you want to erase all wallets, transactions, and budgets? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: async () => {
            const db = await getDatabase();
            await clearAllDatabaseData(db);
            await Promise.all([fetchWallets(), fetchTransactions(), fetchBudgets('2026-09'), fetchGoals()]);
            Alert.alert('Enclave Clean', 'Database returned to pristine empty state.');
          },
        },
      ]
    );
  };

  const handleRunAccuracyTest = () => {
    const res = runFinancialAccuracyTest();
    if (res.passed) {
      setTestResult('PASSED: Section 28 verification succeeded with 100% accuracy!');
      Alert.alert('Section 28 Financial Accuracy', 'PASSED: 100% Math and Isolation Precision.');
    } else {
      setTestResult('FAILED: One or more assertions did not match.');
      Alert.alert('Financial Accuracy Test', 'FAILED: Verify calculations.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Sanctuary Enclave" subtitle="SECURITY & SETTINGS" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Sovereignty Badge Card */}
        <View style={styles.sovereigntyCard}>
          <View style={styles.sovHeader}>
            <MaterialIcons name="security" size={24} color={Colors.dark.primary} />
            <Text style={styles.sovTitle}>SOVEREIGN OFFLINE VAULT</Text>
          </View>
          <Text style={styles.sovDescription}>
            All financial computations and records are contained exclusively inside your device's
            hardware SQLite enclave. Zero analytics, zero cloud transmission, zero telemetry.
          </Text>
        </View>

        {/* Wallets Management */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CONFIGURED WALLETS</Text>
            <TouchableOpacity onPress={() => router.push('/modal/new-wallet')}>
              <Text style={styles.sectionAction}>+ New</Text>
            </TouchableOpacity>
          </View>

          {wallets.length === 0 ? (
            <Text style={styles.emptyNote}>No wallets configured in database</Text>
          ) : (
            wallets.map((w) => (
              <View key={w.id} style={styles.walletRow}>
                <View style={styles.walletInfo}>
                  <View style={[styles.walletDot, { backgroundColor: w.color || Colors.dark.primary }]} />
                  <View>
                    <Text style={styles.walletName}>{w.name}</Text>
                    <Text style={styles.walletType}>{w.type.toUpperCase()}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Remove Wallet', `Delete ${w.name}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => await removeWallet(w.id),
                      },
                    ]);
                  }}
                >
                  <MaterialIcons name="delete-outline" size={18} color={Colors.dark.expense} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Security Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SECURITY & PRIVACY</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.settingTitle}>Hide Sensitive Balances</Text>
              <Text style={styles.settingDesc}>Obfuscate amounts with bullets</Text>
            </View>
            <Switch
              value={isBalanceHidden}
              onValueChange={toggleHideBalance}
              trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingDesc}>Unlock using Fingerprint or Face</Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Backup & Export */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DATA SOVEREIGNTY (BACKUP / RESTORE)</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleExportJson}>
            <MaterialIcons name="file-download" size={18} color={Colors.dark.text} />
            <Text style={styles.actionRowText}>Export Sovereign JSON Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleExportCsv}>
            <MaterialIcons name="table-chart" size={18} color={Colors.dark.text} />
            <Text style={styles.actionRowText}>Export Transactions CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Development & Verification Suite */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DEVELOPER & AUDIT VERIFICATION</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleRunAccuracyTest}>
            <MaterialIcons name="verified" size={18} color={Colors.dark.income} />
            <Text style={[styles.actionRowText, { color: Colors.dark.income }]}>
              Run Section 28 Financial Accuracy Audit
            </Text>
          </TouchableOpacity>

          {testResult && <Text style={styles.testResultText}>{testResult}</Text>}

          <TouchableOpacity style={styles.actionRow} onPress={handleSeedSampleData}>
            <MaterialIcons name="playlist-add" size={18} color={Colors.dark.primary} />
            <Text style={[styles.actionRowText, { color: Colors.dark.primary }]}>
              Generate Development Sample Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleClearDatabase}>
            <MaterialIcons name="delete-forever" size={18} color={Colors.dark.expense} />
            <Text style={[styles.actionRowText, { color: Colors.dark.expense }]}>
              Factory Reset Enclave (Clear All Data)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionFooter}>
          {APP_CONFIG.name} v{APP_CONFIG.version} (Build {APP_CONFIG.build})
        </Text>
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
    gap: 16,
  },
  sovereigntyCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
  },
  sovHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sovTitle: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sovDescription: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionAction: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyNote: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    paddingVertical: 8,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  walletName: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
  walletType: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingLabelCol: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingDesc: {
    color: Colors.dark.textMuted,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  actionRowText: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '600',
  },
  testResultText: {
    color: Colors.dark.income,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: Colors.dark.incomeSubtle,
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  versionFooter: {
    textAlign: 'center',
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 8,
  },
});
