function initDeliverability() {
  var STORAGE_KEY = 'aevum_deliverability_steps';
  var done = [];
  try { done = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (err) {}

  done.forEach(function (n) {
    var el = document.querySelector('.del-step[data-step="' + n + '"]');
    el && el.classList.add('step--done');
  });

  document.querySelectorAll('.del-complete-btn').forEach(function (btn) {
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';
    btn.addEventListener('click', function () {
      var step = parseInt(btn.dataset.step);
      if (done.indexOf(step) === -1) done.push(step);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
      var stepEl = btn.closest('.del-step');
      stepEl && stepEl.classList.add('step--done');
    });
  });

  document.querySelectorAll('.del-copy-btn').forEach(function (btn) {
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';
    btn.addEventListener('click', async function () {
      var targetId = btn.dataset.target;
      var el = document.getElementById(targetId);
      if (!el) return;
      var text = el.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        var orig = btn.textContent;
        btn.textContent = 'Copié !';
        setTimeout(function () { btn.textContent = orig; }, 1500);
      } catch (err) { /* ignore */ }
    });
  });
}
initDeliverability();
document.addEventListener('astro:page-load', initDeliverability);
