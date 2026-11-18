/* Cópia genérica · "O que a Morada resolve" em carrossel de foco (18/11/2026)
   Pegada da referência (pin "Clean Motion Design Idea"): um cartão grande no centro,
   os vizinhos menores dos dois lados cortados pela tela, e embaixo só o nome da frente,
   a frase e o link. Os três giram em círculo a cada 6 s.
   Pausa: botão (obrigatório para conteúdo que se move sozinho), foco de teclado, fora da
   tela, aba escondida e mouse em cima (no CSS, por :hover). Sem troca automática para
   quem pede menos movimento. Setas trocam; clique no vizinho traz ele ao centro; no
   celular, deslize. */
(function () {
  'use strict';
  var INTERVALO = 6000;

  function iniciar() {
    var trilho = document.querySelector('.homeV2 .f3-bento');
    if (!trilho || trilho.classList.contains('copia-foco')) return;
    var cartoes = Array.prototype.filter.call(trilho.children, function (el) { return el.classList.contains('f3-card'); });
    var n = cartoes.length;
    if (n < 3) return;

    var menosMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var atual = 0;
    var motivos = {};
    if (menosMovimento) motivos.sistema = true;

    trilho.classList.add('copia-foco');
    trilho.setAttribute('role', 'region');
    trilho.setAttribute('aria-roledescription', 'carrossel');
    trilho.setAttribute('aria-label', 'O que a Morada resolve');

    // dados de cada frente, tirados do próprio cartão
    var dados = cartoes.map(function (c, i) {
      c.id = c.id || 'copia-frente-' + (i + 1);
      var tag = c.querySelector('.f3-tag');
      var num = tag && tag.querySelector('b') ? tag.querySelector('b').textContent.trim() : '';
      return {
        nome: tag ? tag.textContent.replace(num, '').trim() : 'Frente ' + (i + 1),
        frase: (c.querySelector('.f3-frase') || {}).textContent || '',
        meta: (c.querySelector('.f3-rod em') || {}).textContent || '',
        link: c.querySelector('.f3-link') ? c.querySelector('.f3-link').innerHTML : 'Conhecer',
        href: c.getAttribute('href'),
        alvo: c.getAttribute('target'),
        rel: c.getAttribute('rel')
      };
    });

    // legenda embaixo do cartão central
    var legenda = document.createElement('div');
    legenda.className = 'copiaFocoLegenda';
    legenda.setAttribute('aria-live', 'off');
    var itens = dados.map(function (d, i) {
      var it = document.createElement('div');
      it.className = 'copiaFocoLegenda__item';
      it.id = 'copia-legenda-' + (i + 1);
      var a = '<a class="copiaFocoLegenda__link" href="' + d.href + '"' + (d.alvo ? ' target="' + d.alvo + '"' : '') + (d.rel ? ' rel="' + d.rel + '"' : '') + '>' + d.link + '</a>';
      it.innerHTML = '<p class="copiaFocoLegenda__nome">' + d.nome + '</p>' +
        '<p class="copiaFocoLegenda__frase">' + d.frase + '</p>' +
        '<p class="copiaFocoLegenda__rod"><span>' + d.meta + '</span>' + a + '</p>';
      legenda.appendChild(it);
      return it;
    });

    // controles: três traços de progresso + pausa
    var controles = document.createElement('div');
    controles.className = 'copiaFocoControles';
    controles.style.setProperty('--intervalo', INTERVALO + 'ms');
    var lista = document.createElement('div');
    lista.className = 'copiaFocoTracos';
    lista.setAttribute('role', 'tablist');
    lista.setAttribute('aria-label', 'Frentes da Morada');
    var tracos = dados.map(function (d, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'copiaFocoTraco';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', d.nome);
      b.setAttribute('aria-controls', itens[i].id);
      b.innerHTML = '<span class="copiaFocoTraco__barra" aria-hidden="true"></span>';
      b.addEventListener('click', function () { ir(i, true); });
      lista.appendChild(b);
      return b;
    });
    var pausa = document.createElement('button');
    pausa.type = 'button';
    pausa.className = 'copiaFocoPausa';
    var icPausa = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
    var icPlay = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
    function desenharPausa() {
      var parado = !!motivos.usuario || !!motivos.sistema;
      pausa.innerHTML = parado ? icPlay : icPausa;
      pausa.setAttribute('aria-label', parado ? 'Retomar a troca automática' : 'Pausar a troca automática');
      pausa.setAttribute('aria-pressed', parado ? 'true' : 'false');
    }
    pausa.addEventListener('click', function () {
      if (motivos.sistema) { delete motivos.sistema; } else if (motivos.usuario) { delete motivos.usuario; } else { motivos.usuario = true; }
      desenharPausa(); aplicarPausa();
    });
    controles.appendChild(lista);
    controles.appendChild(pausa);
    desenharPausa();

    trilho.parentNode.insertBefore(legenda, trilho.nextSibling);
    legenda.parentNode.insertBefore(controles, legenda.nextSibling);

    function aplicarPausa() {
      var pausado = Object.keys(motivos).length > 0;
      controles.classList.toggle('is-pausado', pausado);
      controles.setAttribute('data-pausas', Object.keys(motivos).join(' '));
    }

    // posição relativa ao centro: -1 (esquerda), 0 (centro), 1 (direita)
    function posicao(i) {
      var d = (i - atual + n) % n;
      if (d === 0) return 0;
      if (d === 1) return 1;
      if (d === n - 1) return -1;
      return d <= n / 2 ? 2 : -2;   // fora de cena (só existe com mais de 3 frentes)
    }

    var posAnterior = cartoes.map(function () { return null; });
    function ir(i, peloUsuario) {
      atual = (i + n) % n;
      cartoes.forEach(function (c, k) {
        var p = posicao(k);
        // quem atravessa de um lado para o outro some e reaparece, sem cruzar o centro
        var salto = posAnterior[k] !== null && Math.abs(p - posAnterior[k]) > 1;
        c.classList.toggle('is-salto', salto);
        c.setAttribute('data-pos', String(p));
        c.setAttribute('aria-hidden', p === 0 ? 'false' : 'true');
        c.setAttribute('tabindex', p === 0 ? '0' : '-1');
        posAnterior[k] = p;
      });
      itens.forEach(function (it, k) {
        it.classList.toggle('is-ativo', k === atual);
        it.setAttribute('aria-hidden', k === atual ? 'false' : 'true');
        Array.prototype.forEach.call(it.querySelectorAll('a'), function (a) { a.setAttribute('tabindex', k === atual ? '0' : '-1'); });
      });
      tracos.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === atual ? 'true' : 'false');
        t.setAttribute('tabindex', k === atual ? '0' : '-1');
        t.classList.remove('is-ativo');
      });
      void tracos[atual].offsetWidth;            // reinicia a barra
      tracos[atual].classList.add('is-ativo');
      if (peloUsuario === 'teclado') tracos[atual].focus({ preventScroll: true });
    }

    // a barra do traço ativo enche em INTERVALO ms; quando termina, avança
    lista.addEventListener('animationend', function (e) {
      if (e.target.classList.contains('copiaFocoTraco__barra')) ir(atual + 1, false);
    });

    // clique no vizinho traz ele ao centro (o do centro segue como link)
    cartoes.forEach(function (c, k) {
      c.addEventListener('click', function (e) {
        if (k !== atual) { e.preventDefault(); ir(k, true); }
      });
    });

    // teclado
    [trilho, controles].forEach(function (el) {
      el.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual + 1, 'teclado'); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual - 1, 'teclado'); }
      });
    });

    // pausas: foco de teclado, aba escondida, fora da tela (o mouse fica no CSS)
    [trilho, legenda, controles].forEach(function (el) {
      el.addEventListener('focusin', function (e) {
        var teclado = true;
        try { teclado = e.target.matches(':focus-visible'); } catch (err) { teclado = true; }
        if (teclado) { motivos.foco = true; aplicarPausa(); }
      });
      el.addEventListener('focusout', function (e) {
        var r = e.relatedTarget;
        if (!(r && (trilho.contains(r) || legenda.contains(r) || controles.contains(r)))) { delete motivos.foco; aplicarPausa(); }
      });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { motivos.aba = true; } else { delete motivos.aba; }
      aplicarPausa();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { delete motivos.foraDaTela; } else { motivos.foraDaTela = true; }
        aplicarPausa();
      }, { threshold: 0.35 }).observe(trilho);
    }

    // deslize no celular
    var x0 = null, y0 = null;
    trilho.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    trilho.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) ir(atual + (dx < 0 ? 1 : -1), true);
      x0 = y0 = null;
    }, { passive: true });

    ir(0, false);
    aplicarPausa();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
