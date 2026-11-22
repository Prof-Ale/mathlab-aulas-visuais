const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/core.js');

const base = () => ({ schema: 'mathlab.material/2', title: 'Teste', discipline: 'Matemática', blocks: [{ type: 'conceito', title: 'A', content: 'x' }], references: [], limitations: ['nenhuma fonte'] });
const imp = (o) => C.importFromText(JSON.stringify(o));
const tem = (r, rx) => assert.ok(r.warnings.some((w) => rx.test(w)), 'avisos: ' + JSON.stringify(r.warnings));

test('material limpo importa sem nenhum aviso', () => {
  const r = imp(base()); assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.warnings, []);
});

test('tipo de bloco desconhecido vira nota e avisa', () => {
  const o = base(); o.blocks.push({ type: 'inventado', title: 'B', content: 'y' });
  const r = imp(o); tem(r, /tipo desconhecido \("inventado"\).*"nota"/);
  assert.strictEqual(r.material.blocks[1].type, 'nota');
});

test('bloco que não é objeto é descartado e avisa', () => {
  const o = base(); o.blocks.push('texto solto', null);
  const r = imp(o); tem(r, /Descartei 2 blocos/); assert.strictEqual(r.material.blocks.length, 1);
});

test('tipo epistêmico inválido avisa', () => {
  const o = base(); o.epistemicType = 'quantico'; tem(imp(o), /Tipo de conhecimento "quantico"/);
});

test('seções da capa além de 6 são cortadas com aviso', () => {
  const o = base(); o.poster = { title: 'T', sections: Array.from({ length: 8 }, (_, i) => ({ label: 'S' + i, text: 't' })) };
  const r = imp(o); tem(r, /Cortei as 2 últimas/); assert.strictEqual(r.material.poster.sections.length, 6);
});

test('schema diferente avisa; schema ausente continua avisando', () => {
  const o = base(); o.schema = 'mathlab.material/9'; tem(imp(o), /espera "mathlab.material\/2"/);
  const p = base(); delete p.schema; tem(imp(p), /não declara "schema"/);
});

test('referência sem nível de acesso avisa e fica nao-verificado', () => {
  const o = base(); o.references = [{ title: 'Livro', authors: 'A' }];
  const r = imp(o); tem(r, /sem nível de acesso/); assert.strictEqual(r.material.references[0].accessLevel, 'nao-verificado');
});

test('contractVersion fora da família 2.x é ignorado com aviso', () => {
  const o = base(); o.contractVersion = '3.0'; const r = imp(o);
  tem(r, /não é da família 2\.x/); assert.strictEqual(r.material.contractVersion, undefined);
});

test('claims, calculations e provenance válidos são guardados', () => {
  const o = base(); o.contractVersion = '2.1';
  o.claims = [{ id: 'a1', kind: 'fato', text: 'T', support: { mode: 'sem_fonte' } }];
  o.calculations = [{ id: 'c1', expression: '1+1', result: '2' }];
  o.provenance = { generator: 'gem', aiParticipated: true, estadoEditorial: 'GERADO' };
  const r = imp(o); assert.deepStrictEqual(r.warnings, []);
  assert.strictEqual(r.material.claims.length, 1);
  assert.strictEqual(r.material.calculations[0].checkedBy, 'nao_conferido');
  assert.strictEqual(r.material.provenance.estadoEditorial, 'GERADO');
});

test('claims e cálculos inválidos são descartados com aviso', () => {
  const o = base(); o.claims = [{ id: 'a1', kind: 'fato', text: 'T', support: { mode: 'confie' } }, { id: 'a2', kind: 'fato', text: 'ok', support: { mode: 'sem_fonte' } }];
  o.calculations = [{ id: 'c1', expression: '', result: '2' }];
  const r = imp(o); tem(r, /Descartei 1 de 2 afirmações/); tem(r, /Descartei 1 de 1 cálculos/); assert.strictEqual(r.material.claims.length, 1);
});

test('cálculo declarado como conferido por código gera aviso de que o site não refez a conta', () => {
  const o = base(); o.calculations = [{ id: 'c1', expression: '2+2', result: '4', checkedBy: 'codigo' }];
  tem(imp(o), /não refez a conta/);
});

test('estado humano em provenance é ignorado com aviso', () => {
  const o = base(); o.provenance = { estadoEditorial: 'REVISADO_POR_ESPECIALISTA' };
  const r = imp(o); tem(r, /estado de validação humana em provenance/); assert.strictEqual(r.material.provenance.estadoEditorial, '');
});

test('alterar uma afirmação invalida a validação do professor, mas material antigo mantém o mesmo hash', () => {
  const m = C.normalize(base()); const h0 = C.hashConteudo(m);
  assert.strictEqual(C.hashConteudo(C.normalize(base())), h0);
  const n = C.normalize(Object.assign(base(), { claims: [{ id: 'a1', kind: 'fato', text: 'T', support: { mode: 'sem_fonte' } }] }));
  assert.notStrictEqual(C.hashConteudo(n), h0);
});

test('o aviso de revisão aprovada importada continua funcionando', () => {
  const o = base(); o.revisao = { aprovado: true, revisadoPor: 'X', data: '2026-11-21', hash: 'abc' };
  const r = imp(o); tem(r, /revisão marcada como aprovada/); assert.strictEqual(r.material.revisao.aprovado, false);
});
