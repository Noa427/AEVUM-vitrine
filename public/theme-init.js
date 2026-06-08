(function () {
  var t = localStorage.getItem('aevum_theme');
  var p = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t || p);
})();
