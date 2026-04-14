// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import { apiUrl } from '../apiClient';

describe('apiClient', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('apiUrl', () => {
    it('prepends the base URL to a path', () => {
      const url = apiUrl('/api/residents');
      expect(url).toContain('/api/residents');
      expect(url).toMatch(/^https?:\/\//);
    });

    it('handles query parameters', () => {
      const url = apiUrl('/api/tasks?status=all');
      expect(url).toContain('/api/tasks?status=all');
    });

    it('never produces a relative URL', () => {
      const url = apiUrl('/api/alerts');
      expect(url).not.toBe('/api/alerts');
      expect(url).toMatch(/^https?:\/\//);
    });
  });
});
