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
