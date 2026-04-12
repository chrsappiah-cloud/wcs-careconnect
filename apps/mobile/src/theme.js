export const colors = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  primaryDark: '#1D4ED8',

  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceBorder: '#E5E7EB',
  surfaceSecondary: '#F3F4F6',

  text: '#111827',
  textSecondary: '#374151',
  textTertiary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#D1D5DB',

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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const typography = {
  largeTitle: { fontSize: 32, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold' },
  title2: { fontSize: 24, fontWeight: 'bold' },
  title3: { fontSize: 20, fontWeight: '600' },
  headline: { fontSize: 18, fontWeight: 'bold' },
  body: { fontSize: 18, fontWeight: '400' },
  callout: { fontSize: 16, fontWeight: '400' },
  subhead: { fontSize: 16, fontWeight: '500' },
  footnote: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '500' },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};
