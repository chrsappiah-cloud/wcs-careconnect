// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiUrl } from './apiClient';

// ──────────────────────────────────────────────
// Apple Push Notification Service (APNs) via
// expo-notifications — handles registration,
// permissions, and token management for iOS
// native push notifications.
// ──────────────────────────────────────────────

// Configure how notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications with APNs.
 * Returns the Expo push token string or null.
 */
export async function registerForPushNotifications(userName, userRole) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
        provideAppNotificationSettings: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get APNs device token via Expo
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // uses Constants.expoConfig.extra.eas.projectId
  });

  const token = tokenData.data;

  // Also get the native APNs device token for direct APNs usage
  let apnsToken = null;
  if (Platform.OS === 'ios') {
    try {
      const nativeToken = await Notifications.getDevicePushTokenAsync();
      apnsToken = nativeToken.data;
    } catch {
      // Fallback to Expo token
    }
  }

  // Register token with our backend
  try {
    await fetch(apiUrl('/api/push-tokens'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        apns_token: apnsToken,
        platform: Platform.OS,
        user_name: userName,
        user_role: userRole,
      }),
    });
  } catch {
    // Offline — will register on next connect
  }

  // Configure iOS-specific notification categories
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('message', [
      {
        identifier: 'reply',
        buttonTitle: 'Reply',
        options: { opensAppToForeground: true },
        textInput: {
          submitButtonTitle: 'Send',
          placeholder: 'Type a reply...',
        },
      },
      {
        identifier: 'mark_read',
        buttonTitle: 'Mark as Read',
        options: { opensAppToForeground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('alert', [
      {
        identifier: 'view',
        buttonTitle: 'View Details',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'acknowledge',
        buttonTitle: 'Acknowledge',
        options: { opensAppToForeground: false, isDestructive: false },
      },
    ]);
  }

  return token;
}

/**
 * Unregister push notifications and remove token from server.
 */
export async function unregisterPushNotifications() {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await fetch(apiUrl(`/api/push-tokens/${encodeURIComponent(tokenData.data)}`), {
      method: 'DELETE',
    });
  } catch {
    // Best-effort unregister
  }
}

/**
 * Schedule a local notification (for offline/real-time events).
 */
export async function scheduleLocalNotification({ title, body, data, categoryId }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      categoryIdentifier: categoryId,
      sound: 'default',
    },
    trigger: null, // immediate
  });
}

/**
 * Get the current badge count.
 */
export async function getBadgeCount() {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set the app badge count (iOS home screen).
 */
export async function setBadgeCount(count) {
  return Notifications.setBadgeCountAsync(count);
}

/**
 * Add listeners for notification interactions.
 * Returns a cleanup function.
 */
export function addNotificationListeners({ onReceive, onInteraction }) {
  const receiveSub = Notifications.addNotificationReceivedListener((notification) => {
    onReceive?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data;
    const userText = response.userText; // For inline reply

    onInteraction?.({ actionId, data, userText });
  });

  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
