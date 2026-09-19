import { create } from 'zustand';
import { ParsedNotificationResult } from '../services/notifications/parser';

interface SettingsState {
  isBiometricEnabled: boolean;
  isPinEnabled: boolean;
  isBalanceHidden: boolean;
  theme: 'dark' | 'light';
  detectedNotifications: ParsedNotificationResult[];

  toggleHideBalance: () => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setPinEnabled: (enabled: boolean) => void;
  addDetectedNotification: (notif: ParsedNotificationResult) => void;
  dismissDetectedNotification: (index: number) => void;
  clearDetectedNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isBiometricEnabled: false,
  isPinEnabled: false,
  isBalanceHidden: false,
  theme: 'dark',
  detectedNotifications: [],

  toggleHideBalance: () => set((s) => ({ isBalanceHidden: !s.isBalanceHidden })),
  setBiometricEnabled: (enabled) => set({ isBiometricEnabled: enabled }),
  setPinEnabled: (enabled) => set({ isPinEnabled: enabled }),

  addDetectedNotification: (notif) =>
    set((s) => ({ detectedNotifications: [notif, ...s.detectedNotifications] })),

  dismissDetectedNotification: (index) =>
    set((s) => ({
      detectedNotifications: s.detectedNotifications.filter((_, i) => i !== index),
    })),

  clearDetectedNotifications: () => set({ detectedNotifications: [] }),
}));
