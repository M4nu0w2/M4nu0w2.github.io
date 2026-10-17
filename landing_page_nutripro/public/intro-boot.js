// Intro del logo: attivata prima del primo paint per evitare flash del contenuto.
// Saltata con prefers-reduced-motion o se si arriva su un'ancora (es. /#tester).
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || location.hash || location.search.indexOf('storyAt') >= 0) return;
  var root = document.documentElement;
  root.classList.add('intro-active');
  // Paracadute: se il JS non parte, la pagina si sblocca comunque.
  if (location.search.indexOf('introAt') < 0) {
    setTimeout(function () { root.classList.remove('intro-active'); }, 6000);
  }
})();
