/* Cópia genérica · Quem Somos em formato compacto (19/11/2026)
   Com site/copia/compacto-quem-somos.css. Só no desktop (≥ 992 px): abaixo disso
   (ou quando a janela estreita) tudo volta ao HTML original. Sem JS, tudo aparece.
   1. "O que fazemos" (#o-que-fazemos): os 4 cartões do mosaico (Morada OS e as três
      MIAs) viram abas numa lista vertical; o palco mostra um por vez, com os próprios
      cartões. Abas com clique e setas (↑ ↓ ← →, Home, End). Não troca sozinho.
   2. "As pessoas" (#pessoas): os 5 líderes num carrossel de uma linha, 3 por vez, com
      duas setas de vidro; o foco do teclado num líder fora da vista traz o carrossel
      até ele. O cartão de vagas fica ao lado.
   Depois de cada mudança o encaixe por tela (copia/encaixe.js) mede de novo. */
(function () {
  'use strict';

  var MQ = window.matchMedia('(min-width: 992px)');
  var LIDERES_VISIVEIS = 3;

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function criar(tag, classe, attrs) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function filhos(el, classe) {
    return Array.prototype.filter.call(el.children, function (c) { return !classe || c.classList.contains(classe); });
  }
  // pede ao copia/encaixe.js (e ao Lenis) para medir a página de novo
  function remedir() {
    var ev;
    try { ev = new Event('resize'); } catch (e) { ev = document.createEvent('Event'); ev.initEvent('resize', true, false); }
    window.dispatchEvent(ev);
  }

  /* ---------- 1. O que fazemos: explorador ---------- */
  function montarFaz() {
    var secao = document.getElementById('o-que-fazemos');
    if (!secao || secao.classList.contains('copia-faz-on')) return null;
    var bento = secao.querySelector('.q3-bento');
    if (!bento) return null;
    var itens = filhos(bento).filter(function (el) { return el.classList.contains('q3-os') || el.classList.contains('q3-foto'); });
    if (itens.length < 2) return null;

    var raiz = criar('div', 'copiaFaz');
    var lista = criar('div', 'copiaFaz__lista', {
      role: 'tablist',
      'aria-orientation': 'vertical',
      'aria-label': txt(secao.querySelector('.q3-head .q3-eyebrow')) || 'O que fazemos'
    });
    bento.parentNode.insertBefore(raiz, bento);
    raiz.appendChild(lista);
    raiz.appendChild(bento);   // o próprio mosaico vira o palco
    bento.classList.add('copiaFaz__palco');

    var abas = [], paineis = [];
    itens.forEach(function (item, i) {
      var n = i + 1;
      var titulo = txt(item.querySelector('h3')) || 'Destaque ' + n;
      var sub = txt(item.querySelector('.q3-foto-txt p')) || txt(item.querySelector(':scope > p'));
      var aba = criar('button', 'copiaFaz__aba', {
        type: 'button', role: 'tab', id: 'copia-faz-aba-' + n, 'aria-controls': 'copia-faz-painel-' + n
      });
      aba.innerHTML = '<span class="copiaFaz__num" aria-hidden="true">' + (n < 10 ? '0' : '') + n + '</span>' +
        '<span class="copiaFaz__txt"><span class="copiaFaz__titulo"></span><span class="copiaFaz__sub"></span></span>';
      aba.querySelector('.copiaFaz__titulo').textContent = titulo;
      aba.querySelector('.copiaFaz__sub').textContent = sub;
      lista.appendChild(aba);
      // o cartão vai para dentro de um painel (os cartões-foto são links: o papel
      // de tabpanel fica no invólucro, não no <a>)
      var painel = criar('div', 'copiaFaz__painel', {
        id: 'copia-faz-painel-' + n, role: 'tabpanel', 'aria-labelledby': aba.id, tabindex: '0'
      });
      bento.insertBefore(painel, item);
      painel.appendChild(item);
      abas.push(aba);
      paineis.push(painel);
    });
    secao.classList.add('copia-faz-on');

    var atual = -1;
    function ir(i, foco) {
      i = (i + abas.length) % abas.length;
      if (i !== atual) {
        atual = i;
        abas.forEach(function (a, k) {
          var on = k === i;
          a.setAttribute('aria-selected', on ? 'true' : 'false');
          a.setAttribute('tabindex', on ? '0' : '-1');
        });
        paineis.forEach(function (p, k) { p.classList.toggle('is-ativo', k === i); });
      }
      if (foco) abas[i].focus();
    }
    abas.forEach(function (a, i) { a.addEventListener('click', function () { ir(i, false); }); });
    lista.addEventListener('keydown', function (e) {
      var alvo = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') alvo = atual + 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') alvo = atual - 1;
      else if (e.key === 'Home') alvo = 0;
      else if (e.key === 'End') alvo = abas.length - 1;
      if (alvo === null) return;
      e.preventDefault();
      ir(alvo, true);
    });
    ir(0, false);

    return function desfazer() {
      paineis.forEach(function (painel, i) {
        bento.insertBefore(itens[i], painel);
        bento.removeChild(painel);
      });
      raiz.parentNode.insertBefore(bento, raiz);
      raiz.parentNode.removeChild(raiz);
      bento.classList.remove('copiaFaz__palco');
      secao.classList.remove('copia-faz-on');
    };
  }

  /* ---------- 2. As pessoas: carrossel de líderes ---------- */
  function montarPessoas() {
    var secao = document.getElementById('pessoas');
    if (!secao || secao.classList.contains('copia-pes-on')) return null;
    var lideres = secao.querySelector('.q3-lideres');
    if (!lideres) return null;
    var itens = filhos(lideres, 'q3-lider');
    if (!itens.length) return null;
    var vagas = secao.querySelector('.q3-vagas');

    var rotulo = lideres.getAttribute('aria-label') || 'Quem lidera';
    var raiz = criar('div', 'copiaPes');
    var carrossel = criar('div', 'copiaPes__carrossel', { role: 'group', 'aria-roledescription': 'carrossel', 'aria-label': rotulo });
    var janela = criar('div', 'copiaPes__janela');
    var aviso = criar('p', 'copiaPes__aviso', { 'aria-live': 'polite', 'aria-atomic': 'true' });
    lideres.parentNode.insertBefore(raiz, lideres);
    raiz.appendChild(carrossel);
    carrossel.appendChild(janela);
    janela.appendChild(lideres);
    lideres.removeAttribute('aria-label');   // o rótulo passa para o grupo do carrossel
    var idNovo = !lideres.id;
    if (idNovo) lideres.id = 'copia-pes-lideres';

    var max = Math.max(0, itens.length - LIDERES_VISIVEIS);
    var ant = null, prox = null;
    function seta(lado, texto, d) {
      var b = criar('button', 'copiaSeta copiaSeta--' + lado, { type: 'button', 'aria-label': texto, 'aria-controls': lideres.id });
      b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
      carrossel.appendChild(b);
      return b;
    }
    if (max > 0) {
      ant = seta('ant', 'Líderes anteriores', 'M15 18l-6-6 6-6');
      prox = seta('prox', 'Próximos líderes', 'M9 18l6-6-6-6');
      carrossel.appendChild(aviso);
    }
    if (vagas) raiz.appendChild(vagas);
    secao.classList.add('copia-pes-on');

    var atual = 0;
    function posicionar() {
      var x = itens[atual].offsetLeft - itens[0].offsetLeft;
      lideres.style.transform = x ? 'translateX(' + (-x) + 'px)' : '';
      janela.scrollLeft = 0;
    }
    function ir(i, anunciar) {
      atual = Math.max(0, Math.min(max, i));
      posicionar();
      if (ant) {
        ant.setAttribute('aria-disabled', atual === 0 ? 'true' : 'false');
        prox.setAttribute('aria-disabled', atual === max ? 'true' : 'false');
      }
      if (anunciar) {
        aviso.textContent = 'Líderes ' + (atual + 1) + ' a ' + Math.min(itens.length, atual + LIDERES_VISIVEIS) + ' de ' + itens.length;
      }
    }
    if (ant) {
      ant.addEventListener('click', function () { if (atual > 0) ir(atual - 1, true); });
      prox.addEventListener('click', function () { if (atual < max) ir(atual + 1, true); });
    }
    // teclado: o foco num líder fora da vista (link do LinkedIn) traz o carrossel até ele
    function aoFocar(e) {
      var item = e.target.closest ? e.target.closest('.q3-lider') : null;
      var k = itens.indexOf(item);
      if (k < 0) return;
      if (k < atual) ir(k, true);
      else if (k >= atual + LIDERES_VISIVEIS) ir(k - LIDERES_VISIVEIS + 1, true);
      else janela.scrollLeft = 0;
    }
    lideres.addEventListener('focusin', aoFocar);
    // a largura das colunas muda com a janela: recalcula o deslocamento sem animar
    function aoRedimensionar() {
      var t = lideres.style.transition;
      lideres.style.transition = 'none';
      posicionar();
      void lideres.offsetWidth;
      lideres.style.transition = t;
    }
    window.addEventListener('resize', aoRedimensionar);
    ir(0, false);

    return function desfazer() {
      window.removeEventListener('resize', aoRedimensionar);
      lideres.removeEventListener('focusin', aoFocar);
      lideres.style.removeProperty('transform');
      lideres.style.removeProperty('transition');
      lideres.setAttribute('aria-label', rotulo);
      if (idNovo) lideres.removeAttribute('id');
      raiz.parentNode.insertBefore(lideres, raiz);
      if (vagas) raiz.parentNode.insertBefore(vagas, raiz);
      raiz.parentNode.removeChild(raiz);
      secao.classList.remove('copia-pes-on');
    };
  }

  /* ---------- liga e desliga com a largura da tela ---------- */
  var desfazeres = [];
  function atualizar() {
    if (MQ.matches && !desfazeres.length) {
      [montarFaz, montarPessoas].forEach(function (montar) {
        var d = montar();
        if (d) desfazeres.push(d);
      });
    } else if (!MQ.matches && desfazeres.length) {
      desfazeres.forEach(function (d) { d(); });
      desfazeres = [];
    } else {
      return;
    }
    remedir();
  }

  function iniciar() {
    atualizar();
    if (MQ.addEventListener) MQ.addEventListener('change', atualizar);
    else if (MQ.addListener) MQ.addListener(atualizar);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
