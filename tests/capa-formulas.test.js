const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');

const semKatexHtml = (h) => h.replace(/<span class="katex-html"[\s\S]*?<\/span><\/span><\/span><\/span>/g, '[html]').replace(/<annotation[\s\S]*?<\/annotation>/g, '');

test('fórmulas: conjuntos, reticências, graus e texto saem como matemática, não como LaTeX cru', () => {
  const h = C.renderMarkdown('Em $\\mathbb{Z} = \\{\\dots, -1, 0, 1, \\dots\\}$ e $-3\\ ^\\circ\\text{C}$ e $a, b \\in \\mathbb{Z}$.');
  assert.match(h, /class="katex"/);
  assert.doesNotMatch(semKatexHtml(h), /\\mathbb|\\dots|\\circ|\\text|\\in\b/);
});

test('fórmula em bloco ($$) não fica dentro de <p>', () => {
  const h = C.renderMarkdown('Veja:\n\n$$(-6) + (+4) = -2$$\n\nFim.');
  assert.match(h, /<div class="math math-display">/);
  assert.doesNotMatch(h, /<p><div/);
  assert.doesNotMatch(h, /<\/div><\/p>/);
});

test('moeda: R$ solto e $-R$ 65,00$ escrito pela IA viram texto, não fórmula quebrada', () => {
  const h = C.renderMarkdown('Saldo de R$ 40,00 e compra de R$ 65,00. Resposta: $-R$ 65,00$ (ou R$ 65,00 negativos).');
  assert.doesNotMatch(h, /class="katex"/);
  assert.match(h, /-R\$ 65,00 \(ou R\$ 65,00 negativos\)/);
  assert.match(h, /Saldo de R\$ 40,00 e compra de R\$ 65,00\./);
});

test('Capa Clean nunca leva foto nem avatar, nem quando o avatar foi escolhido', () => {
  const m = C.demo();
  m.poster.avatarChoice = 'avatar-prof-ale-1.jpg';
  const h = C.renderCleanCover(m);
  assert.doesNotMatch(h, /avatar-prof-ale|mlclean-avatar|Foto do autor/);
  assert.match(h, /mlclean-emblem/);
});

test('arte da capa: só PNG/JPEG/WebP em data URI; SVG e lixo são ignorados; alt escapado', () => {
  const ok = 'data:image/png;base64,iVBORw0KGgo=';
  assert.equal(C.coverArtOk(ok), true);
  for (const ruim of ['data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', 'javascript:alert(1)', 'data:image/png;base64,"><script>', '', null]) assert.equal(C.coverArtOk(ruim), false, String(ruim));
  const m = C.demo(); m.poster.coverArt = ok; m.poster.coverArtAlt = 'Reta "numérica" <b>azul</b> com setas';
  const n = C.normalize(m);
  assert.equal(n.poster.coverArt, ok);
  const h = C.renderCleanCover(n);
  assert.match(h, /<figure class="mlclean-art"><img src="data:image\/png;base64,iVBORw0KGgo=" alt="Reta &quot;numérica&quot; &lt;b&gt;azul&lt;\/b&gt; com setas">/);
  assert.doesNotMatch(h, /mlclean-emblem"/);
  m.poster.coverArt = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
  assert.equal(C.normalize(m).poster.coverArt, '');
});

test('prompt da capa pede só a arte: sem texto, sem pessoa, 3:4, e cita o assunto', () => {
  const m = C.demo();
  const p = C.buildCoverPrompt(m);
  assert.match(p, /ILUSTRAÇÃO DE CAPA/);
  assert.match(p, /3:4/);
  assert.match(p, /PROIBIDO[^\n]*texto[^\n]*rostos, pessoas, personagens, mascotes/);
  assert.ok(p.includes(m.topic || m.title));
  assert.doesNotMatch(p, /pôster infográfico|CAIXAS NUMERADAS|Professor Alê/);
  assert.match(C.buildImagePrompt(m), /pôster infográfico/, 'o prompt do infográfico continua separado');
});
