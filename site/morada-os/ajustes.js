/* Página do Morada OS · rótulos dos componentes da home (19/11/2026)
   O carrossel (copia/carrossel.js) e o antes e depois (copia/comparativo.js) são os
   mesmos da home e trazem rótulos fixos de lá ("O que a Morada resolve", "Outras
   soluções", "Com a Morada.ai"). Este arquivo roda depois deles e troca só esses
   rótulos pelos desta página. Nada de layout muda. */
(function () {
  'use strict';

  function trocar(el, texto) { if (el) el.textContent = texto; }

  function iniciar() {
    // carrossel de foco: nome da região para leitores de tela
    var trilho = document.querySelector('.homeV2 #funcoesV2 .f3-bento.copia-foco');
    if (trilho) trilho.setAttribute('aria-label', 'Habilidades');

    // antes e depois: "ChatGPT pessoal" x "Com o Morada OS"
    var comp = document.querySelector('.homeV2 #diferenciacaoV2 .copiaComp');
    if (comp) {
      trocar(comp.querySelector('.copiaComp__opcao[data-valor="eles"]'), 'ChatGPT pessoal');
      trocar(comp.querySelector('.copiaComp__opcao[data-valor="nos"]'), 'Com o Morada OS');
      trocar(comp.querySelector('.copiaComp__cabEles'), 'ChatGPT pessoal');
      var logo = comp.querySelector('img.copiaComp__cabNos');
      if (logo) logo.setAttribute('alt', 'Com o Morada OS');
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
