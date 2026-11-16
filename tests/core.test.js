const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/core.js');

test('exemplo completo passa na auditoria sem falha grave', () => {
  const a = C.audit(C.demo());
  assert.strictEqual(a.hard.length, 0, JSON.stringify(a.hard));
  assert.ok(a.score >= 70, 'score ' + a.score);
  assert.strictEqual(a.categories.length, 10);
});

test('esqueleto offline NUNCA pode ser aprovado (honestidade)', () => {
  const s = C.scaffold({ discipline: 'Filosofia', topic: 'Ética em Aristóteles', level: '1º ano EM' });
  assert.strictEqual(s.epistemicType, 'interpretativa');
  const a = C.audit(s);
  assert.ok(a.hard.length > 0);
  assert.match(a.level, /Reprovado/);
});

test('detecta tipo de conhecimento por disciplina', () => {
  const t = (d) => C.detectType(d);
  assert.strictEqual(t('Matemática'), 'formal');
  assert.strictEqual(t('Física'), 'empirica');
  assert.strictEqual(t('História'), 'historica');
  assert.strictEqual(t('Língua Portuguesa'), 'linguistica');
  assert.strictEqual(t('Educação Física'), 'pratica');
  assert.strictEqual(t('Sociologia'), 'interpretativa');
  assert.strictEqual(t('Culinária'), 'pratica');
});

test('importa JSON com cercas de código e texto em volta', () => {
  const txt = 'Aqui está:\n```json\n' + JSON.stringify(C.demo()) + '\n```\nQualquer coisa me avise.';
  const r = C.importFromText(txt);
  assert.ok(r.ok, r.error);
  assert.strictEqual(r.material.title, 'Soma de números inteiros');
  assert.strictEqual(r.material.meta.generatedBy, 'skill'); // JSON importado conta como vindo da skill
});

test('JSON quebrado devolve erro claro, sem exceção', () => {
  const r = C.importFromText('{ "title": "x", ');
  assert.strictEqual(r.ok, false);
  assert.ok(r.error);
  assert.strictEqual(C.importFromText('sem json nenhum').ok, false);
});

test('SVG perigoso é sanitizado e reprovado na auditoria', () => {
  const evil = '<svg xmlns="http://www.w3.org/2000/svg"><title>x</title><script>alert(1)</script><rect onclick="x()" width="5"/><image href="http://x/y.png"/></svg>';
  const clean = C.sanitizeSvg(evil);
  assert.ok(!/script|onclick|<image/i.test(clean));
  const m = C.demo(); m.blocks.push({ type: 'visual', title: 'ruim', content: 'texto', svg: evil });
  assert.ok(C.audit(m).hard.some((h) => /SVG/.test(h.msg)));
});

test('markdown escapa HTML e preserva fórmulas', () => {
  const h = C.renderMarkdown('<img src=x onerror=alert(1)> **ok** e $a*b*c$\n\n1. um\n2. dois');
  assert.ok(!/<img/.test(h));
  assert.match(h, /<span class="math">a\*b\*c<\/span>/);
  assert.match(h, /<ol start="1">/);
});

test('referência incompleta é falha grave', () => {
  const m = C.demo(); m.references = [{ title: 'Algo', authors: '', year: '', accessLevel: 'integral' }];
  assert.ok(C.audit(m).hard.some((h) => /incompleta/.test(h.msg)));
});

test('prompt de imagem contém textos exatos e não menciona proporção', () => {
  const m = C.demo(); const p = C.buildImagePrompt(m);
  assert.match(p, /Soma de Números Inteiros/);
  assert.match(p, /DICA DE OURO/);
  assert.ok(!/\d+\s*:\s*\d+|proporção|aspect/i.test(p), 'não deve ter proporção');
  m.poster.sections.forEach((s) => assert.ok(p.includes(s.text)));
});

test('HTML exportado contém pôster, seções e SVG; sem script', () => {
  const h = C.toHTML(C.demo());
  assert.match(h, /class="mlp"/);
  assert.match(h, /<svg/);
  assert.match(h, /Exercícios graduados/);
  assert.ok(!/<script/i.test(h));
});

test('geradores de SVG produzem figuras acessíveis', () => {
  const V = C.VISUALS;
  const figs = [V.numberLine({ min: -5, max: 5, jump: { from: 1, by: -4 } }), V.timeline({ events: [{ when: '1500', label: 'Chegada' }, { when: '1822', label: 'Independência do Brasil' }, { when: '1889', label: 'República' }] }),
    V.flow({ steps: ['Observar', 'Hipótese', 'Testar'] }), V.conceptMap({ center: 'Fotossíntese', nodes: ['Luz', 'Água', 'CO2', 'Glicose'] })];
  figs.forEach((f) => { assert.match(f, /<title/); assert.match(f, /<desc/); assert.ok(!/NaN|undefined/.test(f)); });
});

test('markdown de exportação inclui seções', () => {
  const md = C.toMarkdown(C.demo());
  assert.match(md, /^# Soma de números inteiros/);
  assert.match(md, /## Apostila visual/);
});

test('pedido para o Gem inclui disciplina, tema e exige JSON', () => {
  const t = C.buildRequestText({ discipline: 'História', topic: 'Revolução Francesa', level: '8º ano' });
  assert.match(t, /Revolução Francesa/);
  assert.match(t, /SOMENTE/);
  assert.match(t, /Histórica/);
});

test('"R$" (reais) não vira fórmula nem gera aviso falso', () => {
  const h = C.renderMarkdown('Saldo de −R$ 40 e depósito de R$ 25.');
  assert.ok(!/class="math"/.test(h), h);
  const m = C.demo();
  assert.ok(!C.audit(m).soft.some((x) => /\$/.test(x.msg)), 'sem aviso falso de $');
  m.blocks[0].content = 'Fórmula aberta $a + b sem fechar';
  assert.ok(C.audit(m).soft.some((x) => /\$/.test(x.msg)), 'deve avisar fórmula realmente desbalanceada');
});

test('v1.5: versão do núcleo é 1.5.x e autor padrão é Prof. Alê Barbosa', () => {
  assert.match(C.VERSION, /^1\.5\./);
  assert.strictEqual(C.DEFAULT_AUTHOR, 'Prof. Alê Barbosa');
});

test('v1.1: callout é normalizado; tipo inválido vira "dica"; texto vazio é descartado', () => {
  const m = C.normalize({ title: 'T', blocks: [
    { type: 'conceito', title: 'A', content: 'x', callout: { kind: 'prova', text: ' Cai em prova ' } },
    { type: 'conceito', title: 'B', content: 'x', callout: { kind: 'inexistente', text: 'ok' } },
    { type: 'conceito', title: 'C', content: 'x', callout: { kind: 'dica', text: '   ' } },
    { type: 'conceito', title: 'D', content: 'x' },
  ] });
  assert.deepStrictEqual(m.blocks[0].callout, { kind: 'prova', text: 'Cai em prova' });
  assert.strictEqual(m.blocks[1].callout.kind, 'dica');
  assert.strictEqual(m.blocks[2].callout, null);
  assert.strictEqual(m.blocks[3].callout, null);
});

test('v1.1: materiais antigos (sem callout) continuam importando e gerando apostila', () => {
  const old = JSON.parse(JSON.stringify(C.demo()));
  old.blocks.forEach((b) => delete b.callout);
  const r = C.importFromText('```json\n' + JSON.stringify(old) + '\n```');
  assert.ok(r.ok);
  assert.match(C.toApostila(r.material), /class="mlpage mlcover"/);
});

test('v1.1: apostila completa tem capa, "Antes de começar", um cartão por bloco, "Em resumo" e rodapé', () => {
  const m = C.demo(); const h = C.toApostila(m);
  assert.match(h, /mlpage mlcover/);
  assert.match(h, /Antes de começar/);
  assert.match(h, /Nesta apostila/);
  assert.match(h, /Em resumo/);
  assert.strictEqual((h.match(/class="mlc mlmove"/g) || []).filter(Boolean).length >= m.blocks.length, true);
  m.blocks.forEach((b) => assert.ok(h.includes(C.esc(b.title)), 'falta bloco ' + b.title));
  assert.match(h, /DICA DE OURO/); assert.match(h, /COBRANÇA EM PROVAS/); assert.match(h, /ATENÇÃO AOS DETALHES/);
  assert.match(h, /validado pelo professor/);
});

test('v1.1: apostila sem pôster não tem capa, mas tem miolo', () => {
  const m = C.demo(); m.poster = null;
  const h = C.toApostila(m);
  assert.ok(!/mlpage mlcover/.test(h));
  assert.match(h, /Antes de começar/);
});

test('v1.1: apostila é segura (HTML escapado, SVG saneado) e o script só aparece uma vez', () => {
  const m = C.demo();
  m.title = '<img src=x onerror=alert(1)>';
  m.blocks[0].content = '<script>alert(1)</script> texto';
  m.blocks[0].callout = { kind: 'dica', text: '<b onclick=x>oi</b>' };
  m.blocks[2].svg = '<svg viewBox="0 0 10 10"><script>alert(1)</script><circle cx="5" cy="5" r="2" onclick="x()"/></svg>';
  const h = C.toApostila(m);
  assert.ok(!/<img src=x/.test(h));
  assert.ok(!/<script>alert/.test(h));
  assert.ok(!/<[a-z][^>]*\son(click|error)\s*=/i.test(h), 'nenhuma tag com atributo de evento');
  assert.strictEqual((h.match(/<script>/g) || []).length, 1, 'só o script de paginação');
});

test('v1.1: Markdown de exportação inclui o callout', () => {
  assert.match(C.toMarkdown(C.demo()), /DICA DE OURO/);
});

test('v1.2: perfil expositivo não exige exercícios nem gabarito na auditoria', () => {
  const m = C.normalize({
    title: 'Equações do 1º grau',
    discipline: 'Matemática',
    level: '7º ano',
    contentProfile: 'expositivo',
    objectives: ['Compreender o conceito de igualdade e incógnita'],
    blocks: [
      { type: 'problematizacao', title: 'Problema inicial', content: 'Uma balança em equilíbrio.' },
      { type: 'conceito', title: 'Conceito de equação', content: 'Equação é uma igualdade com incógnita.' },
      { type: 'exemplo', title: 'Exemplo resolvido', content: 'Se $x + 3 = 7$, então $x = 4$.' }
    ],
    limitations: ['Validar com a turma.']
  });
  const a = C.audit(m);
  assert.ok(!a.soft.some((x) => /exercícios|gabarito/i.test(x.msg)), 'expositivo não deve ser penalizado por falta de exercícios/gabarito');
});

test('v1.2: buildRequestText inclui Psicologia Histórico-Cultural, perfil e sem teto de 6 páginas', () => {
  const txt = C.buildRequestText({
    discipline: 'Matemática',
    topic: 'Funções Afins',
    level: '9º ano',
    contentProfile: 'expositivo'
  });
  assert.match(txt, /Psicologia Histórico-Cultural/);
  assert.match(txt, /Prof\. Alê Barbosa/);
  assert.match(txt, /expositivo/i);
  assert.ok(!/máximo de 6 páginas|2 a 6 páginas/i.test(txt), 'não deve limitar o miolo a 6 páginas');
});

test('v1.2: renderPoster, toApostila e buildImagePrompt incluem Prof. Alê Barbosa', () => {
  const m = C.demo();
  assert.match(C.renderPoster(m.poster), /Prof\. Alê Barbosa/);
  assert.match(C.toApostila(m), /Prof\. Alê Barbosa/);
  assert.match(C.buildImagePrompt(m), /Prof\. Alê Barbosa/);
});

test('v1.3: Capa Clean, Folha de Rosto, etiquetas Histórico-Culturais e Minha Síntese na apostila', () => {
  const m = C.demo();
  const h = C.toApostila(m);
  assert.match(h, /class="mlclean"/);
  assert.match(h, /MathLab Educação/);
  assert.match(h, /Conceito Científico &amp; Mediação Semiótica/);
  assert.match(h, /Minha Síntese \(Registro do Estudante\)/);
  assert.match(h, /Caveat/);
  assert.match(h, /Nunito/);
});

test('v1.4: Miolo Editorial Clean inclui pílula de página, guia, navegação, videoaula opcional, Sobre o Autor e Colofão', () => {
  const m = C.demo();
  m.poster.interiorStyle = 'editorial';
  m.poster.videoTitle = 'Aula de Inteiros';
  m.poster.videoUrl = 'https://youtube.com/watch?v=123';
  const h = C.toApostila(m);
  assert.match(h, /class="mlbook ml-ed"/);
  assert.match(h, /class="mlph-pg"/);
  assert.match(h, /class="mled-guide mlmove"/);
  assert.match(h, /class="mlnav"/);
  assert.match(h, /Aula de Inteiros/);
  assert.match(h, /class="mlauthor-box mlmove"/);
  assert.match(h, /id="ml-colophon"/);
});

test('v1.5: impressão oculta .mlnav e material legado v1.3 mantém estilo lúdico por padrão', () => {
  const h = C.toApostila(C.demo());
  assert.match(h, /@media print\{[\s\S]*\.mlnav\{display:none!important\}/);
  const leg = C.normalize({ title: 'Antigo', meta: { version: '1.3.0' }, poster: { title: 'Antigo' } });
  assert.strictEqual(leg.poster.interiorStyle, 'ludico');
});
