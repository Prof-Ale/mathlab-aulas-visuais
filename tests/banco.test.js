// Banco de questões por habilidade (mathlab.bank/1).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/core.js');

const mat = (blocks, extra) => Object.assign({ title: 'Frações', discipline: 'Matemática', level: '6º ano', objectives: [], blocks }, extra || {});

test('demo: extrai as questões numeradas e pareia o gabarito pelo número', () => {
  const b = C.bancoDeQuestoes(C.demo(), { agora: '2026-11-26T00:00:00Z' });
  assert.equal(b.schema, 'mathlab.bank/1');
  assert.equal(b.validado, false);
  assert.ok(b.total >= 8);
  const q1 = b.itens.find((q) => q.blocoTipo === 'exercicios' && q.numero === 1);
  assert.equal(q1.enunciado, '(+6) + (+9)');
  assert.equal(q1.gabarito, '+15');
  assert.match(q1.gabaritoNota, /confira/);
  assert.match(q1.nivel, /Nível 1/);
});

test('habilidade BNCC nunca é inventada: só vale o que está escrito', () => {
  const sem = C.extrairQuestoes(mat([{ type: 'exercicios', title: 'Lista', content: '1. Some 2 + 3.' }]));
  assert.deepEqual(sem[0].habilidades, []);
  assert.equal(sem[0].habilidadesOrigem, 'nenhuma');
  const obj = C.extrairQuestoes(mat([{ type: 'exercicios', title: 'Lista', content: '1. Some 2 + 3.' }], { objectives: ['Desenvolver EF06MA08 em frações'] }));
  assert.deepEqual(obj[0].habilidades, ['EF06MA08']);
  assert.equal(obj[0].habilidadesOrigem, 'objetivos do material');
  const blo = C.extrairQuestoes(mat([{ type: 'exercicios', title: 'Lista (EF06MA11)', content: '1. Some 2 + 3.' }], { objectives: ['EF06MA08'] }));
  assert.deepEqual(blo[0].habilidades, ['EF06MA11']);
  assert.equal(blo[0].habilidadesOrigem, 'bloco');
  const qst = C.extrairQuestoes(mat([{ type: 'exercicios', title: 'Lista', content: '1. (EF07MA01) Some 2 + 3.\n2. Some 4 + 5.' }], { objectives: ['EF06MA08'] }));
  assert.deepEqual(qst[0].habilidades, ['EF07MA01']);
  assert.equal(qst[0].habilidadesOrigem, 'questao');
  assert.deepEqual(qst[1].habilidades, ['EF06MA08']);
});

test('só blocos de exercícios, atividade e avaliação viram questões', () => {
  const q = C.extrairQuestoes(mat([
    { type: 'conceito', title: 'Teoria', content: '1. isto é uma lista de teoria' },
    { type: 'atividade', title: 'Atividade', content: '1. faça A' },
    { type: 'avaliacao', title: 'Verificação', content: '1. calcule B\n2. calcule C' },
    { type: 'gabarito', title: 'Respostas', content: '1. x' },
  ]));
  assert.deepEqual(q.map((x) => x.blocoTipo), ['atividade', 'avaliacao', 'avaliacao']);
});

test('gabarito de avaliação/atividade não é pareado (só exercícios)', () => {
  const q = C.extrairQuestoes(mat([{ type: 'avaliacao', title: 'V', content: '1. calcule' }, { type: 'gabarito', title: 'R', content: '1. 42' }]));
  assert.equal(q[0].gabarito, '');
});

test('banco de vários materiais: contagem por habilidade e ids únicos', () => {
  const a = mat([{ id: 'b1', type: 'exercicios', title: 'L (EF06MA08)', content: '1. a\n2. b' }], { title: 'Aula A' });
  const b = mat([{ id: 'b1', type: 'exercicios', title: 'L (EF06MA08)', content: '1. c' }], { title: 'Aula B' });
  const bank = C.bancoDeQuestoes([a, b]);
  assert.equal(bank.total, 3);
  assert.equal(bank.porHabilidade.EF06MA08, 3);
  assert.equal(new Set(bank.itens.map((x) => x.id)).size, 3);
});

test('lista de exercícios: filtra por habilidade e só mostra gabarito se pedido', () => {
  const m = mat([
    { id: 'b1', type: 'exercicios', title: 'L (EF06MA08)', content: '1. frações\n2. mais frações' },
    { id: 'b2', type: 'exercicios', title: 'M (EF06MA11)', content: '1. decimais' },
    { id: 'b3', type: 'gabarito', title: 'R', content: '1. resposta secreta' },
  ]);
  const bank = C.bancoDeQuestoes(m);
  const h = C.listaDeExercicios(bank, { habilidade: 'ef06ma08' });
  assert.match(h, /frações/);
  assert.doesNotMatch(h, /decimais/);
  assert.doesNotMatch(h, /resposta secreta/);
  assert.match(h, /Rascunho: aguarda revisão do professor/);
  assert.match(C.listaDeExercicios(bank, { comGabarito: true }), /resposta secreta/);
});

test('fixture do App (arquivo real) e exemplo do 6º ano: não quebram e não inventam habilidade', () => {
  for (const f of ['tests/fixtures/app-export.mathlab.json', 'schema/exemplos/exemplo-material2-1.json', 'schema/exemplos/exemplo-6ano-fracoes.json']) {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
    const m = C.fromV2 ? C.importFromText(JSON.stringify(raw)).data || C.normalize(raw) : C.normalize(raw);
    const bank = C.bancoDeQuestoes(m);
    assert.ok(Array.isArray(bank.itens), f);
    const texto = JSON.stringify(raw).toUpperCase();
    for (const q of bank.itens) for (const h of q.habilidades) assert.ok(texto.includes(h), f + ' inventou ' + h);
  }
});
