const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/core.js');

const planoJson = (extra) => JSON.stringify(Object.assign({
  schema: 'mathlab.blueprint/1', title: 'Probabilidade', discipline: 'Matemática', level: '9º ano', topic: 'Probabilidade', duration: '4 aulas', epistemicType: 'formal',
  objectives: ['Calcular probabilidades simples'],
  units: [
    { id: 'u1', title: 'Espaço amostral', goal: 'Listar todos os resultados possíveis', blockTypes: ['conceito', 'exemplo'], mustCover: ['evento', 'resultado'] },
    { id: 'u2', title: 'Probabilidade de um evento', goal: 'Calcular P(A)', blockTypes: ['conceito', 'exercicios'], dependsOn: ['u1'] },
  ],
}, extra || {}));
const importado = () => C.importBlueprint(planoJson()).blueprint;
const aprovado = () => C.approveBlueprint(importado(), 'Prof. Alê', '2026-11-22').blueprint;
const unidade = (id, extra) => JSON.stringify(Object.assign({ schema: 'mathlab.unit/1', unitId: id, blocks: [{ type: 'conceito', title: 'T', content: 'Texto da unidade.' }], forNextUnit: { terms: ['espaço amostral'], notation: ['Ω'], assumed: ['listar resultados'] } }, extra || {}));

test('o pedido de plano pede só o plano e proíbe aprovação', () => {
  const t = C.buildBlueprintRequest({ discipline: 'Matemática', level: '9º ano', topic: 'Probabilidade', duration: '4 aulas' });
  assert.match(t, /PLANO \(não o material\)/); assert.match(t, /mathlab\.blueprint\/1/); assert.match(t, /quem aprova o plano é o professor/);
});

test('importa plano válido sem aviso e sem aprovação', () => {
  const r = C.importBlueprint(planoJson()); assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.warnings, []);
  assert.strictEqual(r.blueprint.units.length, 2); assert.strictEqual(r.blueprint.aprovacao.aprovado, false);
  assert.strictEqual(C.estadoBlueprint(r.blueprint).aprovado, false);
});

test('plano que chega marcado como aprovado é ignorado com aviso', () => {
  const r = C.importBlueprint(planoJson({ aprovacao: { aprovado: true, aprovadoPor: 'IA', data: '2026-11-22', hash: 'x' } }));
  assert.ok(r.warnings.some((w) => /Ignorei: só o professor aprova/.test(w))); assert.strictEqual(r.blueprint.aprovacao.aprovado, false);
});

test('schema errado ou sem unidades é recusado', () => {
  assert.strictEqual(C.importBlueprint(JSON.stringify({ schema: 'mathlab.material/2' })).ok, false);
  assert.strictEqual(C.importBlueprint(planoJson({ units: [] })).ok, false);
});

test('dependência para id inexistente é removida com aviso', () => {
  const r = C.importBlueprint(planoJson({ units: [{ id: 'u1', title: 'A', goal: 'g', dependsOn: ['zz'] }] }));
  assert.ok(r.warnings.some((w) => /não existem \(zz\)/.test(w))); assert.deepStrictEqual(r.blueprint.units[0].dependsOn, []);
});

test('ids repetidos de unidade viram únicos', () => {
  const r = C.importBlueprint(planoJson({ units: [{ id: 'u1', title: 'A', goal: 'g' }, { id: 'u1', title: 'B', goal: 'g' }] }));
  assert.strictEqual(new Set(r.blueprint.units.map((u) => u.id)).size, 2);
});

test('aprovar exige pessoa: nome vazio ou de IA é recusado', () => {
  for (const n of ['', '  ', 'IA', 'Gemini', 'claude', 'sistema']) assert.strictEqual(C.approveBlueprint(importado(), n, '2026-11-22').ok, false, n);
});

test('não aprova plano com unidade sem objetivo', () => {
  const bp = importado(); bp.units[0].goal = '';
  assert.strictEqual(C.approveBlueprint(bp, 'Prof. Alê').ok, false);
});

test('aprovado fica registrado com nome, data e hash', () => {
  const bp = aprovado(); const e = C.estadoBlueprint(bp);
  assert.strictEqual(e.aprovado, true); assert.match(e.texto, /Prof\. Alê.*22\/11\/2026/);
});

test('mudar o plano depois de aprovado deixa a aprovação desatualizada e bloqueia unidades', () => {
  const bp = aprovado(); bp.units[0].goal = 'outro objetivo';
  const e = C.estadoBlueprint(bp); assert.strictEqual(e.aprovado, false); assert.strictEqual(e.desatualizado, true);
  assert.strictEqual(C.buildUnitRequest(bp).ok, false); assert.strictEqual(C.applyUnit(bp, unidade('u1')).ok, false);
});

test('sem aprovação não se gera nem se aplica unidade', () => {
  const bp = importado();
  assert.strictEqual(C.buildUnitRequest(bp).ok, false); assert.strictEqual(C.applyUnit(bp, unidade('u1')).ok, false);
});

test('o pedido da unidade 1 traz só a unidade 1 e proíbe escrever as outras', () => {
  const r = C.buildUnitRequest(aprovado()); assert.strictEqual(r.ok, true); assert.strictEqual(r.unitId, 'u1');
  assert.match(r.texto, /unidade 1 de 2/); assert.match(r.texto, /Cobrir obrigatoriamente: evento; resultado/);
  assert.match(r.texto, /NÃO escreva as outras/); assert.doesNotMatch(r.texto, /Objetivo: Calcular P\(A\)/); assert.doesNotMatch(r.texto, /Herdado/);
});

test('aplicar a unidade 1 acumula blocos e guarda o que passa para a 2', () => {
  const r = C.applyUnit(aprovado(), unidade('u1')); assert.strictEqual(r.ok, true); assert.strictEqual(r.added, 1); assert.strictEqual(r.completo, false);
  assert.strictEqual(r.blueprint.material.blocks[0].id, 'u1_b1');
  const p2 = C.buildUnitRequest(r.blueprint); assert.strictEqual(p2.unitId, 'u2');
  assert.match(p2.texto, /Herdado da unidade anterior/); assert.match(p2.texto, /Termos: espaço amostral/); assert.match(p2.texto, /Notação: Ω/);
});

test('unidade fora de ordem é recusada', () => {
  const r = C.applyUnit(aprovado(), unidade('u2')); assert.strictEqual(r.ok, false); assert.match(r.error, /próxima do plano é "u1"/);
});

test('plano completo gera material com todos os blocos e depois não aceita mais unidades', () => {
  let bp = C.applyUnit(aprovado(), unidade('u1')).blueprint;
  const f = C.applyUnit(bp, unidade('u2')); assert.strictEqual(f.completo, true);
  assert.strictEqual(f.blueprint.material.blocks.length, 2); assert.strictEqual(f.blueprint.material.title, 'Probabilidade');
  assert.strictEqual(f.blueprint.material.revisao.aprovado, false);
  assert.strictEqual(C.buildUnitRequest(f.blueprint).ok, false); assert.strictEqual(C.applyUnit(f.blueprint, unidade('u2')).ok, false);
});

test('unidade sem blocos com conteúdo ou com schema errado é recusada', () => {
  assert.strictEqual(C.applyUnit(aprovado(), unidade('u1', { blocks: [{ type: 'conceito', content: ' ' }] })).ok, false);
  assert.strictEqual(C.applyUnit(aprovado(), JSON.stringify({ schema: 'mathlab.repair/1' })).ok, false);
});

test('unidade que traz revisão, referências ou aprovação tem esses campos ignorados', () => {
  const r = C.applyUnit(aprovado(), unidade('u1', { revisao: { aprovado: true }, references: [{ title: 'X' }], aprovacao: { aprovado: true } }));
  assert.strictEqual(r.ok, true); ['revisao', 'references', 'aprovacao'].forEach((k) => assert.ok(r.warnings.some((w) => w.includes('"' + k + '"'))));
  assert.strictEqual(r.blueprint.material.references.length, 0);
});

test('aplicar unidade não altera o plano original (imutável)', () => {
  const bp = aprovado(); C.applyUnit(bp, unidade('u1')); assert.deepStrictEqual(bp.progress, {}); assert.strictEqual(bp.material, null);
});

test('a aprovação sobrevive ao progresso: gerar unidades não desatualiza o plano', () => {
  const r = C.applyUnit(aprovado(), unidade('u1')); assert.strictEqual(C.estadoBlueprint(r.blueprint).aprovado, true);
});
