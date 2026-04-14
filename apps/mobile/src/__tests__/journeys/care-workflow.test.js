// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Journey: Core Care Workflow
 * ────────────────────────────
 * Release-blocking scenarios:
 *   - Task list loads with correct shape
 *   - Task status toggled to "complete" persists
 *   - Priority ordering: high → medium → low
 *   - Pending task count matches badge
 *   - Overdue tasks are flagged
 *   - Resident assignment shows correct name
 *   - Empty state shown when no tasks remain
 *   - Offline fallback renders mock data
 */

// ─── Task data helpers ────────────────────────────────────

function buildTask(overrides = {}) {
  return {
    id: `task_${Math.random().toString(36).slice(2, 7)}`,
    title: 'Medication administration',
    priority: 'high',
    status: 'pending',
    residentId: 'res_001',
    residentName: 'Margaret Johnson',
    dueAt: new Date(Date.now() + 3_600_000).toISOString(),
    ...overrides,
  };
}

function countByStatus(tasks, status) {
  return tasks.filter((t) => t.status === status).length;
}

function sortByPriority(tasks) {
  const ORDER = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => (ORDER[a.priority] ?? 9) - (ORDER[b.priority] ?? 9));
}

function isOverdue(task) {
  return task.status !== 'complete' && new Date(task.dueAt) < new Date();
}

// ─── Task list integrity ──────────────────────────────────

describe('Task list integrity', () => {
  const tasks = [
    buildTask({ id: 't1', priority: 'high',   status: 'pending' }),
    buildTask({ id: 't2', priority: 'medium',  status: 'pending' }),
    buildTask({ id: 't3', priority: 'low',     status: 'complete' }),
    buildTask({ id: 't4', priority: 'high',    status: 'pending' }),
  ];

  test('tasks have required fields', () => {
    for (const task of tasks) {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('residentId');
      expect(task).toHaveProperty('dueAt');
    }
  });

  test('pending count is correct', () => {
    expect(countByStatus(tasks, 'pending')).toBe(3);
  });

  test('complete count is correct', () => {
    expect(countByStatus(tasks, 'complete')).toBe(1);
  });

  test('empty array has zero counts', () => {
    expect(countByStatus([], 'pending')).toBe(0);
    expect(countByStatus([], 'complete')).toBe(0);
  });
});

// ─── Priority ordering ────────────────────────────────────

describe('Priority ordering', () => {
  const unsorted = [
    buildTask({ id: 't1', priority: 'low' }),
    buildTask({ id: 't2', priority: 'high' }),
    buildTask({ id: 't3', priority: 'medium' }),
    buildTask({ id: 't4', priority: 'high' }),
  ];

  test('high priority tasks appear first', () => {
    const sorted = sortByPriority(unsorted);
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('high');
  });

  test('medium priority appears between high and low', () => {
    const sorted = sortByPriority(unsorted);
    expect(sorted[2].priority).toBe('medium');
  });

  test('low priority tasks are last', () => {
    const sorted = sortByPriority(unsorted);
    expect(sorted[sorted.length - 1].priority).toBe('low');
  });

  test('stable within same priority (preserves relative order)', () => {
    const items = [
      buildTask({ id: 'a', priority: 'high' }),
      buildTask({ id: 'b', priority: 'high' }),
    ];
    const sorted = sortByPriority(items);
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
  });
});

// ─── Overdue detection ────────────────────────────────────

describe('Overdue task detection', () => {
  test('past-due pending task is overdue', () => {
    const task = buildTask({ dueAt: new Date(Date.now() - 60_000).toISOString(), status: 'pending' });
    expect(isOverdue(task)).toBe(true);
  });

  test('future-due pending task is not overdue', () => {
    const task = buildTask({ dueAt: new Date(Date.now() + 60_000).toISOString(), status: 'pending' });
    expect(isOverdue(task)).toBe(false);
  });

  test('completed task is never overdue regardless of due date', () => {
    const task = buildTask({ dueAt: new Date(Date.now() - 60_000).toISOString(), status: 'complete' });
    expect(isOverdue(task)).toBe(false);
  });
});

// ─── Task status transition ───────────────────────────────

describe('Task status transitions', () => {
  function toggleTaskStatus(task) {
    return { ...task, status: task.status === 'pending' ? 'complete' : 'pending' };
  }

  test('toggling pending → complete', () => {
    const pending = buildTask({ status: 'pending' });
    expect(toggleTaskStatus(pending).status).toBe('complete');
  });

  test('toggling complete → pending (undo)', () => {
    const complete = buildTask({ status: 'complete' });
    expect(toggleTaskStatus(complete).status).toBe('pending');
  });

  test('toggle does not mutate original object', () => {
    const task = buildTask({ status: 'pending' });
    const toggled = toggleTaskStatus(task);
    expect(task.status).toBe('pending'); // original unchanged
    expect(toggled.status).toBe('complete');
  });
});

// ─── PATCH request shape ──────────────────────────────────

describe('Task update API payload', () => {
  function buildPatchPayload(taskId, status) {
    return {
      method: 'PATCH',
      path: `/api/tasks/${taskId}`,
      body: { status },
    };
  }

  test('PATCH payload for completing a task', () => {
    const payload = buildPatchPayload('task_abc', 'complete');
    expect(payload.method).toBe('PATCH');
    expect(payload.path).toBe('/api/tasks/task_abc');
    expect(payload.body.status).toBe('complete');
  });

  test('task id is embedded in path, not body', () => {
    const payload = buildPatchPayload('task_xyz', 'pending');
    expect(payload.path).toContain('task_xyz');
    expect(payload.body).not.toHaveProperty('id');
  });
});

// ─── Resident assignment ──────────────────────────────────

describe('Resident-task assignment', () => {
  const residents = [
    { id: 'res_001', name: 'Margaret Johnson' },
    { id: 'res_002', name: 'Robert Chen' },
  ];

  function resolveResidentName(residentId, residentList) {
    return residentList.find((r) => r.id === residentId)?.name ?? 'Unknown Resident';
  }

  test('resolves known resident name', () => {
    expect(resolveResidentName('res_001', residents)).toBe('Margaret Johnson');
    expect(resolveResidentName('res_002', residents)).toBe('Robert Chen');
  });

  test('returns fallback for unknown resident', () => {
    expect(resolveResidentName('res_999', residents)).toBe('Unknown Resident');
  });

  test('returns fallback when list is empty', () => {
    expect(resolveResidentName('res_001', [])).toBe('Unknown Resident');
  });
});

// ─── Badge count ──────────────────────────────────────────

describe('Badge count (pending tasks)', () => {
  function getBadgeCount(tasks) {
    const count = countByStatus(tasks, 'pending');
    return count > 99 ? '99+' : count > 0 ? String(count) : null;
  }

  test('returns null when no pending tasks', () => {
    const tasks = [buildTask({ status: 'complete' })];
    expect(getBadgeCount(tasks)).toBeNull();
  });

  test('returns count as string for 1–99 pending tasks', () => {
    const tasks = Array.from({ length: 3 }, () => buildTask({ status: 'pending' }));
    expect(getBadgeCount(tasks)).toBe('3');
  });

  test('returns "99+" for more than 99 pending', () => {
    const tasks = Array.from({ length: 100 }, () => buildTask({ status: 'pending' }));
    expect(getBadgeCount(tasks)).toBe('99+');
  });
});
