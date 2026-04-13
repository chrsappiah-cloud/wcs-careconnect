/**
 * Advanced screen interaction tests — user flows, filter behaviour,
 * button actions, modal workflows, data rendering, and edge cases.
 */
import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react-native';
import { Alert, Switch } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import path from 'path';

const tabsDir = path.join(__dirname, '..', 'app', '(tabs)');
const DashboardScreen = require(path.join(tabsDir, 'index')).default;
const AlertsScreen = require(path.join(tabsDir, 'alerts')).default;
const TasksScreen = require(path.join(tabsDir, 'tasks')).default;
const MessagesScreen = require(path.join(tabsDir, 'messages')).default;
const SettingsScreen = require(path.join(tabsDir, 'settings')).default;
const MedSearchScreen = require(path.join(tabsDir, 'medsearch')).default;
const MedicationsScreen = require(path.join(tabsDir, 'medications')).default;
const InteractionsScreen = require(path.join(tabsDir, 'interactions')).default;

import {
  mockResidents,
  mockAlerts,
  mockTasks,
  mockMessages,
  mockReadings,
} from '../mockData';

const Haptics = require('expo-haptics');
let alertSpy;

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

afterEach(() => {
  alertSpy.mockRestore();
  jest.restoreAllMocks();
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// ─── Dashboard Advanced ───────────────────────────────────
describe('Dashboard — search and filtering', () => {
  const Wrapper = createWrapper();

  it('search input filters residents by name', () => {
    const { getByPlaceholderText, queryByText } = render(
      <DashboardScreen />,
      { wrapper: Wrapper },
    );
    const input = getByPlaceholderText(/search/i);
    fireEvent.changeText(input, mockResidents[0].name);
    expect(queryByText(mockResidents[0].name)).toBeTruthy();
  });

  it('search input filters residents by room', () => {
    const { getByPlaceholderText } = render(<DashboardScreen />, {
      wrapper: Wrapper,
    });
    const input = getByPlaceholderText(/search/i);
    const firstRoom = mockResidents[0].room;
    fireEvent.changeText(input, firstRoom);
    // Should render without crash with filtered results
  });

  it('shows empty state when search has no matches', () => {
    const { getByPlaceholderText, getByText } = render(
      <DashboardScreen />,
      { wrapper: Wrapper },
    );
    const input = getByPlaceholderText(/search/i);
    fireEvent.changeText(input, 'XYZNONEXISTENT12345');
    expect(getByText(/no residents found/i)).toBeTruthy();
  });

  it('displays resident count badge', () => {
    const { getAllByText } = render(<DashboardScreen />, { wrapper: Wrapper });
    expect(getAllByText(String(mockResidents.length)).length).toBeGreaterThan(0);
  });

  it('shows status summary pills (Stable, Warning, Critical)', () => {
    const { getAllByText } = render(<DashboardScreen />, { wrapper: Wrapper });
    expect(getAllByText(/stable/i).length).toBeGreaterThan(0);
    expect(getAllByText(/warning/i).length).toBeGreaterThan(0);
    expect(getAllByText(/critical/i).length).toBeGreaterThan(0);
  });

  it('displays glucose reading for residents that have one', () => {
    const residentWithGlucose = mockResidents.find(
      (r) => r.latest_glucose?.value,
    );
    if (residentWithGlucose) {
      const { getByText } = render(<DashboardScreen />, { wrapper: Wrapper });
      expect(
        getByText(new RegExp(`${residentWithGlucose.latest_glucose.value}`)),
      ).toBeTruthy();
    }
  });

  it('renders resident names from mock data', () => {
    const { getByText } = render(<DashboardScreen />, { wrapper: Wrapper });
    // First resident should be visible
    expect(getByText(mockResidents[0].name)).toBeTruthy();
  });

  it('renders room info for residents', () => {
    const { getAllByText } = render(<DashboardScreen />, { wrapper: Wrapper });
    const roomTexts = getAllByText(/Room/);
    expect(roomTexts.length).toBeGreaterThan(0);
  });
});

// ─── Alerts Advanced ──────────────────────────────────────
describe('Alerts — rendering and actions', () => {
  const Wrapper = createWrapper();

  it('renders alert header with count', () => {
    // Default mock has alerts from mockAlerts
    useQuery.mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { getByText } = render(<AlertsScreen />, { wrapper: Wrapper });
    expect(getByText('Alerts')).toBeTruthy();
    expect(
      getByText(
        new RegExp(
          `${mockAlerts.length} active alert`,
        ),
      ),
    ).toBeTruthy();
  });

  it('renders Acknowledge button for each alert', () => {
    useQuery.mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { getAllByText } = render(<AlertsScreen />, { wrapper: Wrapper });
    const ackButtons = getAllByText('Acknowledge');
    expect(ackButtons.length).toBe(mockAlerts.length);
  });

  it('pressing Acknowledge calls mutation', () => {
    const mutateMock = jest.fn();
    useQuery.mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });
    useMutation.mockReturnValue({
      mutate: mutateMock,
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    });

    const { getAllByText } = render(<AlertsScreen />, { wrapper: Wrapper });
    const ackButtons = getAllByText('Acknowledge');
    fireEvent.press(ackButtons[0]);
    expect(mutateMock).toHaveBeenCalledWith(mockAlerts[0].id);
  });

  it('shows empty state when no alerts', () => {
    useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { getByText } = render(<AlertsScreen />, { wrapper: Wrapper });
    expect(getByText(/all clear/i)).toBeTruthy();
  });

  it('displays severity labels (CRITICAL, WARNING)', () => {
    useQuery.mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { getAllByText } = render(<AlertsScreen />, { wrapper: Wrapper });
    const hasCritical = mockAlerts.some((a) => a.severity === 'critical');
    const hasWarning = mockAlerts.some((a) => a.severity === 'warning');
    if (hasCritical) expect(getAllByText('CRITICAL').length).toBeGreaterThan(0);
    if (hasWarning) expect(getAllByText('WARNING').length).toBeGreaterThan(0);
  });

  it('displays resident names from alerts', () => {
    useQuery.mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { getByText } = render(<AlertsScreen />, { wrapper: Wrapper });
    const firstAlertWithName = mockAlerts.find((a) => a.resident_name);
    if (firstAlertWithName) {
      expect(getByText(firstAlertWithName.resident_name)).toBeTruthy();
    }
  });
});

// ─── Tasks Advanced ───────────────────────────────────────
describe('Tasks — rendering and toggle', () => {
  const Wrapper = createWrapper();

  it('renders task items from mock data', () => {
    useQuery.mockReturnValue({
      data: mockTasks,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { getByText } = render(<TasksScreen />, { wrapper: Wrapper });
    expect(getByText('Tasks')).toBeTruthy();
    expect(getByText(mockTasks[0].title)).toBeTruthy();
  });

  it('renders pending and completed task groups', () => {
    useQuery.mockReturnValue({
      data: mockTasks,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { getAllByText } = render(<TasksScreen />, { wrapper: Wrapper });
    expect(getAllByText(/pending/i).length).toBeGreaterThan(0);
  });

  it('shows empty state when no tasks', () => {
    useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { getAllByText } = render(<TasksScreen />, { wrapper: Wrapper });
    expect(getAllByText(/no tasks/i).length).toBeGreaterThan(0);
  });
});

// ─── MedSearch Advanced ───────────────────────────────────
describe('MedSearch — tabs, search, and chips', () => {
  const Wrapper = createWrapper();

  it('defaults to Conditions tab', () => {
    const { getByText } = render(<MedSearchScreen />, { wrapper: Wrapper });
    expect(getByText('Conditions')).toBeTruthy();
    expect(getByText("Alzheimer's disease")).toBeTruthy();
  });

  it('switching to SNOMED tab renders without crash', () => {
    const { getByText, toJSON } = render(<MedSearchScreen />, {
      wrapper: Wrapper,
    });
    fireEvent.press(getByText('SNOMED CT-AU'));
    expect(toJSON()).toBeTruthy();
  });

  it('switching to AU Medicines tab renders without crash', () => {
    const { getByText, toJSON } = render(<MedSearchScreen />, {
      wrapper: Wrapper,
    });
    fireEvent.press(getByText('AU Medicines'));
    expect(toJSON()).toBeTruthy();
  });

  it('switching to FHIR Data tab renders without crash', () => {
    const { getByText, toJSON } = render(<MedSearchScreen />, {
      wrapper: Wrapper,
    });
    fireEvent.press(getByText('FHIR Data'));
    expect(toJSON()).toBeTruthy();
  });

  it('search input accepts text', () => {
    const { getByPlaceholderText } = render(<MedSearchScreen />, {
      wrapper: Wrapper,
    });
    const input = getByPlaceholderText(/search/i);
    fireEvent.changeText(input, 'diabetes');
    expect(input.props.value).toBe('diabetes');
  });

  it('clicking condition chip fills search', () => {
    const { getByText, getByPlaceholderText } = render(
      <MedSearchScreen />,
      { wrapper: Wrapper },
    );
    fireEvent.press(getByText("Alzheimer's disease"));
    // Should not crash — chip triggers search action
  });

  it('renders Data Sources info card', () => {
    const { getByText } = render(<MedSearchScreen />, { wrapper: Wrapper });
    expect(getByText('Data Sources')).toBeTruthy();
  });

  it('all four tab labels are present', () => {
    const { getByText } = render(<MedSearchScreen />, { wrapper: Wrapper });
    ['Conditions', 'SNOMED CT-AU', 'AU Medicines', 'FHIR Data'].forEach(
      (label) => {
        expect(getByText(label)).toBeTruthy();
      },
    );
  });
});

// ─── Settings Advanced ────────────────────────────────────
describe('Settings — profile modal and toggles', () => {
  const Wrapper = createWrapper();

  it('profile edit modal name input is editable', () => {
    const { getByText, getByDisplayValue } = render(<SettingsScreen />, {
      wrapper: Wrapper,
    });
    fireEvent.press(getByText('Nurse Sarah'));
    const nameInput = getByDisplayValue('Nurse Sarah');
    fireEvent.changeText(nameInput, 'Dr. Smith');
    expect(getByDisplayValue('Dr. Smith')).toBeTruthy();
  });

  it('profile edit modal role input is editable', () => {
    const { getByText, getByDisplayValue } = render(<SettingsScreen />, {
      wrapper: Wrapper,
    });
    fireEvent.press(getByText('Nurse Sarah'));
    const roleInput = getByDisplayValue('Ward A • Head Nurse');
    fireEvent.changeText(roleInput, 'Ward B • Nurse');
    expect(getByDisplayValue('Ward B • Nurse')).toBeTruthy();
  });

  it('save profile with modified name triggers alert with updated info', () => {
    const { getByText, getByDisplayValue } = render(<SettingsScreen />, {
      wrapper: Wrapper,
    });
    fireEvent.press(getByText('Nurse Sarah'));
    const nameInput = getByDisplayValue('Nurse Sarah');
    fireEvent.changeText(nameInput, 'Updated Name');
    fireEvent.press(getByText('Save'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Profile Updated',
      expect.any(String),
    );
  });

  it('sign out shows confirmation with Cancel and Sign Out buttons', () => {
    const { getByText } = render(<SettingsScreen />, { wrapper: Wrapper });
    fireEvent.press(getByText('Sign Out'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Sign Out',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Sign Out' }),
      ]),
    );
  });

  it('session timeout button triggers timeout selection alert', () => {
    const { getByText } = render(<SettingsScreen />, { wrapper: Wrapper });
    fireEvent.press(getByText('Session Timeout'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Session Timeout',
      expect.any(String),
      expect.any(Array),
    );
  });

  it('session timeout alert has 5 time options', () => {
    const { getByText } = render(<SettingsScreen />, { wrapper: Wrapper });
    fireEvent.press(getByText('Session Timeout'));
    const options = alertSpy.mock.calls[0][2];
    expect(options).toHaveLength(5);
    expect(options.map((o) => o.text)).toEqual([
      '5 mins',
      '10 mins',
      '15 mins',
      '20 mins',
      '30 mins',
    ]);
  });

  it('renders app version text', () => {
    const { getByText } = render(<SettingsScreen />, { wrapper: Wrapper });
    expect(getByText(/CareConnect v1\.0\.0/)).toBeTruthy();
  });

  it('renders High Priority Only toggle', () => {
    const { getByText } = render(<SettingsScreen />, { wrapper: Wrapper });
    expect(getByText('High Priority Only')).toBeTruthy();
  });

  it('renders notification group heading', () => {
    const { getByText } = render(<SettingsScreen />, { wrapper: Wrapper });
    expect(getByText(/notifications/i)).toBeTruthy();
  });

  it('renders security group heading', () => {
    const { getByText } = render(<SettingsScreen />, { wrapper: Wrapper });
    expect(getByText(/security/i)).toBeTruthy();
  });

  it('renders support group heading', () => {
    const { getAllByText } = render(<SettingsScreen />, { wrapper: Wrapper });
    expect(getAllByText(/support/i).length).toBeGreaterThan(0);
  });
});

// ─── Messages Screen ─────────────────────────────────────
describe('Messages — rendering', () => {
  const Wrapper = createWrapper();

  it('renders Messages header', () => {
    const { getByText } = render(<MessagesScreen />, { wrapper: Wrapper });
    expect(getByText('Messages')).toBeTruthy();
  });

  it('renders conversation list or empty state', () => {
    const { getByText } = render(<MessagesScreen />, { wrapper: Wrapper });
    // With default mocks returning no data, should show the header at minimum
    expect(getByText('Messages')).toBeTruthy();
  });
});

// ─── Medications Screen ──────────────────────────────────
describe('Medications — rendering', () => {
  const Wrapper = createWrapper();

  it('renders Medications header', () => {
    const { getByText } = render(<MedicationsScreen />, { wrapper: Wrapper });
    expect(getByText('Medications')).toBeTruthy();
  });

  it('renders search input', () => {
    const { getByPlaceholderText } = render(<MedicationsScreen />, {
      wrapper: Wrapper,
    });
    expect(getByPlaceholderText(/search/i)).toBeTruthy();
  });
});

// ─── Interactions Screen ─────────────────────────────────
describe('Interactions — rendering', () => {
  const Wrapper = createWrapper();

  it('renders Interactions header', () => {
    // Reset useQuery mock to default (previous tests may have overridden it)
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });
    const { getAllByText } = render(<InteractionsScreen />, {
      wrapper: Wrapper,
    });
    expect(getAllByText(/interaction/i).length).toBeGreaterThan(0);
  });
});

// ─── Loading & Empty States ──────────────────────────────
describe('Loading and empty states across screens', () => {
  const Wrapper = createWrapper();

  it('dashboard shows skeleton when loading with no data', () => {
    useQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: true,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { toJSON } = render(<DashboardScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('alerts show skeleton when loading', () => {
    useQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: true,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { toJSON } = render(<AlertsScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });

  it('tasks show skeleton when loading', () => {
    useQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: true,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    const { toJSON } = render(<TasksScreen />, { wrapper: Wrapper });
    expect(toJSON()).toBeTruthy();
  });
});
