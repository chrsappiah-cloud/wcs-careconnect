const request = require('supertest');

jest.mock('../db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));

const db = require('../db');
const { app } = require('../server');

describe('API contract tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /health returns service contract', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        db: 'connected',
        ts: expect.any(String),
      })
    );
  });

  test('GET /api/residents returns list contract', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: 'Alice Green',
          room: 'A101',
          status: 'stable',
        },
      ],
    });

    const res = await request(app).get('/api/residents');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        room: expect.any(String),
        status: expect.any(String),
      })
    );
  });

  test('POST /api/residents validates required fields', async () => {
    const res = await request(app).post('/api/residents').send({ room: 'A102' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});
