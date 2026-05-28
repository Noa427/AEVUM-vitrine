import { jwtVerify } from 'jose';

if (!import.meta.env.JWT_SECRET) {
  throw new Error('[AEVUM] JWT_SECRET manquant — démarrage impossible');
}
if (!import.meta.env.AEVUM_URL) {
  throw new Error('[AEVUM] AEVUM_URL manquant — démarrage impossible');
}

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

  const secret = import.meta.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    const clientId = payload['clientId'] as string | undefined;
    const email = payload['email'] as string | undefined;
    if (!clientId || !email) return null;
    return { clientId, email, token };
  } catch {
    return null;
  }
}
