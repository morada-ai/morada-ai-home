#!/usr/bin/env node
// Cópia offline de uma página: baixa os arquivos do próprio site (e das CDNs listadas),
// segue url() e @import dentro do CSS e reescreve tudo para caminho relativo.
// uso: node espelhar.mjs <html-bruto> <pasta-site>
import fs from 'node:fs/promises';
import path from 'node:path';

const [, , rawPath, outDir] = process.argv;
const PAGE = 'https://morada.ai/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const HOSTS = { 'morada.ai': '', 'www.morada.ai': '', 'unpkg.com': '_cdn/unpkg.com/', 'cdn.jsdelivr.net': '_cdn/cdn.jsdelivr.net/' };
const EXT = /\.(css|js|mjs|webp|avif|png|jpe?g|svg|gif|ico|mp4|webm|mp3|woff2?|ttf|otf|eot|json|lottie)$/i;
const TRACKERS = ['googletagmanager.com/gtm.js', 'googletagmanager.com/gtag/js', 't.contentsquare.net', 'posthog.init', 'snap.licdn.com', 'js.hs-scripts.com', 'stats.wp.com', '_stq.push'];

const unent = s => s.replace(/&#0?38;|&amp;/g, '&');
function toURL(s, base = PAGE) { try { return new URL(unent(s), base); } catch { return null; } }
// caminho relativo à raiz do site (forma codificada, como vai no HTML) ou null se não for baixável
function relOf(u) {
  if (!u || !(u.hostname in HOSTS)) return null;
  if (!EXT.test(u.pathname)) return null;
  return HOSTS[u.hostname] + u.pathname.replace(/^\//, '');
}
// pasta do site referenciada sem arquivo (ex.: URL do tema passada ao JS)
function dirRelOf(u) {
  if (!u || !['morada.ai', 'www.morada.ai'].includes(u.hostname)) return null;
  if (!/^\/wp-(content|includes)\//.test(u.pathname) || EXT.test(u.pathname) || u.pathname.includes('*')) return null;
  return u.pathname.replace(/^\//, '');
}

const queue = new Map(); // href sem query -> rel
const done = new Map();  // rel -> {ok, status, bytes}
function enqueue(u) {
  const rel = relOf(u);
  if (!rel) return null;
  const key = u.origin + u.pathname;
  if (!queue.has(key)) queue.set(key, rel);
  return rel;
}

async function fetchOne(key, rel) {
  const file = path.join(outDir, decodeURIComponent(rel));
  try {
    const r = await fetch(key, { headers: { 'User-Agent': UA, Referer: PAGE } });
    if (!r.ok) { done.set(rel, { ok: false, status: r.status }); return; }
    let buf = Buffer.from(await r.arrayBuffer());
    if (/\.css$/i.test(rel)) buf = Buffer.from(processCSS(buf.toString('utf8'), key, rel));
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buf);
    done.set(rel, { ok: true, status: r.status, bytes: buf.length });
  } catch (e) { done.set(rel, { ok: false, status: String(e.message || e) }); }
}

function processCSS(css, cssUrl, cssRel) {
  const fix = ref => {
    if (/^(data:|#|about:)/i.test(ref)) return null;
    const u = toURL(ref, cssUrl);
    const rel = enqueue(u);
    if (!rel) return null;
    return path.posix.relative(path.posix.dirname(cssRel), rel) + (u.hash || '');
  };
  css = css.replace(/url\(\s*(['"]?)([^'")]+?)\1\s*\)/g, (m, q, ref) => { const r = fix(ref.trim()); return r ? `url(${q}${r}${q})` : m; });
  css = css.replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, ref) => { const r = fix(ref); return r ? `@import ${q}${r}${q}` : m; });
  return css;
}

async function drain() {
  let pending;
  while ((pending = [...queue].filter(([, rel]) => !done.has(rel))).length) {
    pending.forEach(([, rel]) => done.set(rel, null)); // marca como em andamento
    for (let i = 0; i < pending.length; i += 8)
      await Promise.all(pending.slice(i, i + 8).map(([k, rel]) => fetchOne(k, rel)));
  }
}

// ---------- HTML ----------
let html = await fs.readFile(rawPath, 'utf8');
const RX = /(?:https?:)?\/\/(?:www\.)?(?:morada\.ai|unpkg\.com|cdn\.jsdelivr\.net)(?:\/[^"'\s()<>,\\]*)?/g;
const RX_ESC = /https?:\\\/\\\/(?:www\.)?morada\.ai(?:\\\/[^"'\s()<>,\\]*)*/g;
const RX_ROOT = /(["'(=\s])(\/wp-(?:content|includes)\/[^"'\s()<>,\\]*)/g;

function rewrite(s) {
  const u = toURL(s);
  if (!u) return null;
  if (['morada.ai', 'www.morada.ai'].includes(u.hostname) && (u.pathname === '/' || u.pathname === '') && u.hash) return u.hash; // âncora da própria home
  const rel = enqueue(u);
  if (rel) return rel;
  return dirRelOf(u);
}
let nAbs = 0, nEsc = 0, nRoot = 0;
html = html.replace(RX, m => { const r = rewrite(m); if (r != null) { nAbs++; return r; } return m; });
html = html.replace(RX_ESC, m => { const r = rewrite(m.replace(/\\\//g, '/')); if (r != null) { nEsc++; return r.replace(/\//g, '\\/'); } return m; });
html = html.replace(RX_ROOT, (m, pre, p) => { const r = rewrite(p); if (r != null) { nRoot++; return pre + r; } return m; });

// rastreadores: desligados sem apagar (type="text/plain"), para não gerar visita falsa no analytics
let nOff = 0;
html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, body) => {
  if (!TRACKERS.some(t => attrs.includes(t) || body.includes(t))) return m;
  nOff++;
  const a = attrs.replace(/\stype=(["'])[^"']*\1/, '');
  return `<script type="text/plain" data-desligado-na-copia="rastreamento"${a}>${body}</script>`;
});

await drain();

// SVG dentro de url() (máscara CSS) vira data: — máscara exige CORS, que file:// não tem,
// e url() em variável CSS é resolvido a partir do .css que a consome, não da página.
let nSvg = 0;
async function inlineSvg(text, baseRel) {
  const rx = /url\(\s*(['"]?)([^'"()#]+\.svg)\1\s*\)/gi;
  const hits = [...text.matchAll(rx)];
  for (const [m, , ref] of hits) {
    if (/^(data:|https?:|\/\/)/i.test(ref)) continue;
    const file = path.join(outDir, decodeURIComponent(path.posix.join(baseRel, ref)));
    try {
      const b64 = (await fs.readFile(file)).toString('base64');
      // sem aspas: o url() pode estar dentro de style="..." ou de string JS
      text = text.split(m).join(`url(data:image/svg+xml;base64,${b64})`);
      nSvg++;
    } catch { /* não baixado: mantém o caminho */ }
  }
  return text;
}
html = await inlineSvg(html, '');
for (const [, v] of queue) {
  if (!/\.css$/i.test(v) || !done.get(v)?.ok) continue;
  const f = path.join(outDir, decodeURIComponent(v));
  await fs.writeFile(f, await inlineSvg(await fs.readFile(f, 'utf8'), path.posix.dirname(v)));
}

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, 'index.html'), html);

const all = [...done];
const fail = all.filter(([, v]) => !v || !v.ok);
const bytes = all.reduce((s, [, v]) => s + (v?.bytes || 0), 0);
console.log(JSON.stringify({ reescritas: { absolutas: nAbs, escapadas: nEsc, raiz: nRoot }, rastreadoresDesligados: nOff, svgEmbutidos: nSvg,
  arquivos: all.length, ok: all.length - fail.length, MB: +(bytes / 1048576).toFixed(1), falhas: fail }, null, 1));
