import { useAuth } from '@/utils/auth/useAuth';
import { AuthModal } from '@/utils/auth/useAuthModal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startSyncManager, stopSyncManager } from '../services/syncManager';
import {
  registerForPushNotifications,
  addNotificationListeners,
} from '../services/pushNotifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Persist React Query cache to AsyncStorage (→ iCloud backup on iOS)
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@careconnect_query_cache',
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();

  useEffect(() => {
    initiate();
    startSyncManager();

    // Register for push notifications on app start
    registerForPushNotifications('Nurse Sarah', 'Nurse').catch(() => {});

    // Listen for incoming notifications & user interactions
    const cleanup = addNotificationListeners({
      onReceive: (notification) => {
        // Notification received while app is in foreground — handled by handler
      },
      onInteraction: (response) => {
        // User tapped notification or used an action (reply, acknowledge, etc.)
        const data = response?.notification?.request?.content?.data;
        if (data?.screen === 'messages') {
          // Navigation handled by expo-router deep linking
        }
      },
    });

    return () => {
      stopSyncManager();
      cleanup();
    };
  }, [initiate]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <AuthModal />
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
