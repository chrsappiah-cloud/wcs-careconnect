import { AppState } from 'react-native';
import { playAlertBySeverity, playEscalationSound, playNewAlertSound } from './soundService';

let ws = null;
let reconnectTimer = null;
let listeners = [];
const WS_URL = __DEV__
  ? 'ws://localhost:3001/ws'
  : 'ws://localhost:3001/ws';

export function addWSListener(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function notifyListeners(message) {
  listeners.forEach((fn) => {
    try { fn(message); } catch (_) {}
  });
}

function handleMessage(event) {
  try {
    const data = JSON.parse(event.data);

    // Play sounds for alert-related events
    if (data.type === 'alert_created' && data.alert) {
      playAlertBySeverity(data.alert.severity);
    }
    if (data.type === 'alert_escalated') {
      playEscalationSound();
    }
    if (data.type === 'alert_acknowledged') {
      // no sound — handled locally by the UI
    }

    notifyListeners(data);
  } catch (_) {}
}

export function connectWS() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      clearTimeout(reconnectTimer);
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {};

    ws.onclose = () => {
      ws = null;
      scheduleReconnect();
    };
  } catch (_) {
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connectWS, 3000);
}

export function disconnectWS() {
  clearTimeout(reconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
}

export function sendWS(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// Auto-manage connection based on app state
let appStateSubscription = null;

export function startWSManager() {
  connectWS();
  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        connectWS();
      } else if (state === 'background') {
        disconnectWS();
      }
    });
  }
}

export function stopWSManager() {
  disconnectWS();
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}
