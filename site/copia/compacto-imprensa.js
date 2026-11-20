/* Cópia genérica · Imprensa em formato compacto (19/11/2026)
   Com site/copia/compacto-imprensa.css. Só no desktop (≥ 992 px).
   "Todas as publicações" (section.im3-sec com .im3-lista): mostra os filtros e só os itens
   do ano mais recente (dentro do filtro escolhido) que cabem entre o menu e o pé da tela,
   no mínimo 3. Um botão secundário "Ver todas as matérias (N)" abre a lista inteira e
   leva o foco ao primeiro item que estava fora da vista; "Mostrar menos" volta.
   N é o total do filtro ativo; os filtros da página (.im3-f) continuam valendo e a conta
   é refeita a cada troca. Sem JS, ou abaixo de 992 px, a lista inteira continua.
   Depois de mudar o formato, avisa o copia/encaixe.js (evento resize) para remedir. */
(function () {
  'use strict';

  var lista = document.querySelector('.im3-lista');
  var secao = lista && lista.closest('section.im3-sec');
  if (!secao) return;
  var mq = window.matchMedia('(min-width: 992px)');
  var MIN = 3;
  var ROTULO = {
    'todos': 'Ver todas as matérias',
    'matéria': 'Ver todas as matérias',
    'entrevista': 'Ver todas as entrevistas',
    'podcast': 'Ver todos os podcasts',
    'evento': 'Ver todos os eventos',
    'artigo': 'Ver todos os artigos'
  };

  var anos = Array.prototype.slice.call(lista.querySelectorAll('.im3-ano'));
  var itens = Array.prototype.slice.call(lista.querySelectorAll('.im3-it'));
  var filtros = Array.prototype.slice.call(lista.querySelectorAll('.im3-f'));
  if (!anos.length || !itens.length) return;

  lista.id = lista.id || 'copia-im-lista';
  var caixa = document.createElement('div');
  caixa.className = 'copiaImMais';
  caixa.hidden = true;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'copiaImMais__btn';
  btn.setAttribute('aria-controls', lista.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="copiaImMais__t"></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  caixa.appendChild(btn);
  lista.appendChild(caixa);
  var rot = btn.querySelector('.copiaImMais__t');

  var aberta = false, extras = [];
  function visivel(el) { return !el.hasAttribute('hidden'); }
  function filtroAtivo() {
    var b = filtros.filter(function (f) { return f.getAttribute('aria-pressed') === 'true'; })[0];
    return b ? b.getAttribute('data-f') : 'todos';
  }
  function alturaMenu() {
    var n = document.querySelector('.MainNavSiteHome');
    return n ? Math.round(n.getBoundingClientRect().height) : 0;
  }
  var avisoT = null;
  function avisarEncaixe() {
    clearTimeout(avisoT);
    avisoT = setTimeout(function () {
      try { window.dispatchEvent(new Event('resize')); } catch (e) { /* navegador antigo */ }
    }, 30);
  }
  function marcar(el) { el.classList.add('copia-im-extra'); extras.push(el); }

  function ajustar(avisar) {
    extras.forEach(function (el) { el.classList.remove('copia-im-extra'); });
    extras = [];
    var total = itens.filter(visivel).length;
    if (!mq.matches || !total) {
      secao.classList.remove('copia-im-compacta', 'copia-im-aberta');
      caixa.hidden = true;
      if (avisar) avisarEncaixe();
      return;
    }
    caixa.hidden = false;
    if (aberta) {
      secao.classList.remove('copia-im-compacta');
      secao.classList.add('copia-im-aberta');
      btn.setAttribute('aria-expanded', 'true');
      rot.textContent = 'Mostrar menos';
      if (avisar) avisarEncaixe();
      return;
    }
    secao.classList.remove('copia-im-aberta');
    secao.classList.add('copia-im-compacta');
    btn.setAttribute('aria-expanded', 'false');
    rot.textContent = (ROTULO[filtroAtivo()] || ROTULO.todos) + ' (' + total + ')';

    // só o ano mais recente que tem itens no filtro
    var anosVis = anos.filter(visivel);
    anosVis.slice(1).forEach(marcar);
    var primeiros = anosVis.length ? Array.prototype.filter.call(anosVis[0].querySelectorAll('.im3-it'), visivel) : [];

    // mede sem a redução e sem o respiro que o encaixe pôs (ele refaz os dois logo depois)
    var wrap = secao.querySelector(':scope > .im3-wrap');
    if (wrap) wrap.style.removeProperty('zoom');
    secao.style.removeProperty('padding-top');
    secao.style.removeProperty('padding-bottom');
    var util = window.innerHeight - alturaMenu();
    var h = secao.getBoundingClientRect().height;
    var k = primeiros.length;
    while (k > MIN && h > util + 1) {
      k--;
      h -= primeiros[k].getBoundingClientRect().height;
      marcar(primeiros[k]);
    }
    if (k >= total) caixa.hidden = true;   // coube tudo: o botão sai
    if (avisar) avisarEncaixe();
  }

  btn.addEventListener('click', function () {
    if (!aberta) {
      // o primeiro item que estava fora da vista recebe o foco depois de abrir
      var alvo = null;
      for (var i = 0; i < extras.length && !alvo; i++) {
        var el = extras[i];
        alvo = el.classList.contains('im3-it') ? el : el.querySelector('.im3-it:not([hidden])');
      }
      aberta = true;
      ajustar(true);
      var link = alvo && alvo.querySelector('a');
      if (link) link.focus();
    } else {
      aberta = false;
      ajustar(true);
      btn.scrollIntoView({ block: 'center' });
      btn.focus({ preventScroll: true });
    }
  });
  // os filtros da página já trocaram os [hidden] quando este clique chega aqui
  filtros.forEach(function (f) { f.addEventListener('click', function () { ajustar(true); }); });

  function iniciar() {
    ajustar(true);
    var espera = null;
    window.addEventListener('resize', function () {
      clearTimeout(espera);
      espera = setTimeout(function () { ajustar(false); }, 100);   // antes do encaixe (150 ms)
    });
    window.addEventListener('load', function () { ajustar(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ajustar(true); });
    var mudou = function () { ajustar(true); };
    if (mq.addEventListener) mq.addEventListener('change', mudou);
    else if (mq.addListener) mq.addListener(mudou);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
