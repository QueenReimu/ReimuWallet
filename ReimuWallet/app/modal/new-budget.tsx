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
import { useBudgetStore } from '../../store/budgetStore';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../constants/categories';
import { Colors } from '../../constants/colors';
import { getCurrentMonthString } from '../../utils/dates';
import { parseRupiahInput, formatRupiah } from '../../utils/currency';
import { budgetSchema } from '../../utils/validation';

export default function NewBudgetModal() {
  const router = useRouter();
  const { saveBudget } = useBudgetStore();

  const [categoryId, setCategoryId] = useState(DEFAULT_EXPENSE_CATEGORIES[0]?.id || '');
  const [rawLimit, setRawLimit] = useState('');
  const currentMonth = getCurrentMonthString();

  const handleSave = async () => {
    const monthlyLimit = parseRupiahInput(rawLimit);

    const payload = {
      categoryId,
      monthlyLimit,
      month: currentMonth,
    };

    const validation = budgetSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Validation Error', validation.error.issues[0]?.message || 'Please check limit.');
      return;
    }

    try {
      await saveBudget(categoryId, monthlyLimit, currentMonth);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to set budget');
    }
  };

  const parsedLimit = parseRupiahInput(rawLimit);

  return (
    <View style={styles.container}>
      <Header
        title="Set Budget Limit"
        subtitle="CAPITAL PROTECTION"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Category Picker */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>CATEGORY TO CONSTRAIN</Text>
          <View style={styles.catGrid}>
            {DEFAULT_EXPENSE_CATEGORIES.map((c) => {
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

        {/* Monthly Limit */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>MONTHLY LIMIT (IDR)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.dark.textMuted}
              value={rawLimit}
              onChangeText={setRawLimit}
              autoFocus
            />
          </View>
          {parsedLimit > 0 && (
            <Text style={styles.amountPreview}>{formatRupiah(parsedLimit)} / month</Text>
          )}
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>ENFORCE BUDGET</Text>
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
