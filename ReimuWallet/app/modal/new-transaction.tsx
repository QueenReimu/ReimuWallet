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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../../constants/categories';
import { Colors } from '../../constants/colors';
import { formatRupiah, parseRupiahInput } from '../../utils/currency';
import { getTodayDateString, getCurrentTimeString } from '../../utils/dates';
import { TransactionType } from '../../types/transaction';
import { transactionSchema } from '../../utils/validation';

export default function NewTransactionModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const isEditing = Boolean(params.id);

  const initialType = (params.type as TransactionType) || 'expense';
  const [type, setType] = useState<TransactionType>(initialType);
  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [walletId, setWalletId] = useState('');
  const [destinationWalletId, setDestinationWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());

  const { transactions, createTransaction, modifyTransaction, removeTransaction } = useTransactionStore();
  const { wallets, fetchWallets } = useWalletStore();

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    if (params.id) {
      const existing = transactions.find((t) => t.id === params.id);
      if (existing) {
        setType(existing.type);
        setRawAmount(String(existing.amount));
        setDescription(existing.description || '');
        setWalletId(existing.walletId);
        if (existing.destinationWalletId) {
          setDestinationWalletId(existing.destinationWalletId);
        }
        if (existing.categoryId) {
          setCategoryId(existing.categoryId);
        }
        setDate(existing.date);
        if (existing.time) {
          setTime(existing.time);
        }
      }
    }
  }, [params.id, transactions]);

  useEffect(() => {
    if (!isEditing && wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
      if (wallets.length > 1) {
        setDestinationWalletId(wallets[1].id);
      }
    }
  }, [wallets, isEditing]);

  const categories =
    type === 'expense'
      ? DEFAULT_EXPENSE_CATEGORIES
      : type === 'income'
      ? DEFAULT_INCOME_CATEGORIES
      : [];

  const handleSave = async () => {
    const amount = parseRupiahInput(rawAmount);

    if (wallets.length === 0) {
      Alert.alert(
        'No Wallets Configured',
        'Please create at least one wallet before recording transactions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Wallet', onPress: () => router.push('/modal/new-wallet') },
        ]
      );
      return;
    }

    const payload = {
      type,
      amount,
      walletId,
      destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
      categoryId: type !== 'transfer' ? categoryId || undefined : undefined,
      description: description.trim() || (type === 'transfer' ? 'Transfer' : 'General Transaction'),
      date,
      time,
      source: 'manual' as const,
      confirmed: true,
    };

    const validation = transactionSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Validation Error', validation.error.issues[0]?.message || 'Please check inputs.');
      return;
    }

    try {
      if (isEditing && params.id) {
        await modifyTransaction(params.id, payload);
      } else {
        await createTransaction(payload);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Failed to save transaction.');
    }
  };

  const handleDelete = () => {
    if (!params.id) return;
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to permanently remove this transaction from the ledger?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTransaction(params.id!);
              router.back();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Failed to delete transaction.');
            }
          },
        },
      ]
    );
  };

  const parsedAmount = parseRupiahInput(rawAmount);

  return (
    <View style={styles.container}>
      <Header
        title={
          isEditing
            ? 'Edit Transaction'
            : type === 'expense'
            ? 'Record Expense'
            : type === 'income'
            ? 'Record Income'
            : 'Transfer Liquidity'
        }
        subtitle="SOVEREIGN LEDGER"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          {(['expense', 'income', 'transfer'] as const).map((t) => {
            const isActive = type === t;
            const activeColor =
              t === 'expense'
                ? Colors.dark.expense
                : t === 'income'
                ? Colors.dark.income
                : Colors.dark.transfer;

            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeBtn,
                  isActive && {
                    backgroundColor: `${activeColor}20`,
                    borderColor: activeColor,
                  },
                ]}
                onPress={() => setType(t)}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    isActive && { color: activeColor },
                  ]}
                >
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>AMOUNT (IDR)</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.dark.textMuted}
              value={rawAmount}
              onChangeText={setRawAmount}
              autoFocus
            />
          </View>
          {parsedAmount > 0 && (
            <Text style={styles.amountPreview}>{formatRupiah(parsedAmount)}</Text>
          )}
        </View>

        {/* Source Wallet Picker */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            {type === 'transfer' ? 'FROM SOURCE WALLET' : 'WALLET / ACCOUNT'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
            {wallets.map((w) => {
              const isSelected = walletId === w.id;
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.pickerChip, isSelected && styles.activePickerChip]}
                  onPress={() => setWalletId(w.id)}
                >
                  <MaterialIcons
                    name={(w.icon as any) || 'account-balance-wallet'}
                    size={16}
                    color={isSelected ? Colors.dark.primary : Colors.dark.textMuted}
                  />
                  <Text style={[styles.pickerChipText, isSelected && styles.activePickerChipText]}>
                    {w.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Destination Wallet Picker (For Transfers only) */}
        {type === 'transfer' && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>TO DESTINATION WALLET</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {wallets
                .filter((w) => w.id !== walletId)
                .map((w) => {
                  const isSelected = destinationWalletId === w.id;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.pickerChip, isSelected && styles.activePickerChip]}
                      onPress={() => setDestinationWalletId(w.id)}
                    >
                      <MaterialIcons
                        name={(w.icon as any) || 'account-balance-wallet'}
                        size={16}
                        color={isSelected ? Colors.dark.primary : Colors.dark.textMuted}
                      />
                      <Text style={[styles.pickerChipText, isSelected && styles.activePickerChipText]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        )}

        {/* Category Picker (For Expense & Income) */}
        {type !== 'transfer' && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>CATEGORY</Text>
            <View style={styles.catGrid}>
              {categories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catChip, isSelected && styles.activeCatChip]}
                    onPress={() => setCategoryId(c.id)}
                  >
                    <MaterialIcons
                      name={(c.icon as any) || 'category'}
                      size={16}
                      color={isSelected ? Colors.dark.primary : Colors.dark.textSecondary}
                    />
                    <Text style={[styles.catChipText, isSelected && styles.activeCatChipText]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Description & Note */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>DESCRIPTION / NOTE</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Lunch at Hakurei Shrine"
            placeholderTextColor={Colors.dark.textMuted}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Date and Time Row */}
        <View style={styles.dateRow}>
          <View style={[styles.inputCard, { flex: 1 }]}>
            <Text style={styles.inputLabel}>DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={[styles.inputCard, { flex: 1 }]}>
            <Text style={styles.inputLabel}>TIME (HH:MM)</Text>
            <TextInput
              style={styles.textInput}
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>
            {isEditing ? 'SAVE CHANGES' : 'COMMIT TO LEDGER'}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
            <MaterialIcons name="delete-outline" size={18} color={Colors.dark.expense} />
            <Text style={styles.deleteButtonText}>DELETE TRANSACTION</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
    gap: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  typeBtnText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  inputCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 12,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    color: Colors.dark.primary,
    fontSize: 24,
    fontWeight: '800',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  amountPreview: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  pickerScroll: {
    flexDirection: 'row',
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.cardElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginRight: 8,
  },
  activePickerChip: {
    backgroundColor: Colors.dark.primarySubtle,
    borderColor: Colors.dark.primary,
  },
  pickerChipText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activePickerChipText: {
    color: Colors.dark.primary,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  activeCatChip: {
    backgroundColor: Colors.dark.primarySubtle,
    borderColor: Colors.dark.primary,
  },
  catChipText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  activeCatChipText: {
    color: Colors.dark.primary,
  },
  textInput: {
    color: Colors.dark.text,
    fontSize: 13,
    paddingVertical: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: `${Colors.dark.expense}15`,
    borderWidth: 1,
    borderColor: `${Colors.dark.expense}40`,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  deleteButtonText: {
    color: Colors.dark.expense,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
