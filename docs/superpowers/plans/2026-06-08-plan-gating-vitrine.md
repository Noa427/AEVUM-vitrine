# Plan Gating (Vitrine + Admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface each client's plan (Standard/Premium) and paid options (Abandon checkout / Vocal IA / Module Notaire) in the client portal (badges + visual locks) and let the admin set/edit them when creating or managing a client.

**Architecture:** The backend already stores `plan` on `clients` and the three options as encrypted `client_configs` rows (`addon_f11` = Abandon checkout +200€/m, `addon_f13` = Vocal IA +350€/m, `addon_f18` = Module Notaire +149€/dossier — confirmed by `CLAUDE.md:214-216` and `cron.ts:152`). We expose these three as named booleans `option_checkout` / `option_vocal` / `option_notaire` on `GET /client/me` (decrypting the existing `addon_f11/f13/f18` rows — no schema change, no renaming of existing config_types). The vitrine portal reads these to gate UI. The admin frontend gets a plan selector + addon checkboxes on client creation (currently unsupported by `POST /api/clients`) and a new "Abonnement" section + edit modal on the client detail page (using the existing `PUT /api/clients/:id` for plan and `PUT /api/clients/:id/configs` for addons).

**Tech Stack:** Astro 6 + TypeScript (vitrine), Express + Supabase + Zod (backend), Next.js 14 + React + Tailwind + shadcn/ui + sonner (admin frontend)

**Two repos involved — two branches, two sets of commits:**
- `C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine` (this repo) — branch `feat/plan-gating-vitrine` off `master`
- `C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR` — first commit the existing uncommitted changes on `fix/audit-corrections`, then branch `feat/plan-gating-vitrine` off it

---

## File Structure

| File | Repo | Change |
|------|------|--------|
| `backend/src/routes/clientAuth.ts` | AEVUM_LOGI_INFOPRENEUR | `GET /client/me` (~line 186-205): also fetch+decrypt `addon_f11/f13/f18`, expose `option_checkout/option_vocal/option_notaire` |
| `backend/src/routes/clients.ts` | AEVUM_LOGI_INFOPRENEUR | `POST /` (~line 74-105): accept `plan` + 3 addon booleans, persist `clients.plan` and `client_configs` rows at creation |
| `frontend/components/client-form.tsx` | AEVUM_LOGI_INFOPRENEUR | Creation form: add Plan select + 3 option checkboxes, send in POST payload |
| `frontend/components/subscription-modal.tsx` | AEVUM_LOGI_INFOPRENEUR | New: small modal to edit plan + addons from the client detail page |
| `frontend/app/(app)/clients/[id]/page.tsx` | AEVUM_LOGI_INFOPRENEUR | Add "Abonnement" card (current plan + active option badges + "Modifier" button wiring the new modal) |
| `src/pages/client/dashboard.astro` | vitrine | Add plan/options badge under "Bienvenue, {email}" |
| `src/pages/client/settings.astro` | vitrine | Lock "Récupération vocale IA" on `option_vocal`; add badge+link to the existing "Rapport vidéo" Premium lock |
| `src/pages/client/customize.astro` | vitrine | Overlay on the "Abandon checkout" panel when `option_checkout === false` |

---

## PART A — Backend (AEVUM_LOGI_INFOPRENEUR)

### Task 1: Expose `option_checkout` / `option_vocal` / `option_notaire` on `GET /client/me`

**Files:**
- Modify: `backend/src/routes/clientAuth.ts:186-205`

The route currently does a single `clients` table select then returns a flat JSON. We need to also read the three addon config rows for this client, decrypt them, and add three booleans to the response. `decrypt` is already imported at the top of this file (line 6).

- [ ] **Step 1: Replace the `GET /client/me` handler**

Replace lines 186-205:

```ts
// GET /client/me
clientAuthRouter.get('/me', authenticateClient, async (req, res) => {
  const clientId = (req as any).clientId

  const { data, error } = await supabase
    .from('clients')
    .select('client_email, must_change_password, created_at, paused_until, whatsapp_active, plan')
    .eq('id', clientId)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Client introuvable' })

  res.json({
    email: data.client_email,
    mustChangePassword: data.must_change_password,
    createdAt: data.created_at,
    pausedUntil: data.paused_until ?? null,
    whatsappConnected: data.whatsapp_active ?? false,
    plan: data.plan ?? 'standard',
  })
})
```

with:

```ts
// GET /client/me
clientAuthRouter.get('/me', authenticateClient, async (req, res) => {
  const clientId = (req as any).clientId

  const { data, error } = await supabase
    .from('clients')
    .select('client_email, must_change_password, created_at, paused_until, whatsapp_active, plan')
    .eq('id', clientId)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Client introuvable' })

  const { data: addonRows } = await supabase
    .from('client_configs')
    .select('config_type, encrypted_value')
    .eq('client_id', clientId)
    .in('config_type', ['addon_f11', 'addon_f13', 'addon_f18'])

  const addons = new Set<string>()
  for (const row of addonRows ?? []) {
    try {
      if (decrypt(row.encrypted_value) === 'true') addons.add(row.config_type)
    } catch { /* skip undecryptable rows */ }
  }

  res.json({
    email: data.client_email,
    mustChangePassword: data.must_change_password,
    createdAt: data.created_at,
    pausedUntil: data.paused_until ?? null,
    whatsappConnected: data.whatsapp_active ?? false,
    plan: data.plan ?? 'standard',
    option_checkout: addons.has('addon_f11'),
    option_vocal: addons.has('addon_f13'),
    option_notaire: addons.has('addon_f18'),
  })
})
```

- [ ] **Step 2: Type-check the backend**

Run: `cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR\backend" && npm run build`
Expected: compiles with no TypeScript errors (no new errors referencing `clientAuth.ts`)

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR"
git add backend/src/routes/clientAuth.ts
git commit -m "feat(client-auth): exposer option_checkout/option_vocal/option_notaire dans /client/me"
```

---

### Task 2: Accept `plan` + addon options when creating a client

**Files:**
- Modify: `backend/src/routes/clients.ts:74-105`

Currently `POST /api/clients` only accepts `name, email, stripe_webhook_secret, sender_name, auto_mode` and inserts two `client_configs` rows (`stripe_webhook_secret`, `sender_name`). We need it to also accept `plan` (validated like in `PUT /:id`, line 116-119) and three booleans `option_checkout`/`option_vocal`/`option_notaire`, persisting `plan` on the `clients` row and the addons as encrypted `client_configs` rows (`addon_f11/f13/f18`).

`ADDON_CONFIG_TYPES` is already declared at the top of this file (line 8) as `['addon_f11', 'addon_f13', 'addon_f18']`.

- [ ] **Step 1: Replace the `POST /` handler**

Replace lines 74-105:

```ts
clientsRouter.post('/', async (req, res) => {
  const userId = (req as any).userId
  const { name, email, stripe_webhook_secret, sender_name, auto_mode = true } = req.body

  if (!name || !email || !stripe_webhook_secret || !sender_name) {
    return res.status(400).json({ error: 'Champs requis : name, email, stripe_webhook_secret, sender_name' })
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({ user_id: userId, name, email, auto_mode })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })

  const { error: configError } = await supabase.from('client_configs').insert([
    { client_id: client.id, config_type: 'stripe_webhook_secret', encrypted_value: encrypt(stripe_webhook_secret) },
    { client_id: client.id, config_type: 'sender_name', encrypted_value: encrypt(sender_name) },
  ])
  if (configError) {
    await supabase.from('clients').delete().eq('id', client.id)
    return res.status(500).json({ error: configError.message })
  }

  try {
    await generateClientCredentials(client.id, email)
  } catch (err: any) {
    console.error(`[clients] generateClientCredentials failed for ${client.id}:`, err.message)
  }

  res.status(201).json(client)
})
```

with:

```ts
const ADDON_FIELD_TO_CONFIG_TYPE: Record<string, typeof ADDON_CONFIG_TYPES[number]> = {
  option_checkout: 'addon_f11',
  option_vocal: 'addon_f13',
  option_notaire: 'addon_f18',
}

clientsRouter.post('/', async (req, res) => {
  const userId = (req as any).userId
  const { name, email, stripe_webhook_secret, sender_name, auto_mode = true, plan, option_checkout, option_vocal, option_notaire } = req.body

  if (!name || !email || !stripe_webhook_secret || !sender_name) {
    return res.status(400).json({ error: 'Champs requis : name, email, stripe_webhook_secret, sender_name' })
  }
  if (plan !== undefined && !['standard', 'premium'].includes(plan)) {
    return res.status(400).json({ error: 'Plan invalide' })
  }

  const insertPayload: Record<string, any> = { user_id: userId, name, email, auto_mode }
  if (plan !== undefined) insertPayload.plan = plan

  const { data: client, error } = await supabase
    .from('clients')
    .insert(insertPayload)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })

  const configRows = [
    { client_id: client.id, config_type: 'stripe_webhook_secret', encrypted_value: encrypt(stripe_webhook_secret) },
    { client_id: client.id, config_type: 'sender_name', encrypted_value: encrypt(sender_name) },
  ]
  const optionFields: Record<string, unknown> = { option_checkout, option_vocal, option_notaire }
  for (const [field, configType] of Object.entries(ADDON_FIELD_TO_CONFIG_TYPE)) {
    if (typeof optionFields[field] === 'boolean') {
      configRows.push({ client_id: client.id, config_type: configType, encrypted_value: encrypt(optionFields[field] ? 'true' : 'false') })
    }
  }

  const { error: configError } = await supabase.from('client_configs').insert(configRows)
  if (configError) {
    await supabase.from('clients').delete().eq('id', client.id)
    return res.status(500).json({ error: configError.message })
  }

  try {
    await generateClientCredentials(client.id, email)
  } catch (err: any) {
    console.error(`[clients] generateClientCredentials failed for ${client.id}:`, err.message)
  }

  res.status(201).json(client)
})
```

- [ ] **Step 2: Type-check the backend**

Run: `cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR\backend" && npm run build`
Expected: compiles with no TypeScript errors

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR"
git add backend/src/routes/clients.ts
git commit -m "feat(admin): accepter plan et options (checkout/vocal/notaire) à la création d'un client"
```

---

## PART B — Admin frontend (AEVUM_LOGI_INFOPRENEUR/frontend)

### Task 3: Add Plan select + option checkboxes to the client creation form

**Files:**
- Modify: `frontend/components/client-form.tsx`

The form's local state (`form`) and submit handler need three new option booleans plus a `plan` string. These fields are creation-only (the existing "Modifier" button on the detail page edits name/email/sender/webhook only — plan & options get their own modal in Task 5).

- [ ] **Step 1: Extend form state and the submit payload**

In `client-form.tsx`, change line 25:

```tsx
  const [form, setForm] = useState({ name: '', email: '', stripe_webhook_secret: '', sender_name: '' })
```

to:

```tsx
  const [form, setForm] = useState({
    name: '', email: '', stripe_webhook_secret: '', sender_name: '',
    plan: 'standard' as 'standard' | 'premium',
    option_checkout: false, option_vocal: false, option_notaire: false,
  })
```

Then update the reset branch (lines 32-35):

```tsx
    } else if (!open) {
      setForm({ name: '', email: '', stripe_webhook_secret: '', sender_name: '' })
      setError('')
    }
```

to:

```tsx
    } else if (!open) {
      setForm({
        name: '', email: '', stripe_webhook_secret: '', sender_name: '',
        plan: 'standard', option_checkout: false, option_vocal: false, option_notaire: false,
      })
      setError('')
    }
```

Then update `set` (line 38-40) to be generic over the field's own value type, since checkboxes now set booleans and selects set strings — a plain `string | boolean` parameter would widen the whole `form` type on every update:

```tsx
  function set<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }
```

Finally, in `handleSubmit` (lines 42-64), the create branch (line 53-56) currently sends the whole `form` object — that already includes the new fields once `form` carries them, so no change needed there. The edit branch (lines 47-51) builds an explicit `payload` that must NOT include the new subscription fields (those are edited via the Task 5 modal) — it's already explicit, so leave it as-is.

- [ ] **Step 2: Add the Plan + Options fields to the JSX (creation only)**

In `client-form.tsx`, insert a new section right after the "Configuration email" block closes (after line 156, i.e. right before the `{/* Error */}` comment on line 158-159), wrapped in `{!isEdit && (...)}`:

```tsx
          {/* Section 3 — Abonnement (création uniquement) */}
          {!isEdit && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Abonnement</p>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Plan</label>
                <select
                  value={form.plan}
                  onChange={e => set('plan', e.target.value as 'standard' | 'premium')}
                  disabled={loading}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.option_checkout}
                    onChange={e => set('option_checkout', e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm">Abandon checkout <span className="text-xs text-muted-foreground">(+200€/mois)</span></span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.option_vocal}
                    onChange={e => set('option_vocal', e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm">Vocal IA <span className="text-xs text-muted-foreground">(+350€/mois)</span></span>
                </label>
                <label className="flex items-center gap-2.5 cursor-not-allowed opacity-50">
                  <input type="checkbox" checked={false} disabled className="w-4 h-4" />
                  <span className="text-sm">Module Notaire <span className="text-xs text-muted-foreground">(Bientôt disponible)</span></span>
                </label>
              </div>
            </div>
          )}

```

- [ ] **Step 3: Manual check — start the admin frontend and open "Nouveau client"**

Run: `cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR\frontend" && npm run dev`
Open the app, click "Nouveau client", verify the "Abonnement" section renders with the Plan select (Standard/Premium) and three checkboxes, with "Module Notaire" greyed out and unclickable. Stop the dev server after checking (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR"
git add frontend/components/client-form.tsx
git commit -m "feat(admin): formulaire de création — select Plan + options (checkout/vocal/notaire)"
```

---

### Task 4: Create the subscription edit modal

**Files:**
- Create: `frontend/components/subscription-modal.tsx`

**Note (revised from original plan draft):** the backend already exposes a dedicated `PUT /api/clients/:id/plan` endpoint (see `backend/src/routes/clients.ts:185-250`, shipped on this branch as part of the gating system) that accepts `{ plan?, option_checkout?, option_vocal?, option_notaire? }` in a single atomic call, persists both the plan and the addon configs, and logs a `plan_updated` activity entry. Use that single endpoint — it's strictly better than the two-call approach (`PUT /:id` + `PUT /:id/configs`) originally sketched here: one network round-trip, one source of truth, and it matches the `option_*` naming already used by `GET /client/me` (see `getClientOptions`/`OPTION_ADDON_MAP` in `backend/src/middleware/planGate.ts`).

This is a small standalone modal (mirrors the `Dialog` usage from `client-form.tsx`).

- [ ] **Step 1: Write the component**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  client: { id: string; name: string; email: string; plan: 'standard' | 'premium' }
  options: { option_checkout: boolean; option_vocal: boolean; option_notaire: boolean }
  onClose: () => void
  onSaved: (next: { plan: 'standard' | 'premium'; option_checkout: boolean; option_vocal: boolean; option_notaire: boolean }) => void
}

export function SubscriptionModal({ open, client, options, onClose, onSaved }: Props) {
  const [plan, setPlan] = useState<'standard' | 'premium'>(client.plan)
  const [checkout, setCheckout] = useState(options.option_checkout)
  const [vocal, setVocal] = useState(options.option_vocal)
  const [notaire, setNotaire] = useState(options.option_notaire)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setPlan(client.plan)
      setCheckout(options.option_checkout)
      setVocal(options.option_vocal)
      setNotaire(options.option_notaire)
      setError('')
    }
  }, [open, client.plan, options.option_checkout, options.option_vocal, options.option_notaire])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.put(`/api/clients/${client.id}/plan`, {
        plan,
        option_checkout: checkout,
        option_vocal: vocal,
        option_notaire: notaire,
      })
      toast.success('Abonnement mis à jour')
      onSaved({ plan, option_checkout: checkout, option_vocal: vocal, option_notaire: notaire })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !loading) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;abonnement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Plan</label>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value as 'standard' | 'premium')}
              disabled={loading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkout}
                onChange={e => setCheckout(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">Abandon checkout <span className="text-xs text-muted-foreground">(+200€/mois)</span></span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={vocal}
                onChange={e => setVocal(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">Vocal IA <span className="text-xs text-muted-foreground">(+350€/mois)</span></span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notaire}
                onChange={e => setNotaire(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">Module Notaire <span className="text-xs text-muted-foreground">(+149€/dossier)</span></span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR"
git add frontend/components/subscription-modal.tsx
git commit -m "feat(admin): modal d'édition de l'abonnement (plan + options)"
```

---

### Task 5: Add the "Abonnement" section to the client detail page

**Files:**
- Modify: `frontend/app/(app)/clients/[id]/page.tsx`

The detail page already loads `Client` (no `plan`/`addons` fields) via `loadClient` (line 139-146) and `Partial<PilierConfigs>` via `loadConfigs` (line 162-169, only triggered when the "Paramètres" tab is opened — line 174). The new "Abonnement" card needs `plan` and the three addon values up front (it should render regardless of which tab is active, in the "Informations" area), so:
- Extend the `Client` interface with `plan`
- Fetch the addon configs eagerly (not gated on the Settings tab) — simplest: extend `loadConfigs` to also run on mount, or add a small dedicated fetch. Since `GET /api/clients/:id/configs` already returns `addon_f11/f13/f18` (backend `clients.ts:186` includes `ADDON_CONFIG_TYPES` in `ALL_CONFIG_TYPES`), the cleanest fix is to remove the `tab === 'settings'` gating on `loadConfigs` so it always loads (it's a single lightweight call, and the existing Pilier 3/4 cards already depend on it being loaded before the Settings tab is shown anyway).

- [ ] **Step 1: Add `plan` to the `Client` interface**

Change lines 15-21:

```tsx
interface Client {
  id: string
  name: string
  email: string
  created_at: string
  auto_mode: boolean
}
```

to:

```tsx
interface Client {
  id: string
  name: string
  email: string
  created_at: string
  auto_mode: boolean
  plan: 'standard' | 'premium'
}
```

- [ ] **Step 2: Extend `PilierConfigs` with the addon keys and load configs eagerly**

Change lines 40-48:

```tsx
interface PilierConfigs {
  support_email_enabled: string
  support_auto_reply: string
  politique_remboursement: string
  upsell_enabled: string
  upsell_product_name: string
  upsell_url: string
  upsell_price: string
}
```

to:

```tsx
interface PilierConfigs {
  support_email_enabled: string
  support_auto_reply: string
  politique_remboursement: string
  upsell_enabled: string
  upsell_product_name: string
  upsell_url: string
  upsell_price: string
  addon_f11: string
  addon_f13: string
  addon_f18: string
}
```

Then change line 174:

```tsx
  useEffect(() => { if (tab === 'settings') loadConfigs() }, [tab, loadConfigs])
```

to:

```tsx
  useEffect(() => { loadConfigs() }, [loadConfigs])
```

- [ ] **Step 3: Add modal state and a save handler**

After the existing state declarations, find line 137 (`const [savingConfigs, setSavingConfigs] = useState(false)`) and add right after it:

```tsx

  // Abonnement
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
```

Add the import for the new modal — change line 6:

```tsx
import { ClientForm } from '@/components/client-form'
```

to:

```tsx
import { ClientForm } from '@/components/client-form'
import { SubscriptionModal } from '@/components/subscription-modal'
```

- [ ] **Step 4: Render the "Abonnement" card**

In the JSX, add a new card right after the "En-tête client" block closes (after line 324, i.e. right before the `{/* Onglets */}` comment on line 326):

```tsx
      {/* Abonnement */}
      <div className="card-elevated p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
            client.plan === 'premium'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
          }`}>
            Plan {client.plan === 'premium' ? 'Premium' : 'Standard'}
          </span>
          {configs.addon_f11 === 'true' && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">Abandon checkout</span>
          )}
          {configs.addon_f13 === 'true' && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/30">Vocal IA</span>
          )}
          {configs.addon_f18 === 'true' && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">Module Notaire</span>
          )}
          {configs.addon_f11 !== 'true' && configs.addon_f13 !== 'true' && configs.addon_f18 !== 'true' && (
            <span className="text-xs text-muted-foreground">Aucune option active</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSubscriptionModal(true)} className="text-xs gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Modifier
        </Button>
      </div>
```

- [ ] **Step 5: Render the modal**

After the closing `</TaskDrawer>`-equivalent block — find the existing `<ClientForm ... />` near the end (around line 645-650) and add the new modal right after it, before the final closing `</div>`:

```tsx
      <SubscriptionModal
        open={showSubscriptionModal}
        client={{ id: client.id, name: client.name, email: client.email, plan: client.plan }}
        options={{
          option_checkout: configs.addon_f11 === 'true',
          option_vocal: configs.addon_f13 === 'true',
          option_notaire: configs.addon_f18 === 'true',
        }}
        onClose={() => setShowSubscriptionModal(false)}
        onSaved={(next) => {
          setClient(c => c ? { ...c, plan: next.plan } : c)
          setConfigs(c => ({ ...c, addon_f11: next.option_checkout ? 'true' : 'false', addon_f13: next.option_vocal ? 'true' : 'false', addon_f18: next.option_notaire ? 'true' : 'false' }))
        }}
      />
```

**Naming note:** the modal's props/callbacks use `option_*` (matching the `PUT /:id/plan` body and `/client/me` response), while `configs` (from `GET /:id/configs`) still uses `addon_f11/f13/f18` (the underlying config_type keys, unchanged on this endpoint). The page component is the bridge between the two namings — this is intentional, not an inconsistency to "fix".

- [ ] **Step 6: Manual check**

Run: `cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR\frontend" && npm run dev`
Open a client detail page, verify:
- The "Abonnement" card shows the current plan badge and option badges (or "Aucune option active")
- Clicking "Modifier" opens the modal pre-filled with current plan + checkboxes
- Saving updates the badges without a page reload and shows a success toast
Stop the dev server after checking (Ctrl+C).

- [ ] **Step 7: Commit**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR"
git add "frontend/app/(app)/clients/[id]/page.tsx"
git commit -m "feat(admin): section Abonnement sur la fiche client (plan + options + édition)"
```

---

## PART C — Vitrine portal gating

### Task 6: Dashboard — plan/options badge

**Files:**
- Modify: `src/pages/client/dashboard.astro`

`MeData` (line 35) currently only carries `paused_until`. Extend it and read `plan`/`option_checkout`/`option_vocal` to render a small badge under "Bienvenue, {auth.email}".

- [ ] **Step 1: Extend `MeData` and capture the new fields**

Change line 35:

```ts
type MeData = { paused_until?: string | null };
```

to:

```ts
type MeData = { paused_until?: string | null; plan?: string; option_checkout?: boolean; option_vocal?: boolean };
```

Change lines 82-86:

```ts
let pausedUntil: string | null = null;
if (meResult.status === 'fulfilled' && meResult.value.ok) {
  const me: MeData = await meResult.value.json().catch(() => ({}));
  pausedUntil = me.paused_until ?? null;
}
```

to:

```ts
let pausedUntil: string | null = null;
let plan: 'standard' | 'premium' = 'standard';
let optionCheckout = false;
let optionVocal = false;
if (meResult.status === 'fulfilled' && meResult.value.ok) {
  const me: MeData = await meResult.value.json().catch(() => ({}));
  pausedUntil = me.paused_until ?? null;
  plan = me.plan === 'premium' ? 'premium' : 'standard';
  optionCheckout = me.option_checkout === true;
  optionVocal = me.option_vocal === true;
}

const activeOptionLabels = [
  optionCheckout && '+ Checkout',
  optionVocal && '+ Vocal IA',
].filter((v): v is string => typeof v === 'string');
```

- [ ] **Step 2: Render the badge**

Change line 145:

```astro
      <p style="margin-top:0.5rem">Bienvenue, {auth.email}</p>
```

to:

```astro
      <p style="margin-top:0.5rem">Bienvenue, {auth.email}</p>
      <p class="dash-plan-badge">
        Plan {plan === 'premium' ? 'Premium' : 'Standard'}
        {activeOptionLabels.length > 0 && <span class="dash-plan-options"> · {activeOptionLabels.join(', ')}</span>}
      </p>
```

- [ ] **Step 3: Add CSS**

In the `<style>` block, right after the `.dash-header p { ... }` rule (line 287), add:

```css
  .dash-plan-badge { margin-top: 0.375rem; font-size: 0.8125rem; color: var(--gray); }
  .dash-plan-options { color: var(--gray-light); }
```

- [ ] **Step 4: Manual check**

Run: `cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine" && npm run dev`
Log into the client portal, open `/client/dashboard`, verify "Plan Standard" or "Plan Premium" appears under the welcome line, with "· + Checkout, + Vocal IA" appended only when those options are active. Stop the dev server after checking (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine"
git add src/pages/client/dashboard.astro
git commit -m "feat(dashboard): badge plan + options actives sous le nom du client"
```

---

### Task 7: Settings — lock Vocal IA on `option_vocal`, add badge+link to the Premium lock

**Files:**
- Modify: `src/pages/client/settings.astro`

`meData` (line 181) and `isPremium` (line 200) already exist. Add `option_vocal` extraction, then:
1. Add a `.lock-row` / `.lock-badge` / `.lock-link` style block (shared by both locks)
2. Restructure the existing "Rapport vidéo" non-Premium branch to include the badge + `/contact` link
3. Add a full lock branch to "Récupération vocale IA" (currently has none)
4. Make `initVocalToggle` skip disabled toggles (mirrors `initRapportToggle`'s `toggle.disabled` guard)

- [ ] **Step 1: Read `option_vocal` from `/client/me`**

Change line 181:

```ts
let meData: { paused_until?: string | null; whatsapp_connected?: boolean; plan?: string } | null = null;
```

to:

```ts
let meData: { paused_until?: string | null; whatsapp_connected?: boolean; plan?: string; option_vocal?: boolean } | null = null;
```

Change line 202:

```ts
const vocalIaActive: boolean = settingsConfigs['vocal_ia_active'] === 'true';
```

to:

```ts
const vocalIaActive: boolean = settingsConfigs['vocal_ia_active'] === 'true';
const optionVocal: boolean = meData?.option_vocal === true;
```

- [ ] **Step 2: Restructure the "Rapport vidéo" lock branch (add badge + link)**

Replace lines 386-403:

```astro
      ) : (
        <>
          <label class="toggle-switch" style="margin-bottom:1rem;opacity:0.5;cursor:not-allowed">
            <input type="checkbox" id="rapport-toggle-input" disabled />
            <span class="toggle-track"></span>
            <span class="toggle-label">Inactif</span>
          </label>
          <p style="color:var(--gray-light);font-size:0.9375rem;margin:0 0 0.5rem">
            Chaque lundi à 8h, vous recevez par email une vidéo de 60-90 secondes résumant votre semaine : nouveaux élèves, impayés récupérés, emails envoyés.
          </p>
          <p style="color:var(--gray);font-size:0.875rem;margin:0 0 0.75rem">
            Voix off française générée par IA + slides automatiques.
          </p>
          <p style="color:var(--gray-light);font-size:0.875rem;margin:0;font-style:italic">
            Disponible avec le plan Premium.
          </p>
        </>
      )}
```

with:

```astro
      ) : (
        <>
          <div class="lock-row">
            <label class="toggle-switch" style="margin:0;opacity:0.5;cursor:not-allowed">
              <input type="checkbox" id="rapport-toggle-input" disabled />
              <span class="toggle-track"></span>
              <span class="toggle-label">Inactif</span>
            </label>
            <span class="lock-badge">Plan Premium requis</span>
            <a href="/contact" class="lock-link">En savoir plus →</a>
          </div>
          <p style="color:var(--gray-light);font-size:0.9375rem;margin:0 0 0.5rem">
            Chaque lundi à 8h, vous recevez par email une vidéo de 60-90 secondes résumant votre semaine : nouveaux élèves, impayés récupérés, emails envoyés.
          </p>
          <p style="color:var(--gray);font-size:0.875rem;margin:0">
            Voix off française générée par IA + slides automatiques.
          </p>
        </>
      )}
```

- [ ] **Step 3: Add the lock branch to "Récupération vocale IA"**

Replace lines 408-421:

```astro
      <h2 class="settings-card-title">Récupération vocale IA</h2>
      <label class="toggle-switch" style="margin-bottom:1rem">
        <input type="checkbox" id="vocal-toggle-input" checked={vocalIaActive} />
        <span class="toggle-track"></span>
        <span class="toggle-label" id="vocal-toggle-label">{vocalIaActive ? 'Actif' : 'Inactif'}</span>
      </label>
      <p style="color:var(--gray-light);font-size:0.9375rem;margin:0 0 0.5rem">
        Quand activé, AEVUM passe automatiquement un appel téléphonique à l'élève après la relance J+7 sans paiement. Un message vocal personnalisé (voix IA française) lui rappelle le montant dû et le lien de paiement.
      </p>
      <p style="color:var(--gray);font-size:0.875rem;margin:0">
        Nécessite que le numéro de téléphone de l'élève soit renseigné lors de l'achat sur Stripe. Coûts d'appels facturés à la consommation en supplément de l'option.
      </p>
      <p class="vocal-error" style="display:none;color:#EF4444;font-size:0.875rem;margin-top:0.5rem"></p>
```

with:

```astro
      <h2 class="settings-card-title">Récupération vocale IA</h2>
      {optionVocal ? (
        <label class="toggle-switch" style="margin-bottom:1rem">
          <input type="checkbox" id="vocal-toggle-input" checked={vocalIaActive} />
          <span class="toggle-track"></span>
          <span class="toggle-label" id="vocal-toggle-label">{vocalIaActive ? 'Actif' : 'Inactif'}</span>
        </label>
      ) : (
        <div class="lock-row" style="margin-bottom:1rem">
          <label class="toggle-switch" style="margin:0;opacity:0.5;cursor:not-allowed">
            <input type="checkbox" id="vocal-toggle-input" disabled />
            <span class="toggle-track"></span>
            <span class="toggle-label">Inactif</span>
          </label>
          <span class="lock-badge">Option +350€/mois</span>
          <a href="/contact" class="lock-link">En savoir plus →</a>
        </div>
      )}
      <p style="color:var(--gray-light);font-size:0.9375rem;margin:0 0 0.5rem">
        Quand activé, AEVUM passe automatiquement un appel téléphonique à l'élève après la relance J+7 sans paiement. Un message vocal personnalisé (voix IA française) lui rappelle le montant dû et le lien de paiement.
      </p>
      <p style="color:var(--gray);font-size:0.875rem;margin:0">
        Nécessite que le numéro de téléphone de l'élève soit renseigné lors de l'achat sur Stripe. Coûts d'appels facturés à la consommation en supplément de l'option.
      </p>
      <p class="vocal-error" style="display:none;color:#EF4444;font-size:0.875rem;margin-top:0.5rem"></p>
```

Note: there are now two elements with `id="vocal-toggle-input"` only in the sense that exactly one of the two branches renders at a time (Astro conditional) — the `id` never duplicates in the actual DOM.

- [ ] **Step 4: Guard `initVocalToggle` against disabled toggles**

Change line 485:

```ts
    if (!toggle || toggle.dataset.initialized) return;
```

to:

```ts
    if (!toggle || toggle.disabled || toggle.dataset.initialized) return;
```

- [ ] **Step 5: Add `.lock-row` / `.lock-badge` / `.lock-link` styles**

In the `<style>` block, right after the `.wa-connected-badge { ... }` rule (line 563), add:

```css
  .lock-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .lock-badge {
    display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px;
    font-size: 0.75rem; font-weight: 600;
    background: var(--dark-elevated); color: var(--gray);
  }
  .lock-link { font-size: 0.875rem; color: #2E8BF0; text-decoration: underline; white-space: nowrap; }
```

- [ ] **Step 6: Manual check**

Run: `cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine" && npm run dev`
Open `/client/settings` for a client without `option_vocal`/Premium:
- "Récupération vocale IA": toggle is greyed out + disabled, badge "Option +350€/mois", link "En savoir plus →" → `/contact`
- "Rapport vidéo hebdomadaire": toggle greyed out + disabled, badge "Plan Premium requis", link → `/contact`
For a Premium client with `option_vocal: true`, verify both toggles are interactive and behave as before (no regression — toggling still calls `/api/config-update`). Stop the dev server after checking (Ctrl+C).

- [ ] **Step 7: Commit**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine"
git add src/pages/client/settings.astro
git commit -m "feat(settings): verrou visuel Vocal IA (option) et badge+lien sur le verrou Rapport vidéo (plan)"
```

---

### Task 8: Customize — overlay the "Abandon checkout" panel when `option_checkout === false`

**Files:**
- Modify: `src/pages/client/customize.astro`

The page already fetches `/client/me` and parses `whatsapp_connected` (lines 130-134, see `whatsappConnected`). Add `option_checkout` the same way, then overlay `#panel-template_checkout_abandon` (lines 1089-1098) with a semi-transparent badge+CTA layer when the option is off, making the underlying content non-interactive via CSS (no need to touch the panel's internal structure or its data-attributes/JS hooks).

- [ ] **Step 1: Read `option_checkout` from `/client/me`**

Change lines 130-134:

```ts
let whatsappConnected = false;
if (meResult.status === 'fulfilled' && meResult.value.ok) {
  const meData = await meResult.value.json().catch(() => ({})) as { whatsapp_connected?: boolean };
  whatsappConnected = meData.whatsapp_connected === true;
}
```

to:

```ts
let whatsappConnected = false;
let optionCheckout = false;
if (meResult.status === 'fulfilled' && meResult.value.ok) {
  const meData = await meResult.value.json().catch(() => ({})) as { whatsapp_connected?: boolean; option_checkout?: boolean };
  whatsappConnected = meData.whatsapp_connected === true;
  optionCheckout = meData.option_checkout === true;
}
```

- [ ] **Step 2: Add the `checkout-locked` class and the overlay markup**

Change line 1089 (the opening tag of the panel) from:

```astro
    <div class="cust-card config-panel checkout-abandon-card"
         id="panel-template_checkout_abandon"
```

to:

```astro
    <div class:list={['cust-card', 'config-panel', 'checkout-abandon-card', !optionCheckout && 'checkout-locked']}
         id="panel-template_checkout_abandon"
```

Then, immediately after the opening tag's final attribute line (line 1098, `data-sms-body={checkoutAbandonConfig.sms_body ?? ''}>`), insert the overlay markup before `<div class="panel-header">`:

```astro
      {!optionCheckout && (
        <div class="checkout-lock-overlay">
          <span class="lock-badge">Option +200€/mois</span>
          <p class="checkout-lock-text">Récupérez automatiquement les paniers abandonnés sur Stripe.</p>
          <a href="/contact" class="btn btn-primary">Activer cette option</a>
        </div>
      )}
```

- [ ] **Step 3: Add CSS for the overlay**

Find the `<style>` block in this file (search for `<style>` near the end of the file) and add:

```css
  .checkout-abandon-card { position: relative; }
  .checkout-abandon-card.checkout-locked > *:not(.checkout-lock-overlay) {
    pointer-events: none;
    user-select: none;
    filter: blur(2px);
  }
  .checkout-lock-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    background: rgba(10, 10, 15, 0.78);
    border-radius: var(--r-lg);
  }
  .checkout-lock-text { max-width: 360px; font-size: 0.875rem; color: var(--gray-light); margin: 0; }
  .lock-badge {
    display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px;
    font-size: 0.75rem; font-weight: 600;
    background: var(--dark-elevated); color: var(--gray);
  }
```

Note: if `<style>` in this file is non-scoped/global (check for `<style is:global>` at the top of the existing block — match whatever convention this file already uses) place these rules alongside the other `.cust-*`/`.checkout-*` rules for consistency.

- [ ] **Step 4: Manual check**

Run: `cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine" && npm run dev`
Open `/client/customize`, go to the "Récupération" category:
- For a client with `option_checkout: false`: the "Email de récupération" panel shows a dark semi-transparent overlay with badge "Option +200€/mois", description text and an "Activer cette option" button linking to `/contact`; the underlying toggle/editor/buttons are visibly blurred and unclickable (cursor shows no interaction, clicks don't reach them)
- For a client with `option_checkout: true`: the panel behaves exactly as before (no overlay, fully interactive)
Stop the dev server after checking (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine"
git add src/pages/client/customize.astro
git commit -m "feat(customize): overlay verrou sur le panneau Abandon checkout quand l'option est inactive"
```

---

## Final check

- [ ] **Run the vitrine test suite and build**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\vitrine"
npm test
npm run build
```
Expected: all tests pass, build succeeds with no TypeScript errors.

- [ ] **Run the backend build**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR\backend"
npm run build
```
Expected: compiles with no TypeScript errors.

- [ ] **Run the admin frontend build**

```bash
cd "C:\Users\noapa\Documents\NOA_S_I_M\AEVUM\AEVUM_LOGI_INFOPRENEUR\frontend"
npm run build
```
Expected: Next.js build succeeds with no TypeScript errors (covers `client-form.tsx`, `subscription-modal.tsx`, and `clients/[id]/page.tsx`).
