/* Darstellung früh setzen (vor dem ersten Zeichnen), ohne Inline-Skript wegen CSP */
function applyTheme(t) {
  var root = document.documentElement;
  if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
  var dark = t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  var metas = document.querySelectorAll('meta[name="theme-color"]');
  for (var i = 0; i < metas.length; i++) { metas[i].removeAttribute('media'); metas[i].setAttribute('content', dark ? '#15161a' : '#f7f5f0'); }
}
(function () {
  var t = 'system';
  try { var d = JSON.parse(localStorage.getItem('psyklausur-v1')); if (d && d.set && d.set.theme) t = d.set.theme; } catch (e) {}
  applyTheme(t);
})();
