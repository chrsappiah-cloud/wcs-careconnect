import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const SOUNDS = {
  critical: require('../../../assets/sounds/critical_alert.wav'),
  warning: require('../../../assets/sounds/warning_alert.wav'),
  info: require('../../../assets/sounds/info_alert.wav'),
  acknowledge: require('../../../assets/sounds/acknowledge.wav'),
  escalation: require('../../../assets/sounds/escalation.wav'),
  newAlert: require('../../../assets/sounds/new_alert.wav'),
};

let soundCache = {};
let audioEnabled = true;

export async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (e) {
    console.warn('Audio init failed:', e.message);
  }
}

async function getSound(key) {
  if (soundCache[key]) return soundCache[key];
  const source = SOUNDS[key];
  if (!source) return null;
  try {
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
    soundCache[key] = sound;
    return sound;
  } catch (e) {
    console.warn(`Failed to load sound "${key}":`, e.message);
    return null;
  }
}

export async function playSound(key) {
  if (!audioEnabled) return;
  try {
    const sound = await getSound(key);
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (e) {
    console.warn(`Play sound "${key}" failed:`, e.message);
  }
}

export function playCriticalAlert() {
  return playSound('critical');
}

export function playWarningAlert() {
  return playSound('warning');
}

export function playInfoAlert() {
  return playSound('info');
}

export function playAcknowledgeSound() {
  return playSound('acknowledge');
}

export function playEscalationSound() {
  return playSound('escalation');
}

export function playNewAlertSound() {
  return playSound('newAlert');
}

export function playAlertBySeverity(severity) {
  switch (severity) {
    case 'critical':
      return playCriticalAlert();
    case 'warning':
      return playWarningAlert();
    case 'info':
      return playInfoAlert();
    default:
      return playNewAlertSound();
  }
}

export function setAudioEnabled(enabled) {
  audioEnabled = enabled;
}

export function isAudioEnabled() {
  return audioEnabled;
}

export async function unloadAll() {
  for (const key of Object.keys(soundCache)) {
    try {
      await soundCache[key].unloadAsync();
    } catch (_) {}
  }
  soundCache = {};
}
