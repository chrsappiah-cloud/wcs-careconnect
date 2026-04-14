const request = require('supertest');

jest.mock('../db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));

const db = require('../db');
const { app } = require('../server');

function makeInMemoryResidentDb() {
  const residents = [];
  let nextId = 1;

  return async (sql, params = []) => {
    if (/^SELECT \* FROM residents ORDER BY id/i.test(sql)) {
      return { rows: residents.slice() };
    }

    if (/^SELECT \* FROM residents WHERE id = \$1/i.test(sql)) {
      const id = Number(params[0]);
      const found = residents.find((r) => r.id === id);
      return { rows: found ? [found] : [] };
    }

    if (/^INSERT INTO residents/i.test(sql)) {
      const row = {
        id: nextId++,
        name: params[0],
        room: params[1],
        status: params[2],
        photo_url: params[3],
        age: params[4],
        conditions: params[5],
        latest_glucose: params[6],
        date_of_birth: params[7],
        gender: params[8],
        medicare_number: params[9],
        emergency_contact: params[10],
        gp_name: params[11],
        gp_phone: params[12],
        allergies: params[13],
        medications: params[14],
        medical_history: params[15],
        care_level: params[16],
        admission_date: params[17],
        notes: params[18],
      };
      residents.push(row);
      return { rows: [row] };
    }

    if (/^UPDATE residents SET/i.test(sql)) {
      const id = Number(params[params.length - 1]);
      const found = residents.find((r) => r.id === id);
      if (!found) return { rows: [] };

      const statusParam = params[0];
      if (statusParam) found.status = statusParam;
      return { rows: [found] };
    }

    throw new Error(`Unexpected SQL in test: ${sql}`);
  };
}

describe('Happy-path e2e tests (API)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockImplementation(makeInMemoryResidentDb());
  });

  test('create resident -> list residents -> fetch profile', async () => {
    const created = await request(app).post('/api/residents').send({
      name: 'Test Resident',
      room: 'B201',
      age: 78,
      status: 'stable',
      conditions: ['Hypertension'],
      allergies: ['Penicillin'],
      medications: ['Metoprolol'],
      care_level: 'standard',
      gender: 'Female',
    });

    expect(created.status).toBe(201);
    expect(created.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'Test Resident',
        room: 'B201',
      })
    );

    const list = await request(app).get('/api/residents');
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThanOrEqual(1);

    const profile = await request(app).get(`/api/residents/${created.body.id}`);
    expect(profile.status).toBe(200);
    expect(profile.body).toEqual(expect.objectContaining({ id: created.body.id, name: 'Test Resident' }));
  });

  test('update resident status happy path', async () => {
    const created = await request(app).post('/api/residents').send({ name: 'Update Flow', room: 'C301' });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .patch(`/api/residents/${created.body.id}`)
      .send({ status: 'monitoring' });

    expect(updated.status).toBe(200);
    expect(updated.body).toEqual(expect.objectContaining({ id: created.body.id, status: 'monitoring' }));
  });
});
