/**
 * Tests for the haptics utility module.
 * Verifies each haptic type maps to the correct expo-haptics call.
 */
import { haptic } from '../haptics';

const Haptics = require('expo-haptics');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('haptic utility', () => {
  it('exports all expected haptic types', () => {
    expect(typeof haptic.light).toBe('function');
    expect(typeof haptic.medium).toBe('function');
    expect(typeof haptic.heavy).toBe('function');
    expect(typeof haptic.success).toBe('function');
    expect(typeof haptic.warning).toBe('function');
    expect(typeof haptic.error).toBe('function');
    expect(typeof haptic.selection).toBe('function');
  });

  it('light triggers impactAsync with Light style', async () => {
    await haptic.light();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light,
    );
  });

  it('medium triggers impactAsync with Medium style', async () => {
    await haptic.medium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Medium,
    );
  });

  it('heavy triggers impactAsync with Heavy style', async () => {
    await haptic.heavy();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Heavy,
    );
  });

  it('success triggers notificationAsync with Success type', async () => {
    await haptic.success();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
  });

  it('warning triggers notificationAsync with Warning type', async () => {
    await haptic.warning();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Warning,
    );
  });

  it('error triggers notificationAsync with Error type', async () => {
    await haptic.error();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error,
    );
  });

  it('selection triggers selectionAsync', async () => {
    await haptic.selection();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });

  it('each impact type calls impactAsync exactly once', async () => {
    await haptic.light();
    await haptic.medium();
    await haptic.heavy();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(3);
  });

  it('each notification type calls notificationAsync exactly once', async () => {
    await haptic.success();
    await haptic.warning();
    await haptic.error();
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(3);
  });

  it('does not throw when haptics fail (swallows errors)', async () => {
    Haptics.impactAsync.mockRejectedValueOnce(new Error('Native module unavailable'));
    // Should not throw because haptic.light() has .catch(() => {})
    await expect(haptic.light()).resolves.not.toThrow();
  });

  it('does not throw when notification haptics fail', async () => {
    Haptics.notificationAsync.mockRejectedValueOnce(new Error('Fail'));
    await expect(haptic.success()).resolves.not.toThrow();
  });

  it('does not throw when selection haptics fail', async () => {
    Haptics.selectionAsync.mockRejectedValueOnce(new Error('Fail'));
    await expect(haptic.selection()).resolves.not.toThrow();
  });
});
