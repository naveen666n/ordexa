'use strict';

const jwt = require('jsonwebtoken');

// Inline the logic to avoid loading env validation (setup.js sets env vars but
// we need them available before requiring the module the first time)
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../../src/utils/jwt');

describe('JWT utilities', () => {
  const payload = { id: 7, role: 'customer' };

  test('signAccessToken produces a verifiable token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(7);
    expect(decoded.role).toBe('customer');
  });

  test('signRefreshToken produces a verifiable token', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe(7);
  });

  test('expired access token throws JsonWebTokenError / TokenExpiredError', () => {
    // Sign with 0s expiry
    const expired = jwt.sign(payload, ACCESS_SECRET, { expiresIn: 0 });
    expect(() => verifyAccessToken(expired)).toThrow();
  });

  test('token signed with wrong secret throws', () => {
    const badToken = jwt.sign(payload, 'wrong_secret_value_that_is_different');
    expect(() => verifyAccessToken(badToken)).toThrow();
  });

  test('tampered token payload throws', () => {
    const token = signAccessToken(payload);
    // Flip a byte in the signature portion
    const parts = token.split('.');
    parts[2] = parts[2].slice(0, -1) + (parts[2].slice(-1) === 'A' ? 'B' : 'A');
    expect(() => verifyAccessToken(parts.join('.'))).toThrow();
  });
});
