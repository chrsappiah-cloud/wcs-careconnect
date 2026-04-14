import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Mock modules that aren't in jest.setup.js
jest.mock('../services/iCloudBackup', () => ({
  createBackup: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/syncManager', () => ({
  enqueueMutation: jest.fn().mockResolvedValue(undefined),
}));

import AddResidentScreen from '../app/(tabs)/add-resident';

// Spy on Alert
jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
  // Reset useMutation mock to default
  useMutation.mockReturnValue({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    reset: jest.fn(),
  });
});

describe('AddResidentScreen', () => {
  it('renders the form with required sections', () => {
    const { getByText, getByPlaceholderText } = render(<AddResidentScreen />);
    expect(getByText('Add New Resident')).toBeTruthy();
    expect(getByText('Personal Information')).toBeTruthy();
    expect(getByPlaceholderText('e.g. Margaret Wilson')).toBeTruthy();
    expect(getByPlaceholderText('e.g. 204A')).toBeTruthy();
  });

  it('shows validation alert when name is empty', () => {
    const { getByText } = render(<AddResidentScreen />);
    
    // Find and press the save button
    const saveButton = getByText('Save Resident');
    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please enter the resident name.');
  });

  it('shows validation alert when room is empty but name is filled', () => {
    const { getByPlaceholderText, getByText } = render(<AddResidentScreen />);
    
    fireEvent.changeText(getByPlaceholderText('e.g. Margaret Wilson'), 'John Smith');
    fireEvent.press(getByText('Save Resident'));

    expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please enter the room number.');
  });

  it('calls mutation when form is valid', () => {
    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    });

    const { getByPlaceholderText, getByText } = render(<AddResidentScreen />);
    
    fireEvent.changeText(getByPlaceholderText('e.g. Margaret Wilson'), 'Margaret Wilson');
    fireEvent.changeText(getByPlaceholderText('e.g. 204A'), 'Room 15');
    fireEvent.press(getByText('Save Resident'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Margaret Wilson',
        room: 'Room 15',
        status: 'stable',
        care_level: 'standard',
      })
    );
  });

  it('renders care level options', () => {
    const { getByText } = render(<AddResidentScreen />);
    expect(getByText('standard')).toBeTruthy();
    expect(getByText('high')).toBeTruthy();
    expect(getByText('palliative')).toBeTruthy();
    expect(getByText('respite')).toBeTruthy();
    expect(getByText('dementia')).toBeTruthy();
  });

  it('renders gender options', () => {
    const { getByText } = render(<AddResidentScreen />);
    expect(getByText('Male')).toBeTruthy();
    expect(getByText('Female')).toBeTruthy();
  });

  it('renders common conditions', () => {
    const { getByText } = render(<AddResidentScreen />);
    expect(getByText('Type 2 Diabetes')).toBeTruthy();
    expect(getByText('Hypertension')).toBeTruthy();
    expect(getByText("Alzheimer's disease")).toBeTruthy();
  });

  it('renders common allergies', () => {
    const { getByText } = render(<AddResidentScreen />);
    expect(getByText('Penicillin')).toBeTruthy();
    expect(getByText('Sulfonamides')).toBeTruthy();
  });

  it('allows selecting a care level', () => {
    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    });

    const { getByPlaceholderText, getByText } = render(<AddResidentScreen />);
    
    // Select palliative care level
    fireEvent.press(getByText('palliative'));
    
    // Fill required fields and submit
    fireEvent.changeText(getByPlaceholderText('e.g. Margaret Wilson'), 'Test Resident');
    fireEvent.changeText(getByPlaceholderText('e.g. 204A'), 'Room 1');
    fireEvent.press(getByText('Save Resident'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ care_level: 'palliative' })
    );
  });

  it('populates emergency contact fields', () => {
    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    });

    const { getByPlaceholderText, getByText } = render(<AddResidentScreen />);
    
    fireEvent.changeText(getByPlaceholderText('e.g. Margaret Wilson'), 'Test Resident');
    fireEvent.changeText(getByPlaceholderText('e.g. 204A'), 'Room 1');
    fireEvent.changeText(getByPlaceholderText('e.g. Sarah Wilson'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('04xx xxx xxx'), '0412345678');
    fireEvent.changeText(getByPlaceholderText('e.g. Daughter'), 'Daughter');
    
    fireEvent.press(getByText('Save Resident'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        emergency_contact: {
          name: 'Jane Doe',
          phone: '0412345678',
          relationship: 'Daughter',
        },
      })
    );
  });

  it('builds null emergency_contact when name is empty', () => {
    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    });

    const { getByPlaceholderText, getByText } = render(<AddResidentScreen />);
    
    fireEvent.changeText(getByPlaceholderText('e.g. Margaret Wilson'), 'Test');
    fireEvent.changeText(getByPlaceholderText('e.g. 204A'), 'Room 1');
    fireEvent.press(getByText('Save Resident'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ emergency_contact: null })
    );
  });

  it('toggles conditions when tapped', () => {
    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    });

    const { getByPlaceholderText, getByText } = render(<AddResidentScreen />);
    
    // Select conditions
    fireEvent.press(getByText('Hypertension'));
    fireEvent.press(getByText("Alzheimer's disease"));
    
    // Fill required and submit
    fireEvent.changeText(getByPlaceholderText('e.g. Margaret Wilson'), 'Test');
    fireEvent.changeText(getByPlaceholderText('e.g. 204A'), 'Room 1');
    fireEvent.press(getByText('Save Resident'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: ['Hypertension', "Alzheimer's disease"],
      })
    );
  });
});

// ─── Resident API Integration Tests ─────────────

describe.skip('Resident API Integration', () => {
  const BASE = 'http://localhost:3001';

  it('GET /api/residents returns array', async () => {
    const res = await fetch(`${BASE}/api/residents`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('POST /api/residents creates a new resident', async () => {
    const newResident = {
      name: `Test Resident ${Date.now()}`,
      room: 'Room 99',
      status: 'stable',
      care_level: 'standard',
      conditions: ['Hypertension'],
      allergies: ['Penicillin'],
      medications: [],
      medical_history: [],
    };

    const res = await fetch(`${BASE}/api/residents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newResident),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.name).toBe(newResident.name);
    expect(data.room).toBe('Room 99');
    expect(data.id).toBeDefined();

    // Cleanup: delete the test resident
    const delRes = await fetch(`${BASE}/api/residents/${data.id}`, { method: 'DELETE' });
    expect(delRes.ok).toBe(true);
  });

  it('GET /api/residents/:id returns a specific resident', async () => {
    // First get list to find an id
    const listRes = await fetch(`${BASE}/api/residents`);
    const residents = await listRes.json();
    if (residents.length === 0) return; // skip if no residents

    const res = await fetch(`${BASE}/api/residents/${residents[0].id}`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.id).toBe(residents[0].id);
    expect(data.name).toBeDefined();
  });

  it('PATCH /api/residents/:id updates a resident', async () => {
    // Create temp resident
    const createRes = await fetch(`${BASE}/api/residents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Temp Patch Test', room: 'Room 88', status: 'stable' }),
    });
    const created = await createRes.json();

    const patchRes = await fetch(`${BASE}/api/residents/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: 'Room 77' }),
    });
    expect(patchRes.ok).toBe(true);
    const patched = await patchRes.json();
    expect(patched.room).toBe('Room 77');

    // Cleanup
    await fetch(`${BASE}/api/residents/${created.id}`, { method: 'DELETE' });
  });

  it('DELETE /api/residents/:id removes a resident', async () => {
    // Create temp
    const createRes = await fetch(`${BASE}/api/residents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Temp Delete Test', room: 'Room 66', status: 'stable' }),
    });
    const created = await createRes.json();

    const delRes = await fetch(`${BASE}/api/residents/${created.id}`, { method: 'DELETE' });
    expect(delRes.ok).toBe(true);

    // Verify deleted
    const getRes = await fetch(`${BASE}/api/residents/${created.id}`);
    expect(getRes.status).toBe(404);
  });
});
