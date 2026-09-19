import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_STORAGE_KEY = 'reimu_sanctuary_pin_hash';
const BIOMETRIC_ENABLED_KEY = 'reimu_biometric_enabled';
const HIDE_BALANCE_KEY = 'reimu_hide_balance_enabled';

export class SecurityService {
  /**
   * Check if the device hardware supports biometrics (Fingerprint/FaceID)
   */
  public static async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }

  /**
   * Prompt biometric authentication
   */
  public static async authenticateBiometric(promptMessage = 'Unlock ReimuWallet Sanctuary'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Save app PIN securely into device Keystore / Keychain
   */
  public static async setAppPin(pin: string): Promise<void> {
    // In production, encrypt/hash before saving
    await SecureStore.setItemAsync(PIN_STORAGE_KEY, pin);
  }

  public static async verifyAppPin(pin: string): Promise<boolean> {
    try {
      const stored = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
      if (!stored) return true; // No PIN configured
      return stored === pin;
    } catch {
      return false;
    }
  }

  public static async hasPinConfigured(): Promise<boolean> {
    try {
      const stored = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
      return !!stored;
    } catch {
      return false;
    }
  }

  public static async removePin(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_STORAGE_KEY);
  }
}
