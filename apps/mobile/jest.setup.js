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
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
}));

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
