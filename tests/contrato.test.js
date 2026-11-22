const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/core.js');

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schema/mathlab.material.2.schema.json'), 'utf8'));
const exemplo = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../schema/exemplos/exemplo-material2-1.json'), 'utf8'));

// Validador mínimo (sem dependências): type, const, enum, required, properties, items, minItems, minLength, pattern, additionalProperties:false, $ref local.
function validar(dado, sch, raiz = schema, caminho = '$') {
  const erros = [];
  if (sch.$ref) { const alvo = sch.$ref.replace('#/', '').split('/').reduce((o, k) => o[k], raiz); return validar(dado, alvo, raiz, caminho); }
  if (sch.const !== undefined && dado !== sch.const) erros.push(caminho + ': esperado ' + JSON.stringify(sch.const));
  if (sch.enum && !sch.enum.includes(dado)) erros.push(caminho + ': fora de enum');
  if (sch.type) {
    const tipos = [].concat(sch.type);
    const t = dado === null ? 'null' : Array.isArray(dado) ? 'array' : typeof dado;
    if (!tipos.includes(t)) { erros.push(caminho + ': tipo ' + t); return erros; }
  }
  if (typeof dado === 'string') {
    if (sch.minLength && dado.length < sch.minLength) erros.push(caminho + ': curto demais');
    if (sch.pattern && !new RegExp(sch.pattern).test(dado)) erros.push(caminho + ': fora do padrão');
  }
  if (Array.isArray(dado)) {
    if (sch.minItems && dado.length < sch.minItems) erros.push(caminho + ': poucos itens');
    if (sch.items) dado.forEach((x, i) => erros.push(...validar(x, sch.items, raiz, caminho + '[' + i + ']')));
  }
  if (dado && typeof dado === 'object' && !Array.isArray(dado)) {
    (sch.required || []).forEach((k) => { if (!(k in dado)) erros.push(caminho + ': falta ' + k); });
    const props = sch.properties || {};
    Object.keys(dado).forEach((k) => {
      if (props[k]) erros.push(...validar(dado[k], props[k], raiz, caminho + '.' + k));
      else if (sch.additionalProperties === false) erros.push(caminho + ': campo não previsto ' + k);
    });
  }
  return erros;
}
const ok = (d) => assert.deepStrictEqual(validar(d, schema), []);
const falha = (d, rx) => { const e = validar(d, schema); assert.ok(e.length, 'deveria falhar'); if (rx) assert.match(e.join(' | '), rx); };

test('a constante do schema é a mesma que o core.js emite', () => {
  assert.strictEqual(schema.properties.schema.const, C.SCHEMA);
});

test('o exemplo 2.1 é válido', () => ok(exemplo()));

test('o demo e o esqueleto offline do site cumprem o contrato sem campos novos', () => {
  ok(C.demo());
  ok(C.scaffold({ discipline: 'Matemática', topic: 'Frações', level: '6º ano' }));
});

test('material 2.0 antigo, sem contractVersion nem blocos novos, continua válido', () => {
  const m = exemplo();
  delete m.contractVersion; delete m.claims; delete m.calculations; delete m.provenance;
  ok(m);
});

test('references vazio é válido: o contrato não obriga a inventar fonte', () => {
  const m = exemplo(); m.references = [];
  ok(m);
});

test('afirmação pode declarar sem_fonte', () => {
  const m = exemplo(); m.claims[0].support = { mode: 'sem_fonte' };
  ok(m);
});

test('modo de sustentação inventado é recusado', () => {
  const m = exemplo(); m.claims[0].support.mode = 'confie_em_mim';
  falha(m, /claims\[0\]\.support\.mode/);
});

test('estado de validação humana não pode vir de fora no provenance', () => {
  for (const e of ['REVISADO_POR_ESPECIALISTA', 'VALIDADO_PELO_RESPONSAVEL_EDITORIAL']) {
    const m = exemplo(); m.provenance.estadoEditorial = e;
    falha(m, /estadoEditorial/);
  }
});

test('versão maior diferente de 2 é recusada (exige material/3)', () => {
  const m = exemplo(); m.contractVersion = '3.0';
  falha(m, /contractVersion/);
});

test('cálculo sem a declaração de quem conferiu é recusado', () => {
  const m = exemplo(); delete m.calculations[0].checkedBy;
  falha(m, /checkedBy/);
});

test('blocos novos são estritos: campo desconhecido em claim é recusado', () => {
  const m = exemplo(); m.claims[0].extra = 1;
  falha(m, /não previsto/);
});

test('o topo é tolerante: campo desconhecido passa', () => {
  const m = exemplo(); m.campoDoFuturo = { a: 1 };
  ok(m);
});

test('sem blocos ou sem schema o material é recusado', () => {
  const a = exemplo(); a.blocks = []; falha(a, /poucos itens/);
  const b = exemplo(); delete b.schema; falha(b, /falta schema/);
});

test('todo tipo epistêmico que o site emite é aceito pelo schema', () => {
  for (const t of Object.keys(C.EPISTEMIC)) { const m = exemplo(); m.epistemicType = t; ok(m); }
});
