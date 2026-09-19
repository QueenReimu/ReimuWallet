import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { useWalletStore } from '../../store/walletStore';
import { Colors } from '../../constants/colors';
import { WalletType } from '../../types/wallet';
import { parseRupiahInput, formatRupiah } from '../../utils/currency';
import { walletSchema } from '../../utils/validation';

const WALLET_TYPES: { type: WalletType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { type: 'cash', label: 'Cash', icon: 'payments' },
  { type: 'bank', label: 'Bank', icon: 'account-balance' },
  { type: 'ewallet', label: 'E-Wallet', icon: 'account-balance-wallet' },
  { type: 'vault', label: 'Vault', icon: 'shield' },
  { type: 'savings', label: 'Savings', icon: 'savings' },
];

const WALLET_COLORS = [
  '#FF3E00', // Torii Vermilion
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Slate
];

export default function NewWalletModal() {
  const router = useRouter();
  const { createWallet } = useWalletStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [rawBalance, setRawBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF3E00');
  const [isPrimary, setIsPrimary] = useState(false);

  const handleSave = async () => {
    const initialBalance = parseRupiahInput(rawBalance);

    const payload = {
      name: name.trim(),
      type,
      initialBalance,
      icon: WALLET_TYPES.find((w) => w.type === type)?.icon || 'account-balance-wallet',
      color: selectedColor,
      accountNumber: accountNumber.trim() || undefined,
      isPrimary,
    };

    const validation = walletSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Validation Error', validation.error.issues[0]?.message || 'Please check inputs.');
      return;
    }

    try {
      await createWallet(payload);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create wallet');
    }
  };

  const parsedBalance = parseRupiahInput(rawBalance);

  return (
    <View style={styles.container}>
      <Header
        title="Create Wallet"
        subtitle="SOVEREIGN ASSET"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Wallet Name */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>WALLET / ACCOUNT NAME</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. BCA Main Account, DANA, Petty Cash"
            placeholderTextColor={Colors.dark.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* Type Selector */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>ACCOUNT TYPE</Text>
          <View style={styles.typeGrid}>
            {WALLET_TYPES.map((item) => {
              const isSelected = type === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[styles.typeBtn, isSelected && styles.activeTypeBtn]}
                  onPress={() => setType(item.type)}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={18}
                    color={isSelected ? Colors.dark.primary : Colors.dark.textSecondary}
                  />
                  <Text style={[styles.typeBtnText, isSelected && styles.activeTypeBtnText]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Starting Balance */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>INITIAL STARTING BALANCE</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.dark.textMuted}
              value={rawBalance}
              onChangeText={setRawBalance}
            />
          </View>
          {parsedBalance > 0 && (
            <Text style={styles.amountPreview}>{formatRupiah(parsedBalance)}</Text>
          )}
        </View>

        {/* Optional Account Number */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>ACCOUNT NUMBER / IDENTIFIER (OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 5270123456 (Stored locally only)"
            placeholderTextColor={Colors.dark.textMuted}
            value={accountNumber}
            onChangeText={setAccountNumber}
          />
        </View>

        {/* Color Palette */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>BADGE COLOR</Text>
          <View style={styles.colorsRow}>
            {WALLET_COLORS.map((c) => {
              const isSelected = selectedColor === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isSelected && styles.activeColorCircle,
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              );
            })}
          </View>
        </View>

        {/* Primary Toggle */}
        <View style={styles.switchCard}>
          <View>
            <Text style={styles.switchTitle}>Set as Primary Wallet</Text>
            <Text style={styles.switchDesc}>Default for new transactions and transfers</Text>
          </View>
          <Switch
            value={isPrimary}
            onValueChange={setIsPrimary}
            trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>INITIALIZE WALLET</Text>
        </TouchableOpacity>
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
  textInput: {
    color: Colors.dark.text,
    fontSize: 13,
    paddingVertical: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  activeTypeBtn: {
    backgroundColor: Colors.dark.primarySubtle,
    borderColor: Colors.dark.primary,
  },
  typeBtnText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  activeTypeBtnText: {
    color: Colors.dark.primary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    color: Colors.dark.primary,
    fontSize: 22,
    fontWeight: '800',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  amountPreview: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  activeColorCircle: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 12,
  },
  switchTitle: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  switchDesc: {
    color: Colors.dark.textMuted,
    fontSize: 11,
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
});
