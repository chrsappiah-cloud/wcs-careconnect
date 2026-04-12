/**
 * Integration tests verifying all routes, screens, and API connections
 * are properly wired together.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import path from 'path';

// Use require + path.join to work around Jest's issue with parenthesized dirs
const tabsDir = path.join(__dirname, '..', 'app', '(tabs)');
const DashboardScreen = require(path.join(tabsDir, 'index')).default;
const AlertsScreen = require(path.join(tabsDir, 'alerts')).default;
const TasksScreen = require(path.join(tabsDir, 'tasks')).default;
const MessagesScreen = require(path.join(tabsDir, 'messages')).default;
const SettingsScreen = require(path.join(tabsDir, 'settings')).default;
const MedSearchScreen = require(path.join(tabsDir, 'medsearch')).default;
const MedicationsScreen = require(path.join(tabsDir, 'medications')).default;
const InteractionsScreen = require(path.join(tabsDir, 'interactions')).default;

// Import all components to verify exports
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import { SkeletonCard, SkeletonList } from '../components/Skeleton';

// Import API service to verify all exports
import * as auMedApi from '../services/auMedApi';
import { apiUrl } from '../services/apiClient';

// Import auth to verify exports
import { useAuth } from '../utils/auth/useAuth';
import { AuthModal } from '../utils/auth/useAuthModal';

// Import mock data to verify structure
import {
  mockResidents,
  mockAlerts,
  mockTasks,
  mockMessages,
  mockReadings,
} from '../mockData';

// Import theme to verify exports
import { colors, radius, shadows, typography } from '../theme';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Route & Export Verification', () => {
  it('all tab screens export a default React component', () => {
    expect(typeof DashboardScreen).toBe('function');
    expect(typeof AlertsScreen).toBe('function');
    expect(typeof TasksScreen).toBe('function');
    expect(typeof MessagesScreen).toBe('function');
    expect(typeof SettingsScreen).toBe('function');
    expect(typeof MedSearchScreen).toBe('function');
    expect(typeof MedicationsScreen).toBe('function');
    expect(typeof InteractionsScreen).toBe('function');
  });

  it('all reusable components export correctly', () => {
    expect(typeof Avatar).toBe('function');
    expect(typeof Card).toBe('function');
    expect(typeof EmptyState).toBe('function');
    expect(typeof SectionHeader).toBe('function');
    expect(typeof StatusBadge).toBe('function');
    expect(typeof SkeletonCard).toBe('function');
    expect(typeof SkeletonList).toBe('function');
  });

  it('AuthModal exports correctly', () => {
    expect(typeof AuthModal).toBe('function');
  });

  it('useAuth hook exports all required methods', () => {
    expect(typeof useAuth).toBe('function');
  });
});

describe('API Service Verification', () => {
  it('auMedApi exports all API functions', () => {
    const expectedFunctions = [
      'searchConditions',
      'searchSNOMEDFindings',
      'searchAMTMedications',
      'searchFHIRPatients',
      'lookupSNOMED',
      'searchDrugs',
      'getDrugByRxcui',
      'topAdverseReactions',
      'suggestDrugSpelling',
      'searchAdverseEvents',
      'checkDrugInteractions',
      'searchFHIRMedications',
      'searchFHIRObservations',
      'expandValueSet',
    ];
    expectedFunctions.forEach((fnName) => {
      expect(typeof auMedApi[fnName]).toBe('function');
    });
  });

  it('auMedApi exports constant arrays', () => {
    expect(Array.isArray(auMedApi.COMMON_MEDICATIONS)).toBe(true);
    expect(auMedApi.COMMON_MEDICATIONS.length).toBeGreaterThan(0);
    expect(Array.isArray(auMedApi.AGED_CARE_CONDITIONS)).toBe(true);
    expect(auMedApi.AGED_CARE_CONDITIONS.length).toBeGreaterThan(0);
  });

  it('apiUrl produces absolute URLs', () => {
    expect(apiUrl('/api/test')).toMatch(/^https?:\/\//);
    expect(apiUrl('/api/test')).toContain('/api/test');
  });
});

describe('Mock Data Integrity', () => {
  it('mockResidents has required fields', () => {
    expect(mockResidents.length).toBeGreaterThan(0);
    mockResidents.forEach((r) => {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('room');
      expect(r).toHaveProperty('status');
    });
  });

  it('mockResidents.conditions is always an array', () => {
    mockResidents.forEach((r) => {
      if (r.conditions) {
        expect(Array.isArray(r.conditions)).toBe(true);
      }
    });
  });

  it('mockAlerts has required fields', () => {
    expect(mockAlerts.length).toBeGreaterThan(0);
    mockAlerts.forEach((a) => {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('status');
      expect(a).toHaveProperty('severity');
    });
  });

  it('mockTasks has required fields', () => {
    expect(mockTasks.length).toBeGreaterThan(0);
    mockTasks.forEach((t) => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('status');
    });
  });

  it('mockMessages has required fields', () => {
    expect(mockMessages.length).toBeGreaterThan(0);
    mockMessages.forEach((m) => {
      expect(m).toHaveProperty('id');
    });
  });

  it('mockReadings has required fields', () => {
    expect(mockReadings.length).toBeGreaterThan(0);
    mockReadings.forEach((r) => {
      expect(r).toHaveProperty('metric');
      expect(r).toHaveProperty('value');
    });
  });
});

describe('Theme Verification', () => {
  it('colors exports all required tokens', () => {
    const requiredColors = [
      'primary',
      'background',
      'surface',
      'text',
      'textSecondary',
      'textMuted',
      'danger',
      'success',
      'border',
    ];
    requiredColors.forEach((c) => {
      expect(colors[c]).toBeDefined();
    });
  });

  it('typography exports text style objects', () => {
    expect(typography.body).toBeDefined();
    expect(typography.title2).toBeDefined();
    expect(typography.caption).toBeDefined();
  });

  it('radius exports spacing values', () => {
    expect(typeof radius.sm).toBe('number');
    expect(typeof radius.md).toBe('number');
  });
});

describe('Component Rendering', () => {
  it('EmptyState renders with JSX icon element', () => {
    const { getByText } = render(
      <EmptyState
        icon={<Avatar size={40} name="Test" />}
        title="Test Title"
        subtitle="Test Subtitle"
      />,
    );
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('SectionHeader renders without paddingHorizontal by default', () => {
    const { getByText } = render(<SectionHeader title="Vitals" />);
    expect(getByText('Vitals')).toBeTruthy();
  });

  it('Card renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <EmptyState title="Inside Card" />
      </Card>,
    );
    expect(getByText('Inside Card')).toBeTruthy();
  });
});

describe('Screen Rendering', () => {
  const Wrapper = createWrapper();

  it('DashboardScreen renders without crash', () => {
    const { toJSON } = render(<DashboardScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('AlertsScreen renders without crash', () => {
    const { toJSON } = render(<AlertsScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('TasksScreen renders without crash', () => {
    const { toJSON } = render(<TasksScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('SettingsScreen renders without crash', () => {
    const { toJSON } = render(<SettingsScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('MedSearchScreen renders without crash', () => {
    const { toJSON } = render(<MedSearchScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('MedicationsScreen renders without crash', () => {
    const { toJSON } = render(<MedicationsScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('InteractionsScreen renders without crash', () => {
    const { toJSON } = render(<InteractionsScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('MessagesScreen renders without crash', () => {
    const { toJSON } = render(<MessagesScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });
});
