'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const C = require('../js/core.js');
const D = require('../js/dominios.js');

test('há um pacote pronto para cada tipo de conhecimento', () => {
  for (const k of Object.keys(C.EPISTEMIC)) assert.ok(D.PRONTOS[k], 'falta pacote ' + k);
  for (const p of Object.values(D.PRONTOS)) {
    assert.equal(p.schema, D.DOMAIN_SCHEMA);
    for (const t of [...p.required, ...p.recommended, ...p.forbidden]) assert.ok(C.BLOCK_TYPES[t], p.id + ' usa bloco inexistente ' + t);
    for (const v of p.visuals) assert.ok(v in D.VISUAIS);
  }
});
test('pacotes prontos passam pela própria normalização sem avisos', () => {
  for (const p of Object.values(D.PRONTOS)) assert.deepEqual(D.normalizeDomain(p, 'pronto').warnings, [], p.id);
});
test('o pedido de pacote lista os blocos e visuais permitidos e o esquema', () => {
  const t = D.buildDomainRequest({ topic: 'Mecânica automotiva', level: 'Curso técnico' });
  assert.match(t, /mathlab\.domain\/1/); assert.match(t, /Mecânica automotiva/);
  for (const b of Object.keys(C.BLOCK_TYPES)) assert.ok(t.includes(b));
});
const RESP = '```json\n' + JSON.stringify({ schema: 'mathlab.domain/1', id: 'Mecânica Automotiva!', nome: 'Mecânica automotiva', epistemicType: 'pratica', rigor: 'Procedimento seguro e verificável.',
  required: ['atividade', 'bloco_falso'], forbidden: ['atividade'], visuals: ['fluxograma', 'holograma'], commonErrors: ['apertar sem torquímetro'],
  checks: [{ id: 'torque', label: 'Há valor de torque?', keywords: ['Torque', 'N.m'], nivel: 'warn' }, { id: 'vazio', label: 'sem palavras', keywords: [] }] }) + '\n```';
test('importar pacote novo normaliza, avisa e descarta o que não existe', () => {
  const r = D.importDomain(RESP);
  assert.ok(r.ok); assert.equal(r.pack.id, 'mecanica-automotiva'); assert.equal(r.pack.origem, 'meta-adaptador');
  assert.deepEqual(r.pack.required, []); assert.deepEqual(r.pack.forbidden, ['atividade']);
  assert.deepEqual(r.pack.visuals, ['fluxograma']); assert.equal(r.pack.checks.length, 1);
  assert.deepEqual(r.pack.checks[0].keywords, ['torque', 'n.m']);
  assert.ok(r.warnings.some((w) => /bloco_falso/.test(w))); assert.ok(r.warnings.some((w) => /holograma/.test(w))); assert.ok(r.warnings.some((w) => /required e forbidden/.test(w)));
});
test('importação recusa esquema errado, JSON quebrado e pacote vazio', () => {
  assert.equal(D.importDomain('{"schema":"outro/1"}').ok, false);
  assert.equal(D.importDomain('isto não é json').ok, false);
  assert.equal(D.importDomain(JSON.stringify({ schema: 'mathlab.domain/1' })).ok, false);
});
test('limites: HTML removido, listas e textos cortados', () => {
  const n = D.normalizeDomain({ nome: '<b>X</b>', rigor: 'r'.repeat(900), commonErrors: Array.from({ length: 30 }, (_, i) => '<i>e' + i + '</i>') }).pack;
  assert.equal(n.nome, 'X'); assert.equal(n.rigor.length, 400); assert.equal(n.commonErrors.length, 8); assert.ok(!n.commonErrors[0].includes('<'));
});
test('regrasTexto e achar', () => {
  const t = D.regrasTexto(D.PRONTOS.pratica);
  assert.match(t, /Blocos obrigatórios/); assert.match(t, /Segurança/);
  assert.equal(D.regrasTexto(null), '');
  assert.equal(D.achar('nada', [], 'historica').id, 'historica');
  assert.equal(D.achar('mec', [{ id: 'mec', nome: 'M' }], 'geral').id, 'mec');
  assert.equal(D.achar('x', [], 'inexistente'), null);
});
test('auditoria do domínio: exige, proíbe e confere sinais no texto', () => {
  const pack = D.importDomain(RESP).pack; pack.required = ['conceito'];
  const m = { blocks: [{ type: 'atividade', title: 'Troca de óleo', content: 'Aperte o cárter com 25 Torque.' }] };
  const ids = D.auditar(m, pack).map((x) => x.id);
  assert.ok(ids.includes('req_conceito')); assert.ok(ids.includes('proib_atividade')); assert.ok(!ids.includes('chk_torque'));
  const m2 = { blocks: [{ type: 'conceito', title: 'Óleo', content: 'Sem número.' }] };
  assert.ok(D.auditar(m2, pack).some((x) => x.id === 'chk_torque' && x.nivel === 'warn'));
  assert.deepEqual(D.auditar(null, pack), []);
});
test('a prática exige segurança e o histórico exige fontes', () => {
  const m = { blocks: [{ type: 'conceito', title: 'Aula', content: 'Texto solto.' }, { type: 'atividade', title: 'x', content: 'faça' }] };
  assert.ok(D.auditar(m, D.PRONTOS.pratica).some((x) => x.id === 'chk_seguranca'));
  assert.ok(D.auditar({ blocks: [{ type: 'contexto', title: 'a', content: 'b' }, { type: 'conceito', title: 'a', content: 'b' }] }, D.PRONTOS.historica).some((x) => x.id === 'chk_fontes'));
});
test('integração: script carregado no site e no standalone, e a tela usa o pacote', () => {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  assert.ok(html.indexOf('js/core.js') < html.indexOf('js/dominios.js') && html.indexOf('js/dominios.js') < html.indexOf('js/app.js'));
  assert.match(fs.readFileSync(__dirname + '/../tools/build-standalone.js', 'utf8'), /js\/dominios\.js/);
  const app = fs.readFileSync(__dirname + '/../js/app.js', 'utf8');
  for (const k of ['cardDominio', 'dominioAud', 'copydomainreq', 'importdomain']) assert.ok(app.includes(k), k);
});
