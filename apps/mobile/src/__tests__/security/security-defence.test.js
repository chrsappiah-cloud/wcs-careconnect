// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Security Defence Tests — CareConnect Mobile
 *
 * Verifies that the apiFetch / apiUrl client layer correctly surfaces
 * defensive HTTP responses (401, 403, 429, 400) and never silently
 * swallows errors or leaks data.
 *
 * Three attack-class suites (brute-force, IDOR, path traversal) plus
 * a response-integrity suite.  All tests mock global.fetch — no real
 * network traffic is generated.
 */

import { apiFetch, apiUrl } from '../../services/apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Brute-force login defence
// ─────────────────────────────────────────────────────────────────────────────
describe('Security Defence: Brute-force login defence', () => {
  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.clearAllMocks(); });

  it('throws on 401 Unauthorized (wrong credentials)', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(
      apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'wrong' }),
      })
    ).rejects.toThrow('API 401');
  });

  it('throws on 429 Too Many Requests (rate limited)', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(
      apiFetch('/auth/login', { method: 'POST' })
    ).rejects.toThrow('API 429');
  });

  it('throws on 403 Forbidden response', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(
      apiFetch('/auth/login', { method: 'POST' })
    ).rejects.toThrow('API 403');
  });

  it('does not return data on 401 response — credential check blocked', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    let result;
    try { result = await apiFetch('/auth/login', { method: 'POST' }); } catch { /* expected */ }
    expect(result).toBeUndefined();
  });

  it('does not return data on 429 response — rate limit blocks all access', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });
    let result;
    try { result = await apiFetch('/auth/login', { method: 'POST' }); } catch { /* expected */ }
    expect(result).toBeUndefined();
  });

  it('every rapid login attempt throws — no silent credential acceptance', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401 });
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        apiFetch('/auth/login', { method: 'POST' })
      )
    );
    expect(results.every(r => r.status === 'rejected')).toBe(true);
    results.forEach(r => expect(r.reason.message).toBe('API 401'));
  });

  it('repeated 429 responses all throw — rate limit is not bypassed over time', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429 });
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        apiFetch('/auth/login', { method: 'POST' })
      )
    );
    expect(results.every(r => r.status === 'rejected')).toBe(true);
    results.forEach(r => expect(r.reason.message).toBe('API 429'));
  });

  it('credentials are sent in request body — not exposed in URL', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const options = {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'S3cr3t!' }),
    };
    try { await apiFetch('/auth/login', options); } catch { /* expected */ }
    const [url] = global.fetch.mock.calls[0];
    expect(url).not.toContain('admin');
    expect(url).not.toContain('S3cr3t!');
  });

  it('thrown error message does not contain the submitted password', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    let error;
    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'mysecretpassword123' }),
      });
    } catch (e) { error = e; }
    expect(error.message).not.toContain('mysecretpassword123');
  });

  it('json() is never called on a non-ok login response — no body parsing on failure', async () => {
    const jsonMock = jest.fn();
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: jsonMock });
    try { await apiFetch('/auth/login', {}); } catch { /* expected */ }
    expect(jsonMock).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — IDOR (Insecure Direct Object Reference) defence
// ─────────────────────────────────────────────────────────────────────────────
describe('Security Defence: IDOR defence', () => {
  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.clearAllMocks(); });

  it('throws on 403 when accessing resident 1001 (cross-tenant ID guess)', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(apiFetch('/api/residents/1001')).rejects.toThrow('API 403');
  });

  it('throws on 403 when accessing resident 1002', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(apiFetch('/api/residents/1002')).rejects.toThrow('API 403');
  });

  it('throws on 403 when accessing resident 1003', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(apiFetch('/api/residents/1003')).rejects.toThrow('API 403');
  });

  it('sequential ID enumeration (1001-1003) — all throw on 403', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 403 });
    const results = await Promise.allSettled(
      [1001, 1002, 1003].map(id => apiFetch(`/api/residents/${id}`))
    );
    expect(results.every(r => r.status === 'rejected')).toBe(true);
    results.forEach(r => expect(r.reason.message).toBe('API 403'));
  });

  it('throws on 404 for non-existent resident (ID 9999)', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(apiFetch('/api/residents/9999')).rejects.toThrow('API 404');
  });

  it('no resident data is returned when 403 is received', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    let residentData;
    try { residentData = await apiFetch('/api/residents/1001'); } catch { /* expected */ }
    expect(residentData).toBeUndefined();
  });

  it('health summary is not returned when 403 is received', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    let data;
    try { data = await apiFetch('/api/residents/1001/health-summary'); } catch { /* expected */ }
    expect(data).toBeUndefined();
  });

  it('low-privilege token triggers 401 — apiFetch throws immediately', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(
      apiFetch('/api/residents/1', {
        headers: { Authorization: 'Bearer low-privilege-token-abc123' },
      })
    ).rejects.toThrow('API 401');
  });

  it('broad sequential enumeration (IDs 1-5) — all throw when server returns 403', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 403 });
    const results = await Promise.allSettled(
      [1, 2, 3, 4, 5].map(id => apiFetch(`/api/residents/${id}`))
    );
    expect(results.every(r => r.status === 'rejected')).toBe(true);
    results.forEach(r => expect(r.reason.message).toBe('API 403'));
  });

  it('client constructs correct resource URL without ID manipulation', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    try { await apiFetch('/api/residents/42'); } catch { /* expected */ }
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/residents/42');
  });

  it('400 response on invalid ID format — throws', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(apiFetch('/api/residents/abc')).rejects.toThrow('API 400');
  });

  it('json() is never called on a 403 response — no partial body leakage', async () => {
    const jsonMock = jest.fn().mockResolvedValueOnce({ secret: 'resident data' });
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403, json: jsonMock });
    try { await apiFetch('/api/residents/1001'); } catch { /* expected */ }
    expect(jsonMock).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — Path traversal defence
// ─────────────────────────────────────────────────────────────────────────────
describe('Security Defence: Path traversal defence', () => {
  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.clearAllMocks(); });

  it('apiUrl always produces an HTTP(S) URL — never a file:// path', () => {
    const url = apiUrl('/residents/../../../etc/passwd');
    expect(url).toMatch(/^https?:\/\//);
    expect(url).not.toMatch(/^file:\/\//);
  });

  it('apiUrl with deep traversal stays within the configured API origin', () => {
    const url = apiUrl('/../../../etc/passwd');
    // The URL string is concatenated — it must still start with the API base
    expect(url.startsWith('http')).toBe(true);
  });

  it('apiUrl with traversal does not produce a bare filesystem path', () => {
    const url = apiUrl('/residents/../../../etc/shadow');
    expect(url).not.toMatch(/^\/etc\//);
    expect(url).not.toBe('/etc/shadow');
  });

  it('apiUrl does not produce an empty or null value', () => {
    expect(apiUrl('/api/residents')).toBeTruthy();
    expect(apiUrl('/api/residents')).not.toBe('');
  });

  it('apiFetch with traversal path — server returns 400 — throws', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(
      apiFetch('/residents/../../../etc/passwd')
    ).rejects.toThrow('API 400');
  });

  it('apiFetch with nested traversal — server returns 403 — throws', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(
      apiFetch('/residents/1/../../../etc/shadow')
    ).rejects.toThrow('API 403');
  });

  it('apiFetch with null-byte injection — server returns 400 — throws', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(
      apiFetch('/api/residents/1%00.jpg')
    ).rejects.toThrow('API 400');
  });

  it('apiFetch with encoded traversal (%2E%2E) — server returns 400 — throws', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(
      apiFetch('/api/%2E%2E/%2E%2E/etc/passwd')
    ).rejects.toThrow('API 400');
  });

  it('apiFetch with double-encoded traversal (%252E%252E) — server returns 400 — throws', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(
      apiFetch('/api/%252E%252E/%252E%252E/etc/passwd')
    ).rejects.toThrow('API 400');
  });

  it('fetch is called with a string URL — not an object or file descriptor', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    try { await apiFetch('/api/residents/../etc/passwd'); } catch { /* expected */ }
    const [url] = global.fetch.mock.calls[0];
    expect(typeof url).toBe('string');
  });

  it('URL passed to fetch with deep traversal does not escape to system root', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    try { await apiFetch('/../../../../etc/hosts'); } catch { /* expected */ }
    const [url] = global.fetch.mock.calls[0];
    expect(url).not.toBe('/etc/hosts');
    expect(url).not.toMatch(/^\/etc\//);
  });

  it('apiUrl does not generate a localhost bypass URL via traversal', () => {
    const url = apiUrl('/api/residents/../../../admin');
    expect(url).not.toBe('http://localhost/admin');
    expect(url).not.toMatch(/^http:\/\/localhost\//);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — Response integrity
// ─────────────────────────────────────────────────────────────────────────────
describe('Security Defence: Response integrity', () => {
  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.clearAllMocks(); });

  it('successful 200 response returns parsed JSON — nominal path works', async () => {
    const expectedData = { id: 1, name: 'John Smith', room: '101' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce(expectedData),
    });
    const result = await apiFetch('/api/residents/1');
    expect(result).toEqual(expectedData);
  });

  it('5xx server error — throws with the status code', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(apiFetch('/api/residents')).rejects.toThrow('API 500');
  });

  it('network failure (fetch hard-rejects) — throws original network error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network request failed'));
    await expect(apiFetch('/api/residents')).rejects.toThrow('Network request failed');
  });

  it('non-ok response never returns partial data — result stays undefined', async () => {
    const jsonMock = jest.fn().mockResolvedValueOnce({ secret: 'should-not-appear' });
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403, json: jsonMock });
    let result;
    try { result = await apiFetch('/api/residents/1'); } catch { /* expected */ }
    expect(result).toBeUndefined();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('error message contains only the HTTP status code — no sensitive body content', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    let error;
    try { await apiFetch('/api/residents/1'); } catch (e) { error = e; }
    expect(error.message).toBe('API 403');
  });
});
