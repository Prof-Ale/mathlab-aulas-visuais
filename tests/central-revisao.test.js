// Central de revisão: barra de ações, ciclo de correção com antes e depois, desfazer, apresentação.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/core.js');
const ROOT = path.join(__dirname, '..');
let temPlaywright = true;
try { require('playwright'); } catch { temPlaywright = false; }

test('a barra de revisão existe nas abas Revisar e traz o ciclo completo', () => {
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  for (const t of ['acoesRevisaoHtml() + continueStripHtml()', 'data-a="auditagain"', 'data-a="gotopt"', 'data-a="gotoorto"', 'data-a="copyrepair"', 'data-a="togglerepair"', 'data-a="openslides"', 'data-a="undorepair"', 'snapshotRevisao', "'gotovalidar'", 'Pedir correção à IA', 'Colar JSON de correção']) assert.ok(app.includes(t), t);
  assert.ok(!app.includes('id="rp-resp" data-form="reparo" rows="4"'), 'a caixa de colagem não fica duplicada no Editor');
});

test('material inteiro revisado também é aceito como correção', () => {
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  assert.match(app, /Material inteiro substituído/);
  assert.match(app, /pj\.data\.schema !== C\.REPAIR_SCHEMA/);
});

const ruim = (base) => { const m = C.clone(base); m.blocks.forEach((b, i) => { if (i < 4) b.content = 'texto curto'; }); m.references = []; m.limitations = []; return m; };

test('Chromium: auditar, aplicar material pior, ver o antes e o depois, reparar e desfazer', { skip: !temPlaywright && 'playwright não instalado' }, async () => {
  const { chromium } = require('playwright');
  const orig = C.normalize(C.demo());
  const reparo = { schema: C.REPAIR_SCHEMA, blocks: [0, 1].map((i) => ({ id: orig.blocks[i].id, content: orig.blocks[i].content })) };
  const b = await chromium.launch();
  try {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
    const erros = []; p.on('pageerror', (e) => erros.push(e.message));
    await p.goto('file://' + path.join(ROOT, 'index.html')); await p.waitForTimeout(400);
    await p.click('[data-a="previewdemo"]'); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('[data-a="tab"][data-t="auditoria"]').click());
    assert.ok(await p.$('.rev-actions'), 'barra presente na Auditoria');
    assert.match(await p.textContent('.ra-next .b'), /Auditar agora/);
    await p.click('.ra-next .b');
    const nota0 = await p.textContent('.ra-nota'); assert.match(nota0, /Nota \d+/);
    assert.match(await p.textContent('.ra-next .b'), /Validar como professor/);
    await p.click('[data-a="togglerepair"]'); await p.fill('#rp-resp', JSON.stringify(ruim(orig))); await p.click('[data-a="applyrepair"]');
    const d1 = await p.textContent('.ra-delta');
    assert.match(d1, /Nota \d+ → \d+/); assert.match(d1, /Apareceram agora/);
    assert.match(await p.textContent('.ra-next .b'), /Pedir correção à IA/);
    await p.click('[data-a="togglerepair"]'); await p.fill('#rp-resp', JSON.stringify(reparo)); await p.click('[data-a="applyrepair"]');
    const d2 = await p.textContent('.ra-delta'); assert.match(d2, /Resolvidos/);
    await p.click('[data-a="undorepair"]');
    assert.match(await p.textContent('.ra-nota'), /ponto\(s\) pendente/);
    await p.click('[data-a="tab"][data-t="editor"]');
    assert.ok(await p.$('.rev-actions'), 'barra também no Editor');
    assert.equal(await p.$('#rp-resp'), null, 'sem caixa duplicada com a barra fechada');
    assert.deepEqual(erros, []);
  } finally { await b.close(); }
});

test('Chromium: botão Apresentação abre os slides e JSON inválido dá erro claro', { skip: !temPlaywright && 'playwright não instalado' }, async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(ROOT, 'index.html')); await p.waitForTimeout(300);
    await p.click('[data-a="previewdemo"]'); await p.waitForTimeout(150);
    await p.click('[data-a="togglerepair"]'); await p.fill('#rp-resp', 'não é json'); await p.click('[data-a="applyrepair"]');
    assert.match(await p.textContent('#toast'), /Não encontrei um JSON/);
    const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('.ra-btns [data-a="openslides"]')]);
    await pop.waitForLoadState('load');
    assert.ok((await pop.content()).length > 5000, 'slides abertos');
  } finally { await b.close(); }
});
