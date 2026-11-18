/* Cópia genérica · "O que a Morada resolve" em carrossel (18/11/2026)
   Os três cartões (.f3-card) viram slides: um por vez, troca a cada 6 s, abas com
   barra de progresso. Pausa com o mouse em cima, com foco dentro, fora da tela, com a
   aba do navegador escondida e pelo botão de pausa. Quem pediu menos movimento no
   sistema não tem rotação automática. Setas trocam de aba; no celular, deslize. */
(function () {
  'use strict';
  var INTERVALO = 6000;

  function iniciar() {
    var bento = document.querySelector('.homeV2 .f3-bento');
    if (!bento || bento.classList.contains('copia-carrossel')) return;
    var slides = Array.prototype.filter.call(bento.children, function (el) { return el.classList.contains('f3-card'); });
    if (slides.length < 2) return;

    var menosMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var atual = 0;
    var motivosDePausa = {};
    if (menosMovimento) motivosDePausa.sistema = true;

    bento.classList.add('copia-carrossel');
    bento.setAttribute('role', 'region');
    bento.setAttribute('aria-roledescription', 'carrossel');
    bento.setAttribute('aria-label', 'O que a Morada resolve');

    // abas
    var nav = document.createElement('div');
    nav.className = 'copiaCarrosselNav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Frentes da Morada');
    nav.style.setProperty('--intervalo', INTERVALO + 'ms');

    var abas = slides.map(function (slide, i) {
      slide.id = slide.id || 'copia-frente-' + (i + 1);
      var tag = slide.querySelector('.f3-tag');
      var num = tag && tag.querySelector('b') ? tag.querySelector('b').textContent.trim() : String(i + 1).padStart(2, '0');
      var nome = tag ? tag.textContent.replace(num, '').trim() : 'Frente ' + (i + 1);
      var aba = document.createElement('button');
      aba.type = 'button';
      aba.className = 'copiaCarrosselTab';
      aba.id = 'copia-aba-' + (i + 1);
      aba.setAttribute('role', 'tab');
      aba.setAttribute('aria-controls', slide.id);
      aba.innerHTML = '<span class="copiaCarrosselTab__barra" aria-hidden="true"></span>' +
        '<span class="copiaCarrosselTab__num" aria-hidden="true">' + num + '</span>' +
        '<span class="copiaCarrosselTab__nome">' + nome + '</span>';
      aba.addEventListener('click', function () { ir(i, true); });
      nav.appendChild(aba);
      return aba;
    });
    bento.parentNode.insertBefore(nav, bento.nextSibling);

    // botão de pausa (conteúdo que se move sozinho precisa de controle)
    var pausa = document.createElement('button');
    pausa.type = 'button';
    pausa.className = 'copiaCarrosselPausa';
    var iconePausa = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
    var iconePlay = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
    function desenharPausa() {
      var parado = !!motivosDePausa.usuario || !!motivosDePausa.sistema;
      pausa.innerHTML = parado ? iconePlay : iconePausa;
      pausa.setAttribute('aria-label', parado ? 'Retomar a troca automática' : 'Pausar a troca automática');
      pausa.setAttribute('aria-pressed', parado ? 'true' : 'false');
    }
    pausa.addEventListener('click', function () {
      if (motivosDePausa.sistema) { delete motivosDePausa.sistema; } else if (motivosDePausa.usuario) { delete motivosDePausa.usuario; } else { motivosDePausa.usuario = true; }
      desenharPausa(); aplicarPausa();
    });
    bento.appendChild(pausa);
    desenharPausa();

    function aplicarPausa() {
      var pausado = Object.keys(motivosDePausa).length > 0;
      nav.classList.toggle('is-pausado', pausado);
      nav.setAttribute('data-pausas', Object.keys(motivosDePausa).join(' '));
    }

    function ir(i, peloUsuario) {
      atual = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var ativo = k === atual;
        s.classList.toggle('is-ativo', ativo);
        s.setAttribute('aria-hidden', ativo ? 'false' : 'true');
        if (ativo) { s.removeAttribute('tabindex'); } else { s.setAttribute('tabindex', '-1'); }
      });
      abas.forEach(function (a, k) {
        var ativo = k === atual;
        a.setAttribute('aria-selected', ativo ? 'true' : 'false');
        a.setAttribute('tabindex', ativo ? '0' : '-1');
        a.classList.remove('is-ativo');
      });
      // reinicia a barra de progresso da aba ativa
      void abas[atual].offsetWidth;
      abas[atual].classList.add('is-ativo');
      if (peloUsuario) abas[atual].focus({ preventScroll: true });
    }

    // a barra enche em INTERVALO ms; quando termina, passa para o próximo
    nav.addEventListener('animationend', function (e) {
      if (e.target.classList.contains('copiaCarrosselTab__barra')) ir(atual + 1, false);
    });

    // teclado nas abas
    nav.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual - 1, true); }
      else if (e.key === 'Home') { e.preventDefault(); ir(0, true); }
      else if (e.key === 'End') { e.preventDefault(); ir(slides.length - 1, true); }
    });

    // pausas automáticas
    // mouse em cima: pausado pelo CSS (:hover), que não se perde quando o ícone do botão é trocado
    [bento, nav].forEach(function (el) {
      // só foco de teclado pausa; o clique do mouse não deve travar a rotação depois que o mouse sai
      el.addEventListener('focusin', function (e) {
        var teclado = true;
        try { teclado = e.target.matches(':focus-visible'); } catch (err) { teclado = true; }
        if (teclado) { motivosDePausa.foco = true; aplicarPausa(); }
      });
      el.addEventListener('focusout', function (e) {
        if (!bento.contains(e.relatedTarget) && !nav.contains(e.relatedTarget)) { delete motivosDePausa.foco; aplicarPausa(); }
      });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { motivosDePausa.aba = true; } else { delete motivosDePausa.aba; }
      aplicarPausa();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { delete motivosDePausa.foraDaTela; } else { motivosDePausa.foraDaTela = true; }
        aplicarPausa();
      }, { threshold: 0.35 }).observe(bento);
    }

    // deslize no celular
    var x0 = null, y0 = null;
    bento.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    bento.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) ir(atual + (dx < 0 ? 1 : -1), false);
      x0 = y0 = null;
    }, { passive: true });

    ir(0, false);
    aplicarPausa();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
