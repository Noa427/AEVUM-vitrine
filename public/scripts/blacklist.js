function initBlacklist() {
  var PAGE_SIZE = 50;
  var currentPage = 0;

  var rows = Array.from(document.querySelectorAll('.bl-row'));
  var prevBtn   = document.getElementById('bl-prev');
  var nextBtn   = document.getElementById('bl-next');
  var pageInfo  = document.getElementById('bl-page-info');

  function showPage(page) {
    rows.forEach(function (row, i) {
      row.style.display = (i >= page * PAGE_SIZE && i < (page + 1) * PAGE_SIZE) ? '' : 'none';
    });
    if (prevBtn) prevBtn.disabled = page === 0;
    if (nextBtn) nextBtn.disabled = (page + 1) * PAGE_SIZE >= rows.length;
    if (pageInfo) pageInfo.textContent = 'Page ' + (page + 1) + ' / ' + Math.ceil(rows.length / PAGE_SIZE);
  }

  if (rows.length > PAGE_SIZE) {
    showPage(0);
    prevBtn && prevBtn.addEventListener('click', function () { currentPage--; showPage(currentPage); });
    nextBtn && nextBtn.addEventListener('click', function () { currentPage++; showPage(currentPage); });
  }

  rows.forEach(function (row) {
    if (row.dataset.initialized) return;
    row.dataset.initialized = 'true';
    var removeBtn  = row.querySelector('.btn-bl-remove');
    var confirmEl  = row.querySelector('.bl-confirm');
    var removingEl = row.querySelector('.bl-removing');
    var yesBtn     = row.querySelector('.btn-bl-yes');
    var noBtn      = row.querySelector('.btn-bl-no');
    var email      = row.dataset.email;

    removeBtn && removeBtn.addEventListener('click', function () {
      removeBtn.classList.add('hidden');
      confirmEl && confirmEl.classList.remove('hidden');
    });

    noBtn && noBtn.addEventListener('click', function () {
      confirmEl && confirmEl.classList.add('hidden');
      removeBtn && removeBtn.classList.remove('hidden');
    });

    yesBtn && yesBtn.addEventListener('click', async function () {
      confirmEl && confirmEl.classList.add('hidden');
      if (removingEl) removingEl.classList.remove('hidden');
      try {
        var res = await fetch('/api/blacklist-remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email }),
        });
        if (res.ok) {
          row.remove();
        } else {
          if (removingEl) removingEl.classList.add('hidden');
          removeBtn && removeBtn.classList.remove('hidden');
          alert('Erreur lors de la suppression. Réessayez.');
        }
      } catch (err) {
        if (removingEl) removingEl.classList.add('hidden');
        removeBtn && removeBtn.classList.remove('hidden');
        alert('Erreur réseau. Réessayez.');
      }
    });
  });
}

initBlacklist();
document.addEventListener('astro:page-load', initBlacklist);
