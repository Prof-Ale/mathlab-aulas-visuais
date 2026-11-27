'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const C = require('../js/core.js');
const L = require('../js/livro.js');

const mat = (title, extra) => Object.assign({
  title, author: 'Prof. Teste', discipline: 'Matemática', level: '8º ano', objectives: ['Resolver sistemas'],
  blocks: [
    { type: 'conceito', title: 'Sistema linear', content: 'Um **sistema linear** é um conjunto de equações com as mesmas incógnitas. Outra frase qualquer aqui.' },
    { type: 'exercicios', title: 'Pratique', content: '1. Resolva x + y = 3.' },
    { type: 'gabarito', title: 'Respostas', content: '1. x = 1 e y = 2.' },
  ],
  references: [{ authors: 'Lima, E.', title: 'Álgebra', year: '2010', verified: false }],
}, extra || {});

test('compila capa, sumário, capítulos, glossário, respostas e referências', () => {
  const r = L.compileBook([mat('Sistemas'), mat('Funções', { blocks: [{ type: 'conceito', title: 'Função afim', content: 'A **função afim** é uma regra do tipo f(x) = ax + b.' }] })], { title: 'Caderno do 8º ano' });
  assert.ok(r.ok); assert.equal(r.chapters, 2);
  for (const k of ['Caderno do 8º ano', 'id="cap-1"', 'id="cap-2"', 'id="glossario"', 'id="respostas"', 'id="referencias"', 'href="#cap-2"']) assert.ok(r.html.includes(k), k);
  assert.deepEqual(r.toc.map((t) => t.href), ['#cap-1', '#cap-2', '#glossario', '#respostas', '#referencias']);
});
test('o gabarito sai do capítulo e vai para o caderno de respostas', () => {
  const r = L.compileBook([mat('Sistemas')]);
  const cap = r.html.slice(r.html.indexOf('id="cap-1"'), r.html.indexOf('id="glossario"'));
  assert.ok(!cap.includes('x = 1 e y = 2')); assert.ok(r.html.slice(r.html.indexOf('id="respostas"')).includes('x = 1 e y = 2'));
  const sem = L.compileBook([mat('Sistemas')], { answers: false });
  assert.ok(sem.html.includes('x = 1 e y = 2') && !sem.html.includes('id="respostas"'));
});
test('glossário: ordenado, sem duplicata, com capítulo de origem', () => {
  const r = L.compileBook([mat('A'), mat('B')]);
  const termos = r.glossary.map((g) => g.termo);
  assert.equal(new Set(termos.map((t) => t.toLowerCase())).size, termos.length);
  assert.deepEqual(termos, [...termos].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  assert.ok(r.glossary.every((g) => g.cap === 1)); assert.ok(termos.includes('Sistema linear'));
});
test('referências repetidas aparecem uma vez e a conferida vence', () => {
  const a = mat('A'), b = mat('B', { references: [{ authors: 'Lima, E.', title: 'Álgebra', year: '2010', verified: true, accessLevel: 'FULL' }] });
  const r = L.compileBook([a, b]);
  assert.equal(r.references.length, 1); assert.equal(r.references[0].verified, true);
});
test('honestidade: livro com capítulo não validado avisa e nunca diz validado', () => {
  const r = L.compileBook([mat('A')]);
  assert.equal(r.validated, 0); assert.match(r.html, /ainda não é uma obra validada/); assert.ok(!/Todos os capítulos têm validação/.test(r.html));
});
test('honestidade: só afirma validação quando todos os capítulos têm validação atualizada', () => {
  const m = C.normalize(mat('A'));
  m.revisao = { aprovado: true, revisadoPor: 'Alê', data: '2026-11-23', hash: C.hashConteudo(m) };
  const ok = L.compileBook([m]); assert.equal(ok.validated, 1); assert.match(ok.html, /Todos os capítulos têm validação/);
  m.blocks[0].content += ' alterado';
  const velho = L.compileBook([m]); assert.equal(velho.validated, 0); assert.match(velho.html, /desatualizada/);
});
test('avisos: título repetido, capítulo vazio, exercício sem gabarito', () => {
  const r = L.compileBook([mat('Igual'), mat('Igual'), mat('Vazio', { blocks: [] }), mat('Sem gab', { blocks: [{ type: 'exercicios', title: 'E', content: '1. a' }] })]);
  assert.equal(r.warnings.length, 3);
});
test('lista vazia e entradas inválidas', () => {
  assert.equal(L.compileBook([]).ok, false); assert.equal(L.compileBook(null).ok, false);
  assert.equal(L.compileBook([null, 5, mat('Ok')]).chapters, 1);
});
test('segurança: HTML nos textos é escapado e SVG é sanitizado', () => {
  const r = L.compileBook([mat('<img src=x onerror=alert(1)>', { blocks: [{ type: 'visual', title: '<script>x</script>', content: 'ok', svg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle r="3" onclick="x()"/></svg>' }] })]);
  assert.ok(!r.html.includes('<img src=x')); assert.ok(!/<script>(x|alert)/.test(r.html)); assert.ok(!/onclick=/.test(r.html));
});
test('é determinístico e autocontido (sem recursos externos)', () => {
  const a = L.compileBook([mat('A')], { title: 'T' }).html, b = L.compileBook([mat('A')], { title: 'T' }).html;
  assert.equal(a, b); assert.ok(!/(src|href)="https?:/.test(a));
});
test('integração: carregado no site e no standalone, tela usa o compilador', () => {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  assert.ok(html.indexOf('js/dominios.js') < html.indexOf('js/livro.js') && html.indexOf('js/livro.js') < html.indexOf('js/app.js'));
  assert.match(fs.readFileSync(__dirname + '/../tools/build-standalone.js', 'utf8'), /js\/livro\.js/);
  const app = fs.readFileSync(__dirname + '/../js/app.js', 'utf8');
  for (const k of ['vLivro', 'compileBook', 'dlbook2']) assert.ok(app.includes(k), k);
});

// ---------- Exportação em Markdown (Pandoc) para o livro de alta qualidade ----------
const matMd = () => mat('Equações', {
  blocks: [
    { type: 'conceito', title: 'Equação', content: 'Sendo \\(a \\neq 0\\), a solução é\n\n\\[x = -\\frac{b}{a}\\]\n\nPreço: R$ 12,50 e saldo $-R$ 60$ e $x = 2$.' },
    { type: 'exercicios', title: 'Pratique', content: '1. Resolva $2x = 4$.' },
    { type: 'gabarito', title: 'Respostas', content: '1. $x = 2$.' },
  ],
});

test('Markdown: front matter, capítulo ancorado, caixas e ficha de revisão honesta', () => {
  const r = L.compileBookMarkdown([matMd()], { title: 'Caderno', author: 'Prof. Teste' });
  assert.ok(r.ok);
  for (const k of ['title: "Caderno"', 'lang: pt-BR', 'toc-title: "Sumário"', '# Equações {#cap-1}', '::: {.caixa tipo="conceito"', '# Ficha de revisão {-}', '# Glossário {-}', '# Referências {-}']) assert.ok(r.markdown.includes(k), k);
  assert.equal(r.validated, 0);
  assert.ok(!/material validado|validado pelo professor\b(?!\))/i.test(r.markdown.split('# Equações')[0].replace(/não valida|0 de 1/gi, '')), 'a ficha não afirma validação');
});
test('Markdown: matemática preservada, \\(..\\) e \\[..\\] viram $ e $$, dinheiro escapado', () => {
  const md = L.paraPandoc('Sendo \\(a+b\\) e \\[x^2\\]. R$ 12,50 e $y = 1$ e $-R$ 60$.');
  assert.ok(md.includes('$a+b$') && md.includes('$$x^2$$'));
  assert.ok(md.includes('R\\$ 12,50'), 'cifrão de dinheiro escapado');
  assert.ok(md.includes('$y = 1$'), 'matemática inline intacta');
  assert.ok(md.includes('-R\\$ 60'), 'valor negativo em dinheiro');
  assert.ok(!md.includes('\\('));
});
test('Markdown: não mexe em código nem em matemática com cifrão dentro', () => {
  const md = L.paraPandoc('`R$ 5` e $a = 3$');
  assert.ok(md.includes('`R$ 5`') && md.includes('$a = 3$'));
});
test('Markdown: gabarito vai para o caderno de respostas e sai do capítulo', () => {
  const r = L.compileBookMarkdown([matMd()]);
  const cap = r.markdown.split('# Glossário')[0];
  assert.ok(!/tipo="gabarito"/.test(cap));
  assert.ok(/# Caderno de respostas \{-\}/.test(r.markdown) && /tipo="gabarito"/.test(r.markdown.split('# Caderno de respostas')[1]));
  const sem = L.compileBookMarkdown([matMd()], { answers: false });
  assert.ok(!/# Caderno de respostas/.test(sem.markdown), 'sem caderno de respostas');
  assert.ok(/tipo="gabarito"/.test(sem.markdown.split('# Referências')[0]), 'sem o caderno, o gabarito permanece no capítulo');
});
test('Markdown: figuras SVG como arquivos ou como data URI', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>';
  const m = mat('Fig', { blocks: [{ type: 'visual', title: 'Reta', content: 'Veja.', svg }] });
  const a = L.compileBookMarkdown([m]);
  assert.equal(a.files.length, 1); assert.match(a.files[0].path, /^figs\/cap1-fig\d+\.svg$/); assert.ok(a.markdown.includes('figs/cap1-fig'));
  const b = L.compileBookMarkdown([m], { inlineFigures: true });
  assert.equal(b.files.length, 0); assert.ok(b.markdown.includes('data:image/svg+xml;base64,'));
});
test('Markdown: plural correto na ficha e compileBook intacto', () => {
  const um = L.compileBookMarkdown([matMd()]).markdown, dois = L.compileBookMarkdown([matMd(), mat('Outro')]).markdown;
  assert.ok(/1 de 1 capítulo tem|0 de 1 capítulo tem/.test(um), 'singular');
  assert.ok(/0 de 2 capítulos têm/.test(dois), 'plural');
  assert.ok(L.compileBook([matMd()]).ok);
});
test('Markdown: sem materiais devolve erro claro', () => {
  const r = L.compileBookMarkdown([]);
  assert.equal(r.ok, false);
});

test('CLI: --modelo aceita didatico/narrativo; narrativo usa A5 por padrão e respeita --papel', async () => {
  const { lerArgs } = await import('../tools/livro.mjs');
  assert.equal(lerArgs(['a.json']).modelo, 'didatico');
  assert.equal(lerArgs(['a.json']).papel, 'a4');
  assert.equal(lerArgs(['a.json', '--modelo', 'narrativo']).papel, 'a5');
  assert.equal(lerArgs(['a.json', '--modelo', 'narrativo', '--papel', 'a4']).papel, 'a4');
  assert.throws(() => lerArgs(['a.json', '--modelo', 'comic']), /didatico ou narrativo/);
});

test('Ficha técnica: só aparece com dados informados; ISBN inválido gera aviso e nunca é inventado', () => {
  assert.ok(!L.compileBookMarkdown([mat('A')]).markdown.includes('# Ficha técnica'));
  const r = L.compileBookMarkdown([mat('A')], { credits: { editora: 'Prof. Teste', isbn: '978-85-359-0277-8', ano: '2026' } });
  assert.ok(r.markdown.includes('# Ficha técnica {-}') && r.markdown.includes('**ISBN:** 978-85-359-0277-8') && r.markdown.includes('**Ano:** 2026'));
  assert.ok(r.markdown.indexOf('# Ficha técnica') < r.markdown.indexOf('# Ficha de revisão'));
  assert.ok(!r.warnings.some((w) => /ISBN/.test(w)));
  const ruim = L.compileBookMarkdown([mat('A')], { credits: { isbn: '978-85-359-0277-5' } });
  assert.ok(ruim.warnings.some((w) => /ISBN/.test(w)));
  assert.ok(L.isbnValido('9788535902778') && !L.isbnValido('9788535902775') && !L.isbnValido('123'));
});
test('CLI: sangria em mm (0 a 10) e campos da ficha técnica', async () => {
  const { lerArgs } = await import('../tools/livro.mjs');
  const a = lerArgs(['a.json', '--sangria', '3', '--editora', 'X', '--isbn', '9788535902778', '--ano', '2026']);
  assert.equal(a.sangria, 3); assert.deepEqual(a.opts.credits, { editora: 'X', isbn: '9788535902778', ano: '2026' });
  assert.equal(lerArgs(['a.json']).sangria, 0);
  assert.throws(() => lerArgs(['a.json', '--sangria', '30']), /milímetros/);
  assert.throws(() => lerArgs(['a.json', '--sangria', 'abc']), /milímetros/);
});
