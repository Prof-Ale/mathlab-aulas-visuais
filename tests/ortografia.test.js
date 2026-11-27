// Ortografia pt-BR no MathLab (motor compartilhado com o ScriptaLab).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/core.js');
const root = path.join(__dirname, '..');
let O, sp;
test.before(async () => {
  O = await import('../js/ortografia.mjs');
  sp = O.createSpellChecker(new Uint8Array(fs.readFileSync(path.join(root, 'assets/ortografia/pt-br.bloom'))));
});

test('dicionário e licença acompanham o motor', () => {
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'assets/ortografia/pt-br.meta.json'), 'utf8'));
  assert.match(meta.licenca, /LGPL|MPL/);
  assert.ok(fs.statSync(path.join(root, 'assets/ortografia/LICENCA-VERO.txt')).size > 200);
  assert.equal(sp.correct('análise'), true);
  assert.equal(sp.correct('resultdos'), false);
});

test('demo (texto real, correto) não gera suspeitas', () => {
  const a = O.conferirOrtografiaMaterial(C.demo(), sp);
  assert.deepEqual(a.map((x) => x.palavra), []);
});

test('erro em texto é achado; o mesmo erro dentro de fórmula ou código não é', () => {
  const m = C.normalize({ title: 'T', blocks: [{ type: 'conceito', title: 'Ideia', content: 'A analize dos dados. Fórmula $resultdos + x$ e `resultdos` e https://exemplo.com/resultdos.' }] });
  const a = O.conferirOrtografiaMaterial(m, sp);
  assert.deepEqual(a.map((x) => x.palavra), ['analize']);
  assert.ok(a[0].sugestoes.includes('analise') || a[0].sugestoes.includes('análise'));
});

test('lista de ignorar silencia termos técnicos', () => {
  const m = C.normalize({ title: 'T', blocks: [{ type: 'conceito', title: 'Ideia', content: 'O conceito de zorblax aparece aqui.' }] });
  assert.equal(O.conferirOrtografiaMaterial(m, sp).length, 1);
  assert.equal(O.conferirOrtografiaMaterial(m, sp, { ignorar: ['zorblax'] }).length, 0);
});

test('abrange capa, objetivos e destaques, e informa a origem', () => {
  const m = C.normalize({ title: 'T', objectives: ['Aprender resultdos'], blocks: [{ type: 'nota', title: 'N', content: 'ok', callout: { kind: 'dica', text: 'cuidado com a analize' } }] });
  const a = O.conferirOrtografiaMaterial(m, sp);
  assert.deepEqual(a.map((x) => x.rotulo).sort(), ['Destaque de “N”', 'Objetivo 1'].sort());
});
