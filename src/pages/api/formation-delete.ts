import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes, UUID_V4 } from '../../lib/api';

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { id?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.id) return jsonRes({ error: 'id requis' }, 400);
  if (!UUID_V4.test(body.id)) return jsonRes({ error: 'ID invalide' }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/formations/${body.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
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
