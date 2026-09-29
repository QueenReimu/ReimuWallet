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

        // Filter financial packages (DANA, GoPay, OVO, ShopeePay, LinkAja, BCA, Mandiri, BRI, BNI, Jago, SeaBank, Jenius)
        String pkgLower = packageName.toLowerCase();
        boolean isFinancial = pkgLower.contains("dana") ||
                              pkgLower.contains("gojek") ||
                              pkgLower.contains("gopay") ||
                              pkgLower.contains("ovo") ||
                              pkgLower.contains("shopee") ||
                              pkgLower.contains("telkom.mwallet") ||
                              pkgLower.contains("linkaja") ||
                              pkgLower.contains("bca") ||
                              pkgLower.contains("mandiri") ||
                              pkgLower.contains("bri") ||
                              pkgLower.contains("bni") ||
                              pkgLower.contains("jago") ||
                              pkgLower.contains("seabank") ||
                              pkgLower.contains("jenius");

        // Quick check for explicit OTP or non-transaction noise
        String combinedLower = (title + " " + text).toLowerCase();
        boolean isNoise = combinedLower.contains("kode otp") ||
                          combinedLower.contains("one-time password") ||
                          combinedLower.contains("kode verifikasi") ||
                          combinedLower.contains("jangan berikan kode") ||
                          combinedLower.contains("promo") ||
                          combinedLower.contains("diskon") ||
                          combinedLower.contains("voucher") ||
                          combinedLower.contains("login berhasil") ||
                          combinedLower.contains("perangkat baru") ||
                          combinedLower.contains("pengingat tagihan");

        if (isNoise && !combinedLower.contains("berhasil") && !combinedLower.contains("transfer")) {
            return;
        }

        if (isFinancial || text.contains("Rp") || text.contains("IDR") || text.contains("berhasil") || text.contains("Transfer")) {
            Intent intent = new Intent("com.reimu.wallet.NOTIFICATION_RECEIVED");
            intent.putExtra("package", packageName);
            intent.putExtra("title", title);
            intent.putExtra("text", text);
            intent.putExtra("timestamp", sbn.getPostTime());
            sendBroadcast(intent);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Notification dismissed
    }
}
