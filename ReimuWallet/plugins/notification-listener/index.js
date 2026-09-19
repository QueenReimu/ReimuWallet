const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for ReimuWallet Android Notification Listener
 */
const withNotificationListener = (config) => {
  // 1. Add Service to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Ensure service isn't duplicated
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const serviceName = '.notification.ReimuNotificationListenerService';
    const exists = mainApplication.service.some((s) => s.$['android:name'] === serviceName);

    if (!exists) {
      mainApplication.service.push({
        $: {
          'android:name': serviceName,
          'android:label': 'ReimuWallet Transaction Detector',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

  // 2. Copy Kotlin sources into Android native app source directory
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const targetDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'reimuwallet',
        'app',
        'notification'
      );

      const srcDir = path.join(projectRoot, 'plugins', 'notification-listener', 'android');

      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        const files = fs.readdirSync(srcDir);
        for (const file of files) {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(targetDir, file);
          fs.copyFileSync(srcFile, destFile);
        }
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withNotificationListener;
