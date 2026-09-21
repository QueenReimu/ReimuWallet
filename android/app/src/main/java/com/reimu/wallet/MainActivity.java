package com.reimu.wallet;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private BroadcastReceiver notificationReceiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        notificationReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null) return;
                String pkg = intent.getStringExtra("package");
                String title = intent.getStringExtra("title");
                String text = intent.getStringExtra("text");

                if (text != null && !text.isEmpty()) {
                    String fullMessage = (title != null && !title.isEmpty()) ? title + ": " + text : text;
                    // Escape JS string
                    String safeMessage = fullMessage.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
                    WebView webView = getBridge().getWebView();
                    if (webView != null) {
                        webView.post(() -> {
                            webView.evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('reimu:notification', { detail: { text: \"" + safeMessage + "\", package: \"" + pkg + "\" } }));",
                                null
                            );
                        });
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter("com.reimu.wallet.NOTIFICATION_RECEIVED");
        registerReceiver(notificationReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (notificationReceiver != null) {
            try {
                unregisterReceiver(notificationReceiver);
            } catch (Exception ignored) {}
        }
    }
}

