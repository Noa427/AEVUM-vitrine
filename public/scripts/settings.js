function initRapportToggle() {
  var toggle  = document.getElementById('rapport-toggle-input');
  var label   = document.getElementById('rapport-toggle-label');
  var errorEl = document.querySelector('.rapport-error');
  if (!toggle || toggle.disabled || toggle.dataset.initialized) return;
  toggle.dataset.initialized = 'true';
  toggle.addEventListener('change', async function () {
    var active = toggle.checked;
    if (label) label.textContent = active ? 'Actif' : 'Inactif';
    if (errorEl) errorEl.style.display = 'none';
    try {
      var res = await fetch('/api/config-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_type: 'rapport_video_active', value: active ? 'true' : 'false' }),
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      toggle.checked = !active;
      if (label) label.textContent = !active ? 'Actif' : 'Inactif';
      if (errorEl) { errorEl.textContent = 'Erreur lors de la sauvegarde.'; errorEl.style.display = ''; }
    }
  });
}
initRapportToggle();
document.addEventListener('astro:page-load', initRapportToggle);

function initVocalToggle() {
  var toggle  = document.getElementById('vocal-toggle-input');
  var label   = document.getElementById('vocal-toggle-label');
  var errorEl = document.querySelector('.vocal-error');
  if (!toggle || toggle.disabled || toggle.dataset.initialized) return;
  toggle.dataset.initialized = 'true';
  toggle.addEventListener('change', async function () {
    var active = toggle.checked;
    if (label) label.textContent = active ? 'Actif' : 'Inactif';
    if (errorEl) errorEl.style.display = 'none';
    try {
      var res = await fetch('/api/config-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_type: 'vocal_ia_active', value: active ? 'true' : 'false' }),
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      toggle.checked = !active;
      if (label) label.textContent = !active ? 'Actif' : 'Inactif';
      if (errorEl) { errorEl.textContent = 'Erreur lors de la sauvegarde.'; errorEl.style.display = ''; }
    }
  });
}
initVocalToggle();
document.addEventListener('astro:page-load', initVocalToggle);
