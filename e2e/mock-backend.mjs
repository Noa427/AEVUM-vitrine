import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import { MOCK_PORT, TEST_EMAIL, TEST_PASSWORD, TEST_CLIENT_ID, JWT_SECRET } from './fixtures.mjs';

const encoder = new TextEncoder();

// État en mémoire, reset à chaque démarrage du serveur
const state = {
  configs: {},
  automations: [],
};

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  try {
    if (req.method === 'POST' && pathname === '/client/login') {
      const body = await readJsonBody(req);
      if (body.email === TEST_EMAIL && body.password === TEST_PASSWORD) {
        const token = await new SignJWT({ clientId: TEST_CLIENT_ID, email: TEST_EMAIL })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .sign(encoder.encode(JWT_SECRET));
        return json(res, 200, { token });
      }
      return json(res, 401, { error: 'Identifiants incorrects' });
    }

    // Toutes les autres routes nécessitent un Bearer token
    if (!req.headers['authorization']) {
      return json(res, 401, { error: 'Non authentifié' });
    }

    if (req.method === 'GET' && pathname === '/client/me') {
      return json(res, 200, {
        whatsapp_connected: false,
        option_checkout: true,
        paused_until: null,
        dkim_public_key: 'e2e-dkim-test-key',
      });
    }

    if (req.method === 'GET' && pathname === '/client/stats') {
      return json(res, 200, {});
    }

    if (req.method === 'GET' && pathname === '/client/automations') {
      return json(res, 200, {
        onboarding: true,
        recouvrement: true,
        support_ia: false,
        upsell: false,
        sender_name: '',
      });
    }

    if (req.method === 'GET' && pathname === '/client/history') {
      return json(res, 200, []);
    }

    if (req.method === 'GET' && pathname === '/client/formations') {
      return json(res, 200, []);
    }

    if (req.method === 'GET' && pathname === '/client/configs') {
      const arr = Object.entries(state.configs).map(([config_type, value]) => ({ config_type, value }));
      return json(res, 200, arr);
    }

    if (req.method === 'PUT' && pathname === '/client/configs') {
      const body = await readJsonBody(req);
      state.configs[body.config_type] = body.value;
      return json(res, 200, {});
    }

    if (req.method === 'GET' && pathname === '/client/automations/custom') {
      return json(res, 200, state.automations);
    }

    if (req.method === 'POST' && pathname === '/client/ai/generate') {
      const body = await readJsonBody(req);
      return json(res, 200, {
        subject: `Sujet généré pour ${body.formationName || 'votre formation'}`,
        body: `Bonjour {{nom}}, contenu généré (${body.tone}, ${body.objective}).`,
      });
    }

    if (req.method === 'POST' && pathname === '/client/automations/custom') {
      const body = await readJsonBody(req);
      const automation = {
        id: randomUUID(),
        name: body.name,
        trigger_type: body.trigger_type,
        trigger_delay_days: body.trigger_delay_days ?? null,
        trigger_date: body.trigger_date ?? null,
        subject: body.subject,
        body: body.body,
        active: true,
      };
      state.automations.push(automation);
      return json(res, 200, automation);
    }

    const customMatch = pathname.match(/^\/client\/automations\/custom\/([0-9a-f-]+)$/i);
    if (customMatch) {
      const id = customMatch[1];
      const idx = state.automations.findIndex((a) => a.id === id);
      if (idx === -1) return json(res, 404, { error: 'Introuvable' });

      if (req.method === 'PUT') {
        const body = await readJsonBody(req);
        state.automations[idx] = { ...state.automations[idx], ...body };
        return json(res, 200, state.automations[idx]);
      }
      if (req.method === 'DELETE') {
        state.automations.splice(idx, 1);
        return json(res, 200, {});
      }
    }

    return json(res, 404, { error: 'Not found' });
  } catch {
    return json(res, 400, { error: 'Bad request' });
  }
});

server.listen(MOCK_PORT, () => {
  console.log(`[mock-backend] listening on http://localhost:${MOCK_PORT}`);
});
