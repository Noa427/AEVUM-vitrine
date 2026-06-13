# Client Portal v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refaire le dashboard client avec stats/automations/historique et ajouter les pages history et customize (templates), plus un lien retour dans settings.

**Architecture:** Astro 6 SSR (output: 'static' + prerender=false par page). Chaque page protégée via `getClientFromCookie`. Le dashboard fait des appels parallèles avec `Promise.all`. La page customize gère 5 formulaires SSR indépendants via un champ caché `config_type`. `import.meta.env.AEVUM_URL` pour l'URL du backend, `auth.token` comme Bearer.

**Tech Stack:** Astro 6, `src/lib/auth.ts` (getClientFromCookie → AuthPayload { clientId, email, token }), CSS global existant (card, btn, btn-primary, form-group, form-label, form-input, success-msg, grid-2, section, container, accent-line)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify (rewrite) | `src/pages/client/dashboard.astro` | Stats + automations + dernières activités + nav |
| Create | `src/pages/client/history.astro` | Historique complet (100 entrées) |
| Create | `src/pages/client/customize.astro` | Templates email + sender name (5 formulaires SSR) |
| Modify | `src/pages/client/settings.astro` | Ajouter lien retour /client/dashboard |

---

## Task 1: Refaire dashboard.astro

**Files:**
- Modify (full rewrite): `src/pages/client/dashboard.astro`

- [ ] **Step 1: Remplacer `src/pages/client/dashboard.astro` par le contenu complet suivant**

```astro
---
export const prerender = false;
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

const base = import.meta.env.AEVUM_URL;
const headers = { Authorization: `Bearer ${auth.token}` };

type StatsData = {
  emails_this_month?: number;
  total_emails?: number;
  recouvrement_envoyes?: number;
  upsells_envoyes?: number;
};
type AutomationData = {
  onboarding?: boolean;
  recouvrement?: boolean;
  support_ia?: boolean;
  upsell?: boolean;
};
type HistoryEntry = { date: string; action: string; details?: string };

let stats: StatsData | null = null;
let automations: AutomationData | null = null;
let recentHistory: HistoryEntry[] = [];
let globalError = '';

try {
  const [statsRes, autoRes, histRes] = await Promise.all([
    fetch(`${base}/client/stats`, { headers }),
    fetch(`${base}/client/automations`, { headers }),
    fetch(`${base}/client/history?limit=5`, { headers }),
  ]);

  if ([statsRes, autoRes, histRes].some((r) => r.status === 401)) {
    Astro.cookies.delete('aevum_token', { path: '/' });
    return Astro.redirect('/login');
  }

  if (statsRes.ok) stats = await statsRes.json();
  if (autoRes.ok) automations = await autoRes.json();
  if (histRes.ok) recentHistory = await histRes.json();
} catch {
  globalError = 'Erreur réseau. Réessayez ou contactez le support.';
}

function fmt(n: number | undefined): string {
  return n != null ? String(n) : '—';
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
---

<BaseLayout
  title="Mon espace — AEVUM"
  description="Tableau de bord de votre espace client AEVUM."
  canonical="/client/dashboard"
>

<section class="section dash-section">
  <div class="container dash-container">

    <!-- Header -->
    <div class="dash-header">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Mon espace</h1>
      <p style="margin-top:0.5rem">Bienvenue, {auth.email}</p>
    </div>

    {globalError && (
      <div class="dash-error" role="alert">
        {globalError} <a href="/contact" style="color:inherit;text-decoration:underline">Nous contacter</a>
      </div>
    )}

    <!-- SECTION 1 : Stats -->
    <div class="dash-block">
      <h2 class="block-title">Statistiques</h2>
      <div class="stats-grid">
        <div class="stat-card card">
          <p class="stat-label">Emails ce mois</p>
          <p class="stat-value">{fmt(stats?.emails_this_month)}</p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Total emails envoyés</p>
          <p class="stat-value">{fmt(stats?.total_emails)}</p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Relances impayés</p>
          <p class="stat-value">{fmt(stats?.recouvrement_envoyes)}</p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Upsells envoyés</p>
          <p class="stat-value">{fmt(stats?.upsells_envoyes)}</p>
        </div>
      </div>
    </div>

    <!-- SECTION 2 : Automatisations -->
    <div class="dash-block">
      <h2 class="block-title">Automatisations actives</h2>
      <div class="auto-grid">
        <div class="auto-card card">
          <p class="auto-name">Onboarding J0 / J3 / J7</p>
          <span class={`auto-badge ${automations?.onboarding ? 'badge-actif' : 'badge-off'}`}>
            {automations?.onboarding ? 'Actif' : 'Non configuré'}
          </span>
        </div>
        <div class="auto-card card">
          <p class="auto-name">Recouvrement impayés</p>
          <span class={`auto-badge ${automations?.recouvrement ? 'badge-actif' : 'badge-off'}`}>
            {automations?.recouvrement ? 'Actif' : 'Non configuré'}
          </span>
        </div>
        <div class="auto-card card">
          <p class="auto-name">Support IA</p>
          <span class={`auto-badge ${automations?.support_ia ? 'badge-actif' : 'badge-off'}`}>
            {automations?.support_ia ? 'Actif' : 'Non configuré'}
          </span>
        </div>
        <div class="auto-card card">
          <p class="auto-name">Upsell J+30</p>
          <span class={`auto-badge ${automations?.upsell ? 'badge-actif' : 'badge-off'}`}>
            {automations?.upsell ? 'Actif' : 'Non configuré'}
          </span>
        </div>
      </div>
    </div>

    <!-- SECTION 3 : Dernières activités -->
    <div class="dash-block">
      <h2 class="block-title">Dernières activités</h2>
      {recentHistory.length === 0 ? (
        <div class="card" style="padding:1.5rem;color:var(--gray)">Aucune activité récente.</div>
      ) : (
        <div class="card" style="padding:0;overflow:hidden">
          <ul class="activity-list">
            {recentHistory.map((entry) => (
              <li class="activity-item">
                <span class="activity-date">{fmtDate(entry.date)}</span>
                <span class="activity-action">{entry.action}</span>
                {entry.details && <span class="activity-details">{entry.details}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    <!-- SECTION 4 : Navigation -->
    <div class="dash-block">
      <h2 class="block-title">Accès rapide</h2>
      <div class="nav-grid">
        <a href="/client/history" class="nav-card card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          <p class="nav-card-title">Historique complet</p>
          <p class="nav-card-desc">Tous vos logs d'activité</p>
        </a>
        <a href="/client/customize" class="nav-card card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <p class="nav-card-title">Personnaliser les templates</p>
          <p class="nav-card-desc">Emails d'onboarding, relances, upsell</p>
        </a>
        <a href="/client/settings" class="nav-card card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <p class="nav-card-title">Paramètres du compte</p>
          <p class="nav-card-desc">Mot de passe, email, déconnexion</p>
        </a>
      </div>
    </div>

  </div>
</section>

</BaseLayout>

<style>
  .dash-section { padding-top: 7rem; }
  .dash-container { max-width: 960px; }
  .dash-header { margin-bottom: 2.5rem; }
  .dash-header p { max-width: none; margin: 0; font-size: 1rem; color: var(--gray-light); }

  .dash-error {
    padding: 1rem 1.5rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    margin-bottom: 2rem;
  }

  .dash-block { margin-bottom: 3rem; }
  .block-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--light); letter-spacing: -0.01em; }

  /* Stats */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
  .stat-card { padding: 1.5rem; }
  .stat-label { font-size: 0.8125rem; color: var(--gray); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; max-width: none; }
  .stat-value { font-size: 2rem; font-weight: 700; color: var(--light); letter-spacing: -0.03em; }

  /* Automations */
  .auto-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  .auto-card { padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
  .auto-name { font-size: 0.9375rem; color: var(--light); max-width: none; }
  .auto-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .badge-actif { background: var(--success-light); color: var(--success); }
  .badge-off { background: var(--dark-elevated); color: var(--gray); }

  /* Activity */
  .activity-list { list-style: none; }
  .activity-item {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    padding: 0.875rem 1.5rem;
    border-bottom: 1px solid var(--gray-border);
    flex-wrap: wrap;
  }
  .activity-item:last-child { border-bottom: none; }
  .activity-date { font-size: 0.8125rem; color: var(--gray); white-space: nowrap; flex-shrink: 0; }
  .activity-action { font-size: 0.9375rem; color: var(--light); font-weight: 500; }
  .activity-details { font-size: 0.875rem; color: var(--gray-light); }

  /* Nav cards */
  .nav-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  .nav-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-decoration: none;
    color: inherit;
  }
  .nav-card svg { color: var(--primary); margin-bottom: 0.25rem; }
  .nav-card-title { font-size: 1rem; font-weight: 600; color: var(--light); max-width: none; }
  .nav-card-desc { font-size: 0.875rem; color: var(--gray-light); max-width: none; }

  @media (max-width: 768px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .auto-grid { grid-template-columns: 1fr; }
    .nav-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 2: Vérifier le build**

```bash
cd C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine && npm run build
```

Expected: pas d'erreur TypeScript, build propre.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/dashboard.astro
git commit -m "feat: dashboard v2 — stats, automations, activités, nav rapide"
```

---

## Task 2: Créer history.astro

**Files:**
- Create: `src/pages/client/history.astro`

- [ ] **Step 1: Créer `src/pages/client/history.astro`**

```astro
---
export const prerender = false;
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

type HistoryEntry = { date: string; action: string; details?: string };

let history: HistoryEntry[] = [];
let fetchError = '';

try {
  const res = await fetch(`${import.meta.env.AEVUM_URL}/client/history?limit=100`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (res.status === 401) {
    Astro.cookies.delete('aevum_token', { path: '/' });
    return Astro.redirect('/login');
  }
  if (res.ok) {
    history = await res.json();
  } else {
    fetchError = 'Impossible de charger l\'historique.';
  }
} catch {
  fetchError = 'Erreur réseau. Réessayez.';
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
---

<BaseLayout
  title="Historique — AEVUM"
  description="Historique complet de vos activités AEVUM."
  canonical="/client/history"
>

<section class="section history-section">
  <div class="container history-container">

    <div class="history-header">
      <a href="/client/dashboard" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Retour au tableau de bord
      </a>
      <span class="accent-line" style="margin:1rem 0"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Historique d'activité</h1>
    </div>

    {fetchError && (
      <div class="hist-error" role="alert">{fetchError}</div>
    )}

    {!fetchError && history.length === 0 && (
      <div class="card" style="padding:2rem;color:var(--gray);text-align:center">Aucune activité enregistrée pour le moment.</div>
    )}

    {history.length > 0 && (
      <div class="card" style="padding:0;overflow:hidden">
        <table class="hist-table" aria-label="Historique d'activité">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Action</th>
              <th scope="col">Détails</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr>
                <td class="td-date">{fmtDate(entry.date)}</td>
                <td class="td-action">{entry.action}</td>
                <td class="td-details">{entry.details ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

  </div>
</section>

</BaseLayout>

<style>
  .history-section { padding-top: 7rem; }
  .history-container { max-width: 900px; }
  .history-header { margin-bottom: 2rem; }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    color: var(--gray-light);
    transition: color var(--transition);
    margin-bottom: 0.25rem;
  }
  .back-link:hover { color: var(--primary); }

  .hist-error {
    padding: 1rem 1.5rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    margin-bottom: 1.5rem;
  }

  .hist-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
  }
  .hist-table th {
    padding: 0.875rem 1.25rem;
    text-align: left;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gray);
    border-bottom: 1px solid var(--gray-border);
    background: var(--dark-elevated);
  }
  .hist-table td {
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid var(--gray-border);
    vertical-align: top;
  }
  .hist-table tbody tr:last-child td { border-bottom: none; }
  .td-date { white-space: nowrap; color: var(--gray); font-size: 0.8125rem; width: 10rem; }
  .td-action { color: var(--light); font-weight: 500; }
  .td-details { color: var(--gray-light); }

  @media (max-width: 600px) {
    .hist-table th:last-child,
    .hist-table td:last-child { display: none; }
  }
</style>
```

- [ ] **Step 2: Vérifier le build**

```bash
npm run build
```

Expected: build propre, route `/client/history` apparaît en SSR.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/history.astro
git commit -m "feat: history.astro — tableau historique complet 100 entrées"
```

---

## Task 3: Créer customize.astro

**Files:**
- Create: `src/pages/client/customize.astro`

Note sur la logique POST : chaque formulaire possède un champ caché `config_type` et un champ `value`. Le handler POST lit ces deux valeurs, fait un PUT vers `/client/configs`, puis la page re-fetche toujours les configs (après le POST aussi) pour afficher les valeurs fraîches.

- [ ] **Step 1: Créer `src/pages/client/customize.astro`**

```astro
---
export const prerender = false;
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

const base = import.meta.env.AEVUM_URL;
const headers = { Authorization: `Bearer ${auth.token}` };

let successType = '';
let errorType = '';
let errorMsg = '';

// Traitement POST
if (Astro.request.method === 'POST') {
  const form = await Astro.request.formData();
  const configType = (form.get('config_type') as string ?? '').trim();
  const value = (form.get('value') as string ?? '');

  if (configType) {
    try {
      const res = await fetch(`${base}/client/configs`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_type: configType, value }),
      });
      if (res.status === 401) {
        Astro.cookies.delete('aevum_token', { path: '/' });
        return Astro.redirect('/login');
      }
      if (res.ok) {
        successType = configType;
      } else {
        const data = await res.json().catch(() => ({}));
        errorType = configType;
        errorMsg = data.message ?? data.error ?? 'Erreur lors de la sauvegarde.';
      }
    } catch {
      errorType = configType;
      errorMsg = 'Erreur réseau. Réessayez.';
    }
  }
}

// Toujours re-fetcher après POST pour afficher valeurs fraîches
type ConfigEntry = { config_type: string; value: string };
let configs: Record<string, string> = {};
let senderName = '';
let fetchError = '';

try {
  const [configsRes, autoRes] = await Promise.all([
    fetch(`${base}/client/configs`, { headers }),
    fetch(`${base}/client/automations`, { headers }),
  ]);

  if (configsRes.status === 401 || autoRes.status === 401) {
    Astro.cookies.delete('aevum_token', { path: '/' });
    return Astro.redirect('/login');
  }

  if (configsRes.ok) {
    const arr: ConfigEntry[] = await configsRes.json();
    for (const c of arr) configs[c.config_type] = c.value;
  }
  if (autoRes.ok) {
    const auto = await autoRes.json();
    senderName = auto.sender_name ?? '';
  }
} catch {
  fetchError = 'Impossible de charger vos configurations. Réessayez.';
}

const CONFIG_TYPES = [
  { key: 'sender_name', label: 'Nom d\'expéditeur', multiline: false, defaultValue: senderName },
  { key: 'template_onboarding_j0', label: 'Email onboarding J0', multiline: true, defaultValue: '' },
  { key: 'template_onboarding_j3', label: 'Email onboarding J3', multiline: true, defaultValue: '' },
  { key: 'template_onboarding_j7', label: 'Email onboarding J7', multiline: true, defaultValue: '' },
  { key: 'template_failed_payment', label: 'Email relance impayé', multiline: true, defaultValue: '' },
] as const;
---

<BaseLayout
  title="Personnalisation — AEVUM"
  description="Personnalisez vos templates d'emails et votre nom d'expéditeur."
  canonical="/client/customize"
>

<section class="section customize-section">
  <div class="container customize-container">

    <div class="customize-header">
      <a href="/client/dashboard" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Retour au tableau de bord
      </a>
      <span class="accent-line" style="margin:1rem 0"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Personnaliser les templates</h1>
      <p style="margin-top:0.5rem;max-width:none">Configurez vos emails envoyés automatiquement par AEVUM.</p>
    </div>

    {fetchError && (
      <div class="cust-error" role="alert">{fetchError}</div>
    )}

    {CONFIG_TYPES.map(({ key, label, multiline, defaultValue }) => {
      const currentValue = configs[key] ?? defaultValue;
      const isSuccess = successType === key;
      const isError = errorType === key;
      return (
        <div class="card cust-card">
          <h2 class="cust-card-title">{label}</h2>
          {isSuccess && (
            <div class="success-msg" role="alert"><span>Sauvegardé avec succès.</span></div>
          )}
          {isError && (
            <div class="cust-field-error" role="alert">{errorMsg}</div>
          )}
          <form method="POST" class="cust-form">
            <input type="hidden" name="config_type" value={key} />
            {multiline ? (
              <textarea
                name="value"
                class="form-input cust-textarea"
                rows={6}
                placeholder={`Contenu de votre ${label.toLowerCase()}...`}
              >{currentValue}</textarea>
            ) : (
              <input
                type="text"
                name="value"
                class="form-input"
                value={currentValue}
                placeholder="Ex : Jean Dupont"
              />
            )}
            <button type="submit" class="btn btn-primary" style="align-self:flex-start;margin-top:0.75rem">
              Sauvegarder
            </button>
          </form>
        </div>
      );
    })}

  </div>
</section>

</BaseLayout>

<style>
  .customize-section { padding-top: 7rem; }
  .customize-container { max-width: 700px; }
  .customize-header { margin-bottom: 2.5rem; }
  .customize-header p { color: var(--gray-light); }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    color: var(--gray-light);
    transition: color var(--transition);
    margin-bottom: 0.25rem;
  }
  .back-link:hover { color: var(--primary); }

  .cust-error {
    padding: 1rem 1.5rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    margin-bottom: 2rem;
  }
  .cust-field-error {
    padding: 0.75rem 1rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .cust-card { padding: 1.75rem 2rem; margin-bottom: 1.5rem; }
  .cust-card-title { font-size: 1rem; font-weight: 600; color: var(--light); margin-bottom: 1rem; }
  .cust-form { display: flex; flex-direction: column; }
  .cust-textarea { font-family: monospace; font-size: 0.875rem; resize: vertical; min-height: 130px; }
</style>
```

- [ ] **Step 2: Vérifier le build**

```bash
npm run build
```

Expected: build propre, route `/client/customize` en SSR.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat: customize.astro — 5 formulaires SSR indépendants pour les templates"
```

---

## Task 4: Mettre à jour settings.astro

**Files:**
- Modify: `src/pages/client/settings.astro`

- [ ] **Step 1: Ajouter le lien de navigation vers /client/dashboard**

Dans `src/pages/client/settings.astro`, juste après le `<h1>`, ajouter un lien retour.

Trouver ce bloc (lignes ~91–94) :

```astro
    <div style="margin-bottom:2.5rem">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Paramètres</h1>
    </div>
```

Remplacer par :

```astro
    <div style="margin-bottom:2.5rem">
      <a href="/client/dashboard" class="settings-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Tableau de bord
      </a>
      <span class="accent-line" style="margin:1rem 0"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Paramètres</h1>
    </div>
```

Et ajouter dans le bloc `<style>` :

```css
  .settings-back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    color: var(--gray-light);
    transition: color var(--transition);
    margin-bottom: 0.25rem;
  }
  .settings-back-link:hover { color: var(--primary); }
```

- [ ] **Step 2: Vérifier le build**

```bash
npm run build
```

Expected: build propre.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/settings.astro
git commit -m "feat: settings — lien retour vers /client/dashboard"
```

---

## Task 5: Vérification finale

- [ ] **Step 1: Build complet**

```bash
npm run build
```

Expected: 0 erreur. Routes SSR présentes : `/login`, `/client`, `/client/dashboard`, `/client/history`, `/client/customize`, `/client/settings`.

- [ ] **Step 2: Lister les commits**

```bash
git log --oneline a5fdfbe..HEAD
```

Expected: 4 commits (un par tâche).

- [ ] **Step 3: Smoke test manuel** (à faire avec AEVUM_URL et JWT_SECRET renseignés dans .env)

1. `/login` → se connecter
2. `/client/dashboard` → 4 cartes stats, 4 blocs automations, liste activités, 3 liens nav
3. `/client/history` → tableau avec colonnes Date/Action/Détails, lien retour
4. `/client/customize` → 5 formulaires pré-remplis, sauvegarder un template → message succès
5. `/client/settings` → lien "Tableau de bord" visible en haut

---

## Self-Review

**1. Spec coverage**
- [x] Dashboard : Promise.all vers /stats, /automations, /history?limit=5
- [x] Dashboard section 1 : 4 cartes stats (emails_this_month, total_emails, recouvrement_envoyes, upsells_envoyes)
- [x] Dashboard section 2 : 4 blocs automations avec badge Actif/Non configuré
- [x] Dashboard section 3 : 5 dernières activités (date + action + details)
- [x] Dashboard section 4 : liens vers /client/history, /client/customize, /client/settings
- [x] history.astro : auth guard, fetch /client/history?limit=100, tableau Date/Action/Détails, lien retour
- [x] customize.astro : auth guard, GET /client/configs + GET /client/automations (senderName), 5 formulaires indépendants
- [x] customize.astro : champs sender_name, template_onboarding_j0, j3, j7, template_failed_payment
- [x] customize.astro : PUT /client/configs avec { config_type, value }, succès/erreur par formulaire
- [x] settings.astro : lien vers /client/dashboard en haut

**2. Placeholder scan** — aucun placeholder

**3. Type consistency**
- `HistoryEntry` défini identiquement dans dashboard.astro (Task 1) et history.astro (Task 2) — indépendants, pas de problème
- `ConfigEntry` utilisé uniquement dans customize.astro
- `auth.token` utilisé comme Bearer dans toutes les pages — cohérent avec `AuthPayload.token`
