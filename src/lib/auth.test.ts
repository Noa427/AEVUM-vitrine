import { describe, it, expect, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import { getClientFromCookie, clearAuthCookie } from './auth';

const TEST_SECRET = 'test-secret-at-least-32-chars-long!!';
const encoder = new TextEncoder();

async function makeToken(payload: object, expiresIn = '1h') {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encoder.encode(TEST_SECRET));
}

function makeRequest(cookieHeader: string): Request {
  return new Request('http://localhost/', {
    headers: { cookie: cookieHeader },
  });
}

describe('getClientFromCookie', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  it('returns null when cookie is absent', async () => {
    const result = await getClientFromCookie(makeRequest(''));
    expect(result).toBeNull();
  });

  it('returns null when token has wrong signature', async () => {
    const token = await makeToken({ clientId: '1', email: 'a@b.com' });
    process.env.JWT_SECRET = 'different-secret-also-32-chars-xxx';
    const result = await getClientFromCookie(makeRequest(`aevum_token=${token}`));
    expect(result).toBeNull();
  });

  it('returns null when token is expired', async () => {
    const token = await makeToken({ clientId: '1', email: 'a@b.com' }, '-1s');
    const result = await getClientFromCookie(makeRequest(`aevum_token=${token}`));
    expect(result).toBeNull();
  });

  it('returns payload for a valid token', async () => {
    const token = await makeToken({ clientId: 'abc123', email: 'client@test.com' });
    const result = await getClientFromCookie(makeRequest(`aevum_token=${token}`));
    expect(result).not.toBeNull();
    expect(result!.clientId).toBe('abc123');
    expect(result!.email).toBe('client@test.com');
    expect(result!.token).toBe(token);
  });

  it('parses cookie among multiple cookies', async () => {
    const token = await makeToken({ clientId: 'xyz', email: 'x@y.com' });
    const req = makeRequest(`session=abc; aevum_token=${token}; other=def`);
    const result = await getClientFromCookie(req);
    expect(result!.clientId).toBe('xyz');
  });
});

describe('clearAuthCookie', () => {
  it('returns a Set-Cookie string that expires the token', () => {
    const header = clearAuthCookie();
    expect(header).toContain('aevum_token=');
    expect(header).toContain('Max-Age=0');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Path=/');
  });
});
