#!/usr/bin/env node
/**
 * Gera o PDF da apostila de forma reproduzível, sem depender de internet.
 *
 * Uso:
 *   node tools/gerar-pdf.mjs material.json [saida.pdf]
 *   node tools/gerar-pdf.mjs --demo [saida.pdf]
 *
 * Requer o pacote "playwright" com Chromium instalado (npx playwright install chromium).
 * As fontes (Fredoka, Caveat, Nunito, Patrick Hand, licença OFL) ficam em assets/fontes e são
 * embutidas no HTML; qualquer pedido de rede é bloqueado. Se alguma fonte não carregar, o script falha.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = require(path.join(ROOT, 'js/core.js'));

export const FONTES = [
  { family: 'Fredoka', weight: 600, file: 'fredoka-latin-600-normal.woff2' },
  { family: 'Fredoka', weight: 700, file: 'fredoka-latin-700-normal.woff2' },
  { family: 'Caveat', weight: 600, file: 'caveat-latin-600-normal.woff2' },
  { family: 'Caveat', weight: 700, file: 'caveat-latin-700-normal.woff2' },
  { family: 'Nunito', weight: 400, file: 'nunito-latin-400-normal.woff2' },
  { family: 'Nunito', weight: 600, file: 'nunito-latin-600-normal.woff2' },
  { family: 'Nunito', weight: 700, file: 'nunito-latin-700-normal.woff2' },
  { family: 'Nunito', weight: 800, file: 'nunito-latin-800-normal.woff2' },
  { family: 'Patrick Hand', weight: 400, file: 'patrick-hand-latin-400-normal.woff2' },
];

/* Tudo que não declara fonte própria usa Nunito, para o PDF não depender das fontes do sistema. */
const CSS_FONTES_PADRAO = 'html,body,button,input,textarea,select{font-family:"Nunito","MathLabSimbolos",sans-serif}svg text,svg tspan{font-family:"Nunito","MathLabSimbolos",sans-serif!important}.math{font-family:"Nunito","MathLabSimbolos",sans-serif!important}';

/* Símbolos que Nunito e Fredoka não têm (setas, operadores, letras gregas) vêm do Noto Sans Math, também OFL.
   Entra como último item da lista de fontes, então só é usado para o caractere que as outras não têm. */
const ARQUIVO_SIMBOLOS = 'noto-sans-math-latin-400-normal.woff2';
const FAMILIA_SIMBOLOS = 'MathLabSimbolos';

export function cssFontesEmbutidas(root = ROOT) {
  const ler = (f) => fs.readFileSync(path.join(root, 'assets/fontes', f)).toString('base64');
  const faces = FONTES.map((f) => `@font-face{font-family:"${f.family}";font-weight:${f.weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${ler(f.file)}) format("woff2")}`);
  faces.push(`@font-face{font-family:"${FAMILIA_SIMBOLOS}";font-weight:100 900;font-style:normal;font-display:block;src:url(data:font/woff2;base64,${ler(ARQUIVO_SIMBOLOS)}) format("woff2")}`);
  return faces.join('\n');
}

/** Troca os links do Google Fonts pelas fontes locais embutidas. */
export function htmlComFontesLocais(html, root = ROOT) {
  const semLinks = html.replace(/<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>/g, '')
    .replace(/"(Nunito|Fredoka|Caveat|Patrick Hand)"/g, `"$1","${FAMILIA_SIMBOLOS}"`);
  return semLinks.replace('</head>', `<base href="${pathToFileURL(root + path.sep).href}"><style id="fontes-locais">${cssFontesEmbutidas(root)}\n${CSS_FONTES_PADRAO}</style></head>`);
}

/** Zera datas e identificador do PDF para que duas execuções com o mesmo material saiam idênticas. */
export function normalizarPdf(buf) {
  let s = buf.toString('latin1');
  s = s.replace(/\/(CreationDate|ModDate)\s*\(D:[^)]*\)/g, (_, k) => `/${k} (D:20000101000000+00'00')`);
  s = s.replace(/\/ID\s*\[\s*<[0-9A-Fa-f]+>\s*<[0-9A-Fa-f]+>\s*\]/g, '/ID [<00000000000000000000000000000000> <00000000000000000000000000000000>]');
  return Buffer.from(s, 'latin1');
}

/** Lista as fontes do sistema que o Chromium precisou usar (o que não veio de assets/fontes). Emoji é esperado. */
async function fontesNaoEmbutidas(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '.mlbook *' });
  const usadas = new Map();
  for (const nodeId of nodeIds) {
    let fonts = [];
    try { ({ fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })); } catch { continue; }
    for (const f of fonts) if (!f.isCustomFont) usadas.set(f.familyName, (usadas.get(f.familyName) || 0) + f.glyphCount);
  }
  return [...usadas.entries()].map(([familia, glifos]) => ({ familia, glifos }));
}

export async function gerarPdf(material, saida, { root = ROOT } = {}) {
  const { chromium } = require('playwright');
  const m = C.normalize(material);
  const html = htmlComFontesLocais(C.toApostila(m, {}), root);
  const tmp = path.join(os.tmpdir(), `mathlab-pdf-${process.pid}.html`);
  fs.writeFileSync(tmp, html);
  const browser = await chromium.launch();
  const bloqueados = [];
  try {
    const page = await browser.newPage();
    await page.route('**/*', (route) => {
      const u = route.request().url();
      if (u.startsWith('file:') || u.startsWith('data:')) return route.continue();
      bloqueados.push(u); return route.abort();
    });
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    const faltando = await page.evaluate(async (fontes) => { await document.fonts.load('400 16px "MathLabSimbolos"', '→∑'); await Promise.all(fontes.map((f) => document.fonts.load(`${f.weight} 16px "${f.family}"`, 'Aáç'))); return fontes.filter((f) => !document.fonts.check(`${f.weight} 16px "${f.family}"`)).map((f) => `${f.family} ${f.weight}`); }, FONTES);
    if (faltando.length) throw new Error('Fontes não carregaram: ' + faltando.join(', '));
    const paginasNoDom = await page.evaluate(() => document.querySelectorAll('.mlpage').length);
    const fontesDoSistema = await fontesNaoEmbutidas(page);
    const paginasCortadas = await page.evaluate(() => [...document.querySelectorAll('.mlpage')].map((p, i) => [i + 1, p.scrollHeight - p.clientHeight]).filter(([, d]) => d > 2).map(([n]) => n));
    const bruto = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const pdf = normalizarPdf(bruto);
    fs.writeFileSync(saida, pdf);
    const paginasNoPdf = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    return { saida, bytes: pdf.length, paginasNoDom, paginasNoPdf, bloqueados, fontesDoSistema, paginasCortadas };
  } finally {
    await browser.close(); fs.rmSync(tmp, { force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [entrada, saidaArg] = process.argv.slice(2);
  if (!entrada) { console.error('Uso: node tools/gerar-pdf.mjs material.json|--demo [saida.pdf]'); process.exit(2); }
  let material;
  if (entrada === '--demo') material = C.demo();
  else {
    const r = C.importFromText(fs.readFileSync(entrada, 'utf8'));
    if (!r.ok) { console.error('Não consegui importar o material: ' + r.error); process.exit(2); }
    r.warnings.forEach((w) => console.error('Aviso: ' + w));
    material = r.material;
  }
  const saida = path.resolve(saidaArg || (entrada === '--demo' ? 'apostila-demo.pdf' : entrada.replace(/\.json$/i, '') + '.pdf'));
  const r = await gerarPdf(material, saida);
  console.log(`PDF: ${r.saida} (${r.bytes} bytes, ${r.paginasNoPdf} páginas)`);
  if (r.paginasNoPdf !== r.paginasNoDom) { console.error(`ERRO: a apostila tem ${r.paginasNoDom} páginas, mas o PDF saiu com ${r.paginasNoPdf}. Alguma página transbordou.`); process.exit(1); }
  if (r.paginasCortadas.length) { console.error(`ERRO: o conteúdo das páginas ${r.paginasCortadas.join(', ')} passa do limite da folha e foi cortado.`); process.exit(1); }
  const alemDeEmoji = r.fontesDoSistema.filter((f) => !/emoji/i.test(f.familia));
  if (r.fontesDoSistema.some((f) => /emoji/i.test(f.familia))) console.error('Aviso: emojis usam a fonte do sistema (Noto Color Emoji). O desenho do emoji pode variar entre computadores.');
  if (alemDeEmoji.length) console.error('Aviso: caracteres sem fonte embutida caíram em fontes do sistema: ' + alemDeEmoji.map((f) => `${f.familia} (${f.glifos})`).join(', ') + '. O PDF pode variar entre computadores.');
  if (r.bloqueados.length) console.error('Pedidos de rede bloqueados: ' + r.bloqueados.length);
}
