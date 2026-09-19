import React from 'react';
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
import { useSettingsStore } from '../../store/settingsStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import { Colors } from '../../constants/colors';
import { formatRupiah } from '../../utils/currency';
import { getTodayDateString, getCurrentTimeString } from '../../utils/dates';
import { EmptyState } from '../../components/ui/EmptyState';

export default function DetectedReviewModal() {
  const router = useRouter();
  const {
    detectedNotifications,
    dismissDetectedNotification,
    clearDetectedNotifications,
  } = useSettingsStore();
  const { createTransaction } = useTransactionStore();
  const { wallets } = useWalletStore();

  const handleConfirm = async (index: number) => {
    const item = detectedNotifications[index];
    if (!item) return;

    if (wallets.length === 0) {
      Alert.alert('No Wallets', 'Please create a wallet first before confirming.');
      return;
    }

    // Match or fallback to first wallet
    const matchedWallet =
      wallets.find((w) => w.name.toLowerCase().includes(item.provider.toLowerCase())) ||
      wallets[0];

    try {
      await createTransaction({
        type: item.type,
        amount: item.amount,
        walletId: matchedWallet.id,
        description: item.description,
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        source: 'notification',
        confirmed: true,
      });

      dismissDetectedNotification(index);
      Alert.alert('Confirmed', 'Transaction recorded to sovereign ledger.');
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not record transaction.');
    }
  };

  const handleEditAndConfirm = (index: number) => {
    const item = detectedNotifications[index];
    if (!item) return;
    dismissDetectedNotification(index);
    router.push({
      pathname: '/modal/new-transaction',
      params: {
        type: item.type,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Detected Notifications"
        subtitle="AUTOMATED PARSER"
        showBack
        onBack={() => router.back()}
        rightAction={
          detectedNotifications.length > 0 ? (
            <TouchableOpacity onPress={clearDetectedNotifications}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {detectedNotifications.length === 0 ? (
          <EmptyState
            icon="notifications-none"
            title="Queue Empty"
            description="No pending financial notifications detected. New DANA, GoPay, OVO, or bank notifications will show up here for verification."
          />
        ) : (
          detectedNotifications.map((notif, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.cardHeader}>
                <View style={styles.providerBadge}>
                  <Text style={styles.providerText}>{notif.provider}</Text>
                </View>
                <Text style={styles.confidenceText}>
                  {Math.round(notif.confidence * 100)}% Confidence
                </Text>
              </View>

              <Text style={styles.descriptionText}>{notif.description}</Text>
              <Text
                style={[
                  styles.amountText,
                  {
                    color:
                      notif.type === 'income'
                        ? Colors.dark.income
                        : notif.type === 'expense'
                        ? Colors.dark.expense
                        : Colors.dark.transfer,
                  },
                ]}
              >
                {notif.type === 'income'
                  ? `+${formatRupiah(notif.amount)}`
                  : notif.type === 'expense'
                  ? `-${formatRupiah(notif.amount)}`
                  : formatRupiah(notif.amount)}
              </Text>

              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Cat: {notif.suggestedCategory}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Wallet: {notif.suggestedWallet}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={() => dismissDetectedNotification(index)}
                >
                  <Text style={styles.rejectBtnText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.editBtn]}
                  onPress={() => handleEditAndConfirm(index)}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn]}
                  onPress={() => handleConfirm(index)}
                >
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  clearAllText: {
    color: Colors.dark.expense,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerBadge: {
    backgroundColor: Colors.dark.primarySubtle,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  providerText: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confidenceText: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  descriptionText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: Colors.dark.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rejectBtnText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  editBtn: {
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  editBtnText: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: '700',
  },
  confirmBtn: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: Colors.dark.primary,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
