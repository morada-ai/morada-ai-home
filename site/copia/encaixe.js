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
  var ZOOM_MIN = 1;   // 1 = sem zoom: o grid de 12 colunas vale em todas as seções
  var PROXIMIDADE = 0.35;     // à frente (no sentido da rolagem): assenta se o começo da seção estiver a até 35% da tela
  var RECUO = 0.12;           // para trás: só puxa de volta se estiver bem perto (12%)

  // peça elástica de cada seção: variável CSS, faixa e quanto a altura muda por px da variável
  // passos: larguras permitidas, sempre um número inteiro de colunas do grid (n × 102 − 24),
  // para a peça encolher sem sair das colunas (19/11/2026)
  var ELASTICOS = {
    funcoesV2:       { vars: ['--foco-w', '--foco-h'], max: 588, min: 280, fator: 1, passos: [588, 384] },   // só número par de colunas fica centrado no grid
    manifestoV2:     { vars: ['--video-w'],            max: 996, min: 520, fator: 9 / 16, passos: [996, 792, 588] },
    diferenciacaoV2: { vars: ['--linha-h'],            max: 80,  min: 52,  fator: 4 },
    credibilidadeV2: { vars: ['--cred-h'],             max: 480, min: 380, fator: 1 },
    casesV2:         { vars: ['--cases-h'],            max: 640, min: 540, fator: 1 }
  };
  // o passo mais próximo da largura que caberia (pode passar um pouco da tela; vale o grid)
  function noPasso(e, v) {
    if (!e.passos) return v;
    return e.passos.reduce(function (m, p) { return Math.abs(p - v) < Math.abs(m - v) ? p : m; }, e.passos[0]);
  }
  var SEM_PREENCHER = { heroV2: 1, socialProofV2: 1 };

  var raiz = document.documentElement;
  var navH = 0, ativo = false, assentando = false, timer = null, ultimoY = 0, sentido = 0;

  // as seções ficam dentro de faixas de fundo (div.pageSky), não direto no <main>
  function secoes() {
    return Array.prototype.filter.call(document.querySelectorAll('main.homeV2 .sectionWrap'), function (s) {
      return !s.parentNode.closest('.sectionWrap');
    });
  }
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
    if (s.id === 'heroV2') return;
    var h = s.getBoundingClientRect().height;
    var nota = [];
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
    if (i && h > util + 1 && ZOOM_MIN < 1) {
      var hi = i.getBoundingClientRect().height;
      var z = Math.max(ZOOM_MIN, (hi - (h - util)) / hi);
      i.style.zoom = z.toFixed(3);
      nota.push('zoom=' + z.toFixed(2));
      h = s.getBoundingClientRect().height;
    }
    if (h < util - 1 && !SEM_PREENCHER[s.id]) {
      var cs = getComputedStyle(s), folga = util - h;
      var pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
      if (s.id === 'finalCtaV2') { s.style.paddingTop = (pt + folga) + 'px'; }
      else { s.style.paddingTop = (pt + folga / 2) + 'px'; s.style.paddingBottom = (pb + folga / 2) + 'px'; }
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
      return s.id === 'heroV2' ? 0 : Math.max(0, Math.round(top - navH));
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
