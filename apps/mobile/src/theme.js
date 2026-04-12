export const colors = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  primaryDark: '#1D4ED8',

  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceBorder: '#E8ECF4',
  surfaceSecondary: '#F1F3F8',

  text: '#0F172A',
  textSecondary: '#334155',
  textTertiary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#CBD5E1',

  success: '#22C55E',
  successLight: '#DCFCE7',
  successDark: '#166534',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerDark: '#991B1B',

  heart: '#DC2626',
  heartBg: '#FFF1F2',

  vitals: {
    glucose: { color: '#EF4444', bg: '#FEF2F2' },
    hr: { color: '#DC2626', bg: '#FFF1F2' },
    spo2: { color: '#2563EB', bg: '#EFF6FF' },
    bp: { color: '#7C3AED', bg: '#F5F3FF' },
  },

  status: {
    stable: { color: '#22C55E', bg: '#DCFCE7', text: '#166534' },
    warning: { color: '#F59E0B', bg: '#FEF3C7', text: '#92400E' },
    critical: { color: '#EF4444', bg: '#FEE2E2', text: '#991B1B' },
  },

  severity: {
    critical: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  // Convenience aliases
  statusStable: '#22C55E',
  statusWarning: '#F59E0B',
  statusCritical: '#EF4444',
};

// Gradient presets for premium iOS-style headers and cards
export const gradients = {
  primary: ['#2563EB', '#3B82F6', '#60A5FA'],
  header: ['#1E40AF', '#2563EB'],
  success: ['#16A34A', '#22C55E'],
  danger: ['#DC2626', '#EF4444'],
  warning: ['#D97706', '#F59E0B'],
  card: ['#FFFFFF', '#F8FAFC'],
  vitalsGlucose: ['#FEF2F2', '#FFFFFF'],
  vitalsHr: ['#FFF1F2', '#FFFFFF'],
  vitalsSpo2: ['#EFF6FF', '#FFFFFF'],
  vitalsBp: ['#F5F3FF', '#FFFFFF'],
  background: ['#F0F4FF', '#F8F9FE', '#FFFFFF'],
};

// Animation tokens for consistent motion
export const animation = {
  spring: { damping: 15, stiffness: 150, mass: 0.8 },
  springBouncy: { damping: 12, stiffness: 180, mass: 0.6 },
  duration: { fast: 150, normal: 250, slow: 400 },
  pressScale: 0.97,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: 0.37 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: 0.36 },
  title2: { fontSize: 24, fontWeight: '700', letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: '600', letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.41 },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.41 },
  callout: { fontSize: 16, fontWeight: '400', letterSpacing: -0.32 },
  subhead: { fontSize: 15, fontWeight: '500', letterSpacing: -0.24 },
  footnote: { fontSize: 13, fontWeight: '400', letterSpacing: -0.08 },
  caption: { fontSize: 12, fontWeight: '500', letterSpacing: 0 },
  caption2: { fontSize: 11, fontWeight: '600', letterSpacing: 0.07 },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  colored: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  }),
};
