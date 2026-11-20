#!/usr/bin/env node
// Cópia genérica · páginas internas no padrão da home (19/11/2026)
// Troca o menu antigo das páginas internas pelo menu da home (mesma marcação, CSS e JS),
// com os links ajustados para a subpasta. Pode rodar quantas vezes quiser: o que já
// está aplicado é pulado. Chamado pelo fonte/alteracoes.py (passo 16).
//
// uso (dentro da pasta MORADA.AI HTML):  node fonte/padrao-paginas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(RAIZ, 'site');
const PAGINAS = ['morada-vendas', 'morada-relacionamento', 'conteudo', 'blog', 'quem-somos', 'conbral', 'direcional', 'fraiha', 'imprensa'];
// páginas montadas já no padrão da home (body.home + main.homeV2): só entram na troca de links
const PAGINAS_HOME = ['parceiros', 'morada-os'];
// endereços externos que passam a abrir a cópia local, quando a pasta existe
const LOCAIS = [
  ['https://morada.ai/imprensa/', 'imprensa'],
  ['https://partners.morada.ai/', 'parceiros'],
  ['https://os.morada.ai/', 'morada-os'],
].filter(([, pasta]) => fs.existsSync(path.join(SITE, pasta, 'index.html')));
// troca os links externos pela cópia; prefixo '' na home, '../' nas subpastas
function linksLocais(html, prefixo) {
  for (const [url, pasta] of LOCAIS) {
    const esc = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp('<a([^>]*?)href="' + esc + '"([^>]*)>', 'g'), (m, a, b) =>
      '<a' + (a + b).replace(/\s*target="_blank"/g, '').replace(/\s*rel="noopener[^"]*"/g, '').replace(/\s+$/, '') + ' href="' + prefixo + pasta + '/index.html">');
  }
  return html;
}
// case Simoplan: foto nova da fachada (19/11/2026), no lugar da que tinha marca d'água
function fotoSimoplan(html) {
  const nova = 'wp-content/uploads/2026/11/simoplan-fachada-2026.webp';
  if (!fs.existsSync(path.join(SITE, nova))) return html;
  return html.split('wp-content/uploads/2026/11/simoplan-altitude-cambui-fachada-800.jpg').join(nova)
    .split('wp-content/uploads/2026/11/simoplan-altitude-cambui-fachada-1920.jpg').join(nova);
}

// a home primeiro: o menu das páginas é derivado dela
{
  const f = path.join(SITE, 'index.html');
  const h0 = fs.readFileSync(f, 'utf8');
  let h1 = linksLocais(h0, '');
  // Integrações (encaixe por tela, 19/11/2026): os dois links de baixo da grade entram no
  // cartão da MIA, ao lado do botão, para a seção caber numa tela
  const links = h1.match(/<p class="i3-links">[\s\S]*?<\/p>/);
  const acoes = '<div class="i3-acoes"><a class="h3-btn" href="#criesuamia">';
  if (links && h1.includes(acoes)) {
    h1 = h1.replace(links[0], '');
    const i = h1.indexOf(acoes), fimA = h1.indexOf('</a>', i) + 4;
    h1 = h1.slice(0, fimA) + links[0] + h1.slice(fimA);
  }
  // Faixa de logos (19/11/2026): logos novos da Novolar e da MRV, recortados rente ao
  // desenho. Só dentro da faixa: a janela "Crie sua MIA" continua com os coloridos
  const ini = h1.indexOf('<div class="partnersMarquee"'), fim = ini < 0 ? -1 : h1.indexOf('</div>', h1.indexOf('</ul>', ini));
  if (ini >= 0 && fim > ini) {
    const faixa = h1.slice(ini, fim)
      .split('partners/novolar.svg').join('partners/novolar-2026.png')
      .split('partners/logo-mrv.webp').join('partners/mrv-2026.png');
    h1 = h1.slice(0, ini) + faixa + h1.slice(fim);
  }
  h1 = fotoSimoplan(h1);
  if (h1 !== h0) { fs.writeFileSync(f, h1); console.log('  ok    home: links locais / integrações / logos / foto da Simoplan'); }
}

// bloco <section ...> completo a partir da abertura (respeita seções aninhadas)
function bloco(html, abertura) {
  const i = html.indexOf(abertura);
  if (i < 0) return null;
  const re = /<\/?section\b[^>]*>/g;
  re.lastIndex = i;
  let d = 0, m;
  while ((m = re.exec(html))) {
    d += m[0][1] === '/' ? -1 : 1;
    if (d === 0) return { ini: i, fim: m.index + m[0].length, txt: html.slice(i, m.index + m[0].length) };
  }
  return null;
}

const home = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');   // já com os links locais
const navHome = bloco(home, '<section class="MainNavSiteHome">');
if (!navHome) { console.error('menu da home não encontrado'); process.exit(1); }

// links da home → links a partir de uma subpasta
function paraSubpasta(nav) {
  return nav.txt
    .replace(/\s*aria-current="page"/g, '')
    .replace(/ current-menu-item| current_page_item| menu-item-home/g, '')
    .replace(/(href|src)="([^"]*)"/g, (m, attr, url) => {
      if (/^(https?:|mailto:|tel:|\.\.\/|\/)/.test(url)) return m;
      if (url === '#criesuamia') return m;                    // abre a Mia na própria página
      if (url.startsWith('#')) return `${attr}="../index.html${url}"`;   // âncoras da home
      return `${attr}="../${url}"`;
    });
}
const navNovo = paraSubpasta(navHome);

const CSS_HOME = "<link rel='stylesheet' id='moradaai-v2-menu-home-css' href='../wp-content/themes/moradaai-v2/css/menuStyleHome.css' media='all' />";
const JS_HOME = '<script id="moradaai-v2-menu-home-js" src="../wp-content/themes/moradaai-v2/js/mainMenuHome.js"></script>';
const GRID_CSS = '<link rel="stylesheet" id="copia-grid-css" href="../copia/grid-proporcao.css" media="all" />';
const fimHome = bloco(home, '<section id="finalCtaV2"');
const FIM_HOME = fimHome ? '<main class="homeV2 copiaFimHome">\n' + paraSubpasta(fimHome) + '\n</main>' : null;

for (const p of PAGINAS) {
  const f = path.join(SITE, p, 'index.html');
  if (!fs.existsSync(f)) { console.log('  falta ', p); continue; }
  let h = fs.readFileSync(f, 'utf8');
  const antes = h;
  const relato = [];

  // 1. menu: o bloco antigo dá lugar ao da home
  const velho = bloco(h, '<section class="MainNavSite"') || bloco(h, '<section class="MainNavSiteHome">');
  if (velho && velho.txt !== navNovo) { h = h.slice(0, velho.ini) + navNovo + h.slice(velho.fim); relato.push('menu'); }
  { const h2 = linksLocais(h, '../'); if (h2 !== h) { h = h2; relato.push('links locais'); } }

  // 2. CSS: sai o do menu antigo (regras genéricas em .primary-menu), entra o da home
  h = h.replace(/<link[^>]*id='moradaai-v2-menu-css'[^>]*>\s*/g, () => { relato.push('css antigo fora'); return ''; });
  if (!h.includes('moradaai-v2-menu-home-css')) { h = h.replace('</head>', CSS_HOME + '\n</head>'); relato.push('css da home'); }

  // 3. JS: sai o do menu antigo (quebra sem a marcação dele), entra o da home
  h = h.replace(/<script[^>]*id="moradaai-v2-menu-js"[^>]*><\/script>\s*/g, () => { relato.push('js antigo fora'); return ''; });
  if (!h.includes('moradaai-v2-menu-home-js')) { h = h.replace('</body>', JS_HOME + '\n</body>'); relato.push('js da home'); }

  // 4. fim da página: as duas faixas azul-marinho (pré-rodapé e formulário) dão lugar à
  //    chamada final da home (cidade dissolvendo no céu + formulário), dentro de um
  //    <main class="homeV2"> para valer o CSS da home sem mudança
  const form = bloco(h, '<section style="background-color:#00203C; color:white;">');
  if (form && FIM_HOME) {
    const pre = bloco(h, '<section class="preFooter"');
    const ini = pre && pre.ini < form.ini ? pre.ini : form.ini;
    h = h.slice(0, ini) + FIM_HOME + h.slice(form.fim);
    relato.push('chamada final da home');
  }

  // 5. <body class="… home">: liga as regras da camada da home (menu e chamada final)
  h = h.replace(/<body class="([^"]*)"/, (m, c) => {
    if (/(^|\s)home(\s|$)/.test(c)) return m;
    relato.push('body.home');
    return `<body class="${c} home"`;
  });

  // 6. camada da home (grid-proporcao.css) antes da camada das páginas
  if (!h.includes('copia-grid-css')) {
    h = h.replace('<link rel="stylesheet" id="copia-paginas-css"', GRID_CSS + '\n<link rel="stylesheet" id="copia-paginas-css"');
    relato.push('camada da home');
  }

  // 7. encaixe por tela da home: Lenis, rolagem suave e copia/encaixe.js
  if (!h.includes('copia/encaixe.js')) {
    const extra = (h.includes('lenis.min.js') ? '' : '<script src="../_cdn/cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js" defer></script>\n') +
      '<script src="../copia/rolagem.js" defer></script>\n<script src="../copia/encaixe.js" defer></script>\n';
    h = h.replace('</body>', extra + '</body>');
    relato.push('encaixe por tela');
  }

  // 9. foto nova do case Simoplan
  { const h2 = fotoSimoplan(h); if (h2 !== h) { h = h2; relato.push('foto da Simoplan'); } }

  // 8. formato compacto das seções longas (carrossel, abas, "ver todas"): CSS + JS por página
  {
    const nome = { 'morada-relacionamento': 'compacto-relacionamento', 'quem-somos': 'compacto-quem-somos',
      conbral: 'compacto-cases', direcional: 'compacto-cases', fraiha: 'compacto-cases',
      blog: 'compacto-blog', imprensa: 'compacto-imprensa' }[p];
    if (nome && fs.existsSync(path.join(SITE, 'copia', nome + '.css')) && !h.includes('copia/' + nome + '.css')) {
      h = h.replace('</head>', '<link rel="stylesheet" id="copia-compacto-css" href="../copia/' + nome + '.css" media="all" />\n</head>');
      relato.push('compacto css');
    }
    if (nome && fs.existsSync(path.join(SITE, 'copia', nome + '.js')) && !h.includes('copia/' + nome + '.js')) {
      h = h.replace('</body>', '<script src="../copia/' + nome + '.js" defer></script>\n</body>');
      relato.push('compacto js');
    }
  }

  if (h !== antes) { fs.writeFileSync(f, h); console.log('  ok   ', p + ':', relato.join(', ')); }
  else console.log('  já   ', p);
}

for (const p of PAGINAS_HOME) {
  const f = path.join(SITE, p, 'index.html');
  if (!fs.existsSync(f)) continue;
  const h0 = fs.readFileSync(f, 'utf8'), h1 = linksLocais(h0, '../');
  if (h1 !== h0) { fs.writeFileSync(f, h1); console.log('  ok   ', p + ': links locais'); } else console.log('  já   ', p);
}
