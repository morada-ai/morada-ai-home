/* Cópia genérica · rolagem suave das páginas internas (19/11/2026)
   A mesma da home: Lenis com lerp 0,1, exposto como window.copiaLenis para o
   copia/encaixe.js assentar a rolagem no começo de cada seção. Quem pede menos
   movimento no sistema fica com a rolagem nativa (o encaixe cai no scroll-snap do CSS). */
(function () {
  'use strict';
  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function suave() {
    if (reduz || !window.Lenis || window.copiaLenis) return;
    var l = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: true });
    window.copiaLenis = l;
    function raf(t) { l.raf(t); window.requestAnimationFrame(raf); }
    window.requestAnimationFrame(raf);
  }
  if (document.readyState === 'complete') { suave(); } else { window.addEventListener('load', suave); }
})();
