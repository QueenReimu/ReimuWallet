import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { parseIncomingNotification, ParsedNotificationResult } from './parser';

const { ReimuNotificationListener } = NativeModules;

export interface RawNotificationPayload {
  packageName: string;
  title: string;
  text: string;
  timestamp: number;
}

export class NotificationDetectorService {
  private static eventEmitter: NativeEventEmitter | null = null;

  public static async isPermissionGranted(): Promise<boolean> {
    if (Platform.OS !== 'android' || !ReimuNotificationListener) {
      return false;
    }
    try {
      return await ReimuNotificationListener.isPermissionGranted();
    } catch (e) {
      console.warn('Failed to check notification permission', e);
      return false;
    }
  }

  public static requestPermission(): void {
    if (Platform.OS === 'android' && ReimuNotificationListener) {
      ReimuNotificationListener.requestPermission();
    }
  }

  public static subscribe(
    onDetected: (parsed: ParsedNotificationResult, raw: RawNotificationPayload) => void
  ): () => void {
    if (Platform.OS !== 'android' || !ReimuNotificationListener) {
      return () => {};
    }

    if (!this.eventEmitter) {
      this.eventEmitter = new NativeEventEmitter(ReimuNotificationListener);
    }

    const subscription = this.eventEmitter.addListener(
      'onNotificationReceived',
      (payload: RawNotificationPayload) => {
        const parsed = parseIncomingNotification(
          payload.packageName,
          payload.title,
          payload.text
        );
        if (parsed) {
          onDetected(parsed, payload);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }

  public static async getPendingQueue(): Promise<ParsedNotificationResult[]> {
    if (Platform.OS !== 'android' || !ReimuNotificationListener) {
      return [];
    }
    try {
      const rawQueueStr: string = await ReimuNotificationListener.getPendingQueue();
      const rawList: RawNotificationPayload[] = JSON.parse(rawQueueStr || '[]');
      const parsedList: ParsedNotificationResult[] = [];

      for (const item of rawList) {
        const parsed = parseIncomingNotification(item.packageName, item.title, item.text);
        if (parsed) {
          parsedList.push(parsed);
        }
      }

      return parsedList;
    } catch (e) {
      console.warn('Failed to fetch pending notification queue', e);
      return [];
    }
  }

  public static async clearPendingQueue(): Promise<void> {
    if (Platform.OS === 'android' && ReimuNotificationListener) {
      await ReimuNotificationListener.clearPendingQueue();
    }
  }
}
