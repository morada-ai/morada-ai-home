/* Cópia genérica · Morada Relacionamento em formato compacto (19/11/2026)
   Com site/copia/compacto-relacionamento.css. Só no desktop (≥ 992 px): abaixo disso
   (ou quando a janela estreita) tudo volta ao HTML original. Sem JS, tudo aparece.
   1. "Integração e Morada OS" (.mr3-erp): os dois blocos (cartão royal e telas do
      Morada OS) viram duas abas, um por vez. Abas com clique e setas (← →, Home, End).
   2. FAQ (.mr-faq): ficam as 4 primeiras perguntas; um botão "Ver todas as perguntas (N)"
      mostra (e volta a esconder) as outras. Aberta, a seção cresce.
   Depois de cada mudança de altura o encaixe por tela (copia/encaixe.js) mede de novo. */
(function () {
  'use strict';

  var MQ = window.matchMedia('(min-width: 992px)');
  var VISIVEIS_FAQ = 4;

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function criar(tag, classe, attrs) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  // pede ao copia/encaixe.js (e ao Lenis) para medir a página de novo
  function remedir() {
    var ev;
    try { ev = new Event('resize'); } catch (e) { ev = document.createEvent('Event'); ev.initEvent('resize', true, false); }
    window.dispatchEvent(ev);
  }

  /* abas genéricas (padrão WAI-ARIA, ativação automática) */
  function ligarAbas(lista, abas, paineis) {
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
      if (e.key === 'ArrowRight') alvo = atual + 1;
      else if (e.key === 'ArrowLeft') alvo = atual - 1;
      else if (e.key === 'Home') alvo = 0;
      else if (e.key === 'End') alvo = abas.length - 1;
      if (alvo === null) return;
      e.preventDefault();
      ir(alvo, true);
    });
    ir(0, false);
  }

  /* ---------- 1. Integração e Morada OS: duas abas ---------- */
  function montarErp() {
    var secao = document.querySelector('.mr-landing .mr3-erp');
    if (!secao || secao.classList.contains('copia-erp-on')) return null;
    var royal = secao.querySelector(':scope > .mr3-erp__g');
    var telas = secao.querySelector(':scope > .mr3-os-telas');
    if (!royal || !telas) return null;
    var blocos = [royal, telas];
    var rotulos = ['Integração com o ERP', 'Telas do Morada OS'];

    // o invólucro também é .mr3-wrap: é ele que o encaixe reduz, se ainda precisar
    var raiz = criar('div', 'mr3-wrap copiaErp');
    var lista = criar('div', 'copiaAbas', {
      role: 'tablist',
      'aria-label': txt(royal.querySelector('.mr3-kick')) || 'Integração e Morada OS'
    });
    var palco = criar('div', 'copiaErp__palco');
    secao.insertBefore(raiz, royal);
    raiz.appendChild(lista);
    raiz.appendChild(palco);

    var abas = [], paineis = [];
    blocos.forEach(function (bloco, i) {
      var n = i + 1;
      var aba = criar('button', 'copiaAbas__aba', {
        type: 'button', role: 'tab', id: 'copia-erp-aba-' + n, 'aria-controls': 'copia-erp-painel-' + n
      });
      aba.innerHTML = '<span class="copiaAbas__num" aria-hidden="true">0' + n + '</span><span class="copiaAbas__titulo"></span>';
      aba.querySelector('.copiaAbas__titulo').textContent = rotulos[i];
      lista.appendChild(aba);
      var painel = criar('div', 'copiaErp__painel', {
        id: 'copia-erp-painel-' + n, role: 'tabpanel', 'aria-labelledby': aba.id, tabindex: '0'
      });
      painel.appendChild(bloco);
      palco.appendChild(painel);
      abas.push(aba);
      paineis.push(painel);
    });
    secao.classList.add('copia-erp-on');
    ligarAbas(lista, abas, paineis);

    return function desfazer() {
      blocos.forEach(function (bloco) { secao.insertBefore(bloco, raiz); });
      raiz.parentNode.removeChild(raiz);
      secao.classList.remove('copia-erp-on');
    };
  }

  /* ---------- 2. FAQ: 4 perguntas + "Ver todas" ---------- */
  function montarFaq() {
    var secao = document.querySelector('.mr-landing .mr-faq');
    if (!secao || secao.classList.contains('copia-faq-on')) return null;
    var lista = secao.querySelector('.mr-faq__list');
    if (!lista) return null;
    var itens = Array.prototype.filter.call(lista.children, function (el) { return el.classList.contains('mr-faq__item'); });
    if (itens.length <= VISIVEIS_FAQ) return null;
    var extras = itens.slice(VISIVEIS_FAQ);
    var idNovo = !lista.id;
    if (idNovo) lista.id = 'copia-faq-lista';

    var rotuloFechado = 'Ver todas as perguntas (' + itens.length + ')';
    var botao = criar('button', 'copiaFaqMais', { type: 'button', 'aria-expanded': 'false', 'aria-controls': lista.id });
    botao.innerHTML = '<span class="copiaFaqMais__txt"></span>' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>';
    var rotulo = botao.querySelector('.copiaFaqMais__txt');
    lista.appendChild(botao);

    var aberto = false;
    function aplicar() {
      extras.forEach(function (el) { el.hidden = !aberto; });
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      rotulo.textContent = aberto ? 'Ver menos perguntas' : rotuloFechado;
      secao.classList.toggle('copia-faq-todas', aberto);
    }
    botao.addEventListener('click', function () {
      aberto = !aberto;
      aplicar();
      remedir();
      // ao fechar, o botão sobe junto com a lista: traz de volta para a tela se sumiu
      if (!aberto) {
        var r = botao.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) {
          var y = window.scrollY + r.top - window.innerHeight / 2;
          if (window.copiaLenis) window.copiaLenis.scrollTo(y, { immediate: true });
          else window.scrollTo(0, y);
        }
      }
    });
    secao.classList.add('copia-faq-on');
    aplicar();

    return function desfazer() {
      extras.forEach(function (el) { el.hidden = false; });
      if (botao.parentNode) botao.parentNode.removeChild(botao);
      if (idNovo) lista.removeAttribute('id');
      secao.classList.remove('copia-faq-on', 'copia-faq-todas');
    };
  }

  /* ---------- liga e desliga com a largura da tela ---------- */
  var desfazeres = [];
  function atualizar() {
    if (MQ.matches && !desfazeres.length) {
      [montarErp, montarFaq].forEach(function (montar) {
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
