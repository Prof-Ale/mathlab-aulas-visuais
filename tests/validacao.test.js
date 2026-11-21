const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/core.js');

// Etapa 1: o material só aparece como validado se o professor validou de fato.
const rascunho = () => C.demo();
const validado = (nome = 'Prof. Alê Barbosa', data = '2026-11-21') => {
  const m = C.normalize(C.demo());
  m.revisao = { aprovado: true, revisadoPor: nome, data, hash: C.hashConteudo(m) };
  return m;
};
const capa = (m) => C.renderCleanCover(m);
const apostila = (m) => C.toApostila(m);

test('capa de rascunho NÃO diz que foi validado e não imprime a versão do código', () => {
  const h = capa(rascunho());
  assert.doesNotMatch(h, /Validado pelo professor/);
  assert.match(h, /aguarda revisão do professor/i);
  assert.doesNotMatch(h, /Versão 2\.0\.0/);
});

test('caixa do autor de rascunho não afirma validação', () => {
  const h = apostila(rascunho());
  assert.doesNotMatch(h, /validado pelo docente/i);
  assert.match(h, /Aguarda a revisão do docente/);
});

test('nenhum material novo ou importado nasce validado', () => {
  assert.strictEqual(C.estadoRevisao(C.normalize({ title: 'x', blocks: [{ type: 'conceito', content: 'y' }] })).validado, false);
  assert.strictEqual(C.estadoRevisao(C.demo()).validado, false);
  assert.strictEqual(C.estadoRevisao(C.scaffold({ discipline: 'Matemática', topic: 't', level: '7º ano' })).validado, false);
});

test('validação completa aparece na capa com nome e data', () => {
  const h = capa(validado());
  assert.match(h, /Validado pelo professor/);
  assert.match(h, /Prof\. Alê Barbosa/);
  assert.match(h, /21\/11\/2026/);
});

test('marcar "aprovado" sem nome ou sem data não conta como validado', () => {
  const m = C.normalize(C.demo());
  m.revisao = { aprovado: true, revisadoPor: '', data: '2026-11-21', hash: C.hashConteudo(m) };
  assert.strictEqual(C.estadoRevisao(m).validado, false);
  m.revisao = { aprovado: true, revisadoPor: 'Fulano', data: '', hash: C.hashConteudo(m) };
  assert.strictEqual(C.estadoRevisao(m).validado, false);
  assert.doesNotMatch(capa(m), /Validado pelo professor/);
});

test('editar o conteúdo depois de validar torna a validação desatualizada', () => {
  const m = validado();
  m.blocks[0].content += ' Texto novo depois da revisão.';
  const e = C.estadoRevisao(m);
  assert.strictEqual(e.validado, false);
  assert.strictEqual(e.desatualizada, true);
  assert.match(capa(m), /desatualizada/i);
  assert.doesNotMatch(capa(m), /Validado pelo professor/);
});

test('mudar só a aparência (avatar, logo) não invalida a revisão', () => {
  const m = validado();
  m.poster.avatarChoice = 'avatar-prof-ale-2.jpg';
  assert.strictEqual(C.estadoRevisao(m).validado, true);
});

test('JSON de IA que traz revisão aprovada é ignorado, com aviso', () => {
  const j = JSON.stringify(Object.assign(C.demo(), { revisao: { aprovado: true, revisadoPor: 'IA', data: '2026-01-01', hash: 'x' } }));
  const r = C.importFromText(j);
  assert.ok(r.ok);
  assert.strictEqual(C.estadoRevisao(r.material).validado, false);
  assert.ok(r.warnings.some((w) => /só o professor valida/i.test(w)), JSON.stringify(r.warnings));
});

test('revisão humana do contrato v2 também é ignorada na importação, com aviso', () => {
  const fs = require('node:fs'); const path = require('node:path');
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../schema/exemplos/exemplo-6ano-fracoes.json'), 'utf8'));
  raw.revisao_humana = { aprovado: true, revisado_por: 'IA', data: '2026-01-01', escopo: ['conteudo'] };
  const r = C.importFromText(JSON.stringify(raw));
  assert.ok(r.ok);
  assert.strictEqual(C.estadoRevisao(r.material).validado, false);
  assert.ok(r.warnings.some((w) => /só o professor valida/i.test(w)));
});

test('a validação sobrevive a normalizar de novo (salvar versão)', () => {
  const m = validado();
  const n = C.normalize(JSON.parse(JSON.stringify(m)));
  assert.strictEqual(C.estadoRevisao(n).validado, true);
});
