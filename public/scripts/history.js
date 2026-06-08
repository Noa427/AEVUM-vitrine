function initPagination() {
  var PAGE_SIZE = 50;
  var table = document.getElementById('hist-table');
  if (!table) return;
  var existingPager = document.querySelector('.hist-pager');
  if (existingPager) existingPager.remove();
  var rows = Array.from(table.querySelectorAll('tbody tr'));
  rows.forEach(function (r) { r.style.display = ''; });
  if (rows.length <= PAGE_SIZE) return;

  var currentPage = 0;
  var totalPages = Math.ceil(rows.length / PAGE_SIZE);

  var pager = document.createElement('div');
  pager.className = 'hist-pager';
  pager.innerHTML =
    '<button class="btn btn-secondary hist-btn" id="hist-prev" disabled>← Précédent</button>' +
    '<span class="hist-page-info" id="hist-info"></span>' +
    '<button class="btn btn-secondary hist-btn" id="hist-next">Suivant →</button>';
  var card = table.closest('.hist-card');
  if (card) card.after(pager);

  var prevBtn = document.getElementById('hist-prev');
  var nextBtn = document.getElementById('hist-next');
  var infoEl  = document.getElementById('hist-info');

  function showPage(page) {
    rows.forEach(function (row, i) {
      row.style.display = (i >= page * PAGE_SIZE && i < (page + 1) * PAGE_SIZE) ? '' : 'none';
    });
    currentPage = page;
    if (infoEl) infoEl.textContent = 'Page ' + (page + 1) + ' / ' + totalPages;
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page === totalPages - 1;
  }

  prevBtn.addEventListener('click', function () { showPage(currentPage - 1); });
  nextBtn.addEventListener('click', function () { showPage(currentPage + 1); });
  showPage(0);
}
initPagination();
document.addEventListener('astro:page-load', initPagination);
