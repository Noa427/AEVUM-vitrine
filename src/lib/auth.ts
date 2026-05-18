import { jwtVerify } from 'jose';

export interface AuthPayload {
  clientId: string;
  email: string;
  token: string;
}

function extractToken(request: Request): string | null {
  const header = request.headers.get('cookie') ?? '';
  const match = header.match(/(?:^|;\s*)aevum_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function getClientFromCookie(request: Request): Promise<AuthPayload | null> {
  const token = extractToken(request);
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const clientId = payload['clientId'] as string | undefined;
    const email = payload['email'] as string | undefined;
    if (!clientId || !email) return null;
    return { clientId, email, token };
  } catch {
    return null;
  }
}

export function clearAuthCookie(): string {
  return 'aevum_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/';
}
