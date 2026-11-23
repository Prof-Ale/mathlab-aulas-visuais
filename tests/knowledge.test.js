'use strict';
/* Falha se algum documento da base de conhecimento sumir ou mudar um byte. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex');
const M = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const man = fs.readFileSync(path.join(root, 'knowledge/MANIFESTO_SHA256.md'), 'utf8');
const linhas = [...man.matchAll(/\| \d+ \| `([^`]+)` \|[^|]*\|\s*`(\d+)` \| `([0-9A-F]{64})`/g)].map((m) => ({ nome: m[1], tam: +m[2], hash: m[3].toLowerCase() }));
const presentes = linhas.filter((l) => !l.nome.includes('/'));
const ausentes = linhas.filter((l) => l.nome.includes('/'));

test('o manifesto original lista 10 documentos, 8 presentes e 2 ausentes', () => {
  assert.equal(linhas.length, 10);
  assert.equal(presentes.length, 8);
  assert.deepEqual(ausentes.map((l) => l.nome), M.conhecimento.ausentes);
});
test('cada documento presente existe, tem o tamanho e o SHA-256 do manifesto', () => {
  presentes.forEach((l) => {
    const p = 'knowledge/' + l.nome;
    assert.ok(fs.existsSync(path.join(root, p)), 'sumiu: ' + p);
    assert.equal(fs.statSync(path.join(root, p)).size, l.tam, 'tamanho mudou: ' + p);
    assert.equal(sha(p), l.hash, 'conteúdo mudou: ' + p);
  });
});
test('nenhum arquivo extra em knowledge/ além dos documentos, do manifesto e do LEIA-ME', () => {
  const ok = new Set(presentes.map((l) => l.nome).concat(['MANIFESTO_SHA256.md', 'LEIA-ME.md']));
  fs.readdirSync(path.join(root, 'knowledge')).forEach((f) => assert.ok(ok.has(f), 'arquivo não previsto: ' + f));
});
test('os documentos são tratados como candidatas, não aprovadas', () => {
  assert.match(M.conhecimento.status, /n(a|ã)o aprovadas/);
  presentes.forEach((l) => assert.match(l.nome, /CANDIDATA/));
});
test('documentos de arquitetura conferem com o hash registrado no manifesto do site', () => {
  Object.entries(M.conhecimento.arquitetura).forEach(([p, h]) => {
    assert.ok(fs.existsSync(path.join(root, p)), 'sumiu: ' + p);
    assert.equal(sha(p), h, 'conteúdo mudou: ' + p);
  });
});
test('o .gitattributes protege o fim de linha dos documentos', () => {
  const g = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8');
  assert.match(g, /knowledge\/\*\* -text/);
  assert.match(g, /docs\/architecture\/\*\* -text/);
});
test('o texto do Princípio está como Aprovado', () => {
  assert.match(fs.readFileSync(path.join(root, 'docs/architecture/PRINCIPIO_INTELIGENCIA_EPISTEMICA.md'), 'utf8'), /\| Status \| Aprovado \|/);
});
