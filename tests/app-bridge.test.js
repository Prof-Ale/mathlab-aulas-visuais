const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/core.js');

// Arquivo gerado de verdade pelo App Node (formato "Enviar ao site (JSON)"). Se o contrato mudar dos dois lados, este teste avisa.
const txt = fs.readFileSync(path.join(__dirname, 'fixtures/app-export.mathlab.json'), 'utf8');

test('arquivo do App importa sem nenhum aviso', () => {
  const r = C.importFromText(txt);
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.warnings, []);
});

test('o site guarda objetivos, referências, afirmações e proveniência que o App enviou', () => {
  const m = C.importFromText(txt).material;
  assert.ok(m.objectives.length >= 1); assert.ok(m.prerequisites.length >= 1);
  assert.ok(m.references.length >= 1); assert.ok(m.references.every((r) => r.verified === false));
  assert.ok(m.claims.length >= 1 && m.claims.every((c) => c.support.mode === 'sem_fonte'));
  assert.strictEqual(m.provenance.generator, 'app-node');
  assert.strictEqual(m.contractVersion, '2.1');
  assert.strictEqual(m.epistemicType, 'formal');
});

test('material vindo do App chega sem validação do professor', () => {
  const m = C.importFromText(txt).material;
  assert.strictEqual(m.revisao.aprovado, false);
  assert.strictEqual(C.estadoRevisao(m).validado, false);
});

test('o que o App deixou de fora dos blocos está declarado, não escondido', () => {
  const m = C.importFromText(txt).material;
  const ids = m.meta.bridge.droppedBlocks.map((d) => d.id);
  assert.deepStrictEqual(ids.sort(), ['blk-identificacao', 'blk-objetivos']);
});

test('a auditoria do site roda sobre o material do App e não quebra', () => {
  const a = C.audit(C.importFromText(txt).material);
  assert.ok(a.score > 0); assert.ok(Array.isArray(a.categories) && a.categories.length >= 9);
});

test('arquivo do App adulterado com revisão aprovada tem a revisão ignorada com aviso', () => {
  const o = JSON.parse(txt); o.revisao = { aprovado: true, revisadoPor: 'Qualquer um', data: '2026-11-22', hash: 'x' };
  const r = C.importFromText(JSON.stringify(o));
  assert.strictEqual(r.material.revisao.aprovado, false);
  assert.ok(r.warnings.some((w) => /revisão marcada como aprovada/.test(w)));
});
