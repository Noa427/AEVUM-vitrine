import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }

  const b = body as Record<string, unknown>;
  if (
    typeof b.emailType !== 'string' || b.emailType.length > 50 ||
    typeof b.formationName !== 'string' || b.formationName.length > 200 ||
    typeof b.tone !== 'string' || b.tone.length > 50 ||
    typeof b.objective !== 'string' || b.objective.length > 500
  ) {
    return jsonRes({ error: 'Paramètres invalides' }, 400);
  }
  const validatedBody = {
    emailType: b.emailType,
    formationName: b.formationName,
    tone: b.tone,
    objective: b.objective,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/ai/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedBody),
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
