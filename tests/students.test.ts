import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    student: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// eslint-disable-next-line import/first
import { createApp } from '../src/app';
// eslint-disable-next-line import/first
import { prisma } from '../src/config/prisma';

const app = createApp();
const token = jwt.sign({ sub: 'u1', email: 'a@a.com', role: 'ADMIN' }, 'test_secret');

describe('GET /students', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/students');
    expect(res.status).toBe(401);
  });

  it('returns a paginated list for an authenticated request', async () => {
    (prisma.student.findMany as jest.Mock).mockResolvedValue([
      { id: '1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    ]);
    (prisma.student.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app).get('/students').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
  });
});

describe('GET /students/:id', () => {
  it('returns 422 for a non-uuid id', async () => {
    const res = await request(app)
      .get('/students/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
  });

  it('returns 404 when the student does not exist', async () => {
    (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/students/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Student not found' });
  });
});

describe('POST /students', () => {
  it('returns 422 when required fields are missing', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Ada' });

    expect(res.status).toBe(422);
  });

  it('creates a student with a valid payload', async () => {
    const payload = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };
    (prisma.student.create as jest.Mock).mockResolvedValue({ id: '1', ...payload });

    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('ada@example.com');
  });
});
