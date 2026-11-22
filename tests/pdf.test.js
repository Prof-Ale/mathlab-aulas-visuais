const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const C = require('../js/core.js');

const ROOT = path.join(__dirname, '..');
const ferramenta = () => import('../tools/gerar-pdf.mjs');

let temPlaywright = true;
try { require('playwright'); } catch { temPlaywright = false; }

test('CSS de impressão zera a margem do body: sem isso cada folha A4 transborda para a seguinte', () => {
  const html = C.toApostila(C.normalize(C.demo()), {});
  const bloco = html.match(/@media print\{html,body\{[^}]*\}/);
  assert.ok(bloco, 'bloco de impressão sem reset de html e body');
  assert.match(bloco[0], /margin:0!important/);
});

test('as fontes do PDF estão no repositório, com a licença de cada uma', async () => {
  const { FONTES } = await ferramenta();
  for (const f of FONTES) assert.ok(fs.statSync(path.join(ROOT, 'assets/fontes', f.file)).size > 5000, f.file);
  for (const n of ['fredoka', 'caveat', 'nunito', 'patrick-hand', 'noto-sans-math']) {
    assert.match(fs.readFileSync(path.join(ROOT, `assets/fontes/LICENSE-${n}.txt`), 'utf8'), /SIL Open Font License/);
  }
});

test('o HTML do PDF não pede nada à internet: troca Google Fonts por fontes embutidas', async () => {
  const { htmlComFontesLocais } = await ferramenta();
  const bruto = C.toApostila(C.normalize(C.demo()), {});
  assert.match(bruto, /fonts\.googleapis\.com/);
  const html = htmlComFontesLocais(bruto);
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/);
  assert.match(html, /@font-face\{font-family:"Fredoka"/);
  assert.match(html, /font-family:"MathLabSimbolos"/);
  assert.match(html, /<base href="file:/);
});

test('normalizarPdf deixa iguais dois PDFs que só diferem em data e identificador', async () => {
  const { normalizarPdf } = await ferramenta();
  const mk = (d, id) => Buffer.from(`%PDF-1.4\n/CreationDate (D:${d}Z) /ModDate (D:${d}Z)\ntrailer << /ID [<${id}> <${id}>] >>\n`, 'latin1');
  const a = mk('20261122100000', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'), b = mk('20271231235959', 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
  assert.notDeepStrictEqual(a, b);
  assert.deepStrictEqual(normalizarPdf(a), normalizarPdf(b));
});

test('PDF da apostila: uma folha por página, sem corte, sem rede, byte a byte reproduzível', { skip: !temPlaywright && 'playwright não instalado', timeout: 120000 }, async () => {
  const { gerarPdf } = await ferramenta();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mlpdf-'));
  const r1 = await gerarPdf(C.demo(), path.join(dir, 'a.pdf'));
  const r2 = await gerarPdf(C.demo(), path.join(dir, 'b.pdf'));
  assert.strictEqual(r1.paginasNoPdf, r1.paginasNoDom, 'alguma página transbordou para a seguinte');
  assert.deepStrictEqual(r1.paginasCortadas, []);
  assert.deepStrictEqual(r1.bloqueados, []);
  assert.deepStrictEqual(fs.readFileSync(path.join(dir, 'a.pdf')), fs.readFileSync(path.join(dir, 'b.pdf')));
  const txt = fs.readFileSync(path.join(dir, 'a.pdf')).toString('latin1');
  for (const fam of ['Fredoka', 'Nunito', 'Caveat']) assert.ok(new RegExp('/BaseFont\\s*/[A-Z]{6}\\+' + fam).test(txt), fam + ' não está embutida no PDF');
  assert.ok(!/\+Inter-|\+LiberationSans/.test(txt), 'caiu em fonte do sistema');
});
