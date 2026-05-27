import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DELETE: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { email: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.email || !EMAIL_RE.test(body.email)) {
    return jsonRes({ error: 'email valide requis' }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/blacklist`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return jsonRes(await res.json().catch(() => ({})), res.status);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') return jsonRes({ error: 'Timeout' }, 504);
    return jsonRes({ error: 'Erreur réseau' }, 502);
  }
};
