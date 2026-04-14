// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
export const colors = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  primaryDark: '#1D4ED8',
  primaryMuted: '#93BBFD',

  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceBorder: '#E8ECF4',
  surfaceSecondary: '#F1F3F8',
  surfaceTertiary: '#E8EDF5',

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

  // Glass / frosted glass
  glass: {
    white: 'rgba(255,255,255,0.72)',
    whiteBorder: 'rgba(255,255,255,0.25)',
    dark: 'rgba(15,23,42,0.65)',
    darkBorder: 'rgba(255,255,255,0.08)',
    tint: 'rgba(37,99,235,0.08)',
    overlay: 'rgba(0,0,0,0.45)',
  },

  vitals: {
    glucose: { color: '#EF4444', bg: '#FEF2F2', gradient: ['#FEF2F2', '#FEE2E2'] },
    hr: { color: '#DC2626', bg: '#FFF1F2', gradient: ['#FFF1F2', '#FEE2E2'] },
    spo2: { color: '#2563EB', bg: '#EFF6FF', gradient: ['#EFF6FF', '#DBEAFE'] },
    bp: { color: '#7C3AED', bg: '#F5F3FF', gradient: ['#F5F3FF', '#EDE9FE'] },
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
  primaryReverse: ['#60A5FA', '#3B82F6', '#2563EB'],
  header: ['#1E40AF', '#2563EB'],
  headerVibrant: ['#1E3A8A', '#1E40AF', '#2563EB'],
  success: ['#16A34A', '#22C55E'],
  danger: ['#DC2626', '#EF4444'],
  dangerVibrant: ['#991B1B', '#DC2626', '#EF4444'],
  warning: ['#D97706', '#F59E0B'],
  card: ['#FFFFFF', '#F8FAFC'],
  cardSubtle: ['#FAFBFF', '#F1F5F9'],
  vitalsGlucose: ['#FEF2F2', '#FFFFFF'],
  vitalsHr: ['#FFF1F2', '#FFFFFF'],
  vitalsSpo2: ['#EFF6FF', '#FFFFFF'],
  vitalsBp: ['#F5F3FF', '#FFFFFF'],
  background: ['#F0F4FF', '#F8F9FE', '#FFFFFF'],
  shimmer: ['#E2E8F0', '#F1F5F9', '#E2E8F0'],
  glass: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.65)'],
  dark: ['#0F172A', '#1E293B'],
  aurora: ['#1E40AF', '#7C3AED', '#EC4899'],
  sunset: ['#F59E0B', '#EF4444', '#EC4899'],
  ocean: ['#0EA5E9', '#2563EB', '#4F46E5'],
  mint: ['#10B981', '#06B6D4'],
};

// Animation tokens for consistent motion
export const animation = {
  spring: { damping: 15, stiffness: 150, mass: 0.8 },
  springBouncy: { damping: 12, stiffness: 180, mass: 0.6 },
  springSnappy: { damping: 20, stiffness: 300, mass: 0.5 },
  springGentle: { damping: 20, stiffness: 100, mass: 1 },
  duration: { fast: 150, normal: 250, slow: 400, slower: 600 },
  pressScale: 0.97,
  stagger: 50,
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
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  }),
  depth: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
};
