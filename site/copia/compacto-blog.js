/* Cópia genérica · blog em formato compacto (19/11/2026)
   Com site/copia/compacto-blog.css. Só no desktop (≥ 992 px).
   Cada trilha (section.mt-sec) vira um carrossel de uma linha, 3 cartões por vez:
   - setas de vidro no cabeçalho (ao lado de "N artigos"), que andam uma página (3);
   - deslize no toque e rolagem lateral do trackpad (rolagem nativa com encaixe);
   - teclado: Tab chega a cada cartão (o trilho rola até ele) e o trilho tem foco próprio
     para ← →; um aviso discreto para leitor de tela diz quais artigos estão à vista.
   O "Ver mais" da página continua: aberta, a trilha volta à grade inteira. A busca continua
   filtrando: o carrossel mostra só os cartões que ficaram. Sem JS nada muda.
   Depois de mudar o formato, avisa o copia/encaixe.js (evento resize) para remedir. */
(function () {
  'use strict';

  var raiz = document.querySelector('.mt-trilhas');
  if (!raiz) return;
  var mq = window.matchMedia('(min-width: 992px)');
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  var avisoT = null;
  function avisarEncaixe() {
    clearTimeout(avisoT);
    avisoT = setTimeout(function () {
      try { window.dispatchEvent(new Event('resize')); } catch (e) { /* navegador antigo */ }
    }, 30);
  }
  var SETA = { ant: 'M15 18l-6-6 6-6', prox: 'M9 18l6-6-6-6' };
  function seta(lado, rotulo, alvo) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'copiaSeta copiaSeta--' + lado;
    b.setAttribute('aria-label', rotulo);
    b.setAttribute('aria-controls', alvo);
    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + SETA[lado] + '"/></svg>';
    return b;
  }

  function montar(sec, n) {
    var grade = sec.querySelector('.mt-grid');
    var cab = sec.querySelector('.mt-head');
    if (!grade || !cab) return null;
    grade.id = grade.id || 'copia-trilho-' + (n + 1);
    var titulo = txt(sec.querySelector('.mt-h2')) || 'Artigos';

    var nav = document.createElement('div');
    nav.className = 'copiaTrilho__nav';
    nav.hidden = true;
    var ant = seta('ant', 'Artigos anteriores de ' + titulo, grade.id);
    var prox = seta('prox', 'Próximos artigos de ' + titulo, grade.id);
    nav.appendChild(ant);
    nav.appendChild(prox);
    cab.appendChild(nav);
    var aviso = document.createElement('p');
    aviso.className = 'copiaTrilho__sr';
    aviso.setAttribute('aria-live', 'polite');
    sec.querySelector('.mt-wrap').appendChild(aviso);

    var ligado = false, quadro = null, falarT = null;
    function visiveis() {
      return Array.prototype.filter.call(grade.children, function (c) {
        return c.classList.contains('mt-card') && c.getClientRects().length > 0;
      });
    }
    function passo(vis) {
      return vis.length > 1 ? vis[1].offsetLeft - vis[0].offsetLeft : grade.clientWidth;
    }
    function carrossel() { return ligado && !sec.classList.contains('is-open'); }
    function atualizar() {
      quadro = null;
      if (!carrossel()) { nav.hidden = true; return; }
      var temMais = grade.scrollWidth > grade.clientWidth + 2;
      nav.hidden = !temMais;
      ant.setAttribute('aria-disabled', grade.scrollLeft <= 2 ? 'true' : 'false');
      prox.setAttribute('aria-disabled', grade.scrollLeft + grade.clientWidth >= grade.scrollWidth - 2 ? 'true' : 'false');
    }
    function falar() {
      var vis = visiveis();
      if (!vis.length) return;
      var p = passo(vis) || 1;
      var cabem = Math.max(1, Math.round((grade.clientWidth + 24) / p));
      var de = Math.min(vis.length - 1, Math.round(grade.scrollLeft / p));
      var ate = Math.min(vis.length, de + cabem);
      aviso.textContent = titulo + ': artigos ' + (de + 1) + ' a ' + ate + ' de ' + vis.length + '.';
    }
    function andar(dir) {
      if (!carrossel()) return;
      var vis = visiveis();
      var p = passo(vis);
      var cabem = Math.max(1, Math.round((grade.clientWidth + 24) / (p || grade.clientWidth)));
      grade.scrollBy({ left: dir * p * cabem, behavior: reduz.matches ? 'auto' : 'smooth' });
      clearTimeout(falarT);
      falarT = setTimeout(falar, reduz.matches ? 50 : 500);
    }
    ant.addEventListener('click', function () { if (ant.getAttribute('aria-disabled') !== 'true') andar(-1); });
    prox.addEventListener('click', function () { if (prox.getAttribute('aria-disabled') !== 'true') andar(1); });
    grade.addEventListener('scroll', function () {
      if (!quadro) quadro = window.requestAnimationFrame(atualizar);
    }, { passive: true });

    // "Ver mais" / "Ver menos": a página troca a classe is-open; aqui só reposiciona o trilho
    var toggle = sec.querySelector('.mt-toggle');
    if (toggle) toggle.addEventListener('click', function () {
      grade.scrollLeft = 0;
      ajustarAria();
      atualizar();
    });

    function ajustarAria() {
      if (carrossel()) {
        grade.setAttribute('role', 'region');
        grade.setAttribute('aria-roledescription', 'carrossel');
        grade.setAttribute('aria-label', 'Artigos de ' + titulo);
        grade.tabIndex = 0;
      } else {
        grade.removeAttribute('role');
        grade.removeAttribute('aria-roledescription');
        grade.removeAttribute('aria-label');
        grade.removeAttribute('tabindex');
      }
    }
    function ligar() {
      if (ligado) return;
      ligado = true;
      sec.classList.add('copia-trilho');
      ajustarAria();
      grade.scrollLeft = 0;
      atualizar();
    }
    function desligar() {
      if (!ligado) return;
      ligado = false;
      sec.classList.remove('copia-trilho');
      ajustarAria();
      nav.hidden = true;
      aviso.textContent = '';
    }
    function reiniciar() { grade.scrollLeft = 0; atualizar(); }
    return { ligar: ligar, desligar: desligar, atualizar: atualizar, reiniciar: reiniciar };
  }

  var trilhas = [];
  function aplicar() {
    trilhas.forEach(function (t) { if (mq.matches) t.ligar(); else t.desligar(); });
    avisarEncaixe();
  }
  function iniciar() {
    Array.prototype.forEach.call(raiz.querySelectorAll('section.mt-sec'), function (sec, n) {
      var t = montar(sec, n);
      if (t) trilhas.push(t);
    });
    if (!trilhas.length) return;
    aplicar();
    var espera = null;
    window.addEventListener('resize', function () {
      clearTimeout(espera);
      espera = setTimeout(function () { trilhas.forEach(function (t) { t.atualizar(); }); }, 100);
    });
    window.addEventListener('load', function () { trilhas.forEach(function (t) { t.atualizar(); }); });
    if (mq.addEventListener) mq.addEventListener('change', aplicar);
    else if (mq.addListener) mq.addListener(aplicar);
    // busca da página: quando os cartões filtrados mudam, o trilho volta ao começo
    if (window.MutationObserver) {
      var pend = null;
      var marca = function (classes, nome) { return (' ' + (classes || '') + ' ').indexOf(' ' + nome + ' ') !== -1; };
      new MutationObserver(function (lista) {
        // só o que a busca mexe: is-busca na raiz, is-off nos cartões, is-vazia nas trilhas
        var mudou = lista.some(function (m) {
          var agora = m.target.getAttribute('class');
          return ['is-busca', 'is-off', 'is-vazia'].some(function (c) { return marca(m.oldValue, c) !== marca(agora, c); });
        });
        if (!mudou || pend) return;
        pend = window.requestAnimationFrame(function () {
          pend = null;
          trilhas.forEach(function (t) { t.reiniciar(); });
        });
      }).observe(raiz, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
