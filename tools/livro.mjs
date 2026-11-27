#!/usr/bin/env node
/**
 * Livro de alta qualidade: junta materiais do MathLab e gera Markdown, PDF (XeLaTeX) e EPUB.
 *
 * Uso:
 *   node tools/livro.mjs material1.json [material2.json ...] [--saida pasta] [--titulo "..."] [--subtitulo "..."]
 *        [--autor "..."] [--formato pdf,epub,md] [--papel a4|a5] [--modelo didatico|narrativo] [--sangria 3] [--pdfa]
 *        [--editora ".."] [--isbn 978..] [--edicao "1ª"] [--ano 2026] [--licenca ".."] [--contato ".."] [--sem-gabarito] [--indice] [--sem-glossario] [--sem-referencias]
 *   node tools/livro.mjs --demo
 *
 * Requer Pandoc 3 e XeLaTeX (TeX Live) instalados na sua máquina. Para PDF com hifenização correta em português,
 * instale também o pacote de idioma do TeX Live (texlive-lang-portuguese no Debian/Ubuntu).
 * A ideia do fluxo Markdown + Pandoc + LaTeX vem do projeto romankurnovskii/markdown-to-pdf-book-converter (MIT).
 * Os arquivos desta pasta (caixas.lua, header.tex, epub.css) são originais do MathLab.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = require(path.join(ROOT, 'js/core.js'));
const L = require(path.join(ROOT, 'js/livro.js'));
const DIR = path.join(ROOT, 'tools/livro');

const slug = (s) => String(s || 'livro').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'livro';

export function lerArgs(argv) {
  const a = { arquivos: [], saida: 'livro-saida', formato: ['pdf', 'epub', 'md'], papel: 'a4', papelDado: false, sangria: 0, pdfa: false, modelo: 'didatico', demo: false, opts: {} };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => { if (i + 1 >= argv.length) throw new Error('Falta o valor depois de ' + k); return argv[++i]; };
    if (k === '--saida') a.saida = v();
    else if (k === '--titulo') a.opts.title = v();
    else if (k === '--subtitulo') a.opts.subtitle = v();
    else if (k === '--autor') a.opts.author = v();
    else if (k === '--formato') a.formato = v().split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    else if (k === '--papel') { a.papel = v().toLowerCase(); a.papelDado = true; }
    else if (k === '--modelo') a.modelo = v().toLowerCase();
    else if (k === '--pdfa') a.pdfa = true;
    else if (k === '--sangria') a.sangria = Number(v().replace(',', '.'));
    else if (['--editora', '--isbn', '--edicao', '--ano', '--licenca', '--contato'].includes(k)) (a.opts.credits ||= {})[k.slice(2)] = v();
    else if (k === '--sem-gabarito') a.opts.answers = false;
    else if (k === '--sem-glossario') a.opts.glossary = false;
    else if (k === '--indice') a.opts.index = true;
    else if (k === '--sem-referencias') a.opts.references = false;
    else if (k === '--demo') a.demo = true;
    else if (k.startsWith('--')) throw new Error('Opção desconhecida: ' + k);
    else a.arquivos.push(k);
  }
  if (!Number.isFinite(a.sangria) || a.sangria < 0 || a.sangria > 10) throw new Error('--sangria aceita um valor em milímetros entre 0 e 10 (a gráfica costuma pedir 3).');
  if (!['didatico', 'narrativo'].includes(a.modelo)) throw new Error('--modelo aceita didatico ou narrativo.');
  if (a.modelo === 'narrativo' && !a.papelDado) a.papel = 'a5';
  if (!['a4', 'a5'].includes(a.papel)) throw new Error('--papel aceita a4 ou a5.');
  const ruim = a.formato.filter((f) => !['pdf', 'epub', 'md'].includes(f));
  if (ruim.length) throw new Error('Formato desconhecido: ' + ruim.join(', ') + '. Use pdf, epub ou md.');
  return a;
}

export function lerMateriais(arquivos) {
  const out = [];
  for (const f of arquivos) {
    let j;
    try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { throw new Error('Não consegui ler ' + f + ': ' + e.message); }
    (Array.isArray(j) ? j : [j]).forEach((m) => out.push(m));
  }
  return out;
}

function pandoc(args, cwd) {
  const r = spawnSync('pandoc', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error('Não consegui executar o Pandoc: ' + r.error.message);
  return r;
}

export function checarFerramentas(formatos) {
  const p = spawnSync('pandoc', ['--version'], { encoding: 'utf8' });
  if (p.error || p.status !== 0) throw new Error('Pandoc não encontrado. Instale o Pandoc 3 (https://pandoc.org/installing.html) e rode de novo. Para só gerar o Markdown, use --formato md.');
  if (formatos.includes('pdf')) {
    const x = spawnSync('xelatex', ['--version'], { encoding: 'utf8' });
    if (x.error || x.status !== 0) throw new Error('XeLaTeX não encontrado. Instale o TeX Live (ou MacTeX no Mac) para gerar o PDF, ou use --formato epub,md.');
  }
}

function capaSvg(titulo, autor) {
  const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const linhas = [];
  let atual = '';
  String(titulo).split(/\s+/).forEach((w) => { if ((atual + ' ' + w).trim().length > 18) { linhas.push(atual.trim()); atual = w; } else atual += ' ' + w; });
  if (atual.trim()) linhas.push(atual.trim());
  const t = linhas.slice(0, 5).map((l, i) => '<text x="90" y="' + (520 + i * 86) + '" font-size="72" font-weight="700" fill="#fff">' + e(l) + '</text>').join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800" viewBox="0 0 1200 1800" font-family="Helvetica, Arial, sans-serif"><rect width="1200" height="1800" fill="#14264f"/><rect x="90" y="400" width="260" height="12" fill="#f2b705"/>' + t +
    '<text x="90" y="1560" font-size="46" font-weight="700" fill="#fff">' + e(autor) + '</text><text x="90" y="1620" font-size="30" fill="#f2b705" letter-spacing="3">MATHLAB AULAS VISUAIS</text></svg>';
}

// Converte o PDF para PDF/A-2b com Ghostscript (arquivamento de longo prazo: fontes embutidas, cores em sRGB).
// Não torna o PDF acessível (sem tags) e não é validado aqui com veraPDF: valide antes de enviar a um repositório.
export function converterPdfA(pdf, titulo, autor) {
  const v = spawnSync('gs', ['--version'], { encoding: 'utf8' });
  if (v.error || v.status !== 0) throw new Error('Ghostscript não encontrado. Instale (brew install ghostscript / apt install ghostscript) para usar --pdfa.');
  const raiz = ['/usr/share/ghostscript', '/usr/local/share/ghostscript', '/opt/homebrew/share/ghostscript', '/usr/share/color/icc/ghostscript'];
  let icc = '';
  for (const r of raiz) {
    if (!fs.existsSync(r)) continue;
    const achado = [path.join(r, 'default_rgb.icc'), ...fs.readdirSync(r).flatMap((d) => [path.join(r, d, 'iccprofiles', 'default_rgb.icc')])].find((f) => fs.existsSync(f));
    if (achado) { icc = achado; break; }
  }
  if (!icc) throw new Error('Não achei o perfil de cor sRGB do Ghostscript (default_rgb.icc). Reinstale o Ghostscript completo.');
  const ps = (t) => '(' + String(t).replace(/[\\()]/g, (c) => '\\' + c) + ')';
  const def = path.join(path.dirname(pdf), '.pdfa_def.ps'), tmp = pdf + '.pdfa.tmp';
  fs.writeFileSync(def, '%!\n[ /Title ' + ps(titulo) + ' /Author ' + ps(autor) + ' /DOCINFO pdfmark\n' +
    '[/_objdef {icc_PDFA} /type /stream /OBJ pdfmark\n[{icc_PDFA} <</N 3>> /PUT pdfmark\n[{icc_PDFA} ' + ps(icc) + ' (r) file /PUT pdfmark\n' +
    '[/_objdef {OutputIntent_PDFA} /type /dict /OBJ pdfmark\n[{OutputIntent_PDFA} <</Type /OutputIntent /S /GTS_PDFA1 /DestOutputProfile {icc_PDFA} /OutputConditionIdentifier (sRGB) /Info (sRGB)>> /PUT pdfmark\n' +
    '[{Catalog} <</OutputIntents [ {OutputIntent_PDFA} ]>> /PUT pdfmark\n');
  const r = spawnSync('gs', ['-dPDFA=2', '-dBATCH', '-dNOPAUSE', '-dQUIET', '-dNOSAFER', '-dPDFACompatibilityPolicy=1', '-sColorConversionStrategy=RGB', '-sDEVICE=pdfwrite', '-sOutputFile=' + tmp, def, pdf], { encoding: 'utf8' });
  fs.rmSync(def, { force: true });
  if (r.status !== 0 || !fs.existsSync(tmp)) { fs.rmSync(tmp, { force: true }); throw new Error('O Ghostscript falhou ao converter para PDF/A:\n' + String(r.stderr || r.stdout).split('\n').slice(0, 15).join('\n')); }
  fs.renameSync(tmp, pdf);
}

export function gerar(args) {
  const materiais = args.demo ? [C.demo()] : lerMateriais(args.arquivos);
  if (!materiais.length) throw new Error('Passe ao menos um arquivo de material (.json) ou use --demo.');
  const r = L.compileBookMarkdown(materiais, args.opts);
  if (!r.ok) throw new Error(r.error);
  const saida = path.resolve(args.saida);
  fs.mkdirSync(saida, { recursive: true });
  const base = slug(r.title);
  fs.writeFileSync(path.join(saida, base + '.md'), r.markdown);
  r.files.forEach((f) => { const p = path.join(saida, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.content); });
  const feitos = [path.join(saida, base + '.md')];
  const avisos = r.warnings.slice();
  const comuns = ['-f', 'markdown+hard_line_breaks', '--lua-filter', path.join(DIR, 'caixas.lua'), '--resource-path', saida, '--toc', '--toc-depth=1', '--top-level-division=chapter', '--number-sections', '--standalone'];

  if (args.formato.includes('pdf')) {
    const a5 = args.papel === 'a5';
    const pdf = path.join(saida, base + '.pdf');
    const nar = args.modelo === 'narrativo';
    const cabecalhos = ['-H', path.join(DIR, 'header.tex')].concat(nar ? ['-H', path.join(DIR, 'header-narrativo.tex')] : []);
    const b = args.sangria;
    const TRIM = a5 ? [148, 210] : [210, 297];
    const mm = (cm) => (cm * 10 + b) + 'mm';
    const margens = nar ? 'inner=' + mm(2.2) + ',outer=' + mm(1.7) + ',top=' + mm(2) + ',bottom=' + mm(2.2) : 'margin=' + mm(a5 ? 1.8 : 2.5);
    const geom = ['-V', 'geometry:' + (b > 0 ? 'paperwidth=' + (TRIM[0] + 2 * b) + 'mm,paperheight=' + (TRIM[1] + 2 * b) + 'mm,' : '') + margens];
    const res = pandoc([path.basename(feitos[0]), '-o', pdf, ...comuns, '--pdf-engine=xelatex', ...cabecalhos,
      '-V', 'documentclass=book', '-V', 'classoption=' + (nar ? 'twoside' : 'oneside'), ...(nar ? ['-V', 'classoption=openany'] : []), '-V', 'classoption=' + (a5 ? '10pt' : '11pt'), ...(b > 0 ? [] : ['-V', 'papersize=' + args.papel]),
      ...geom, '-V', 'secnumdepth=0', '-V', 'indent=true', '-V', 'linestretch=' + (nar ? '1.2' : '1.12'), '-V', 'colorlinks=true', '-V', 'linkcolor=ml-navy', '-V', 'urlcolor=ml-azul', '-V', 'toccolor=ml-navy'], saida);
    if (res.status !== 0) throw new Error('O Pandoc/XeLaTeX falhou ao gerar o PDF:\n' + String(res.stderr).split('\n').slice(0, 25).join('\n'));
    if (/Missing character|Hyphenation patterns .* not found|No hyphenation patterns/i.test(res.stderr)) avisos.push('O LaTeX avisou sobre caracteres ou hifenização. Instale o pacote de idioma do TeX Live para português.');
    if (b > 0) avisos.push('PDF com sangria de ' + b + ' mm: o tamanho da página é o formato final + ' + (2 * b) + ' mm em cada eixo, sem marcas de corte. Informe à gráfica o formato final (' + TRIM[0] + ' x ' + TRIM[1] + ' mm) e a sangria.');
    if (args.pdfa) { converterPdfA(pdf, r.title, r.author); avisos.push('PDF/A-2b gerado com Ghostscript (fontes embutidas, cores sRGB). Não foi validado com veraPDF e não é um PDF acessível (sem tags).'); }
    feitos.push(pdf);
  }
  if (args.formato.includes('epub')) {
    const epub = path.join(saida, base + '.epub');
    const extra = ['--css', path.join(DIR, 'epub.css'), '--mathml', '--split-level=1'];
    const rs = spawnSync('rsvg-convert', ['--version'], { encoding: 'utf8' });
    if (!rs.error && rs.status === 0) {
      const svg = path.join(saida, 'capa-livro.svg'), png = path.join(saida, 'capa-livro.png');
      fs.writeFileSync(svg, capaSvg(r.title, r.author));
      if (spawnSync('rsvg-convert', ['-o', png, svg]).status === 0) extra.push('--epub-cover-image', png);
    }
    const res = pandoc([path.basename(feitos[0]), '-o', epub, ...comuns, ...extra], saida);
    if (res.status !== 0) throw new Error('O Pandoc falhou ao gerar o EPUB:\n' + String(res.stderr).split('\n').slice(0, 25).join('\n'));
    for (const f of ['capa-livro.svg', 'capa-livro.png']) fs.rmSync(path.join(saida, f), { force: true });
    feitos.push(epub);
  }
  if (!args.formato.includes('md')) fs.rmSync(feitos[0], { force: true });
  return { feitos, avisos, capitulos: r.chapters, figuras: r.figures, validados: r.validated };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = lerArgs(process.argv.slice(2));
    checarFerramentas(args.formato);
    const r = gerar(args);
    console.log('Livro gerado: ' + r.capitulos + ' capítulo(s), ' + r.figuras + ' figura(s), ' + r.validados + ' com validação do professor.');
    r.feitos.forEach((f) => console.log('  ' + f));
    r.avisos.forEach((w) => console.log('Aviso: ' + w));
  } catch (e) {
    console.error('Erro: ' + e.message);
    process.exit(1);
  }
}
