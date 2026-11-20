/* Cópia genérica · cases de clientes como visor em tela cheia (18/11/2026)
   Um cartão só: a foto do case ocupa tudo, com véu escuro vindo da esquerda; sobre ele,
   o selo do cliente com o link do case, o número grande (conta até o valor), o contexto
   e o depoimento. No pé do cartão, os 4 clientes como capítulos (logo + número); o ativo ganha a
   linha da marca. Abas com clique, setas, Home e End; não troca sozinho.
   Tudo vem do próprio HTML; o depoimento é ligado ao case pela empresa no cargo
   ("· Direcional"). Sem JS, os cartões originais continuam. */
(function () {
  'use strict';
  // foto da Fraiha (não há no cartão da home): fachada aérea do 145 Vianna, da página do case
  var FOTO_EXTRA = { fraiha: 'wp-content/uploads/2026/11/fraiha-145-vianna-fachada-vista-aerea-1200.jpg' };
  // versões maiores para a foto em tela cheia
  var FOTO_MAIOR = { simoplan: 'wp-content/uploads/2026/11/simoplan-fachada-2026.webp' };   // foto nova (19/11/2026), sem marca d'água
  // enquadramento de cada foto no cartão largo
  var FOCO = { direcional: '50% 45%', fraiha: '62% 50%', conbral: '50% 55%', simoplan: '50% 4%' };
  // logos em branco (copia/logos) para o cartão escuro; sem versão branca, usa o original numa pílula
  var LOGO_BRANCO = { direcional: 1, fraiha: 1, conbral: 1, simoplan: 1 };
  // tamanho óptico: todos os logos com a mesma área, sem passar da altura máxima
  function otico(img, area, hMax) {
    function aplicar() {
      if (!img.naturalWidth) return;
      var r = img.naturalWidth / img.naturalHeight;
      img.style.height = Math.min(hMax, Math.round(Math.sqrt(area / r))) + 'px';
    }
    if (img.complete) aplicar(); else img.addEventListener('load', aplicar);
  }
  var SETA = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function iniciar() {
    var secao = document.querySelector('.homeV2 #casesV2');
    if (!secao || secao.classList.contains('copia-cases-on')) return;
    var bento = secao.querySelector('.c3-bento');
    if (!bento) return;
    var menosMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var casos = Array.prototype.map.call(bento.querySelectorAll('article.c3-t'), function (a) {
      var logo = a.querySelector('.c3-logo img');
      var foto = a.querySelector('img.c3-bg, img.c3-largo__img');
      var ler = a.querySelector('.c3-ler');
      var href = ler ? ler.getAttribute('href') : '#';
      var chave = href.replace(/^https?:\/\/[^/]+\//, '').split('/')[0].toLowerCase();
      return {
        chave: chave, href: href,
        nome: logo ? logo.getAttribute('alt') : chave,
        logo: LOGO_BRANCO[chave] ? 'copia/logos/' + chave + '-branco.png' : (logo ? logo.getAttribute('src') : ''),
        logoBranco: !!LOGO_BRANCO[chave],
        foto: FOTO_MAIOR[chave] || (foto ? foto.getAttribute('src') : (FOTO_EXTRA[chave] || '')),
        kpi: ((a.querySelector('.c3-kpi strong') || {}).textContent || '').trim(),
        kpiTxt: ((a.querySelector('.c3-kpi span') || {}).textContent || '').trim(),
        fato: a.querySelector('.c3-fato') ? a.querySelector('.c3-fato').textContent.trim() : '',
        dep: null
      };
    }).filter(function (c) { return c.kpi; });
    if (casos.length < 2) return;

    Array.prototype.forEach.call(bento.querySelectorAll('figure.c3-cit'), function (f) {
      var small = f.querySelector('figcaption small');
      var empresa = small ? small.textContent.split('·').pop().trim().toLowerCase() : '';
      var caso = casos.filter(function (c) { return !c.dep && empresa && (c.chave.indexOf(empresa) >= 0 || c.nome.toLowerCase().indexOf(empresa) >= 0); })[0];
      if (!caso) return;
      var ini = f.querySelector('.c3-ini'), av = f.querySelector('figcaption img');
      caso.dep = {
        texto: f.querySelector('blockquote').textContent.trim(),
        nome: ((f.querySelector('figcaption b') || {}).textContent || '').trim(),
        cargo: small ? small.textContent.trim() : '',
        foto: av ? av.getAttribute('src') : '',
        ini: ini ? ini.textContent.trim() : '',
        iniCor: ini ? ini.style.background : ''
      };
    });

    var raiz = document.createElement('div');
    raiz.className = 'copiaCases';
    var palco = document.createElement('div');
    palco.className = 'copiaCases__palco';
    var fotos = document.createElement('div');
    fotos.className = 'copiaCases__fotos';
    fotos.setAttribute('aria-hidden', 'true');
    var veu = document.createElement('div');
    veu.className = 'copiaCases__veu';
    veu.setAttribute('aria-hidden', 'true');
    var paineis = document.createElement('div');
    paineis.className = 'copiaCases__paineis';
    var placar = document.createElement('div');
    placar.className = 'copiaCases__placar';
    placar.setAttribute('role', 'tablist');
    placar.setAttribute('aria-label', 'Cases de clientes');

    var abas = [], painelEls = [], fotoEls = [];
    casos.forEach(function (c, i) {
      var fw = document.createElement('div');
      fw.className = 'copiaCases__foto';
      if (c.foto) fw.innerHTML = '<img src="' + esc(c.foto) + '" alt="" loading="lazy" decoding="async" style="object-position:' + (FOCO[c.chave] || '50% 50%') + '">';
      fotos.appendChild(fw); fotoEls.push(fw);

      var p = document.createElement('article');
      p.className = 'copiaCases__painel';
      p.id = 'copia-case-' + (i + 1);
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', 'copia-case-aba-' + (i + 1));
      var externo = /^https?:/.test(c.href) && c.href.indexOf(location.host) < 0;
      var html = '<div class="copiaCases__topo"><span class="copiaCases__selo' + (c.logoBranco ? '' : ' is-cor') + '"><img src="' + esc(c.logo) + '" alt="' + esc(c.nome) + '"></span>' +
        '<a class="copiaCases__ler" href="' + esc(c.href) + '"' + (externo ? ' target="_blank" rel="noopener"' : '') + '>Ler o case ' + SETA +
        '<span class="copiaCases__sr"> completo da ' + esc(c.nome) + (externo ? ' (abre em nova aba)' : '') + '</span></a></div>' +
        '<p class="copiaCases__kpi"><strong aria-hidden="true" data-alvo="' + esc(c.kpi) + '">' + esc(c.kpi) + '</strong>' +
        '<span class="copiaCases__sr">' + esc(c.kpi) + ' </span><span class="copiaCases__kpiTxt">' + esc(c.kpiTxt) + '</span></p>';
      if (c.dep) {
        var avatar = c.dep.foto ? '<img src="' + esc(c.dep.foto) + '" alt="" width="44" height="44" loading="lazy">'
          : '<span class="copiaCases__ini" style="background:' + esc(c.dep.iniCor || '#0074FF') + '">' + esc(c.dep.ini) + '</span>';
        html += '<figure class="copiaCases__dep"><blockquote>' + esc(c.dep.texto) + '</blockquote>' +
          '<figcaption>' + avatar + '<span><b>' + esc(c.dep.nome) + '</b><small>' + esc(c.dep.cargo) + '</small></span></figcaption></figure>';
      } else if (c.fato) {
        html += '<p class="copiaCases__fato">' + esc(c.fato) + '</p>';
      }
      p.innerHTML = html;
      paineis.appendChild(p); painelEls.push(p);

      var aba = document.createElement('button');
      aba.type = 'button';
      aba.className = 'copiaCases__aba';
      aba.id = 'copia-case-aba-' + (i + 1);
      aba.setAttribute('role', 'tab');
      aba.setAttribute('aria-controls', p.id);
      aba.innerHTML = '<span class="copiaCases__abaLogo' + (c.logoBranco ? '' : ' is-cor') + '"><img src="' + esc(c.logo) + '" alt="' + esc(c.nome) + '" loading="lazy"></span>' +
        '<span class="copiaCases__abaNum">' + esc(c.kpi) + '</span>';
      if (c.logoBranco) { otico(p.querySelector('.copiaCases__selo img'), 4000, 52); otico(aba.querySelector('.copiaCases__abaLogo img'), 2000, 34); }
      aba.addEventListener('click', function () { ir(i, true); });
      placar.appendChild(aba); abas.push(aba);
    });

    palco.appendChild(fotos);
    palco.appendChild(veu);
    palco.appendChild(paineis);
    palco.appendChild(placar);
    raiz.appendChild(palco);
    bento.parentNode.insertBefore(raiz, bento.nextSibling);
    secao.classList.add('copia-cases-on');

    var atual = -1;
    function contar(el) {
      var alvo = el.getAttribute('data-alvo');
      var m = alvo.match(/\d+(?:[.,]\d+)?/);
      if (!m || menosMovimento) { el.textContent = alvo; return; }
      var bruto = m[0], virgula = bruto.indexOf(',') >= 0, dec = (bruto.split(/[.,]/)[1] || '').length;
      var valor = parseFloat(bruto.replace(',', '.')), t0 = null, dur = 900;
      function passo(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        var v = (valor * e).toFixed(dec);
        if (virgula) v = v.replace('.', ',');
        el.textContent = alvo.replace(bruto, v);
        if (k < 1) requestAnimationFrame(passo); else el.textContent = alvo;
      }
      requestAnimationFrame(passo);
    }
    function ir(i, peloUsuario) {
      i = (i + casos.length) % casos.length;
      if (i === atual) return;
      atual = i;
      abas.forEach(function (a, k) { var on = k === i; a.setAttribute('aria-selected', on ? 'true' : 'false'); a.setAttribute('tabindex', on ? '0' : '-1'); });
      fotoEls.forEach(function (f, k) { f.classList.toggle('is-ativo', k === i); });
      painelEls.forEach(function (p, k) {
        var on = k === i;
        p.classList.toggle('is-ativo', on);
        p.setAttribute('aria-hidden', on ? 'false' : 'true');
        Array.prototype.forEach.call(p.querySelectorAll('a'), function (a) { a.setAttribute('tabindex', on ? '0' : '-1'); });
      });
      contar(painelEls[i].querySelector('.copiaCases__kpi strong'));
      if (peloUsuario) abas[i].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: menosMovimento ? 'auto' : 'smooth' });
    }
    placar.addEventListener('keydown', function (e) {
      var alvo = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') alvo = atual + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') alvo = atual - 1;
      else if (e.key === 'Home') alvo = 0;
      else if (e.key === 'End') alvo = casos.length - 1;
      if (alvo === null) return;
      e.preventDefault();
      ir(alvo, true);
      abas[atual].focus();
    });

    ir(0, false);
    if ('IntersectionObserver' in window && !menosMovimento) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        contar(painelEls[atual].querySelector('.copiaCases__kpi strong'));
      }, { threshold: 0.4 });
      io.observe(palco);
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
