// Jest setup — mocks for native modules and third-party libs

// Silence RN Animated warnings in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

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
  return new Proxy(
    {},
    { get: (_target, prop) => icon(String(prop)) },
  );
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
