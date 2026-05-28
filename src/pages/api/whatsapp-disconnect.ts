import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/whatsapp/connect`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    return jsonRes(data, res.status);
  } catch {
    return jsonRes({ error: 'Erreur réseau' }, 502);
  }
};
