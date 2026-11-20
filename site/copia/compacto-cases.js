/* Cópia genérica · cases em formato compacto (19/11/2026)
   Conbral, Direcional e Fraiha, com site/copia/compacto-cases.css. Só no desktop (≥ 992 px).
   1. "Em resumo": os três cartões da história (Desafio, Solução, Resultado) viram abas de
      um palco, um passo por vez: clique, setas de vidro, ← → / Home / End nas abas e
      deslize no toque. Os rótulos das abas são as próprias pílulas dos cartões.
      Não troca sozinho. A ficha do cliente fica ao lado (só CSS).
   2. "Onde acontece" com mapa alto (Direcional): o mapa fica mais baixo e o viewBox é
      recortado em volta dos pinos, para nenhum pino sair da vista.
   Abaixo de 992 px tudo volta ao empilhamento original; sem JS nada muda.
   Depois de mudar o formato, avisa o copia/encaixe.js (evento resize) para remedir. */
(function () {
  'use strict';

  var mq = window.matchMedia('(min-width: 992px)');
  var raiz = document.querySelector('.mc2');
  if (!raiz) return;

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  var avisoT = null;
  function avisarEncaixe() {
    clearTimeout(avisoT);
    avisoT = setTimeout(function () {
      try { window.dispatchEvent(new Event('resize')); } catch (e) { /* navegador antigo */ }
    }, 30);
  }
  var SETA = {
    ant: 'M15 18l-6-6 6-6',
    prox: 'M9 18l6-6-6-6'
  };
  function seta(lado, rotulo, alvo) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'copiaSeta copiaSeta--' + lado;
    b.setAttribute('aria-label', rotulo);
    if (alvo) b.setAttribute('aria-controls', alvo);
    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + SETA[lado] + '"/></svg>';
    return b;
  }

  /* ---------- 1. Em resumo: história em abas ---------- */
  function montarResumo() {
    var secao = raiz.querySelector('#resumo');
    var w = secao && secao.querySelector(':scope > .w');
    var ol = w && w.querySelector(':scope > .historia');
    if (!ol) return null;
    var itens = Array.prototype.filter.call(ol.children, function (li) { return li.classList.contains('hist'); });
    if (itens.length < 2) return null;
    ol.id = ol.id || 'copia-hist';

    var nav = document.createElement('div');
    nav.className = 'copiaHist__nav';
    nav.hidden = true;
    var lista = document.createElement('div');
    lista.className = 'copiaHist__abas';
    lista.setAttribute('role', 'tablist');
    lista.setAttribute('aria-label', 'Etapas da história');
    var setas = document.createElement('div');
    setas.className = 'copiaHist__setas';
    var ant = seta('ant', 'Etapa anterior', ol.id);
    var prox = seta('prox', 'Próxima etapa', ol.id);
    setas.appendChild(ant);
    setas.appendChild(prox);

    var abas = itens.map(function (li, i) {
      li.id = li.id || 'copia-hist-' + (i + 1);
      var rotulo = txt(li.querySelector('.pilula')) || 'Etapa ' + (i + 1);
      var aba = document.createElement('button');
      aba.type = 'button';
      aba.className = 'copiaHist__aba';
      aba.id = 'copia-hist-aba-' + (i + 1);
      aba.setAttribute('role', 'tab');
      aba.setAttribute('aria-controls', li.id);
      aba.innerHTML = '<span class="copiaHist__num" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><span class="copiaHist__rot"></span>';
      aba.querySelector('.copiaHist__rot').textContent = rotulo;
      aba.addEventListener('click', function () { ir(i, false); });
      lista.appendChild(aba);
      return aba;
    });
    nav.appendChild(lista);
    nav.appendChild(setas);
    w.insertBefore(nav, ol);

    var atual = 0, ligado = false;
    function ir(i, foco) {
      atual = Math.max(0, Math.min(itens.length - 1, i));
      abas.forEach(function (a, k) {
        var sim = k === atual;
        a.setAttribute('aria-selected', sim ? 'true' : 'false');
        a.tabIndex = sim ? 0 : -1;
      });
      itens.forEach(function (li, k) { li.classList.toggle('is-ativo', k === atual); });
      ant.setAttribute('aria-disabled', atual === 0 ? 'true' : 'false');
      prox.setAttribute('aria-disabled', atual === itens.length - 1 ? 'true' : 'false');
      if (foco) abas[atual].focus();
    }
    ant.addEventListener('click', function () { if (atual > 0) ir(atual - 1, false); });
    prox.addEventListener('click', function () { if (atual < itens.length - 1) ir(atual + 1, false); });
    lista.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (atual + 1) % itens.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (atual - 1 + itens.length) % itens.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = itens.length - 1;
      if (n === null) return;
      e.preventDefault();
      ir(n, true);
    });
    // deslize no toque (o mouse continua só com cliques)
    var x0 = null, y0 = null;
    ol.addEventListener('pointerdown', function (e) {
      if (!ligado || e.pointerType === 'mouse') return;
      x0 = e.clientX; y0 = e.clientY;
    });
    ol.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = y0 = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      ir(atual + (dx < 0 ? 1 : -1), false);
    });
    ol.addEventListener('pointercancel', function () { x0 = y0 = null; });

    function ligar() {
      if (ligado) return;
      ligado = true;
      secao.classList.add('copia-resumo-on');
      ol.setAttribute('role', 'none');   // os itens viram painéis das abas
      itens.forEach(function (li, k) {
        li.setAttribute('role', 'tabpanel');
        li.setAttribute('aria-labelledby', abas[k].id);
        li.tabIndex = 0;
      });
      nav.hidden = false;
      ir(atual, false);
    }
    function desligar() {
      if (!ligado) return;
      ligado = false;
      secao.classList.remove('copia-resumo-on');
      ol.removeAttribute('role');
      itens.forEach(function (li) {
        li.removeAttribute('role');
        li.removeAttribute('aria-labelledby');
        li.removeAttribute('tabindex');
        li.classList.remove('is-ativo');
      });
      nav.hidden = true;
    }
    return { ligar: ligar, desligar: desligar };
  }

  /* ---------- 2. Onde acontece: mapa alto mais baixo ---------- */
  function montarMapa() {
    var secao = raiz.querySelector('#onde');
    var svg = secao && secao.querySelector('.mapa3 svg');
    if (!svg || !svg.viewBox || !svg.viewBox.baseVal) return null;
    var vb = svg.viewBox.baseVal;
    var orig = [vb.x, vb.y, vb.width, vb.height];
    if (!orig[2] || orig[3] / orig[2] < 0.85) return null;   // só mapa alto (Direcional 720 × 700)
    var origTxt = svg.getAttribute('viewBox');
    var pinos = svg.querySelectorAll('.pino');
    var ligado = false, caixa = null;

    function caixaPinos() {
      var y1 = Infinity, y2 = -Infinity;
      Array.prototype.forEach.call(pinos, function (g) {
        try {
          var b = g.getBBox();
          if (b.height) { y1 = Math.min(y1, b.y); y2 = Math.max(y2, b.y + b.height); }
        } catch (e) { /* ainda sem layout */ }
      });
      return y1 < y2 ? { y: y1, h: y2 - y1 } : null;
    }
    function recortar() {
      if (!ligado) return;
      svg.setAttribute('viewBox', origTxt);          // mede com o mapa inteiro
      var r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var visivel = orig[2] * r.height / r.width;    // unidades do mapa que cabem na altura
      if (visivel >= orig[3] - 1) return;            // coube inteiro
      caixa = caixa || caixaPinos();
      var folga = 18;
      var topo = caixa ? caixa.y - folga : orig[1];
      var base = caixa ? caixa.y + caixa.h + folga : orig[1] + orig[3];
      var lim0 = orig[1], lim1 = orig[1] + orig[3];
      var y, h;
      if (base - topo > visivel) {
        // os pinos não cabem no recorte: mostra a faixa inteira deles (sobra margem nas laterais)
        h = Math.min(base - topo, orig[3]);
        y = Math.max(lim0, Math.min(topo, lim1 - h));
      } else {
        h = visivel;
        y = Math.max(lim0, Math.min((topo + base) / 2 - h / 2, lim1 - h));
      }
      svg.setAttribute('viewBox', orig[0] + ' ' + y.toFixed(1) + ' ' + orig[2] + ' ' + h.toFixed(1));
    }
    function ligar() {
      if (ligado) return;
      ligado = true;
      secao.classList.add('copia-onde-on');
      recortar();
    }
    function desligar() {
      if (!ligado) return;
      ligado = false;
      secao.classList.remove('copia-onde-on');
      svg.setAttribute('viewBox', origTxt);
    }
    return { ligar: ligar, desligar: desligar, medir: recortar };
  }

  var partes = [];
  function iniciar() {
    var a = montarResumo(); if (a) partes.push(a);
    var b = montarMapa(); if (b) partes.push(b);
    if (!partes.length) return;
    aplicar();
    var espera = null;
    window.addEventListener('resize', function () {
      clearTimeout(espera);
      espera = setTimeout(function () { partes.forEach(function (p) { if (p.medir) p.medir(); }); }, 100);
    });
    window.addEventListener('load', function () { partes.forEach(function (p) { if (p.medir) p.medir(); }); });
    if (mq.addEventListener) mq.addEventListener('change', aplicar);
    else if (mq.addListener) mq.addListener(aplicar);
  }
  function aplicar() {
    partes.forEach(function (p) { if (mq.matches) p.ligar(); else p.desligar(); });
    avisarEncaixe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
