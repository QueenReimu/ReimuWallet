package com.reimu.wallet;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

public class ReimuNotificationListener extends NotificationListenerService {
    private static final String TAG = "ReimuNotifListener";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;

        String packageName = sbn.getPackageName();
        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;

        if (extras == null) return;

        CharSequence titleChar = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textChar = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextChar = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

        String title = titleChar != null ? titleChar.toString() : "";
        String text = textChar != null ? textChar.toString() : (bigTextChar != null ? bigTextChar.toString() : "");

        Log.d(TAG, "Notification received from " + packageName + ": " + title + " - " + text);

        // Filter financial packages (DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, BRI, etc.)
        boolean isFinancial = packageName.contains("dana") ||
                              packageName.contains("gojek") ||
                              packageName.contains("ovo") ||
                              packageName.contains("shopee") ||
                              packageName.contains("bca") ||
                              packageName.contains("mandiri") ||
                              packageName.contains("bri") ||
                              packageName.contains("bni");

        if (isFinancial || text.contains("Rp") || text.contains("IDR") || text.contains("berhasil") || text.contains("Transfer")) {
            Intent intent = new Intent("com.reimu.wallet.NOTIFICATION_RECEIVED");
            intent.putExtra("package", packageName);
            intent.putExtra("title", title);
            intent.putExtra("text", text);
            sendBroadcast(intent);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Notification dismissed
    }
}
