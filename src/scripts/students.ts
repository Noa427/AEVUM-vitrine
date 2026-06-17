import { TEMPLATE_LABELS, STATUS_LABELS } from '../lib/studentLabels';

function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function getAvailableConfigTypes(): string[] {
  const overlay = document.getElementById('stu-overlay');
  try {
    const raw = overlay?.dataset.configTypes ?? '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Module-level state shared between initStudents() calls (page-load vs astro:page-load)
let _currentFilter = 'all';
let _currentSearch = '';
let _nextPage = 2;
let _loadingMore = false;

function fmtDateClient(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' });
}

function getAllRows(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#stu-tbody .stu-row'));
}

function applyFiltersGlobal() {
  const q = _currentSearch.toLowerCase();
  getAllRows().forEach((row) => {
    const r = row;
    const status = r.dataset.status ?? '';
    const name   = (r.dataset.name ?? '').toLowerCase();
    const email  = (r.dataset.email ?? '').toLowerCase();
    const matchFilter = _currentFilter === 'all' || status === _currentFilter;
    const matchSearch = !q || name.includes(q) || email.includes(q);
    r.style.display = (matchFilter && matchSearch) ? '' : 'none';
  });
}

function updateTotalCount() {
  const el = document.getElementById('stu-total-count');
  if (el) el.textContent = `(${getAllRows().length})`;
}

function attachRowHandler(row: HTMLElement) {
  if (row.dataset.rowInitialized) return;
  row.dataset.rowInitialized = 'true';
  row.style.cursor = 'pointer';
  row.addEventListener('click', () => {
    openDrawer(row.dataset.id ?? '', row.dataset.name ?? '', row.dataset.email ?? '');
  });
}

function buildRow(s: any): HTMLElement {
  const statusLabels = STATUS_LABELS;
  const tr = document.createElement('tr');
  tr.className = 'stu-row';
  tr.dataset.id     = s.id;
  tr.dataset.name   = s.name ?? '';
  tr.dataset.email  = s.email ?? '';
  tr.dataset.status = s.status ?? '';
  const statusLabel = statusLabels[s.status] ?? s.status;
  const badgeClass  = `stu-badge stu-badge--${escapeHtml(s.status)}`;
  tr.innerHTML = `
    <td class="stu-td-name">${escapeHtml(s.name || '—')}</td>
    <td class="stu-td-email">${escapeHtml(s.email)}</td>
    <td><span class="${badgeClass}">${escapeHtml(statusLabel)}</span></td>
    <td class="stu-td-date">${escapeHtml(fmtDateClient(s.created_at))}</td>
    <td class="stu-td-count">${escapeHtml(String(s.emails_received ?? 0))}</td>
    <td class="stu-td-action">${escapeHtml(s.last_action || '—')}</td>
  `;
  return tr;
}

function initStudents() {
  const searchInput   = document.getElementById('stu-search') as HTMLInputElement | null;
  const pillsEl       = document.getElementById('stu-pills');
  const loadMoreWrap  = document.getElementById('stu-loadmore-wrap');
  const loadMoreBtn   = document.getElementById('stu-loadmore') as HTMLButtonElement | null;

  // Attache les handlers aux lignes déjà rendues côté serveur
  getAllRows().forEach(attachRowHandler);

  if (pillsEl && !pillsEl.dataset.initialized) {
    pillsEl.dataset.initialized = 'true';
    pillsEl.querySelectorAll<HTMLElement>('.stu-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        pillsEl.querySelectorAll('.stu-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        _currentFilter = pill.dataset.filter ?? 'all';
        applyFiltersGlobal();
      });
    });
  }

  if (searchInput && !searchInput.dataset.initialized) {
    searchInput.dataset.initialized = 'true';
    searchInput.addEventListener('input', () => {
      _currentSearch = searchInput.value;
      applyFiltersGlobal();
    });
  }

  const overlay     = document.getElementById('stu-overlay');
  const drawerClose = document.getElementById('drawer-close');

  if (overlay && !overlay.dataset.initialized) {
    overlay.dataset.initialized = 'true';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDrawer(); });
  }
  if (drawerClose && !drawerClose.dataset.initialized) {
    drawerClose.dataset.initialized = 'true';
    drawerClose.addEventListener('click', closeDrawer);
  }

  if (loadMoreBtn && !loadMoreBtn.dataset.initialized) {
    loadMoreBtn.dataset.initialized = 'true';
    loadMoreBtn.addEventListener('click', async () => {
      if (_loadingMore) return;
      _loadingMore = true;
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Chargement…';
      try {
        const res = await fetch(`/api/students-page?page=${_nextPage}`);
        if (res.status === 401) { _loadingMore = false; window.location.href = '/login'; return; }
        const data = await res.json().catch(() => []);
        const newStudents = Array.isArray(data) ? data : [];
        const tbody = document.getElementById('stu-tbody');
        if (tbody) {
          newStudents.forEach((s: any) => {
            const tr = buildRow(s);
            tbody.appendChild(tr);
            attachRowHandler(tr);
          });
        }
        _nextPage++;
        updateTotalCount();
        applyFiltersGlobal();
        if (newStudents.length < 50) {
          loadMoreWrap?.remove();
        } else {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Charger plus';
        }
      } catch {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Charger plus';
      }
      _loadingMore = false;
    });
  }
}

function closeDrawer() {
  document.getElementById('stu-overlay')?.classList.add('hidden');
}

function openDrawer(studentId: string, name: string, email: string) {
  const overlay     = document.getElementById('stu-overlay');
  const drawerName  = document.getElementById('drawer-name');
  const drawerEmail = document.getElementById('drawer-email');
  const drawerBody  = document.getElementById('drawer-body');
  if (!overlay || !drawerName || !drawerEmail || !drawerBody) return;
  drawerName.textContent = name || email;
  drawerEmail.textContent = email;
  drawerBody.innerHTML = '<div class="drawer-loading">Chargement…</div>';
  overlay.classList.remove('hidden');

  fetch(`/api/student-detail?id=${encodeURIComponent(studentId)}`)
    .then((r) => r.json())
    .catch(() => null)
    .then((detail) => {
      if (!detail) {
        drawerBody.innerHTML = '<p class="drawer-error">Impossible de charger les détails.</p>';
        return;
      }
      const statusLabel = STATUS_LABELS[detail.status] ?? detail.status;
      const history = Array.isArray(detail.emails_history) ? detail.emails_history : [];

      const availableConfigTypes = getAvailableConfigTypes();
      const selectOpts = availableConfigTypes.map(
        (k) => `<option value="${k}">${TEMPLATE_LABELS[k] ?? k}</option>`
      ).join('');

      drawerBody.innerHTML = `
        <div class="drawer-meta">
          <span class="stu-badge stu-badge--${escapeHtml(detail.status)}">${escapeHtml(statusLabel)}</span>
          ${detail.churn_risk ? '<span class="stu-badge stu-badge--churn">À risque</span>' : ''}
          <span class="drawer-date">Inscrit le ${detail.created_at ? new Date(detail.created_at).toLocaleDateString('fr-FR', { dateStyle: 'short' }) : '—'}</span>
        </div>
        <div class="drawer-section">
          <div class="drawer-section-title">Historique des emails</div>
          ${history.length === 0
            ? '<p class="drawer-empty">Aucun email envoyé.</p>'
            : `<ul class="drawer-history">${history.map((h: any) => `
                <li class="drawer-history-item">
                  <span class="dh-date">${h.date ? new Date(h.date).toLocaleDateString('fr-FR', { dateStyle: 'short' }) : '—'}</span>
                  <span class="dh-type">${escapeHtml(h.type || '—')}</span>
                  <span class="dh-subject">${escapeHtml(h.subject || '—')}</span>
                  <span class="dh-engagement">
                    ${h.opened_at ? `<span class="dh-opened" title="Ouvert le ${escapeHtml(new Date(h.opened_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }))}">✓</span>` : ''}
                    ${h.clicked_at ? `<span class="dh-clicked" title="Cliqué le ${escapeHtml(new Date(h.clicked_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }))}">🔗</span>` : ''}
                  </span>
                </li>`).join('')}</ul>`
          }
        </div>
        <div class="drawer-section">
          <div class="drawer-section-title">Envoyer un email</div>
          <select class="form-input drawer-tpl-select" id="drawer-tpl-select">${selectOpts}</select>
          <button type="button" class="btn btn-primary drawer-send-btn" id="drawer-send-btn"
                  data-student-id="${escapeHtml(detail.id ?? studentId)}" data-email="${escapeHtml(detail.email ?? email)}"
                  style="margin-top:0.75rem;align-self:flex-start">
            Envoyer
          </button>
          <div class="drawer-confirm hidden" id="drawer-confirm">
            <p class="drawer-confirm-text" id="drawer-confirm-text"></p>
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
              <button type="button" class="btn btn-primary drawer-confirm-yes" id="drawer-confirm-yes">Oui, envoyer</button>
              <button type="button" class="btn btn-secondary drawer-confirm-no" id="drawer-confirm-no">Annuler</button>
            </div>
          </div>
          <div class="drawer-send-feedback hidden" id="drawer-send-feedback"></div>
        </div>
        ${detail.phone ? `
        <div class="drawer-section">
          <div class="drawer-section-title">Appel vocal IA</div>
          <button type="button" class="btn btn-secondary drawer-vocal-btn" id="drawer-vocal-btn"
                  data-student-id="${escapeHtml(detail.id ?? studentId)}"
                  style="display:flex;align-items:center;gap:0.5rem;align-self:flex-start">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            Appel vocal IA
          </button>
          <div class="drawer-vocal-feedback hidden" id="drawer-vocal-feedback"></div>
        </div>
        ` : ''}
      `;

      const sendBtn     = drawerBody.querySelector<HTMLButtonElement>('#drawer-send-btn');
      const confirmEl   = drawerBody.querySelector<HTMLElement>('#drawer-confirm');
      const confirmText = drawerBody.querySelector<HTMLElement>('#drawer-confirm-text');
      const confirmYes  = drawerBody.querySelector<HTMLButtonElement>('#drawer-confirm-yes');
      const confirmNo   = drawerBody.querySelector<HTMLButtonElement>('#drawer-confirm-no');
      const feedback    = drawerBody.querySelector<HTMLElement>('#drawer-send-feedback');
      const select      = drawerBody.querySelector<HTMLSelectElement>('#drawer-tpl-select');

      sendBtn?.addEventListener('click', () => {
        const selectedLabel = TEMPLATE_LABELS[select?.value ?? ''] ?? select?.value;
        if (confirmText) confirmText.textContent =
          `Cet email (${selectedLabel}) sera envoyé immédiatement à ${sendBtn.dataset.email ?? email}. Confirmer ?`;
        confirmEl?.classList.remove('hidden');
        sendBtn.disabled = true;
      });

      confirmNo?.addEventListener('click', () => {
        confirmEl?.classList.add('hidden');
        if (sendBtn) sendBtn.disabled = false;
      });

      confirmYes?.addEventListener('click', async () => {
        confirmEl?.classList.add('hidden');
        const configType = select?.value ?? '';
        const sid = sendBtn?.dataset.studentId ?? '';
        if (feedback) { feedback.className = 'drawer-send-feedback'; feedback.textContent = 'Envoi…'; feedback.classList.remove('hidden'); }
        try {
          const res = await fetch('/api/send-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: sid, config_type: configType }),
          });
          const data = await res.json().catch(() => ({}));
          if (feedback) {
            feedback.className = res.ok
              ? 'drawer-send-feedback drawer-send-feedback--ok'
              : 'drawer-send-feedback drawer-send-feedback--err';
            feedback.textContent = res.ok
              ? 'Email envoyé avec succès.'
              : (data.error ?? "Erreur lors de l'envoi.");
            feedback.classList.remove('hidden');
          }
        } catch {
          if (feedback) {
            feedback.className = 'drawer-send-feedback drawer-send-feedback--err';
            feedback.textContent = 'Erreur réseau. Réessayez.';
            feedback.classList.remove('hidden');
          }
        }
        if (sendBtn) sendBtn.disabled = false;
      });

      const vocalBtn      = drawerBody.querySelector<HTMLButtonElement>('#drawer-vocal-btn');
      const vocalFeedback = drawerBody.querySelector<HTMLElement>('#drawer-vocal-feedback');
      vocalBtn?.addEventListener('click', async () => {
        const vsid = vocalBtn.dataset.studentId ?? '';
        if (vocalBtn) vocalBtn.disabled = true;
        if (vocalFeedback) {
          vocalFeedback.className = 'drawer-vocal-feedback';
          vocalFeedback.textContent = 'Génération de l\'appel en cours…';
          vocalFeedback.classList.remove('hidden');
        }
        try {
          const res = await fetch('/api/vocal-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: vsid }),
          });
          const data = await res.json().catch(() => ({}));
          if (vocalFeedback) {
            vocalFeedback.className = res.ok
              ? 'drawer-vocal-feedback drawer-send-feedback--ok'
              : 'drawer-vocal-feedback drawer-send-feedback--err';
            vocalFeedback.textContent = res.ok
              ? (data.message ?? 'Appel en cours vers le numéro renseigné.')
              : (data.error ?? "Erreur lors du déclenchement de l'appel.");
            vocalFeedback.classList.remove('hidden');
          }
        } catch {
          if (vocalFeedback) {
            vocalFeedback.className = 'drawer-vocal-feedback drawer-send-feedback--err';
            vocalFeedback.textContent = 'Erreur réseau. Réessayez.';
            vocalFeedback.classList.remove('hidden');
          }
        }
        if (vocalBtn) vocalBtn.disabled = false;
      });
    });
}

initStudents();
document.addEventListener('astro:page-load', initStudents);
