// Slides HTML interativos: plano (dados puros) e HTML gerado.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');

const base = (blocks, extra) => Object.assign({ title: 'Frações', discipline: 'Matemática', level: '6º ano', duration: '2 aulas', objectives: ['Comparar frações'], blocks }, extra || {});
const bloco = (type, title, content, more) => Object.assign({ type, title, content }, more || {});

test('plano: capa, objetivos, blocos na ordem e fim', () => {
  const p = C.slidePlan(base([bloco('conceito', 'Ideia', 'Texto curto.'), bloco('exemplo', 'Exemplo', 'Outro texto.')]));
  assert.deepEqual(p.slides.map((s) => s.kind), ['capa', 'lista', 'bloco', 'bloco', 'fim']);
  assert.equal(p.slides[2].title, 'Ideia');
  assert.equal(p.relatorio.slides, 5);
});

test('rascunho: capa e fim declaram "aguarda revisão" e nunca "validado"', () => {
  const p = C.slidePlan(base([bloco('conceito', 'Ideia', 'x')]));
  for (const s of [p.slides[0], p.slides[p.slides.length - 1]]) { assert.equal(s.validado, false); assert.match(s.status, /Rascunho/); }
  const h = C.toSlides(base([bloco('conceito', 'Ideia', 'x')]));
  assert.match(h, /Rascunho · aguarda revisão do professor/);
  assert.doesNotMatch(h, /Validado pelo professor/);
});

test('gabarito fica de fora por padrão e entra com { gabarito: true }', () => {
  const m = base([bloco('exercicios', 'Lista', '1. a\n2. b'), bloco('gabarito', 'Respostas', '1. x\n2. y')]);
  const sem = C.slidePlan(m);
  assert.equal(sem.relatorio.gabaritoOmitido, 1);
  assert.ok(!sem.slides.some((s) => s.tipo === 'gabarito'));
  assert.doesNotMatch(C.toSlides(m), /Respostas/);
  const com = C.slidePlan(m, { gabarito: true });
  assert.ok(com.slides.some((s) => s.tipo === 'gabarito'));
  assert.match(C.toSlides(m, { gabarito: true }), /Respostas/);
});

test('bloco longo é dividido sem perder nenhuma palavra e a numeração continua', () => {
  const itens = Array.from({ length: 24 }, (_, i) => (i + 1) + '. questão número ' + (i + 1) + ' com um enunciado razoavelmente longo para ocupar espaço').join('\n');
  const m = base([bloco('exercicios', 'Muitas', itens)]);
  const p = C.slidePlan(m, { maxPalavras: 60 });
  const partes = p.slides.filter((s) => s.tipo === 'exercicios');
  assert.ok(partes.length > 2);
  assert.match(partes[0].title, /\(1\/\d+\)/);
  const juntos = partes.map((s) => s.content).join('\n');
  for (let i = 1; i <= 24; i++) assert.ok(juntos.includes('questão número ' + i + ' '), 'perdeu a questão ' + i);
  assert.ok(partes[1].start > 1);
  const h = C.toSlides(m, { maxPalavras: 60 });
  assert.match(h, /<ol start="\d+">/);
});

test('figura longa vai para slide próprio; figura com texto curto fica junto', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img"><title>Reta</title><desc>Uma reta</desc><circle cx="5" cy="5" r="3"/></svg>';
  const longo = Array.from({ length: 60 }, () => 'palavra').join(' ');
  const a = C.slidePlan(base([bloco('visual', 'Fig A', longo, { svg })]));
  assert.ok(a.slides.some((s) => s.kind === 'figura'));
  const b = C.slidePlan(base([bloco('visual', 'Fig B', 'curto', { svg })]));
  assert.ok(!b.slides.some((s) => s.kind === 'figura'));
  assert.ok(b.slides.some((s) => s.svg));
  assert.match(C.toSlides(base([bloco('visual', 'Fig B', 'curto', { svg })])), /<title>Reta<\/title>/);
});

test('SVG com script ou handler é saneado nos slides', () => {
  const svg = '<svg viewBox="0 0 10 10"><script>alert(1)</script><circle cx="5" cy="5" r="3" onclick="alert(2)"/></svg>';
  const h = C.toSlides(base([bloco('visual', 'Perigo', 'x', { svg })]));
  assert.doesNotMatch(h, /alert\(/);
  assert.doesNotMatch(h, /<[a-z][^>]*\son\w+\s*=/i, 'nenhum elemento com handler inline (on*=)');
});

test('fórmulas são renderizadas (KaTeX) e R$ não vira fórmula', () => {
  const h = C.toSlides(base([bloco('conceito', 'Fórmula', 'Vale $\\frac{1}{2}$ e custa R$ 5 e R$ 7.')]));
  assert.match(h, /class="katex"/);
  assert.match(h, /R\$ 5 e R\$ 7/);
});

test('HTML: acessível, autocontido e sem recursos externos', () => {
  const h = C.toSlides(C.demo());
  assert.match(h, /<html lang="pt-BR">/);
  assert.match(h, /aria-roledescription="slide"/);
  assert.match(h, /aria-live="polite"/);
  assert.match(h, /prefers-reduced-motion/);
  assert.match(h, /@page\{size:A4 landscape/);
  assert.match(h, /class="skip"/);
  assert.doesNotMatch(h, /<link /i);
  assert.doesNotMatch(h, /(?:src|href)="https?:/i);
  const n = (h.match(/<section class="slide/g) || []).length;
  assert.equal(n, C.slidePlan(C.demo()).slides.length);
});

test('título malicioso não quebra o HTML nem injeta script', () => {
  const t = '</title><script>alert(1)</script><b>';
  const h = C.toSlides(base([bloco('conceito', t, t)], { title: t }));
  assert.doesNotMatch(h, /<script>alert\(1\)/);
  assert.equal((h.match(/<script>/g) || []).length, 1, 'só o script do motor');
});

test('material vazio ou quase vazio não quebra', () => {
  for (const m of [{}, { title: '' }, { blocks: [] }, { title: 'x', blocks: [{ type: 'conceito', title: 'a', content: '' }] }, null, undefined]) {
    const p = C.slidePlan(m);
    assert.ok(p.slides.length >= 2);
    assert.match(C.toSlides(m), /<section class="slide capa"/);
  }
});

test('callout aparece no último slide do bloco', () => {
  const m = base([bloco('nota', 'Erros', 'texto', { callout: { kind: 'atencao', text: 'Cuidado com o sinal.' } })]);
  const p = C.slidePlan(m);
  assert.equal(p.slides.filter((s) => s.callout).length, 1);
  assert.match(C.toSlides(m), /ATENÇÃO AOS DETALHES[\s\S]*Cuidado com o sinal/);
});

test('validação humana atualizada aparece como validado', () => {
  const m = C.normalize(base([bloco('conceito', 'Ideia', 'x')]));
  m.revisao = { aprovado: true, revisadoPor: 'Prof. Ana', data: '2026-11-01', hash: C.hashConteudo(m) };
  const p = C.slidePlan(m);
  assert.equal(p.slides[0].validado, true);
  assert.match(p.slides[0].status, /Validado pelo professor · Prof\. Ana/);
  m.blocks[0].content = 'mudou depois de validar';
  assert.equal(C.slidePlan(m).slides[0].validado, false);
});
