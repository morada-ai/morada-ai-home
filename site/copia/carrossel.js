/* Cópia genérica · "O que a Morada resolve" em carrossel de foco (18/11/2026)
   Pegada da referência (pin "Clean Motion Design Idea"): um cartão grande no centro,
   os vizinhos menores dos dois lados cortados pela tela, e embaixo só o nome da frente,
   a frase e o link. Giram em círculo só quando a pessoa pede (desde 19/11/2026 não há
   troca automática): setas nas laterais do cartão central, setas do teclado, clique no
   vizinho e, no celular, deslize. */
(function () {
  'use strict';

  function iniciar() {
    var trilho = document.querySelector('.homeV2 .f3-bento');
    if (!trilho || trilho.classList.contains('copia-foco')) return;
    var cartoes = Array.prototype.filter.call(trilho.children, function (el) { return el.classList.contains('f3-card'); });
    var n = cartoes.length;
    if (n < 3) return;

    var atual = 0;

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

    // 19/11/2026: sem troca automática, sem traços e sem pausa; duas setas nas laterais do
    // cartão central (na fresta entre ele e os vizinhos)
    var seta = function (lado, rotulo, d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'copiaFocoSeta copiaFocoSeta--' + lado;
      b.setAttribute('aria-label', rotulo);
      b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
      trilho.appendChild(b);
      return b;
    };
    var antes = seta('ant', 'Frente anterior', 'M15 18l-6-6 6-6');
    var depois = seta('prox', 'Próxima frente', 'M9 18l6-6-6-6');
    antes.addEventListener('click', function () { ir(atual - 1, true); });
    depois.addEventListener('click', function () { ir(atual + 1, true); });

    trilho.parentNode.insertBefore(legenda, trilho.nextSibling);

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
      var nomeDe = function (k) { return dados[(k + n) % n].nome; };
      antes.setAttribute('aria-label', 'Anterior: ' + nomeDe(atual - 1));
      depois.setAttribute('aria-label', 'Próxima: ' + nomeDe(atual + 1));
    }

    // clique no vizinho traz ele ao centro (o do centro segue como link)
    cartoes.forEach(function (c, k) {
      c.addEventListener('click', function (e) {
        if (k !== atual) { e.preventDefault(); ir(k, true); }
      });
    });

    // teclado
    trilho.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual - 1, true); }
    });

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
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
