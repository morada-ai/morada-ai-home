/* Cópia genérica · Credibilidade como explorador (18/11/2026)
   Os 5 destaques (Meta, 100 Open Startups, Investimento, Cubo Itaú, Valor) viram abas
   numa lista vertical; o palco mostra um por vez, reaproveitando os próprios cartões.
   A imprensa fica numa faixa de uma linha embaixo. Abas com clique e setas (vertical:
   ↑ ↓, Home, End). Não troca sozinho. Sem JS, o mosaico original continua. */
(function () {
  'use strict';

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  function iniciar() {
    var secao = document.querySelector('.homeV2 #credibilidadeV2');
    if (!secao || secao.classList.contains('copia-cred-on')) return;
    var bento = secao.querySelector('.cr3-bento');
    if (!bento) return;
    var itens = Array.prototype.filter.call(bento.children, function (el) {
      return el.classList.contains('cr3-b') && !el.classList.contains('cr3-premios') && !el.classList.contains('cr3-imp');
    });
    if (itens.length < 2) return;
    var imprensa = bento.querySelector('.cr3-imp');

    var raiz = document.createElement('div');
    raiz.className = 'copiaCred';
    var lista = document.createElement('div');
    lista.className = 'copiaCred__lista';
    lista.setAttribute('role', 'tablist');
    lista.setAttribute('aria-orientation', 'vertical');
    lista.setAttribute('aria-label', 'Destaques de credibilidade');
    var palco = document.createElement('div');
    palco.className = 'copiaCred__palco';

    var abas = itens.map(function (el, i) {
      var img = el.querySelector('img');
      var titulo = txt(el.querySelector('.cr3-tag')) || (img ? img.getAttribute('alt') : '') || 'Destaque';
      var sub = txt(el.querySelector('figcaption strong')) || txt(el.querySelector('.cr3-h3')) || txt(el.querySelector('.cr3-num')) || txt(el.querySelector('blockquote'));
      var aba = document.createElement('button');
      aba.type = 'button';
      aba.className = 'copiaCred__aba';
      aba.id = 'copia-cred-aba-' + (i + 1);
      aba.setAttribute('role', 'tab');
      el.id = el.id || 'copia-cred-' + (i + 1);
      aba.setAttribute('aria-controls', el.id);
      aba.innerHTML = '<span class="copiaCred__num" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="copiaCred__txt"><span class="copiaCred__titulo"></span><span class="copiaCred__sub"></span></span>';
      aba.querySelector('.copiaCred__titulo').textContent = titulo;
      aba.querySelector('.copiaCred__sub').textContent = sub;
      aba.addEventListener('click', function () { ir(i, true); });
      lista.appendChild(aba);

      el.classList.add('copiaCred__painel');
      el.setAttribute('role', 'tabpanel');
      el.setAttribute('aria-labelledby', aba.id);
      palco.appendChild(el);   // o próprio cartão vira o painel
      return aba;
    });

    raiz.appendChild(lista);
    raiz.appendChild(palco);
    bento.parentNode.insertBefore(raiz, bento);
    if (imprensa) {
      imprensa.classList.add('copiaCred__imprensa');
      raiz.parentNode.insertBefore(imprensa, raiz.nextSibling);
    }
    secao.classList.add('copia-cred-on');

    var atual = -1;
    function ir(i, peloUsuario) {
      i = (i + itens.length) % itens.length;
      if (i === atual) return;
      atual = i;
      abas.forEach(function (a, k) {
        var on = k === i;
        a.setAttribute('aria-selected', on ? 'true' : 'false');
        a.setAttribute('tabindex', on ? '0' : '-1');
      });
      itens.forEach(function (el, k) {
        var on = k === i;
        el.classList.toggle('is-ativo', on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
        Array.prototype.forEach.call(el.querySelectorAll('a'), function (a) { a.setAttribute('tabindex', on ? '0' : '-1'); });
      });
      if (peloUsuario) abas[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    lista.addEventListener('keydown', function (e) {
      var alvo = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') alvo = atual + 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') alvo = atual - 1;
      else if (e.key === 'Home') alvo = 0;
      else if (e.key === 'End') alvo = itens.length - 1;
      if (alvo === null) return;
      e.preventDefault();
      ir(alvo, true);
      abas[atual].focus();
    });
    ir(0, false);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
