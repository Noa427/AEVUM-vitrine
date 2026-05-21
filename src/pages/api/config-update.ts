import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { config_type: string; value: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body?.config_type || body.value === undefined) {
    return new Response(JSON.stringify({ error: 'config_type et value requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = import.meta.env.AEVUM_URL;
  try {
    const res = await fetch(`${base}/client/configs`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config_type: body.config_type, value: body.value }),
    });
    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Erreur réseau: ${msg}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
