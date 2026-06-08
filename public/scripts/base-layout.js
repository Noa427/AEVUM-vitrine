function initFontSwap() {
  document.querySelectorAll('link[rel="stylesheet"][media="print"]').forEach(function (link) {
    if (link.dataset.swapInitialized) return;
    link.dataset.swapInitialized = 'true';
    link.addEventListener('load', function () { link.media = 'all'; });
  });
}
function initReveal() {
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.remove('will-animate');
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
  );
  var vh = window.innerHeight;
  document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
    var top = el.getBoundingClientRect().top;
    if (top < vh - 32) el.classList.add('visible');
    else { el.classList.add('will-animate'); observer.observe(el); }
  });
}
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      if (item) {
        var isOpen = item.classList.contains('open');
        item.parentElement && item.parentElement.querySelectorAll('.faq-item.open').forEach(function (el) { el.classList.remove('open'); });
        if (!isOpen) item.classList.add('open');
      }
    });
  });
}
function applyTheme() {
  var t = localStorage.getItem('aevum_theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', t);
}
initFontSwap();
applyTheme();
initReveal();
initFAQ();
document.addEventListener('astro:after-swap', function () { initFontSwap(); applyTheme(); initReveal(); initFAQ(); });
