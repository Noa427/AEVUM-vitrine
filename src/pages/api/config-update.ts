import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  const cookieHeader = request.headers.get('cookie') ?? '';
  const fmMatch = cookieHeader.match(/(?:^|;\s*)aevum_formation_id=([^;]+)/);
  const formationId = fmMatch?.[1] ?? null;

  let body: { config_type: string; value: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.config_type || body.value === undefined) {
    return jsonRes({ error: 'config_type et value requis' }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/configs`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        ...(formationId ? { 'X-Formation-Id': formationId } : {}),
      },
      body: JSON.stringify({ config_type: body.config_type, value: body.value }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return jsonRes(await res.json().catch(() => ({})), res.status);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      return jsonRes({ error: 'Timeout' }, 504);
    }
    return jsonRes({ error: 'Erreur réseau' }, 502);
  }
};
