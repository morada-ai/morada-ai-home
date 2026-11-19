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
// a home primeiro: o menu das páginas é derivado dela
{
  const f = path.join(SITE, 'index.html');
  const h0 = fs.readFileSync(f, 'utf8'), h1 = linksLocais(h0, '');
  if (h1 !== h0) { fs.writeFileSync(f, h1); console.log('  ok    home: links locais'); }
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

  if (h !== antes) { fs.writeFileSync(f, h); console.log('  ok   ', p + ':', relato.join(', ')); }
  else console.log('  já   ', p);
}

for (const p of PAGINAS_HOME) {
  const f = path.join(SITE, p, 'index.html');
  if (!fs.existsSync(f)) continue;
  const h0 = fs.readFileSync(f, 'utf8'), h1 = linksLocais(h0, '../');
  if (h1 !== h0) { fs.writeFileSync(f, h1); console.log('  ok   ', p + ': links locais'); } else console.log('  já   ', p);
}
