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
