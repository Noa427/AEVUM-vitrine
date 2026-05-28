import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes, UUID_V4 } from '../../lib/api';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  const cookieHeader = request.headers.get('cookie') ?? '';
  const fmMatch = cookieHeader.match(/(?:^|;\s*)aevum_formation_id=([^;]+)/);
  const rawFormationId = fmMatch?.[1] ?? null;
  const formationId = rawFormationId && UUID_V4.test(rawFormationId) ? rawFormationId : null;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonRes({ error: 'id requis' }, 400);
  if (!UUID_V4.test(id)) return jsonRes({ error: 'id invalide' }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/students/${id}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        ...(formationId ? { 'X-Formation-Id': formationId } : {}),
      },
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
