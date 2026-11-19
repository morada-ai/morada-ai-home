/* Cópia genérica · Faixa de logos das incorporadoras em branco (19/11/2026)
   O CSS (seção 4 da camada) deixa cada logo branco com filter: brightness(0) invert(1),
   o que só funciona em arquivo com fundo transparente. Alguns logos vêm com fundo branco
   chapado (jpg, png sem transparência, webp sem alfa) e virariam um retângulo branco.
   Aqui esses arquivos passam por um canvas: o claro vira transparente e o escuro vira
   branco opaco, e o <img> recebe essa versão. Sem JS, o filtro do CSS continua. */
(function () {
  'use strict';
  var cache = {};

  function opaco(dados, w, h) {
    var cantos = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
    return cantos.every(function (i) { return dados[i + 3] === 255; });
  }

  function converter(img) {
    var src = img.currentSrc || img.src;
    if (!src || img.dataset.copiaMono) return;
    if (cache[src]) { aplicar(img, cache[src]); return; }
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return;
    var esc = Math.min(1, 640 / w);
    w = Math.max(1, Math.round(w * esc)); h = Math.max(1, Math.round(h * esc));
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    try {
      ctx.drawImage(img, 0, 0, w, h);
      var px = ctx.getImageData(0, 0, w, h);
      var d = px.data;
      if (!opaco(d, w, h)) { cache[src] = 'transparente'; img.dataset.copiaMono = 'transparente'; return; }
      // o fundo é a cor dos cantos; quanto mais longe dela, mais opaco o branco
      var f = [d[0], d[1], d[2]];
      for (var i = 0; i < d.length; i += 4) {
        var dist = Math.max(Math.abs(d[i] - f[0]), Math.abs(d[i + 1] - f[1]), Math.abs(d[i + 2] - f[2])) / 255;
        var a = Math.min(1, Math.max(0, (dist - 0.08) / 0.42));
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = Math.round(a * 255);
      }
      ctx.putImageData(px, 0, 0);
      cache[src] = c.toDataURL('image/png');
      aplicar(img, cache[src]);
    } catch (e) { /* canvas bloqueado: fica o filtro do CSS */ }
  }

  function aplicar(img, url) {
    if (url === 'transparente') { img.dataset.copiaMono = 'transparente'; return; }
    img.dataset.copiaMono = 'convertido';
    img.removeAttribute('srcset');
    img.src = url;
  }

  function iniciar() {
    var imgs = document.querySelectorAll('.homeV2 .partnersMarquee .partnerLogo img');
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.complete && img.naturalWidth) converter(img);
      else img.addEventListener('load', function () { converter(img); }, { once: true });
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
