import bcrypt from 'bcryptjs';
import request from 'supertest';

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

// Mock the Prisma client so tests don't require a live database.
jest.mock('../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// eslint-disable-next-line import/first
import { createApp } from '../src/app';
// eslint-disable-next-line import/first
import { prisma } from '../src/config/prisma';

const app = createApp();

describe('POST /auth/login', () => {
  it('returns 422 when the body is invalid', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a non-existent user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Invalid email or password' });
  });

  it('returns an access token and user for valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 10);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'admin@mpcircle.org',
      password: hash,
      name: 'Admin User',
      role: 'ADMIN',
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@mpcircle.org', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).toEqual({
      id: 'user-1',
      email: 'admin@mpcircle.org',
      name: 'Admin User',
      role: 'ADMIN',
    });
  });
});
