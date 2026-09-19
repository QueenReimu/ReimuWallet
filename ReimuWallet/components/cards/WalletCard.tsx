import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Wallet } from '../../types/wallet';
import { Colors } from '../../constants/colors';
import { formatRupiah } from '../../utils/currency';

interface WalletCardProps {
  wallet: Wallet;
  balance: number;
  isBalanceHidden: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  balance,
  isBalanceHidden,
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: `${wallet.color || Colors.dark.primary}20` }]}>
          <MaterialIcons
            name={(wallet.icon as any) || 'account-balance-wallet'}
            size={18}
            color={wallet.color || Colors.dark.primary}
          />
        </View>

        {wallet.isPrimary && (
          <View style={styles.primaryPill}>
            <Text style={styles.primaryText}>MAIN</Text>
          </View>
        )}
      </View>

      <Text style={styles.walletName} numberOfLines={1}>
        {wallet.name}
      </Text>
      <Text style={styles.walletType}>
        {wallet.type.toUpperCase()}
      </Text>

      <Text style={styles.balanceText} numberOfLines={1}>
        {isBalanceHidden ? '••••••' : formatRupiah(balance)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 12,
    marginRight: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPill: {
    backgroundColor: Colors.dark.primarySubtle,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  primaryText: {
    color: Colors.dark.primary,
    fontSize: 8,
    fontWeight: '800',
  },
  walletName: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  walletType: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  balanceText: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
});
