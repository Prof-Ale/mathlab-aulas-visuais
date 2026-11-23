'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const F = require('../js/fontes.js');

const fonte = (t, extra) => F.normalizarFonte(Object.assign({ title: t, authors: 'Lima, E.', year: '2010', text: 'A probabilidade de um evento mede a chance de ele ocorrer em um experimento aleatório com resultados igualmente prováveis.' }, extra || {})).fonte;

test('normaliza e exige título e trecho mínimo', () => {
  assert.equal(F.normalizarFonte({ title: '', text: 'curto' }).ok, false);
  assert.equal(F.normalizarFonte({ title: 'x', text: 'curto' }).erros.length, 1);
  const r = F.normalizarFonte({ title: '<b>Livro</b>', text: '<i>Texto de teste com mais de vinte caracteres.</i>', access: 'XX' });
  assert.ok(r.ok); assert.equal(r.fonte.title, 'Livro'); assert.ok(!r.fonte.text.includes('<')); assert.equal(r.fonte.access, 'PARTIAL');
});
test('trecho longo é cortado no cadastro e marcado', () => {
  const r = F.normalizarFonte({ title: 'x', text: 'palavra '.repeat(1000) });
  assert.equal(r.fonte.text.length <= F.LIM.trecho, true); assert.equal(r.fonte.truncated, true);
});
test('bloco de fontes numera, limita por fonte e no total e avisa', () => {
  const grande = Array.from({ length: 5 }, (_, i) => fonte('Fonte ' + i, { text: 'x '.repeat(900) }));
  const b = F.blocoDeFontes(grande);
  assert.match(b.texto, /BASE OBRIGATÓRIA DO AUTOR/); assert.match(b.texto, /\[F1\]/); assert.match(b.texto, /Não copie frases inteiras/);
  assert.ok(b.texto.length < F.LIM.total + 1500); assert.ok(b.avisos.some((a) => /cortado/.test(a))); assert.ok(b.avisos.some((a) => /ficou de fora/.test(a)));
  assert.equal(F.blocoDeFontes([]).texto, ''); assert.equal(F.blocoDeFontes(null).marcadores.length, 0);
});
test('no máximo 8 fontes entram', () => {
  const b = F.blocoDeFontes(Array.from({ length: 12 }, (_, i) => fonte('F' + i, { text: 'trecho curto de teste número ' + i + ' com texto suficiente' })));
  assert.ok(b.avisos.some((a) => /8 primeiras/.test(a)));
});
test('maior cópia em palavras ignora acento, caixa e pontuação', () => {
  const f = 'A probabilidade de um evento mede a chance de ele ocorrer.';
  assert.equal(F.maiorCopia('a PROBABILIDADE, de um evento mede a chance de ele ocorrer!', f), 11);
  assert.equal(F.maiorCopia('nada em comum aqui', f), 0); assert.equal(F.maiorCopia('', f), 0);
});
const mat = (content) => ({ title: 'M', blocks: [{ type: 'conceito', title: 'C', content }] });
test('auditoria: marcador inexistente, fonte não citada e cópia literal', () => {
  const f = [fonte('Lima')];
  const ids = (m) => F.auditarUso(m, f).map((x) => x.id);
  assert.deepEqual(ids(mat('Texto próprio sobre chance [F1].')), []);
  assert.deepEqual(ids(mat('Texto próprio sem citar.')), ['nao_citada_F1']);
  assert.ok(ids(mat('Veja [F3] para mais.')).includes('marc_3'));
  assert.ok(ids(mat('Segundo o livro: a probabilidade de um evento mede a chance de ele ocorrer em um experimento aleatório [F1].')).includes('copia_F1'));
  assert.deepEqual(F.auditarUso(mat('qualquer'), []), []); assert.deepEqual(F.auditarUso(null, f).map((x) => x.id), ['nao_citada_F1']);
});
test('referências prontas usam o acesso declarado e nunca marcam como verificada', () => {
  const r = F.comoReferencias([fonte('Lima', { access: 'FULL' })]);
  assert.equal(r[0].accessLevel, 'FULL'); assert.equal(r[0].verified, false);
});
test('integração: carregado antes do app, no standalone, e a tela usa as fontes', () => {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  assert.ok(html.indexOf('js/livro.js') < html.indexOf('js/fontes.js') && html.indexOf('js/fontes.js') < html.indexOf('js/app.js'));
  assert.match(fs.readFileSync(__dirname + '/../tools/build-standalone.js', 'utf8'), /js\/fontes\.js/);
  const app = fs.readFileSync(__dirname + '/../js/app.js', 'utf8');
  for (const k of ['cardFontes', 'fonteAud', 'addsource', 'blocoDeFontes']) assert.ok(app.includes(k), k);
});
