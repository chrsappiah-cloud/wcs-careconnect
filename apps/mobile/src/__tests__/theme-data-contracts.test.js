// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Theme token validation & mock data contract tests.
 *
 * Ensures every design token is the correct shape/type and that mock data
 * conforms to the contracts expected by screens and components.
 */

import { colors, gradients, animation, spacing, radius, typography, shadows } from '../theme';
import {
  mockResidents,
  mockAlerts,
  mockTasks,
  mockMessages,
  mockReadings,
} from '../mockData';

// ─── Helpers ────────────────────────────────────────────────────────────────
const HEX_RE = /^#[0-9A-Fa-f]{3,8}$/;
const isHex = (v) => typeof v === 'string' && HEX_RE.test(v);

// ─── Theme token tests ─────────────────────────────────────────────────────

describe('Theme — colors', () => {
  const flatColors = [
    'primary', 'primaryLight', 'primaryBorder', 'primaryDark',
    'background', 'surface', 'surfaceBorder', 'surfaceSecondary',
    'text', 'textSecondary', 'textTertiary', 'textMuted', 'textInverse',
    'border', 'borderLight', 'divider',
    'success', 'successLight', 'successDark',
    'warning', 'warningLight', 'warningDark',
    'danger', 'dangerLight', 'dangerDark',
    'heart', 'heartBg',
    'statusStable', 'statusWarning', 'statusCritical',
  ];

  test.each(flatColors)('colors.%s is a valid hex string', (key) => {
    expect(isHex(colors[key])).toBe(true);
  });

  test('vitals contains glucose, hr, spo2, bp with color+bg', () => {
    ['glucose', 'hr', 'spo2', 'bp'].forEach((v) => {
      expect(colors.vitals[v]).toBeDefined();
      expect(isHex(colors.vitals[v].color)).toBe(true);
      expect(isHex(colors.vitals[v].bg)).toBe(true);
    });
  });

  test('status contains stable, warning, critical with color+bg+text', () => {
    ['stable', 'warning', 'critical'].forEach((s) => {
      expect(colors.status[s]).toBeDefined();
      expect(isHex(colors.status[s].color)).toBe(true);
      expect(isHex(colors.status[s].bg)).toBe(true);
      expect(isHex(colors.status[s].text)).toBe(true);
    });
  });

  test('severity contains critical, warning, info as hex', () => {
    ['critical', 'warning', 'info'].forEach((s) => {
      expect(isHex(colors.severity[s])).toBe(true);
    });
  });
});

describe('Theme — gradients', () => {
  const presets = [
    'primary', 'header', 'success', 'danger', 'warning',
    'card', 'vitalsGlucose', 'vitalsHr', 'vitalsSpo2', 'vitalsBp', 'background',
  ];

  test.each(presets)('gradients.%s is an array of hex strings', (key) => {
    expect(Array.isArray(gradients[key])).toBe(true);
    expect(gradients[key].length).toBeGreaterThanOrEqual(2);
    gradients[key].forEach((c) => expect(isHex(c)).toBe(true));
  });
});

describe('Theme — animation', () => {
  test('spring tokens are positive numbers', () => {
    expect(typeof animation.spring.damping).toBe('number');
    expect(typeof animation.spring.stiffness).toBe('number');
    expect(typeof animation.spring.mass).toBe('number');
    expect(animation.spring.damping).toBeGreaterThan(0);
  });

  test('springBouncy tokens are positive numbers', () => {
    expect(animation.springBouncy.damping).toBeGreaterThan(0);
    expect(animation.springBouncy.stiffness).toBeGreaterThan(0);
    expect(animation.springBouncy.mass).toBeGreaterThan(0);
  });

  test('duration tokens (fast, normal, slow) are ascending', () => {
    const { fast, normal, slow } = animation.duration;
    expect(fast).toBeLessThan(normal);
    expect(normal).toBeLessThan(slow);
  });

  test('pressScale is between 0 and 1', () => {
    expect(animation.pressScale).toBeGreaterThan(0);
    expect(animation.pressScale).toBeLessThan(1);
  });
});

describe('Theme — spacing', () => {
  const keys = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];

  test.each(keys)('spacing.%s is a positive number', (key) => {
    expect(typeof spacing[key]).toBe('number');
    expect(spacing[key]).toBeGreaterThan(0);
  });

  test('spacing values increase monotonically', () => {
    const values = keys.map((k) => spacing[k]);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe('Theme — radius', () => {
  const keys = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];

  test.each(keys)('radius.%s is a positive number', (key) => {
    expect(typeof radius[key]).toBe('number');
    expect(radius[key]).toBeGreaterThan(0);
  });

  test('radius.full is 9999 (pill shape)', () => {
    expect(radius.full).toBe(9999);
  });
});

describe('Theme — typography', () => {
  const styles = [
    'largeTitle', 'title', 'title2', 'title3', 'headline',
    'body', 'callout', 'subhead', 'footnote', 'caption', 'caption2',
  ];

  test.each(styles)('typography.%s has fontSize, fontWeight, letterSpacing', (key) => {
    const t = typography[key];
    expect(typeof t.fontSize).toBe('number');
    expect(typeof t.fontWeight).toBe('string'); // RN requires string weights
    expect(typeof t.letterSpacing).toBe('number');
  });

  test('font sizes are descending from largeTitle to caption2', () => {
    const sizes = styles.map((k) => typography[k].fontSize);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]);
    }
  });
});

describe('Theme — shadows', () => {
  const presets = ['sm', 'md', 'lg', 'xl'];

  test.each(presets)('shadows.%s has required properties', (key) => {
    const s = shadows[key];
    expect(isHex(s.shadowColor)).toBe(true);
    expect(s.shadowOffset).toEqual(expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }));
    expect(typeof s.shadowOpacity).toBe('number');
    expect(typeof s.shadowRadius).toBe('number');
    expect(typeof s.elevation).toBe('number');
  });

  test('shadow elevations increase sm → xl', () => {
    const elevations = presets.map((k) => shadows[k].elevation);
    for (let i = 1; i < elevations.length; i++) {
      expect(elevations[i]).toBeGreaterThan(elevations[i - 1]);
    }
  });

  test('shadows.colored is a function that returns shadow object', () => {
    expect(typeof shadows.colored).toBe('function');
    const result = shadows.colored('#FF0000');
    expect(result.shadowColor).toBe('#FF0000');
    expect(typeof result.shadowOpacity).toBe('number');
    expect(typeof result.elevation).toBe('number');
  });
});

// ─── Mock data contract tests ───────────────────────────────────────────────

describe('MockData — residents contract', () => {
  test('has at least 1 resident', () => {
    expect(mockResidents.length).toBeGreaterThan(0);
  });

  test.each(mockResidents.map((r) => [r.name, r]))('%s has required fields', (_name, r) => {
    expect(typeof r.id).toBe('number');
    expect(typeof r.name).toBe('string');
    expect(r.name.length).toBeGreaterThan(0);
    expect(typeof r.room).toBe('string');
    expect(['stable', 'warning', 'critical']).toContain(r.status);
    expect(typeof r.age).toBe('number');
    expect(r.age).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(r.conditions)).toBe(true);
  });

  test('latest_glucose values are positive with unit and ISO timestamp', () => {
    mockResidents.forEach((r) => {
      const g = r.latest_glucose;
      expect(typeof g.value).toBe('number');
      expect(g.value).toBeGreaterThan(0);
      expect(g.unit).toBe('mg/dL');
      expect(() => new Date(g.timestamp)).not.toThrow();
      expect(new Date(g.timestamp).toISOString()).toBe(g.timestamp);
    });
  });

  test('resident IDs are unique', () => {
    const ids = mockResidents.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('contains at least one of each status', () => {
    const statuses = new Set(mockResidents.map((r) => r.status));
    expect(statuses.has('stable')).toBe(true);
    expect(statuses.has('warning')).toBe(true);
    expect(statuses.has('critical')).toBe(true);
  });
});

describe('MockData — alerts contract', () => {
  test('has at least 1 alert', () => {
    expect(mockAlerts.length).toBeGreaterThan(0);
  });

  test.each(mockAlerts.map((a) => [`Alert #${a.id}`, a]))('%s has required fields', (_label, a) => {
    expect(typeof a.id).toBe('number');
    expect(typeof a.resident_id).toBe('number');
    expect(typeof a.resident_name).toBe('string');
    expect(['critical', 'warning', 'info']).toContain(a.severity);
    expect(typeof a.message).toBe('string');
    expect(a.message.length).toBeGreaterThan(0);
    expect(typeof a.type).toBe('string');
    expect(a.status).toBe('open');
    expect(() => new Date(a.created_at)).not.toThrow();
  });

  test('alert resident_ids reference valid residents', () => {
    const resIds = new Set(mockResidents.map((r) => r.id));
    mockAlerts.forEach((a) => {
      expect(resIds.has(a.resident_id)).toBe(true);
    });
  });

  test('alert IDs are unique', () => {
    const ids = mockAlerts.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('contains at least one critical severity', () => {
    expect(mockAlerts.some((a) => a.severity === 'critical')).toBe(true);
  });
});

describe('MockData — tasks contract', () => {
  test('has at least 1 task', () => {
    expect(mockTasks.length).toBeGreaterThan(0);
  });

  test.each(mockTasks.map((t) => [`Task #${t.id}`, t]))('%s has required fields', (_label, t) => {
    expect(typeof t.id).toBe('number');
    expect(typeof t.title).toBe('string');
    expect(typeof t.description).toBe('string');
    expect(['pending', 'completed']).toContain(t.status);
    expect(['high', 'medium', 'low']).toContain(t.priority);
  });

  test('pending tasks have due_at, completed tasks have completed_at', () => {
    mockTasks.forEach((t) => {
      if (t.status === 'pending') {
        expect(t.due_at).toBeDefined();
        expect(() => new Date(t.due_at)).not.toThrow();
      }
      if (t.status === 'completed') {
        expect(t.completed_at).toBeDefined();
        expect(() => new Date(t.completed_at)).not.toThrow();
      }
    });
  });

  test('task IDs are unique', () => {
    const ids = mockTasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('contains both pending and completed tasks', () => {
    const statuses = new Set(mockTasks.map((t) => t.status));
    expect(statuses.has('pending')).toBe(true);
    expect(statuses.has('completed')).toBe(true);
  });

  test('task resident_ids reference valid residents or null (ward-level)', () => {
    const resIds = new Set(mockResidents.map((r) => r.id));
    mockTasks.forEach((t) => {
      if (t.resident_id !== null) {
        expect(resIds.has(t.resident_id)).toBe(true);
      }
    });
  });
});

describe('MockData — messages contract', () => {
  test('has at least 1 message', () => {
    expect(mockMessages.length).toBeGreaterThan(0);
  });

  test.each(mockMessages.map((m) => [`Msg #${m.id}`, m]))('%s has required fields', (_label, m) => {
    expect(typeof m.id).toBe('number');
    expect(typeof m.sender_name).toBe('string');
    expect(typeof m.sender_role).toBe('string');
    expect(typeof m.content).toBe('string');
    expect(m.content.length).toBeGreaterThan(0);
    expect(() => new Date(m.created_at)).not.toThrow();
  });

  test('message IDs are unique', () => {
    const ids = mockMessages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('messages are chronologically ordered (ascending)', () => {
    for (let i = 1; i < mockMessages.length; i++) {
      const prev = new Date(mockMessages[i - 1].created_at).getTime();
      const curr = new Date(mockMessages[i].created_at).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

describe('MockData — readings contract', () => {
  const VALID_METRICS = ['glucose', 'hr', 'spo2', 'bp_systolic'];
  const VALID_SOURCES = ['ble', 'manual'];

  test('has at least 1 reading', () => {
    expect(mockReadings.length).toBeGreaterThan(0);
  });

  test.each(mockReadings.map((r) => [`Reading #${r.id}`, r]))('%s has required fields', (_label, r) => {
    expect(typeof r.id).toBe('number');
    expect(typeof r.resident_id).toBe('number');
    expect(VALID_METRICS).toContain(r.metric);
    expect(typeof r.value).toBe('number');
    expect(r.value).toBeGreaterThan(0);
    expect(typeof r.unit).toBe('string');
    expect(VALID_SOURCES).toContain(r.source);
    expect(() => new Date(r.created_at)).not.toThrow();
  });

  test('reading resident_ids reference valid residents', () => {
    const resIds = new Set(mockResidents.map((r) => r.id));
    mockReadings.forEach((r) => {
      expect(resIds.has(r.resident_id)).toBe(true);
    });
  });

  test('reading IDs are unique', () => {
    const ids = mockReadings.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('glucose readings have mg/dL unit', () => {
    mockReadings
      .filter((r) => r.metric === 'glucose')
      .forEach((r) => expect(r.unit).toBe('mg/dL'));
  });

  test('hr readings have bpm unit', () => {
    mockReadings
      .filter((r) => r.metric === 'hr')
      .forEach((r) => expect(r.unit).toBe('bpm'));
  });

  test('spo2 readings have % unit and value 0–100', () => {
    mockReadings
      .filter((r) => r.metric === 'spo2')
      .forEach((r) => {
        expect(r.unit).toBe('%');
        expect(r.value).toBeGreaterThanOrEqual(0);
        expect(r.value).toBeLessThanOrEqual(100);
      });
  });
});

describe('MockData — cross-entity referential integrity', () => {
  test('every alert resident_name matches the corresponding resident', () => {
    mockAlerts.forEach((a) => {
      const resident = mockResidents.find((r) => r.id === a.resident_id);
      expect(resident).toBeDefined();
      expect(a.resident_name).toBe(resident.name);
    });
  });

  test('readings for a resident match their latest_glucose value', () => {
    mockResidents.forEach((res) => {
      const glucoseReadings = mockReadings
        .filter((r) => r.resident_id === res.id && r.metric === 'glucose');
      if (glucoseReadings.length > 0) {
        // Most recent reading should match latest_glucose
        const sorted = [...glucoseReadings].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
        expect(sorted[0].value).toBe(res.latest_glucose.value);
      }
    });
  });
});
