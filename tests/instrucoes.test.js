'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const files = {
  skill: fs.readFileSync(path.join(root, 'skill', 'SKILL.md'), 'utf8'),
  gem: fs.readFileSync(path.join(root, 'gemini', 'GEM_INSTRUCOES.md'), 'utf8'),
  gpt: fs.readFileSync(path.join(root, 'chatgpt', 'CHATGPT_GPT_INSTRUCOES.md'), 'utf8'),
};
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const campos = ['epistemicType', 'contentProfile', 'registro', 'destinatario', 'objectives', 'prerequisites', 'blocks', 'references', 'limitations', 'poster', 'meta'];

test('instruções: os três arquivos trazem os mesmos campos do esquema', () => {
  for (const [nome, txt] of Object.entries(files)) {
    for (const c of campos) assert.ok(txt.includes('"' + c + '"'), nome + ' sem o campo ' + c);
  }
});

test('instruções: versão igual nos três arquivos e no package.json', () => {
  for (const [nome, txt] of Object.entries(files)) {
    assert.ok(txt.includes('"version": "' + pkg.version + '"') || txt.includes('"version":"' + pkg.version + '"'), nome + ' com meta.version diferente de ' + pkg.version);
  }
});

test('instruções: pergunta de esclarecimento é a única exceção ao JSON', () => {
  for (const [nome, txt] of Object.entries(files)) {
    assert.match(txt, /(ÚNICA exceção|única exceção)/, nome);
    assert.match(txt, /sem JSON/, nome);
  }
});

test('instruções: orientam tema interdisciplinar sem apagar perspectivas', () => {
  for (const [nome, txt] of Object.entries(files)) {
    assert.match(txt, /interdisciplinares/i, nome);
    assert.match(txt, /Perspectivas complementares/, nome);
  }
});

test('instruções: DUA, objetivos de 2 a 4 e terminologia da Educação Especial nos três', () => {
  for (const [nome, txt] of Object.entries(files)) {
    assert.match(txt, /Desenho Universal para a Aprendizagem/, nome);
    assert.match(txt, /representação/, nome);
    assert.match(txt, /2 a 4/, nome);
    assert.match(txt, /estudantes da Educação Especial/, nome);
    assert.match(txt, /público-alvo da Educação Especial/, nome);
  }
});

test('instruções: o esquema de referências é completo no GPT, no Gem e na Skill', () => {
  for (const [nome, txt] of Object.entries(files)) {
    for (const c of ['authors', 'venue', 'doi', 'accessLevel', 'verified']) {
      assert.ok(txt.includes('"' + c + '"'), nome + ' sem ' + c + ' em references');
    }
  }
});

test('instruções: o bloco colável do GPT cabe no limite de 8000 caracteres do campo Instructions', () => {
  const m = files.gpt.match(/```text\n([\s\S]*?)\n```/);
  assert.ok(m, 'bloco text não encontrado');
  assert.ok([...m[1]].length <= 8000, 'bloco do GPT com ' + [...m[1]].length + ' caracteres');
});

test('instruções: Educação Especial manda tratar os decretos de 2025 como norma a verificar', () => {
  for (const [nome, txt] of Object.entries(files)) {
    assert.match(txt, /12\.686/, nome);
    assert.match(txt, /12\.773/, nome);
    assert.match(txt, /legislação vigente/, nome);
  }
});

// Fatia 3 da Fase 2: formatos auxiliares do plano por unidades e do reparo.
const C = require('../js/core.js');

test('instruções: os três arquivos citam os formatos auxiliares com os nomes que o site espera', () => {
  for (const [nome, txt] of Object.entries(files)) {
    for (const f of [C.BLUEPRINT_SCHEMA, C.UNIT_SCHEMA, C.REPAIR_SCHEMA]) assert.ok(txt.includes(f), nome + ' sem ' + f);
    assert.match(txt, /nunca inclua "revisao"/i, nome);
  }
});

test('instruções: Gem e Skill trazem os campos completos de plano, unidade e reparo', () => {
  for (const nome of ['gem', 'skill']) {
    for (const c of ['"units"', '"mustCover"', '"dependsOn"', '"blockTypes"', '"unitId"', '"forNextUnit"', '"terms"', '"notation"', '"assumed"', '"notes"']) {
      assert.ok(files[nome].includes(c), nome + ' sem ' + c);
    }
    for (const c of ['contractVersion', 'claims', 'calculations', 'provenance', 'sem_fonte', 'nao_conferido']) assert.ok(files[nome].includes(c), nome + ' sem ' + c);
  }
});

test('instruções: só a Skill, que pode rodar código, admite checkedBy "codigo"; ninguém usa "humano"', () => {
  assert.match(files.skill, /rodado código/);
  assert.doesNotMatch(files.gem, /use "codigo"/);
  assert.match(files.skill, /Nunca use "humano"/);
});

test('instruções: o site importa os exemplos de plano que as instruções descrevem', () => {
  const m = files.skill.match(/mathlab\.blueprint\/1 \(plano\): (\{.*?\})\. De 2 a 8/s);
  assert.ok(m, 'exemplo de plano não encontrado na Skill');
  const r = C.importBlueprint(m[1]);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.blueprint.units.length, 1);
});

test('instruções: o exemplo de reparo e de unidade da Skill é aceito pelo schema esperado', () => {
  const u = files.skill.match(/mathlab\.unit\/1 \(uma unidade do plano aprovado\): (\{.*?\})\. Escreva só/s);
  const r = files.skill.match(/mathlab\.repair\/1 \(correção\): (\{.*?\})\. Envie só/s);
  assert.ok(u && r);
  assert.strictEqual(JSON.parse(u[1]).schema, C.UNIT_SCHEMA);
  assert.strictEqual(JSON.parse(r[1]).schema, C.REPAIR_SCHEMA);
});
