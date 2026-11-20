/* Página do Morada OS · seções compactas (19/11/2026)
   Duas seções passavam da altura da tela no desktop. Aqui elas mudam só de formato,
   sem perder conteúdo (o estilo fica no <style id="morada-os-css">, seções 7 e 8):
   1. Conectores: os quatro grupos da tela viram abas dentro da própria tela, um grupo
      por vez (Mercado imobiliário, Produtividade, Marketing, CRM, com os rótulos do
      HTML). No cartão claro ao lado fica à vista só o texto do grupo ativo; os outros
      continuam no HTML para leitores de tela. Abas com clique e setas (← → ↑ ↓, Home, End).
   2. FAQ: as 4 primeiras perguntas à vista e um botão "Ver todas as perguntas (9)" que
      mostra o resto (e volta a recolher).
   Sem JS, a tela mostra os quatro grupos e o FAQ as nove perguntas, como antes. */
(function () {
  'use strict';

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  // o copia/encaixe.js mede as seções no resize: avisa quando a altura muda
  function remedir() { window.dispatchEvent(new Event('resize')); }

  function conectores() {
    var tela = document.querySelector('.homeV2 #conectores .mos-con');
    if (!tela || tela.classList.contains('os-con-abas')) return false;
    var rotulos = Array.prototype.filter.call(tela.children, function (p) {
      var ul = p.nextElementSibling;
      return p.classList.contains('mos-con__grupo') && ul && ul.classList.contains('mos-con__grade');
    });
    if (rotulos.length < 2) return false;
    var mia = document.querySelector('.homeV2 #conectores .i3-mia');
    var subs = mia ? Array.prototype.slice.call(mia.querySelectorAll('.i3-sub')) : [];

    var lista = document.createElement('div');
    lista.className = 'os-con__abas';
    lista.setAttribute('role', 'tablist');
    lista.setAttribute('aria-label', 'Grupos de conectores');
    var paineis = document.createElement('div');
    paineis.className = 'os-con__paineis';

    var grupos = rotulos.map(function (p, i) {
      var partes = txt(p).split('·');
      var nome = partes[0].trim();
      var num = (partes[1] || '').trim();
      var ul = p.nextElementSibling;
      ul.id = ul.id || 'os-con-grupo-' + (i + 1);

      var aba = document.createElement('button');
      aba.type = 'button';
      aba.className = 'os-con__aba';
      aba.id = 'os-con-aba-' + (i + 1);
      aba.setAttribute('role', 'tab');
      aba.setAttribute('aria-controls', ul.id);
      aba.innerHTML = '<span class="os-con__nome"></span>' +
        (num ? '<span class="os-con__num" aria-hidden="true"></span><span class="h3-sr"></span>' : '');
      aba.querySelector('.os-con__nome').textContent = nome;
      if (num) {
        aba.querySelector('.os-con__num').textContent = num;
        aba.querySelector('.h3-sr').textContent = ' · ' + num + (num === '1' ? ' conector' : ' conectores');
      }
      aba.addEventListener('click', function () { ir(i); });
      lista.appendChild(aba);

      ul.setAttribute('role', 'tabpanel');
      ul.setAttribute('aria-labelledby', aba.id);
      ul.setAttribute('tabindex', '0');
      paineis.appendChild(ul);

      // o texto do mesmo grupo no cartão claro (subtítulo + parágrafo seguinte)
      var par = [];
      subs.forEach(function (s) {
        if (txt(s).toLowerCase() !== nome.toLowerCase()) return;
        par.push(s);
        var d = s.nextElementSibling;
        if (d && d.classList.contains('i3-p')) par.push(d);
      });
      return { aba: aba, ul: ul, par: par };
    });

    tela.insertBefore(lista, rotulos[0]);
    tela.insertBefore(paineis, rotulos[0]);
    // a tela deixa de ser uma imagem (role="img" esconderia as abas dos leitores de tela);
    // continua uma figura com o mesmo nome
    tela.removeAttribute('role');
    tela.classList.add('os-con-abas');

    var atual = -1;
    function ir(i) {
      i = (i + grupos.length) % grupos.length;
      if (i === atual) return;
      atual = i;
      grupos.forEach(function (g, k) {
        var on = k === i;
        g.aba.setAttribute('aria-selected', on ? 'true' : 'false');
        g.aba.setAttribute('tabindex', on ? '0' : '-1');
        g.ul.classList.toggle('is-oculto', !on);
        g.par.forEach(function (el) { el.classList.toggle('os-con__fora', !on); });
      });
    }
    lista.addEventListener('keydown', function (e) {
      var alvo = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') alvo = atual + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') alvo = atual - 1;
      else if (e.key === 'Home') alvo = 0;
      else if (e.key === 'End') alvo = grupos.length - 1;
      if (alvo === null) return;
      e.preventDefault();
      ir(alvo);
      grupos[atual].aba.focus();
    });
    ir(0);
    return true;
  }

  function faq() {
    var VISIVEIS = 4;
    var lista = document.querySelector('.homeV2 #faq .os-faq');
    if (!lista || lista.classList.contains('os-faq--compacta')) return false;
    var itens = Array.prototype.filter.call(lista.children, function (el) { return el.classList.contains('os-faq__item'); });
    if (itens.length <= VISIVEIS) return false;
    lista.id = lista.id || 'os-faq-lista';
    lista.classList.add('os-faq--compacta');

    var caixa = document.createElement('p');
    caixa.className = 'os-faq__mais';
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'os-faq__btn';
    botao.setAttribute('aria-controls', lista.id);
    botao.innerHTML = '<span></span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"></path></svg>';
    var rotulo = botao.firstChild;
    caixa.appendChild(botao);
    lista.parentNode.insertBefore(caixa, lista.nextSibling);

    function aplicar(aberto) {
      lista.classList.toggle('is-compacto', !aberto);
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      rotulo.textContent = aberto ? 'Ver menos perguntas' : 'Ver todas as perguntas (' + itens.length + ')';
    }
    botao.addEventListener('click', function () {
      var abrir = botao.getAttribute('aria-expanded') !== 'true';
      aplicar(abrir);
      if (abrir) {
        // o foco vai para a primeira pergunta que apareceu
        var q = itens[VISIVEIS].querySelector('summary');
        if (q) q.focus({ preventScroll: true });
      } else {
        // ao recolher, o botão sobe: mantém ele à vista
        var r = botao.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) botao.scrollIntoView({ block: 'center' });
      }
      remedir();
    });
    aplicar(false);
    return true;
  }

  function iniciar() {
    var mudou = conectores();
    mudou = faq() || mudou;
    if (mudou) remedir();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
