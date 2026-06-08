function initFontSwap() {
  document.querySelectorAll('link[rel="stylesheet"][media="print"]').forEach(function (link) {
    if (link.dataset.swapInitialized) return;
    link.dataset.swapInitialized = 'true';
    link.addEventListener('load', function () { link.media = 'all'; });
  });
}

var hamburger = document.getElementById('cl-hamburger');
var sidebar   = document.getElementById('cl-sidebar');
var overlay   = document.getElementById('cl-overlay');

function toggleMenu(open) {
  sidebar && sidebar.classList.toggle('cl-sidebar--open', open);
  overlay && overlay.classList.toggle('cl-overlay--visible', open);
  hamburger && hamburger.setAttribute('aria-expanded', String(open));
}
hamburger && hamburger.addEventListener('click', function () {
  var isOpen = hamburger.getAttribute('aria-expanded') === 'true';
  toggleMenu(!isOpen);
});
overlay && overlay.addEventListener('click', function () { toggleMenu(false); });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && hamburger && hamburger.getAttribute('aria-expanded') === 'true') {
    toggleMenu(false);
    hamburger.focus();
  }
});
document.addEventListener('astro:before-swap', function () { toggleMenu(false); });

function applyTheme() {
  var t = localStorage.getItem('aevum_theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', t);
}
applyTheme();
document.addEventListener('astro:after-swap', function () { applyTheme(); initFontSwap(); });

function initThemeToggle() {
  var btn = document.getElementById('theme-toggle');
  if (!btn || btn.dataset.initialized) return;
  btn.dataset.initialized = 'true';
  function update(theme) {
    var sun = btn.querySelector('.icon-sun');
    var moon = btn.querySelector('.icon-moon');
    var label = btn.querySelector('.cl-theme-label');
    if (sun) sun.style.display = theme === 'dark' ? 'block' : 'none';
    if (moon) moon.style.display = theme === 'light' ? 'block' : 'none';
    if (label) label.textContent = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre');
  }
  update(document.documentElement.getAttribute('data-theme') || 'dark');
  btn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('aevum_theme', next);
    update(next);
  });
}
initThemeToggle();
document.addEventListener('astro:page-load', initThemeToggle);

function initFormationSelector() {
  var sel = document.getElementById('formation-select');
  if (!sel || sel.dataset.initialized) return;
  sel.dataset.initialized = 'true';
  sel.addEventListener('change', function () {
    document.cookie = 'aevum_formation_id=' + sel.value + '; path=/; SameSite=Strict; Secure; Max-Age=86400';
    window.location.reload();
  });
}
initFormationSelector();
document.addEventListener('astro:page-load', initFormationSelector);

initFontSwap();
