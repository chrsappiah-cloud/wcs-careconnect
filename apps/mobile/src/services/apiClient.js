// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import { withPerfMonitoring } from './perfMonitor';

const API_BASE =
  process.env.EXPO_PUBLIC_CREATE_API_URL || 'https://api.createanything.com';

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function _apiFetch(path, options) {
  const response = await fetch(apiUrl(path), options);
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export const apiFetch = withPerfMonitoring(_apiFetch);
