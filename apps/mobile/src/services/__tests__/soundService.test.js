// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import {
  initAudio,
  playSound,
  playCriticalAlert,
  playWarningAlert,
  playInfoAlert,
  playAcknowledgeSound,
  playEscalationSound,
  playNewAlertSound,
  playAlertBySeverity,
  setAudioEnabled,
  isAudioEnabled,
  unloadAll,
} from '../soundService';
import { Audio } from 'expo-av';

const mockPlayAsync = jest.fn().mockResolvedValue(undefined);
const mockSetPositionAsync = jest.fn().mockResolvedValue(undefined);
const mockUnloadAsync = jest.fn().mockResolvedValue(undefined);

const mockSound = {
  playAsync: mockPlayAsync,
  setPositionAsync: mockSetPositionAsync,
  unloadAsync: mockUnloadAsync,
};

beforeEach(() => {
  jest.clearAllMocks();
  Audio.Sound.createAsync.mockResolvedValue({ sound: mockSound });
  // Reset audio state
  setAudioEnabled(true);
});

afterEach(async () => {
  // Clear sound cache between tests
  await unloadAll();
});

describe('initAudio', () => {
  it('sets audio mode with correct config', async () => {
    await initAudio();
    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  });

  it('handles init failure gracefully', async () => {
    Audio.setAudioModeAsync.mockRejectedValueOnce(new Error('Audio init failure'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    await initAudio();
    expect(consoleSpy).toHaveBeenCalledWith('Audio init failed:', 'Audio init failure');
    consoleSpy.mockRestore();
  });
});

describe('playSound', () => {
  it('creates sound on first play and caches it', async () => {
    await playSound('critical');
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(1);
    expect(mockSetPositionAsync).toHaveBeenCalledWith(0);
    expect(mockPlayAsync).toHaveBeenCalledTimes(1);

    // Second play should use cache
    await playSound('critical');
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(1); // Still 1 — cached
    expect(mockPlayAsync).toHaveBeenCalledTimes(2);
  });

  it('does nothing when audio is disabled', async () => {
    setAudioEnabled(false);
    await playSound('critical');
    expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
    expect(mockPlayAsync).not.toHaveBeenCalled();
  });

  it('handles unknown sound keys gracefully', async () => {
    await playSound('nonexistent');
    expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
    expect(mockPlayAsync).not.toHaveBeenCalled();
  });

  it('handles createAsync failure', async () => {
    Audio.Sound.createAsync.mockRejectedValueOnce(new Error('Load failed'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    await playSound('warning');
    expect(mockPlayAsync).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('resets position before replaying', async () => {
    await playSound('info');
    expect(mockSetPositionAsync).toHaveBeenCalledWith(0);
  });
});

describe('named play functions', () => {
  it('playCriticalAlert plays critical sound', async () => {
    await playCriticalAlert();
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
    expect(mockPlayAsync).toHaveBeenCalled();
  });

  it('playWarningAlert plays warning sound', async () => {
    await playWarningAlert();
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });

  it('playInfoAlert plays info sound', async () => {
    await playInfoAlert();
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });

  it('playAcknowledgeSound plays acknowledge sound', async () => {
    await playAcknowledgeSound();
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });

  it('playEscalationSound plays escalation sound', async () => {
    await playEscalationSound();
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });

  it('playNewAlertSound plays newAlert sound', async () => {
    await playNewAlertSound();
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });
});

describe('playAlertBySeverity', () => {
  it('routes critical severity', async () => {
    await playAlertBySeverity('critical');
    expect(mockPlayAsync).toHaveBeenCalled();
  });

  it('routes warning severity', async () => {
    await playAlertBySeverity('warning');
    expect(mockPlayAsync).toHaveBeenCalled();
  });

  it('routes info severity', async () => {
    await playAlertBySeverity('info');
    expect(mockPlayAsync).toHaveBeenCalled();
  });

  it('defaults to newAlert for unknown severity', async () => {
    await playAlertBySeverity('unknown');
    expect(mockPlayAsync).toHaveBeenCalled();
  });

  it('defaults to newAlert for undefined severity', async () => {
    await playAlertBySeverity();
    expect(mockPlayAsync).toHaveBeenCalled();
  });
});

describe('setAudioEnabled / isAudioEnabled', () => {
  it('starts enabled by default', () => {
    expect(isAudioEnabled()).toBe(true);
  });

  it('can be disabled', () => {
    setAudioEnabled(false);
    expect(isAudioEnabled()).toBe(false);
  });

  it('can be re-enabled', () => {
    setAudioEnabled(false);
    setAudioEnabled(true);
    expect(isAudioEnabled()).toBe(true);
  });

  it('prevents playback when disabled', async () => {
    setAudioEnabled(false);
    await playCriticalAlert();
    expect(mockPlayAsync).not.toHaveBeenCalled();
  });
});

describe('unloadAll', () => {
  it('unloads all cached sounds', async () => {
    await playSound('critical');
    await playSound('warning');
    await unloadAll();
    expect(mockUnloadAsync).toHaveBeenCalledTimes(2);
  });

  it('creates fresh sounds after unload', async () => {
    await playSound('critical'); // cache it
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(1);

    await unloadAll(); // clear cache

    await playSound('critical'); // should create again
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2);
  });

  it('handles unload failure gracefully', async () => {
    mockUnloadAsync.mockRejectedValueOnce(new Error('Unload failed'));
    await playSound('critical');
    // Should not throw
    await expect(unloadAll()).resolves.toBeUndefined();
  });
});
