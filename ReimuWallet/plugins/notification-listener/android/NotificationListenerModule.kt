package com.reimuwallet.app.notification

import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationListenerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "ReimuNotificationListener"
        private var staticContext: ReactApplicationContext? = null

        fun emitNotification(packageName: String, title: String, text: String, timestamp: Long) {
            staticContext?.let { ctx ->
                if (ctx.hasActiveReactInstance()) {
                    val map = Arguments.createMap().apply {
                        putString("packageName", packageName)
                        putString("title", title)
                        putString("text", text)
                        putDouble("timestamp", timestamp.toDouble())
                    }
                    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onNotificationReceived", map)
                }
            }
        }
    }

    init {
        staticContext = reactContext
    }

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun isPermissionGranted(promise: Promise) {
        try {
            val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(reactContext)
            val isGranted = enabledPackages.contains(reactContext.packageName)
            promise.resolve(isGranted)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestPermission() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun getPendingQueue(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("reimu_notification_enclave", Context.MODE_PRIVATE)
            val queue = prefs.getString("pending_raw_notifs", "[]") ?: "[]"
            promise.resolve(queue)
        } catch (e: Exception) {
            promise.reject("QUEUE_READ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearPendingQueue(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("reimu_notification_enclave", Context.MODE_PRIVATE)
            prefs.edit().putString("pending_raw_notifs", "[]").apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("QUEUE_CLEAR_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for React Native built-in EventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native built-in EventEmitter
    }
}
