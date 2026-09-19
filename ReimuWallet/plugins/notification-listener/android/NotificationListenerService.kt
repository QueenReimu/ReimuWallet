package com.reimuwallet.app.notification

import android.app.Notification
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class ReimuNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "ReimuNotifListener"
        const val ACTION_NOTIFICATION_RECEIVED = "com.reimuwallet.app.NOTIFICATION_RECEIVED"
        
        val MONITORED_PACKAGES = setOf(
            "id.dana",
            "com.gojek.app",
            "ovo.id",
            "com.bca",
            "id.co.bca.mybca.omni",
            "com.bankmandiri.livin",
            "id.co.bri.brimo",
            "id.co.bni.mobilebanking"
        )
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "ReimuWallet NotificationListener connected successfully.")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: return
        val extras = sbn.notification?.extras ?: return

        // Extract title, text, subtext
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: text
        val postTime = sbn.postTime

        val fullContent = if (bigText.isNotBlank()) bigText else text

        // Filter for financial apps or relevant keywords
        val isFinancialPackage = MONITORED_PACKAGES.contains(packageName)
        val hasFinancialKeywords = fullContent.contains("Rp", ignoreCase = true) ||
                fullContent.contains("berhasil", ignoreCase = true) ||
                fullContent.contains("transfer", ignoreCase = true) ||
                fullContent.contains("pembayaran", ignoreCase = true)

        if (isFinancialPackage || hasFinancialKeywords) {
            Log.d(TAG, "Detected financial notification from $packageName: $title - $fullContent")

            // Send local broadcast or emit to React Native
            NotificationListenerModule.emitNotification(
                packageName = packageName,
                title = title,
                text = fullContent,
                timestamp = postTime
            )

            // Cache to SharedPreferences as backup queue
            saveToEnclaveQueue(packageName, title, fullContent, postTime)
        }
    }

    private fun saveToEnclaveQueue(pkg: String, title: String, text: String, timestamp: Long) {
        try {
            val prefs = getSharedPreferences("reimu_notification_enclave", Context.MODE_PRIVATE)
            val currentQueue = prefs.getString("pending_raw_notifs", "[]") ?: "[]"
            val record = """{"pkg":"$pkg","title":"${title.replace("\"", "\\\"")}","text":"${text.replace("\"", "\\\"")}","time":$timestamp}"""
            
            val updatedQueue = if (currentQueue == "[]") {
                "[$record]"
            } else {
                currentQueue.replace("]", ",$record]")
            }
            prefs.edit().putString("pending_raw_notifs", updatedQueue).apply()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cache notification to enclave queue", e)
        }
    }
}
