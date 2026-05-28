import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes, UUID_V4 } from '../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  const cookieHeader = request.headers.get('cookie') ?? '';
  const fmMatch = cookieHeader.match(/(?:^|;\s*)aevum_formation_id=([^;]+)/);
  const rawFormationId = fmMatch?.[1] ?? null;
  const formationId = rawFormationId && UUID_V4.test(rawFormationId) ? rawFormationId : null;

  let body: { student_id: string; config_type: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.student_id || !body?.config_type) {
    return jsonRes({ error: 'student_id et config_type requis' }, 400);
  }
  if (!UUID_V4.test(body.student_id)) {
    return jsonRes({ error: 'student_id invalide' }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/send-manual`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        ...(formationId ? { 'X-Formation-Id': formationId } : {}),
      },
      body: JSON.stringify({ student_id: body.student_id, config_type: body.config_type }),
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
