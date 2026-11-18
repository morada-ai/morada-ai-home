/* Cópia genérica · Diferenciação como "antes e depois" interativo (18/11/2026)
   Um seletor [Outras soluções | Com a Morada.ai] troca as 4 linhas: cada problema dá
   lugar à resposta da Morada, em cascata. A virada acontece sozinha uma vez quando a
   seção entra na tela; depois o controle é de quem lê. O texto vem das duas listas do
   próprio HTML (pareadas pela ordem). Sem JS, a versão original continua visível.
   Menos movimento: começa direto em "Com a Morada", sem cascata e sem virada automática. */
(function () {
  'use strict';

  function iniciar() {
    var secao = document.querySelector('.homeV2 #diferenciacaoV2');
    if (!secao || secao.classList.contains('copia-comp-on')) return;
    var vs = secao.querySelector('.d3-vs');
    var eles = Array.prototype.map.call(secao.querySelectorAll('.d3-eles li'), function (li) { return li.textContent.trim(); });
    var nos = Array.prototype.map.call(secao.querySelectorAll('.d3-nos li'), function (li) { return li.textContent.trim(); });
    var n = Math.min(eles.length, nos.length);
    if (!vs || n < 2) return;

    var menosMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var logo = secao.querySelector('.d3-nos .d3-rot img');
    var cta = secao.querySelector('.d3-nos .d3-cta a');
    var icX = '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
    var icV = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var comp = document.createElement('div');
    comp.className = 'copiaComp';
    comp.setAttribute('data-estado', 'eles');

    // seletor
    var seletor = document.createElement('div');
    seletor.className = 'copiaComp__seletor';
    seletor.setAttribute('role', 'radiogroup');
    seletor.setAttribute('aria-label', 'Comparar');
    seletor.innerHTML = '<span class="copiaComp__polegar" aria-hidden="true"></span>';
    var opcoes = [
      { valor: 'eles', rotulo: 'Outras soluções' },
      { valor: 'nos', rotulo: logo ? 'Com a Morada.ai' : 'Com a Morada' }
    ].map(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'copiaComp__opcao';
      b.setAttribute('role', 'radio');
      b.setAttribute('data-valor', o.valor);
      b.textContent = o.rotulo;
      b.addEventListener('click', function () { definir(o.valor, true); });
      seletor.appendChild(b);
      return b;
    });
    seletor.addEventListener('keydown', function (e) {
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      e.preventDefault();
      definir(estado === 'eles' ? 'nos' : 'eles', true);
      opcoes[estado === 'eles' ? 0 : 1].focus();
    });

    // painel com as linhas
    var painel = document.createElement('div');
    painel.className = 'copiaComp__painel';
    painel.setAttribute('aria-live', 'polite');
    var cab = document.createElement('div');
    cab.className = 'copiaComp__cab';
    cab.innerHTML = '<span class="copiaComp__cabEles">Outras soluções</span>' +
      (logo ? '<img class="copiaComp__cabNos" src="' + logo.getAttribute('src') + '" alt="' + (logo.getAttribute('alt') || 'Com a Morada.ai') + '" width="127" height="23">' : '<span class="copiaComp__cabNos">Com a Morada.ai</span>');
    painel.appendChild(cab);
    var lista = document.createElement('ol');
    lista.className = 'copiaComp__linhas';
    for (var i = 0; i < n; i++) {
      var li = document.createElement('li');
      li.className = 'copiaComp__linha';
      li.style.setProperty('--i', i);
      li.innerHTML =
        '<span class="copiaComp__num" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="copiaComp__icone" aria-hidden="true"><span class="copiaComp__x">' + icX + '</span><span class="copiaComp__v">' + icV + '</span></span>' +
        '<span class="copiaComp__texto"><span class="copiaComp__eles">' + eles[i] + '</span><span class="copiaComp__nos">' + nos[i] + '</span></span>';
      lista.appendChild(li);
    }
    painel.appendChild(lista);

    // pé: botão (o mesmo do HTML)
    var pe = document.createElement('div');
    pe.className = 'copiaComp__pe';
    if (cta) pe.appendChild(cta.cloneNode(true));

    comp.appendChild(seletor);
    comp.appendChild(painel);
    comp.appendChild(pe);
    vs.parentNode.insertBefore(comp, vs.nextSibling);
    secao.classList.add('copia-comp-on');

    var estado = 'eles';
    var mexeu = false;
    function definir(valor, peloUsuario) {
      if (peloUsuario) mexeu = true;
      estado = valor;
      comp.setAttribute('data-estado', valor);
      opcoes.forEach(function (b) {
        var on = b.getAttribute('data-valor') === valor;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.setAttribute('tabindex', on ? '0' : '-1');
      });
      Array.prototype.forEach.call(lista.querySelectorAll('.copiaComp__eles'), function (s) { s.setAttribute('aria-hidden', valor === 'eles' ? 'false' : 'true'); });
      Array.prototype.forEach.call(lista.querySelectorAll('.copiaComp__nos'), function (s) { s.setAttribute('aria-hidden', valor === 'nos' ? 'false' : 'true'); });
    }

    if (menosMovimento) {
      comp.classList.add('is-sem-movimento');
      definir('nos', false);
    } else {
      definir('eles', false);
      // a virada acontece sozinha uma vez, quando o painel aparece
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return;
          io.disconnect();
          setTimeout(function () { if (!mexeu) definir('nos', false); }, 1000);
        }, { threshold: 0.5 });
        io.observe(painel);
      } else {
        definir('nos', false);
      }
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
