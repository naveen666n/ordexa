'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models');

// Unique email per test run so no conflicts with seeded data
const TEST_EMAIL = `jest_auth_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass@1234';

let cookies = [];

afterAll(async () => {
  await User.destroy({ where: { email: TEST_EMAIL }, force: true });
  await sequelize.close();
});

describe('Auth flow integration', () => {
  test('POST /auth/register — creates new customer, returns accessToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        first_name: 'Jest',
        last_name: 'Tester',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.accessToken).toBeDefined();
    // Refresh token set as HTTP-only cookie
    cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
  });

  test('POST /auth/login — returns accessToken and sets refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_EMAIL);

    cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
  });

  test('POST /auth/refresh-token — returns new accessToken using cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    cookies = res.headers['set-cookie'] || cookies;
  });

  test('POST /auth/logout — clears refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] || [];
    const refreshCookie = setCookie.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toMatch(/Expires=Thu, 01 Jan 1970/i);
  });

  test('POST /auth/login — wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPassword@999' });

    expect(res.status).toBe(401);
  });
});
