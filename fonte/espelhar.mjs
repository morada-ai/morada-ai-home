#!/usr/bin/env node
// Cópia estática de páginas do morada.ai: baixa cada página, os arquivos do próprio site
// (e das CDNs listadas), segue url()/@import do CSS e reescreve tudo para caminho relativo.
// Links entre páginas copiadas apontam para a cópia (pasta/index.html, funciona em file:// e na Vercel);
// o resto continua indo para o site no ar.
//
// uso: node espelhar.mjs <pasta-site> <pasta-originais> <url>[=arquivo.html] [...]
//   com "=arquivo.html" usa o HTML já baixado em vez de buscar a página
//   (o WordPress do morada.ai devolve 503 por IP quando recebe páginas demais em sequência).
import fs from 'node:fs/promises';
import path from 'node:path';

const [, , outDir, origDir, ...pageArgs] = process.argv;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const SITE_HOSTS = ['morada.ai', 'www.morada.ai'];
const HOSTS = { 'morada.ai': '', 'www.morada.ai': '', 'unpkg.com': '_cdn/unpkg.com/', 'cdn.jsdelivr.net': '_cdn/cdn.jsdelivr.net/' };
const EXT = /\.(css|js|mjs|webp|avif|png|jpe?g|svg|gif|ico|mp4|webm|mp3|woff2?|ttf|otf|eot|json|lottie|pdf)$/i;
const TRACKERS = ['googletagmanager.com/gtm.js', 'googletagmanager.com/gtag/js', 't.contentsquare.net', 'posthog.init',
  'snap.licdn.com', 'js.hs-scripts.com', 'stats.wp.com', '_stq.push', 'connect.facebook.net', 'clarity.ms', 'hotjar'];

const unent = s => s.replace(/&#0?38;|&amp;/g, '&');
const toURL = (s, base) => { try { return new URL(unent(s), base); } catch { return null; } };
const normPath = p => (p.endsWith('/') ? p : p + '/');

// páginas: caminho no site -> arquivo local
const pages = new Map();
for (const a of pageArgs) {
  const [href, file] = a.split(/=(.+)/);
  const u = new URL(href);
  const p = normPath(u.pathname);
  pages.set(p, { url: u.href, file, path: p, local: p === '/' ? 'index.html' : p.slice(1) + 'index.html', slug: p === '/' ? 'home' : p.slice(1, -1).replace(/\//g, '_') });
}

function relOf(u) {
  if (!u || !(u.hostname in HOSTS) || !EXT.test(u.pathname)) return null;
  return HOSTS[u.hostname] + u.pathname.replace(/^\//, '');
}
function dirRelOf(u) {
  if (!u || !SITE_HOSTS.includes(u.hostname)) return null;
  if (!/^\/wp-(content|includes)\//.test(u.pathname) || EXT.test(u.pathname) || u.pathname.includes('*')) return null;
  return u.pathname.replace(/^\//, '');
}

const queue = new Map(), done = new Map();
function enqueue(u) {
  const rel = relOf(u);
  if (!rel) return null;
  const key = u.origin + u.pathname;
  if (!queue.has(key)) queue.set(key, rel);
  return rel;
}

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://morada.ai/' } });
  return r;
}
async function fetchOne(key, rel) {
  const file = path.join(outDir, decodeURIComponent(rel));
  try {
    const r = await get(key);
    if (!r.ok) { done.set(rel, { ok: false, status: r.status, url: key }); return; }
    let buf = Buffer.from(await r.arrayBuffer());
    if (/\.css$/i.test(rel)) buf = Buffer.from(processCSS(buf.toString('utf8'), key, rel));
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buf);
    done.set(rel, { ok: true, bytes: buf.length });
  } catch (e) { done.set(rel, { ok: false, status: String(e.message || e), url: key }); }
}
function processCSS(css, cssUrl, cssRel) {
  const fix = ref => {
    if (/^(data:|#|about:)/i.test(ref)) return null;
    const u = toURL(ref, cssUrl);
    const rel = enqueue(u);
    return rel ? path.posix.relative(path.posix.dirname(cssRel), rel) + (u.hash || '') : null;
  };
  css = css.replace(/url\(\s*(['"]?)([^'")]+?)\1\s*\)/g, (m, q, ref) => { const r = fix(ref.trim()); return r ? `url(${q}${r}${q})` : m; });
  return css.replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, ref) => { const r = fix(ref); return r ? `@import ${q}${r}${q}` : m; });
}
async function drain() {
  let pending;
  while ((pending = [...queue].filter(([, rel]) => !done.has(rel))).length) {
    pending.forEach(([, rel]) => done.set(rel, null));
    for (let i = 0; i < pending.length; i += 8) await Promise.all(pending.slice(i, i + 8).map(([k, rel]) => fetchOne(k, rel)));
  }
}

// SVG em url() vira data: (máscara CSS exige CORS, que file:// não tem; url() em variável CSS
// é resolvido a partir do .css que a consome). Sem aspas: pode estar em style="" ou string JS.
let nSvg = 0;
async function inlineSvg(text, baseDir) {
  for (const [m, , ref] of [...text.matchAll(/url\(\s*(['"]?)([^'"()#\\]+\.svg)\1\s*\)/gi)]) {
    if (/^(data:|https?:|\/\/)/i.test(ref)) continue;
    try {
      const b64 = (await fs.readFile(path.join(outDir, decodeURIComponent(path.posix.join(baseDir, ref))))).toString('base64');
      text = text.split(m).join(`url(data:image/svg+xml;base64,${b64})`);
      nSvg++;
    } catch { /* não baixado: mantém */ }
  }
  return text;
}

const RX = /(?:https?:)?\/\/(?:www\.)?(?:morada\.ai|unpkg\.com|cdn\.jsdelivr\.net)(?:\/[^"'\s()<>,\\]*)?/g;
const RX_ESC = /https?:\\\/\\\/(?:www\.)?morada\.ai(?:\\\/[^"'\s()<>,\\]*)*/g;
const RX_ROOT = /(["'(=\s])(\/wp-(?:content|includes)\/[^"'\s()<>,\\]*)/g;

const report = [];
const built = [];
await fs.mkdir(origDir, { recursive: true });
for (const pg of pages.values()) {
  let html;
  if (pg.file) html = await fs.readFile(pg.file, 'utf8');
  else {
    const r = await get(pg.url);
    html = await r.text();
    if (!r.ok) { console.error(`ERRO ${r.status} em ${pg.url}: nada foi gravado`); process.exit(1); }
  }
  if (!/<html[\s>]/i.test(html) || html.length < 5000) { console.error(`ERRO: ${pg.url} não parece a página (${html.length} bytes)`); process.exit(1); }
  await fs.writeFile(path.join(origDir, pg.slug + '.html'), html);
  const dir = path.posix.dirname(pg.local) === '.' ? '' : path.posix.dirname(pg.local);
  const up = dir ? '../'.repeat(dir.split('/').length) : '';
  const c = { pagina: pg.path, links: 0, arquivos: 0, rastreadores: 0 };

  // 1) links <a href> para páginas copiadas
  html = html.replace(/(<a\b[^>]*?\bhref=)(["'])([^"']*)\2/gi, (m, pre, q, href) => {
    const u = toURL(href, pg.url);
    if (!u || !SITE_HOSTS.includes(u.hostname)) return m;
    const target = pages.get(normPath(u.pathname));
    if (!target) return m;
    c.links++;
    if (target === pg && u.hash) return `${pre}${q}${u.hash}${q}`;
    return `${pre}${q}${path.posix.relative(dir || '.', target.local)}${u.hash}${q}`;
  });
  // 2) arquivos do site e das CDNs
  const asset = s => { const u = toURL(s, pg.url); const rel = enqueue(u) ?? dirRelOf(u); return rel == null ? null : up + rel; };
  html = html.replace(RX, m => { const r = asset(m); if (r != null) { c.arquivos++; return r; } return m; });
  html = html.replace(RX_ESC, m => { const r = asset(m.replace(/\\\//g, '/')); if (r != null) { c.arquivos++; return r.replace(/\//g, '\\/'); } return m; });
  html = html.replace(RX_ROOT, (m, pre, p) => { const r = asset(p); if (r != null) { c.arquivos++; return pre + r; } return m; });
  // 3) rastreadores desligados sem apagar
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, body) => {
    if (!TRACKERS.some(t => attrs.includes(t) || body.includes(t))) return m;
    c.rastreadores++;
    return `<script type="text/plain" data-desligado-na-copia="rastreamento"${attrs.replace(/\stype=(["'])[^"']*\1/, '')}>${body}</script>`;
  });
  built.push({ pg, html, dir });
  report.push(c);
}

await drain();
for (const { pg, html, dir } of built) {
  const f = path.join(outDir, pg.local);
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, await inlineSvg(html, dir));
}
for (const [, v] of queue) {
  if (!/\.css$/i.test(v) || !done.get(v)?.ok) continue;
  const f = path.join(outDir, decodeURIComponent(v));
  await fs.writeFile(f, await inlineSvg(await fs.readFile(f, 'utf8'), path.posix.dirname(v)));
}

const all = [...done];
const fail = all.filter(([, v]) => !v || !v.ok).map(([rel, v]) => `${v?.status} ${v?.url || rel}`);
console.log(JSON.stringify({ paginas: report, svgEmbutidos: nSvg, arquivos: all.length, ok: all.length - fail.length,
  MB: +(all.reduce((s, [, v]) => s + (v?.bytes || 0), 0) / 1048576).toFixed(1), falhas: fail }, null, 1));
