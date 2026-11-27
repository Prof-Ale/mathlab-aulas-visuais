// Revisor de português do MathLab: motor copiado do ScriptaLab, com hash conferido.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'js', 'ptbr');
let O;
test.before(async () => { O = await import('../js/ortografia.mjs'); });

test('a cópia do motor confere com VERSION.json (independente de LF/CRLF)', () => {
  const v = JSON.parse(fs.readFileSync(path.join(dir, 'VERSION.json'), 'utf8'));
  assert.equal(v.origem, 'Prof-Ale/ScriptaLab');
  assert.ok(Object.keys(v.arquivos).length >= 8);
  for (const [rel, esperado] of Object.entries(v.arquivos)) {
    const txt = fs.readFileSync(path.join(dir, rel), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(crypto.createHash('sha256').update(txt, 'utf8').digest('hex'), esperado, 'copia alterada: ' + rel);
  }
});

test('só os registros didático e divulgação aparecem no MathLab', () => {
  assert.deepEqual(O.REGISTROS_MATHLAB.map((r) => r.id), ['didatico', 'divulgacao']);
});

const mat = (content, extra = {}) => ({ title: 'Frações', blocks: [{ id: 'b1', title: 'Intro', content }], ...extra });

test('pega crase, concordância, vício e coloquialismo, com severidade', () => {
  const r = O.revisarPortuguesMaterial(mat('Houveram muitos alunos. As vezes faltam. A nível de escola, tipo assim, vale.'));
  const regras = r.achados.map((a) => a.regra);
  for (const esperado of ['houveram', 'as-vezes', 'a-nivel-de']) assert.ok(regras.includes(esperado), 'faltou ' + esperado);
  assert.ok(r.resumo.erro >= 1 && r.resumo.aviso >= 2);
  assert.equal(r.achados[0].severidade, 'erro', 'erros vêm primeiro');
  assert.ok(r.achados.some((a) => a.fix));
});

test('fórmulas, links e marcadores [F#] não geram sinais', () => {
  const r = O.revisarPortuguesMaterial(mat('A conta $x = 2 + 3 $ , veja https://exemplo.com/houveram e [F1].'));
  assert.ok(!r.achados.some((a) => /houveram|exemplo/.test(a.trecho)));
});

test('texto limpo não gera erro', () => {
  const r = O.revisarPortuguesMaterial(mat('A fração representa uma parte do todo. Dividimos a pizza em oito pedaços iguais.'));
  assert.equal(r.resumo.erro, 0);
});

test('o registro de divulgação é mais exigente com período longo que o didático', () => {
  const longo = Array.from({ length: 30 }, () => 'palavra').join(' ') + '.';
  const d = O.revisarPortuguesMaterial(mat(longo), { registro: 'didatico' }).resumo.total;
  const v = O.revisarPortuguesMaterial(mat(longo), { registro: 'divulgacao' }).resumo.total;
  assert.ok(v >= d);
});

test('lê título, capa e blocos; a revisão não altera o material', () => {
  const m = mat('Texto certo.', { poster: { title: 'As vezes a capa erra', sections: [] } });
  const antes = JSON.stringify(m);
  const r = O.revisarPortuguesMaterial(m);
  assert.ok(r.achados.some((a) => a.onde === 'capa'));
  assert.equal(JSON.stringify(m), antes);
});

test('interface: cartão e ação existem e só sinalizam', () => {
  const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert.match(app, /revisaoPtCard\(\) \+ ortografiaCard\(\)/);
  assert.match(app, /revisarpt:\s*\(\) => revisarPtAcao\(\)/);
  assert.match(app, /Só sinaliza: nada é trocado sozinho/);
});
