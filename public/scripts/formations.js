function initFormations() {
  document.querySelectorAll('.btn-inline-rename').forEach(function (btn) {
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';
    btn.addEventListener('click', function () {
      var modal   = document.getElementById('rename-modal');
      var overlay = document.getElementById('formations-overlay');
      var idInput = document.getElementById('rename-id');
      var nameInput = document.getElementById('rename-input');
      idInput.value   = btn.dataset.id;
      nameInput.value = btn.dataset.name;
      modal.style.display   = '';
      overlay.style.display = '';
      nameInput.focus();
    });
  });

  var renameCancel = document.getElementById('rename-cancel');
  renameCancel && renameCancel.addEventListener('click', function () {
    document.getElementById('rename-modal').style.display   = 'none';
    document.getElementById('formations-overlay').style.display = 'none';
  });

  document.querySelectorAll('.btn-confirm-delete').forEach(function (btn) {
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';
    btn.addEventListener('click', function () {
      var modal   = document.getElementById('delete-modal');
      var overlay = document.getElementById('formations-overlay');
      var idInput = document.getElementById('delete-id');
      var nameEl  = modal.querySelector('.delete-modal-name');
      idInput.value      = btn.dataset.id;
      nameEl.textContent = btn.dataset.name;
      modal.style.display   = '';
      overlay.style.display = '';
    });
  });

  var deleteCancel = document.getElementById('delete-cancel');
  deleteCancel && deleteCancel.addEventListener('click', function () {
    document.getElementById('delete-modal').style.display   = 'none';
    document.getElementById('formations-overlay').style.display = 'none';
  });

  var overlayEl = document.getElementById('formations-overlay');
  overlayEl && overlayEl.addEventListener('click', function () {
    document.getElementById('rename-modal').style.display   = 'none';
    document.getElementById('delete-modal').style.display   = 'none';
    document.getElementById('formations-overlay').style.display = 'none';
  });
}
initFormations();
document.addEventListener('astro:page-load', initFormations);
