/* Cópia genérica · cases de clientes como explorador (18/11/2026)
   Os 7 cartões viram: um placar com os 4 clientes (logo, número, contexto) e um palco
   que mostra o case escolhido: foto, número grande que conta até o valor, contexto e o
   depoimento do cliente (ou o dado extra, quando não há depoimento). Abas com teclado
   (setas, Home, End). Não troca sozinho: é conteúdo para ler.
   Tudo vem do próprio HTML; o depoimento é ligado ao case pela empresa no cargo
   ("· Direcional"). Sem JS, os cartões originais continuam. */
(function () {
  'use strict';
  // a Fraiha não tem foto no cartão da home; esta é a fachada aérea do 145 Vianna, da página do case
  var FOTO_EXTRA = { fraiha: 'wp-content/uploads/2026/11/fraiha-145-vianna-fachada-vista-aerea-1200.jpg' };
  var SETA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

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
      var nome = logo ? logo.getAttribute('alt') : chave;
      return {
        chave: chave, nome: nome, href: href,
        logo: logo ? logo.getAttribute('src') : '',
        foto: foto ? foto.getAttribute('src') : (FOTO_EXTRA[chave] || ''),
        fotoAlt: foto ? foto.getAttribute('alt') : '',
        kpi: (a.querySelector('.c3-kpi strong') || {}).textContent || '',
        kpiTxt: (a.querySelector('.c3-kpi span') || {}).textContent || '',
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
      var ini = f.querySelector('.c3-ini');
      var av = f.querySelector('figcaption img');
      caso.dep = {
        texto: f.querySelector('blockquote').textContent.trim(),
        nome: (f.querySelector('figcaption b') || {}).textContent || '',
        cargo: small ? small.textContent.trim() : '',
        foto: av ? av.getAttribute('src') : '',
        ini: ini ? ini.textContent.trim() : '',
        iniCor: ini ? ini.style.background : ''
      };
    });

    var raiz = document.createElement('div');
    raiz.className = 'copiaCases';

    // placar (abas)
    var placar = document.createElement('div');
    placar.className = 'copiaCases__placar';
    placar.setAttribute('role', 'tablist');
    placar.setAttribute('aria-label', 'Cases de clientes');

    // palco
    var palco = document.createElement('div');
    palco.className = 'copiaCases__palco';
    var fotos = document.createElement('div');
    fotos.className = 'copiaCases__fotos';
    var paineis = document.createElement('div');
    paineis.className = 'copiaCases__paineis';

    var abas = [], painelEls = [], fotoEls = [];
    casos.forEach(function (c, i) {
      var aba = document.createElement('button');
      aba.type = 'button';
      aba.className = 'copiaCases__aba';
      aba.id = 'copia-case-aba-' + (i + 1);
      aba.setAttribute('role', 'tab');
      aba.setAttribute('aria-controls', 'copia-case-' + (i + 1));
      aba.innerHTML = '<span class="copiaCases__abaLogo"><img src="' + esc(c.logo) + '" alt="' + esc(c.nome) + '" loading="lazy"></span>' +
        '<span class="copiaCases__abaNum">' + esc(c.kpi) + '</span>' +
        '<span class="copiaCases__abaTxt">' + esc(c.kpiTxt) + '</span>';
      aba.addEventListener('click', function () { ir(i, true); });
      placar.appendChild(aba); abas.push(aba);

      var fw = document.createElement('div');
      fw.className = 'copiaCases__foto';
      fw.setAttribute('aria-hidden', 'true');
      fw.innerHTML = (c.foto ? '<img src="' + esc(c.foto) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<span class="copiaCases__fotoLogo"><img src="' + esc(c.logo) + '" alt=""></span>';
      fotos.appendChild(fw); fotoEls.push(fw);

      var p = document.createElement('article');
      p.className = 'copiaCases__painel';
      p.id = 'copia-case-' + (i + 1);
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', aba.id);
      var corpo = '<p class="copiaCases__kpi"><strong aria-hidden="true" data-alvo="' + esc(c.kpi) + '">' + esc(c.kpi) + '</strong>' +
        '<span class="copiaCases__sr">' + esc(c.kpi) + ' </span><span class="copiaCases__kpiTxt">' + esc(c.kpiTxt) + '</span></p>';
      if (c.dep) {
        var avatar = c.dep.foto ? '<img src="' + esc(c.dep.foto) + '" alt="" width="48" height="48" loading="lazy">'
          : '<span class="copiaCases__ini" style="background:' + esc(c.dep.iniCor || '#0074FF') + '">' + esc(c.dep.ini) + '</span>';
        corpo += '<figure class="copiaCases__dep"><blockquote>' + esc(c.dep.texto) + '</blockquote>' +
          '<figcaption>' + avatar + '<span><b>' + esc(c.dep.nome) + '</b><small>' + esc(c.dep.cargo) + '</small></span></figcaption></figure>';
      } else if (c.fato) {
        corpo += '<p class="copiaCases__fato">' + esc(c.fato) + '</p>';
      }
      var externo = /^https?:/.test(c.href) && c.href.indexOf(location.host) < 0;
      corpo += '<a class="copiaCases__ler" href="' + esc(c.href) + '"' + (externo ? ' target="_blank" rel="noopener"' : '') + '>Ler o case completo ' + SETA +
        '<span class="copiaCases__sr"> da ' + esc(c.nome) + (externo ? ' (abre em nova aba)' : '') + '</span></a>';
      p.innerHTML = corpo;
      paineis.appendChild(p); painelEls.push(p);
    });

    palco.appendChild(fotos);
    palco.appendChild(paineis);
    raiz.appendChild(placar);
    raiz.appendChild(palco);
    bento.parentNode.insertBefore(raiz, bento.nextSibling);
    secao.classList.add('copia-cases-on');

    var atual = -1;
    function contar(el) {
      var alvo = el.getAttribute('data-alvo');
      var m = alvo.match(/\d+(?:[.,]\d+)?/);
      if (!m || menosMovimento) { el.textContent = alvo; return; }
      var bruto = m[0], virgula = bruto.indexOf(',') >= 0;
      var dec = (bruto.split(/[.,]/)[1] || '').length;
      var valor = parseFloat(bruto.replace(',', '.'));
      var t0 = null, dur = 900;
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
      abas.forEach(function (a, k) {
        var on = k === i;
        a.setAttribute('aria-selected', on ? 'true' : 'false');
        a.setAttribute('tabindex', on ? '0' : '-1');
      });
      fotoEls.forEach(function (f, k) { f.classList.toggle('is-ativo', k === i); });
      painelEls.forEach(function (p, k) {
        var on = k === i;
        p.classList.toggle('is-ativo', on);
        p.hidden = false;
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

    // o primeiro número conta quando a seção aparece
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
