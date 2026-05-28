import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { phone_number_id?: string; access_token?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }

  const { phone_number_id, access_token } = body ?? {};
  if (!phone_number_id || !access_token) {
    return jsonRes({ error: 'Phone Number ID et Access Token requis' }, 400);
  }

  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/whatsapp/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ phone_number_id, access_token }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    return jsonRes(data, res.status);
  } catch {
    return jsonRes({ error: 'Erreur réseau' }, 502);
  }
};
