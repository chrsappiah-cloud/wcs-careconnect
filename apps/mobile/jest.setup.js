// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
// Jest setup — mocks for native modules and third-party libs

// Silence RN Animated warnings in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-image (Avatar tries dynamic require)
jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock lucide-react-native — return simple views
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (name) => {
    const Icon = (props) => <View testID={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return new Proxy({}, { get: (_target, prop) => icon(String(prop)) });
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: '1' }),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  Link: 'Link',
  Tabs: 'Tabs',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

// Mock @tanstack/react-query — provide a real QueryClientProvider for screen tests
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    }),
    useMutation: jest.fn().mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    }),
    useQueryClient: jest.fn().mockReturnValue({
      invalidateQueries: jest.fn(),
    }),
  };
});

// Mock react-native-webview (requires native TurboModule)
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props) => <View testID="webview" {...props} /> };
});

// Mock @react-native-async-storage/async-storage
// Uses a real in-memory store so setItem/getItem actually persist within a test.
// mockResolvedValueOnce() overrides still work (queued values take priority over
// the default implementation), so existing tests are unaffected.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  const mock = {
    getItem: jest.fn((key) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys) =>
      Promise.resolve(keys.map((k) => [k, store[k] ?? null]))
    ),
    multiSet: jest.fn((pairs) => {
      pairs.forEach(([k, v]) => {
        store[k] = v;
      });
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys) => {
      keys.forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
    // Internal store accessor for test teardown
    _store: store,
  };
  return mock;
});
// Reset AsyncStorage store between every test to prevent state leakage
beforeEach(() => {
  const AS = require('@react-native-async-storage/async-storage').default ??
              require('@react-native-async-storage/async-storage');
  if (AS && AS._store) {
    Object.keys(AS._store).forEach((k) => delete AS._store[k]);
  }
});

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const { View, Modal } = require('react-native');
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(({ children }, ref) => (
      <View ref={ref}>{children}</View>
    )),
    BottomSheetModal: React.forwardRef(({ children }, ref) => (
      <View ref={ref}>{children}</View>
    )),
    BottomSheetModalProvider: ({ children }) => <View>{children}</View>,
    BottomSheetBackdrop: (props) => <View {...props} />,
    BottomSheetView: ({ children }) => <View>{children}</View>,
    BottomSheetScrollView: ({ children }) => <View>{children}</View>,
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }) => (
      <View testID="linear-gradient" {...props}>{children}</View>
    ),
  };
});

// Mock expo-blur
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: ({ children, ...props }) => (
      <View testID="blur-view" {...props}>{children}</View>
    ),
  };
});

// Mock expo-av
jest.mock('expo-av', () => {
  const mockSound = {
    playAsync: jest.fn().mockResolvedValue(undefined),
    setPositionAsync: jest.fn().mockResolvedValue(undefined),
    unloadAsync: jest.fn().mockResolvedValue(undefined),
  };
  return {
    Audio: {
      setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
      Sound: {
        createAsync: jest.fn().mockResolvedValue({ sound: mockSound }),
      },
    },
  };
});

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[mock]' }),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-device-token', type: 'ios' }),
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  AndroidImportance: { MAX: 5 },
}));

// Mock useRealtimeMessages hook
jest.mock('./src/hooks/useRealtimeMessages', () => ({
  useRealtimeMessages: () => ({
    connected: true,
    onlineUsers: [],
    typingUsers: [],
    sendTyping: jest.fn(),
    sendReadReceipt: jest.fn(),
  }),
}));

// Mock pushNotifications service
jest.mock('./src/services/pushNotifications', () => ({
  registerForPushNotifications: jest.fn().mockResolvedValue('ExponentPushToken[mock]'),
  unregisterPushNotifications: jest.fn().mockResolvedValue(undefined),
  scheduleLocalNotification: jest.fn().mockResolvedValue('mock-notification-id'),
  getBadgeCount: jest.fn().mockResolvedValue(0),
  setBadgeCount: jest.fn().mockResolvedValue(undefined),
  addNotificationListeners: jest.fn().mockReturnValue(jest.fn()),
}));
