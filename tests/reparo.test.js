const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/core.js');

const mat = () => C.normalize(C.demo());
const resp = (o) => JSON.stringify(Object.assign({ schema: 'mathlab.repair/1' }, o));

test('sem problemas não há pedido de reparo', () => {
  assert.strictEqual(C.buildRepairPrompt(mat(), []).ok, false);
});

test('o pedido lista os problemas, os ids dos blocos e as proibições', () => {
  const m = mat();
  const r = C.buildRepairPrompt(m, [{ origem: 'importação', texto: 'Bloco virou nota.' }, { origem: 'Fundamentação', gravidade: 'grave', texto: 'Falta fonte.' }]);
  assert.strictEqual(r.ok, true); assert.strictEqual(r.total, 2);
  assert.match(r.texto, /1\. \[importação\] Bloco virou nota\./);
  assert.match(r.texto, /2\. \[Fundamentação, grave\] Falta fonte\./);
  assert.ok(m.blocks.every((b) => r.texto.includes('id "' + b.id + '"')));
  assert.match(r.texto, /Não invente referências/);
  assert.match(r.texto, /Não inclua "revisao"/);
  assert.match(r.texto, /SOMENTE o que os problemas apontam/);
});

test('problemasParaReparo junta avisos de importação e achados da auditoria', () => {
  const m = mat(); m.blocks[0].content = '[PREENCHER: texto]';
  const ps = C.problemasParaReparo(m, ['Aviso X.']);
  assert.ok(ps.some((p) => p.origem === 'importação' && p.texto === 'Aviso X.'));
  assert.ok(ps.some((p) => p.gravidade === 'grave'));
});

test('reparo troca só o bloco indicado e mantém os outros intactos', () => {
  const m = mat(); const alvo = m.blocks[1];
  const r = C.applyRepair(m, resp({ blocks: [{ id: alvo.id, type: alvo.type, title: alvo.title, content: 'Texto corrigido.' }] }));
  assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.changed, [alvo.id]);
  assert.strictEqual(r.material.blocks[1].content, 'Texto corrigido.');
  assert.strictEqual(r.material.blocks[1].svg, alvo.svg);
  m.blocks.forEach((b, i) => { if (i !== 1) assert.deepStrictEqual(r.material.blocks[i], b); });
  assert.strictEqual(m.blocks[1].content === 'Texto corrigido.', false, 'não altera o original');
});

test('bloco com id inexistente é ignorado com aviso, nunca criado', () => {
  const m = mat();
  const r = C.applyRepair(m, resp({ blocks: [{ id: 'nao-existe', content: 'x' }, { id: m.blocks[0].id, content: 'ok' }] }));
  assert.strictEqual(r.material.blocks.length, m.blocks.length);
  assert.ok(r.warnings.some((w) => /não existe no material/.test(w)));
});

test('reparo que só traz ids inexistentes falha', () => {
  const r = C.applyRepair(mat(), resp({ blocks: [{ id: 'zzz', content: 'x' }] }));
  assert.strictEqual(r.ok, false);
});

test('revisão, referências, claims e capa na resposta são ignorados com aviso', () => {
  const m = mat();
  const r = C.applyRepair(m, resp({ blocks: [{ id: m.blocks[0].id, content: 'novo' }], revisao: { aprovado: true, revisadoPor: 'IA', data: '2026-11-22' }, references: [{ title: 'Inventada' }], poster: { title: 'x' } }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.material.revisao.aprovado, false);
  assert.strictEqual(r.material.references.length, m.references.length);
  ['revisao', 'references', 'poster'].forEach((k) => assert.ok(r.warnings.some((w) => w.includes('"' + k + '"'))));
});

test('reparo invalida a validação do professor (hash muda)', () => {
  const m = mat(); m.revisao = { aprovado: true, revisadoPor: 'Prof. Alê', data: '2026-11-22', hash: C.hashConteudo(m) };
  assert.strictEqual(C.estadoRevisao(m).validado, true);
  const r = C.applyRepair(m, resp({ blocks: [{ id: m.blocks[0].id, content: 'mudou' }] }));
  const e = C.estadoRevisao(r.material);
  assert.strictEqual(e.validado, false); assert.strictEqual(e.desatualizada, true);
});

test('limitações novas são acrescentadas sem duplicar', () => {
  const m = mat(); const antiga = m.limitations[0];
  const r = C.applyRepair(m, resp({ blocks: [{ id: m.blocks[0].id, content: 'n' }], limitations: [antiga, 'Nova limitação.'] }));
  assert.strictEqual(r.material.limitations.length, m.limitations.length + 1);
  assert.ok(r.material.limitations.includes('Nova limitação.'));
});

test('resposta com outro schema, sem blocos ou sem JSON é recusada', () => {
  assert.strictEqual(C.applyRepair(mat(), JSON.stringify({ schema: 'mathlab.material/2', blocks: [] })).ok, false);
  assert.strictEqual(C.applyRepair(mat(), resp({ blocks: [] })).ok, false);
  assert.strictEqual(C.applyRepair(mat(), 'oi, aqui está').ok, false);
});

test('bloco do reparo sem conteúdo é ignorado', () => {
  const m = mat(); const r = C.applyRepair(m, resp({ blocks: [{ id: m.blocks[0].id, content: '  ' }, { id: m.blocks[1].id, content: 'ok' }] }));
  assert.ok(r.warnings.some((w) => /sem conteúdo/.test(w))); assert.deepStrictEqual(r.changed, [m.blocks[1].id]);
});
