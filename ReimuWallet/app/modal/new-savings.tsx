import React, { useState } from 'react';
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
import { useSavingsStore } from '../../store/savingsStore';
import { Colors } from '../../constants/colors';
import { parseRupiahInput, formatRupiah } from '../../utils/currency';
import { savingsGoalSchema } from '../../utils/validation';

const GOAL_ICONS: (keyof typeof MaterialIcons.glyphMap)[] = [
  'savings',
  'desktop-windows',
  'two-wheeler',
  'home',
  'flight',
  'school',
  'favorite',
];

export default function NewSavingsModal() {
  const router = useRouter();
  const { createGoal } = useSavingsStore();

  const [name, setName] = useState('');
  const [rawTarget, setRawTarget] = useState('');
  const [rawCurrent, setRawCurrent] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('savings');

  const handleSave = async () => {
    const targetAmount = parseRupiahInput(rawTarget);
    const currentAmount = parseRupiahInput(rawCurrent);

    const payload = {
      name: name.trim(),
      targetAmount,
      currentAmount,
      targetDate: targetDate.trim() || undefined,
      icon: selectedIcon,
      color: Colors.dark.primary,
    };

    const validation = savingsGoalSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Validation Error', validation.error.issues[0]?.message || 'Please check inputs.');
      return;
    }

    try {
      await createGoal(payload);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create goal');
    }
  };

  const parsedTarget = parseRupiahInput(rawTarget);

  return (
    <View style={styles.container}>
      <Header
        title="Create Savings Target"
        subtitle="FUTURE RESERVES"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Goal Name */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>TARGET GOAL TITLE</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Emergency Fund, New Rig, Vacation"
            placeholderTextColor={Colors.dark.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* Target Amount */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>TARGET AMOUNT (IDR)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.dark.textMuted}
              value={rawTarget}
              onChangeText={setRawTarget}
            />
          </View>
          {parsedTarget > 0 && (
            <Text style={styles.amountPreview}>{formatRupiah(parsedTarget)}</Text>
          )}
        </View>

        {/* Current Starting Stash */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>CURRENT RESERVES ALREADY ACCUMULATED (OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={Colors.dark.textMuted}
            value={rawCurrent}
            onChangeText={setRawCurrent}
          />
        </View>

        {/* Target Date */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>DEADLINE / TARGET DATE (YYYY-MM-DD, OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="2026-12-31"
            placeholderTextColor={Colors.dark.textMuted}
            value={targetDate}
            onChangeText={setTargetDate}
          />
        </View>

        {/* Icon Picker */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>CHOOSE ICON</Text>
          <View style={styles.iconsRow}>
            {GOAL_ICONS.map((ico) => {
              const isSelected = selectedIcon === ico;
              return (
                <TouchableOpacity
                  key={ico}
                  style={[styles.iconChip, isSelected && styles.activeIconChip]}
                  onPress={() => setSelectedIcon(ico)}
                >
                  <MaterialIcons
                    name={ico}
                    size={20}
                    color={isSelected ? Colors.dark.primary : Colors.dark.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>CREATE SAVINGS GOAL</Text>
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
  iconsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconChip: {
    backgroundColor: Colors.dark.primarySubtle,
    borderColor: Colors.dark.primary,
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
