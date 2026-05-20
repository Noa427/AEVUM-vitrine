import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { id: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body?.id) {
    return new Response(JSON.stringify({ error: 'id requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = import.meta.env.AEVUM_URL;
  try {
    const res = await fetch(`${base}/client/automations/custom/${body.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Erreur réseau' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
