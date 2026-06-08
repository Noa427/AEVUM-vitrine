function initMenu() {
  var toggle = document.querySelector('.nav__toggle');
  var mobile = document.getElementById('nav-mobile');
  if (!toggle || !mobile) return;
  toggle.addEventListener('click', function () {
    var isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    mobile.classList.toggle('is-open');
    mobile.setAttribute('aria-hidden', String(isOpen));
  });
}
function initThemeToggle() {
  var btn = document.getElementById('theme-toggle');
  if (!btn || btn.dataset.initialized) return;
  btn.dataset.initialized = 'true';
  function update(theme) {
    var sun = btn.querySelector('.icon-sun');
    var moon = btn.querySelector('.icon-moon');
    if (sun) sun.style.display = theme === 'dark' ? 'block' : 'none';
    if (moon) moon.style.display = theme === 'light' ? 'block' : 'none';
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
initMenu();
initThemeToggle();
document.addEventListener('astro:after-swap', function () { initMenu(); initThemeToggle(); });
