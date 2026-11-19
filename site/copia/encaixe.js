/* Cópia genérica · encaixe por tela (18/11/2026)
   No desktop, cada seção cabe inteira entre o menu fixo e o fim da tela, e a rolagem
   assenta suave no começo de uma seção quando para perto dele. Rolagem livre no resto.
   1. Mede cada seção contra a altura útil (tela − menu).
   2. Se passar: encolhe a peça elástica da seção (cartão do carrossel, vídeo, linhas da
      comparação, palco da Credibilidade, visor dos cases, sobreposição do formulário).
   3. Se ainda passar: a seção fica mais alta que a tela. (Até 19/11/2026 ela era reduzida
      por igual com zoom, mas isso tirava os cartões das colunas do grid; desligado.)
   4. Se sobrar: centraliza o conteúdo, e a seção fica exatamente uma tela.
   Assentamento: quando a rolagem para perto do começo de uma seção (à frente, no sentido
   em que a pessoa rolava), a página desliza até ele; no meio da seção, nada acontece.
   Assentamento: pelo Lenis do tema (window.copiaLenis) ou, sem ele, pelo scroll-snap do CSS.
   Celular e telas baixas (< 600 px): nada muda. */
(function () {
  'use strict';
  var MQ = '(min-width: 992px) and (min-height: 600px)';
  // zoom só como último recurso em telas baixas (< 820 px de altura), no mínimo 82%;
  // de 820 px para cima não há zoom e o grid de 12 colunas vale exato em todas as seções
  function zoomMin() { return window.innerHeight < 760 ? 0.78 : window.innerHeight < 820 ? 0.82 : 1; }
  var PROXIMIDADE = 0.35;     // à frente (no sentido da rolagem): assenta se o começo da seção estiver a até 35% da tela
  var RECUO = 0.12;           // para trás: só puxa de volta se estiver bem perto (12%)

  // peça elástica de cada seção: variável CSS, faixa e quanto a altura muda por px da variável
  // passos: larguras permitidas, sempre um número inteiro de colunas do grid (n × 102 − 24),
  // para a peça encolher sem sair das colunas (19/11/2026)
  var ELASTICOS = {
    funcoesV2:       { vars: ['--foco-w', '--foco-h'], max: 588, min: 280, fator: 1, passos: [588, 384] },   // só número par de colunas fica centrado no grid
    manifestoV2:     { vars: ['--video-w'],            max: 996, min: 520, fator: 9 / 16, passos: [996, 792, 588] },
    diferenciacaoV2: { vars: ['--linha-h'],            max: 80,  min: 52,  fator: 4 },
    credibilidadeV2: { vars: ['--cred-h'],             max: 480, min: 340, fator: 1 },
    casesV2:         { vars: ['--cases-h'],            max: 640, min: 420, fator: 1 }
  };
  // o maior passo que cabe (com 24 px de tolerância); se nenhum couber, o menor
  function noPasso(e, v) {
    if (!e.passos) return v;
    for (var k = 0; k < e.passos.length; k++) { if (e.passos[k] <= v + 24) return e.passos[k]; }
    return e.passos[e.passos.length - 1];
  }
  var SEM_PREENCHER = { heroV2: 1, socialProofV2: 1 };

  var raiz = document.documentElement;
  var navH = 0, ativo = false, assentando = false, timer = null, ultimoY = 0, sentido = 0;

  // home: as seções ficam dentro de faixas de fundo (div.pageSky), não direto no <main>.
  // Páginas internas (19/11/2026): as seções de primeiro nível do conteúdo da página, mais a
  // chamada final da home; a primeira é o topo (como o #heroV2 da home) e as listas que só
  // continuam a seção anterior (anos da Imprensa, resumo colado no topo) ficam de fora.
  var PAGINA = !!document.querySelector('.pageContainer, .hubConteudo');
  var FORA = '.MainNavSiteHome, .pageTemplate, .im3-ano, .im3-sec--resumo, .preFooter';
  var cacheSecoes = null;
  function secoes() {
    if (!PAGINA) {
      return Array.prototype.filter.call(document.querySelectorAll('main.homeV2 .sectionWrap'), function (s) {
        return !s.parentNode.closest('.sectionWrap');
      });
    }
    if (cacheSecoes) return cacheSecoes;
    var todas = document.querySelectorAll('.pageContainer section, .hubConteudo > section, .copiaFimHome > .sectionWrap');
    cacheSecoes = Array.prototype.filter.call(todas, function (s) {
      if (s.matches(FORA) || s.closest('.MainNavSiteHome, footer')) return false;
      var pai = s.parentElement && s.parentElement.closest('section:not(.pageTemplate)');
      if (pai) return false;
      var c = getComputedStyle(s);
      return c.display !== 'none' && c.position !== 'fixed' && s.offsetHeight > 120;
    });
    if (cacheSecoes[0] && !cacheSecoes[0].id) cacheSecoes[0].id = 'copia-topo';
    if (cacheSecoes[0]) TOPO = cacheSecoes[0].id;
    return cacheSecoes;
  }
  var TOPO = 'heroV2';
  function interno(s) { return s.querySelector(':scope > .h3.h3-in, :scope > .sectionInner'); }
  function alturaMenu() { var n = document.querySelector('.MainNavSiteHome'); return n ? Math.round(n.getBoundingClientRect().height) : 0; }

  function limpar(s) {
    s.style.removeProperty('padding-top');
    s.style.removeProperty('padding-bottom');
    var e = ELASTICOS[s.id];
    if (e) e.vars.forEach(function (v) { s.style.removeProperty(v); });
    var i = interno(s); if (i) i.style.removeProperty('zoom');
    s.removeAttribute('data-encaixe');
  }

  function encaixar(s, util) {
    if (s.id === TOPO) return;
    var h = s.getBoundingClientRect().height;
    var nota = [];
    // chamada final: quem cede é a faixa da cidade embaixo do formulário (sem zoom e sem
    // respiro extra no topo): passou da tela, a faixa encolhe (até 48 px); sobrou, cresce
    if (s.id === 'finalCtaV2') {
      var pbF = parseFloat(getComputedStyle(s).paddingBottom) || 0;
      var novoPb = Math.max(48, Math.round(pbF + (util - h)));
      if (Math.abs(novoPb - pbF) > 1) {
        s.style.setProperty('padding-bottom', novoPb + 'px', 'important');
        nota.push('cidade=' + novoPb);
      }
      s.setAttribute('data-encaixe', nota.join(' ') || 'cabe');
      return;
    }
    var e = ELASTICOS[s.id];
    if (e && h > util + 1) {
      var excesso = h - util;
      if (e.fator > 0) {
        var novo = noPasso(e, Math.max(e.min, Math.round(e.max - excesso / e.fator)));
        e.vars.forEach(function (v) { s.style.setProperty(v, novo + 'px'); });
        nota.push(e.vars[0] + '=' + novo);
      } else {   // finalCta: o cartão avança sobre a foto
        var sobra = Math.min(e.teto(), Math.round(e.max + excesso));
        e.vars.forEach(function (v) { s.style.setProperty(v, sobra + 'px'); });
        nota.push(e.vars[0] + '=' + sobra);
      }
      h = s.getBoundingClientRect().height;
    }
    var i = interno(s);
    if (i && h > util + 1 && zoomMin() < 1) {
      var hi = i.getBoundingClientRect().height;
      var z = Math.max(zoomMin(), (hi - (h - util)) / hi);
      i.style.zoom = z.toFixed(3);
      nota.push('zoom=' + z.toFixed(2));
      h = s.getBoundingClientRect().height;
    }
    if (h < util - 1 && !SEM_PREENCHER[s.id]) {
      var cs = getComputedStyle(s), folga = util - h;
      var pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
      // com 'important': as camadas fixam o respiro das seções com !important
      if (s.id === 'finalCtaV2') { s.style.setProperty('padding-top', (pt + folga) + 'px', 'important'); }
      else { s.style.setProperty('padding-top', (pt + folga / 2) + 'px', 'important'); s.style.setProperty('padding-bottom', (pb + folga / 2) + 'px', 'important'); }
      nota.push('folga=' + Math.round(folga));
    }
    s.setAttribute('data-encaixe', nota.join(' ') || 'cabe');
  }

  function medir() {
    var lista = secoes();
    lista.forEach(limpar);
    ativo = window.matchMedia(MQ).matches;
    raiz.classList.toggle('copia-encaixe', ativo);
    raiz.classList.toggle('copia-encaixe-css', ativo && !window.copiaLenis);
    if (!ativo) return;
    navH = alturaMenu();
    raiz.style.setProperty('--nav-h', navH + 'px');
    var util = innerHeight - navH;
    lista.forEach(function (s) { encaixar(s, util); });
  }

  // assentamento suave (só quando o Lenis está ativo; sem ele, o CSS cuida)
  function alvos() {
    return secoes().map(function (s) {
      var top = s.getBoundingClientRect().top + scrollY;
      return s.id === TOPO ? 0 : Math.max(0, Math.round(top - navH));
    });
  }
  function aoParar() {
    if (!ativo || assentando || !window.copiaLenis) return;
    var y = scrollY, frente = innerHeight * PROXIMIDADE, atras = innerHeight * RECUO, melhor = null;
    var ultimo = secoes().slice(-1)[0];
    if (ultimo && y > ultimo.getBoundingClientRect().top + scrollY + ultimo.offsetHeight - navH) return;  // já no rodapé
    // no meio de uma seção a rolagem fica livre; perto de um começo, assenta nele
    alvos().forEach(function (t) {
      var d = t - y, adiante = sentido >= 0 ? d : -d;
      var vale = adiante >= 0 ? adiante <= frente : -adiante <= atras;
      if (vale && (melhor === null || Math.abs(d) < Math.abs(melhor - y))) melhor = t;
    });
    if (melhor === null || Math.abs(melhor - y) < 2) return;
    assentando = true;
    window.copiaLenis.scrollTo(melhor, {
      duration: 0.7,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      onComplete: function () { assentando = false; }
    });
    setTimeout(function () { assentando = false; }, 1100);
  }
  function aoRolar() {
    var y = scrollY;
    if (y !== ultimoY) { sentido = y > ultimoY ? 1 : -1; ultimoY = y; }
    if (assentando) return;
    clearTimeout(timer);
    timer = setTimeout(aoParar, 140);
  }

  var pendente = null;
  function remedir() { clearTimeout(pendente); pendente = setTimeout(medir, 150); }

  function iniciar() {
    medir();
    window.addEventListener('resize', remedir);
    window.addEventListener('load', remedir);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remedir);
    window.addEventListener('scroll', aoRolar, { passive: true });
    // o Lenis do tema sobe depois; quando aparecer, o assentamento passa para ele
    var tentativas = 0, espera = setInterval(function () {
      tentativas++;
      if (window.copiaLenis || tentativas > 40) { clearInterval(espera); remedir(); }
    }, 100);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
