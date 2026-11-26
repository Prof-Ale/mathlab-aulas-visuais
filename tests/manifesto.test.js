'use strict';
/* O manifesto é a fonte única das versões. Se uma peça mudar sem o manifesto, estes testes quebram. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const ler = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const M = JSON.parse(ler('manifest.json'));
const C = require('../js/core.js');
const D = require('../js/dominios.js');

test('versão do pacote e do motor batem com package.json e core.js', () => {
  assert.equal(M.pacote, JSON.parse(ler('package.json')).version);
  assert.equal(M.motor, C.VERSION);
});
test('identificadores de contrato e formatos auxiliares batem com o código', () => {
  assert.equal(M.contrato.schema, C.SCHEMA);
  assert.equal(M.formatosAuxiliares.blueprint, C.BLUEPRINT_SCHEMA);
  assert.equal(M.formatosAuxiliares.unidade, C.UNIT_SCHEMA);
  assert.equal(M.formatosAuxiliares.reparo, C.REPAIR_SCHEMA);
  assert.equal(M.formatosAuxiliares.dominio, D.DOMAIN_SCHEMA);
});
test('o schema JSON, o exemplo e a documentação falam a mesma versão de contrato', () => {
  const sch = JSON.parse(ler(M.contrato.arquivo));
  assert.equal(sch.properties.schema.const, M.contrato.schema);
  assert.match(sch.title + sch.description, new RegExp(M.contrato.versao.replace('.', '\\.')));
  assert.equal(JSON.parse(ler(M.contrato.exemplo)).contractVersion, M.contrato.versao);
  assert.match(ler('docs/CONTRATO_MATERIAL_2.md'), new RegExp(M.contrato.versao.replace('.', '\\.')));
});
test('as três instruções (Skill, Gem, GPT) estão na versão do manifesto e na mesma versão entre si', () => {
  const v = M.instrucoes.versao;
  M.instrucoes.arquivos.forEach((a) => {
    const t = ler(a);
    assert.ok(t.includes('v' + v), a + ' não declara v' + v);
    assert.ok(!/v1\.[0-5]\.\d/.test(t.split('\n').slice(0, 10).join('\n')), a + ' ainda cita versão antiga no cabeçalho');
  });
  assert.ok(ler('gemini/GEM_INSTRUCOES.md').includes('"version":"' + v + '"'));
  assert.ok(ler('skill/SKILL.md').includes('"version": "' + v + '"'));
});
test('módulos de script: index.html, manifesto e build-standalone listam os mesmos, na mesma ordem', () => {
  const html = [...ler('index.html').matchAll(/<script src="(js\/[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(html, M.modulos);
  M.modulos.forEach((m) => assert.ok(fs.existsSync(path.join(root, m)), m + ' não existe'));
  const build = ler('tools/build-standalone.js');
  let ultimo = -1; M.modulos.forEach((m) => { const i = build.indexOf(m); assert.ok(i > ultimo, m + ' ausente ou fora de ordem no build'); ultimo = i; });
});
test('o standalone gerado carrega todos os módulos', () => {
  const f = path.join(root, 'dist/mathlab-standalone.html'); if (!fs.existsSync(f)) return;
  const t = fs.readFileSync(f, 'utf8');
  ['MathLabCore', 'MathLabDominios', 'MathLabLivro', 'MathLabFontes'].forEach((k) => assert.ok(t.includes(k), k));
});
test('todo teste do diretório tests está no script npm test', () => {
  const scripts = JSON.parse(ler('package.json')).scripts.test;
  fs.readdirSync(path.join(root, 'tests')).filter((f) => f.endsWith('.test.js')).forEach((f) => assert.ok(scripts.includes('tests/' + f), f + ' fora do npm test'));
});
test('UI/UX v2: shell com H1, Open Graph, 3 grupos, modo escuro, busca e versão unificada', () => {
  const html = ler('index.html');
  assert.match(html, /<h1[^>]*>[^<]+<\/h1>/, 'index.html precisa de H1 visível');
  assert.ok(html.includes('property="og:title"') && html.includes('name="twitter:card"'), 'tags Open Graph/Twitter presentes');
  assert.ok(html.includes('id="groups"') && html.includes('id="themeBtn"') && html.includes('id="verTop"'), 'elementos de navegação, tema e versão no topo');
  assert.ok(html.includes('<noscript>'), 'fallback noscript presente');
  const css = ler('css/styles.css');
  assert.ok(css.includes('prefers-color-scheme: dark') && css.includes('data-theme="dark"'), 'suporte a tema escuro no CSS');
  assert.ok(css.includes('scroll-margin-top'), 'scroll-margin-top para âncoras abaixo do topo fixo');
  const app = ler('js/app.js');
  assert.ok(app.includes("tab: lib.projects.length ? 'biblioteca' : 'criar'"), 'primeira visita abre na aba Criar');
  assert.ok(app.includes('const GROUPS =') && app.includes('criar:') && app.includes('revisar:') && app.includes('organizar:'), 'navegação em 3 grupos');
  assert.ok(app.includes('previewdemo:') && app.includes('savepreviewdemo:') && app.includes('exitpreviewdemo:'), 'prévia de exemplo sem gravar na biblioteca');
  assert.ok(app.includes('gotostep3:') && app.includes('card-fluxo-ia'), 'stepper persistente de 4 passos para IA externa');
  assert.ok(app.includes('libSearch') && app.includes("fetch('manifest.json')"), 'busca na biblioteca e versão lida do manifest.json');
});
test('Formulário pedagógico + emblema editorial: detecção epistemológica, seções modulares, calibração e fim do bonequinho', () => {
  assert.equal(C.calibrateStage('4º ano do Ensino Fundamental').id, 'ef_iniciais');
  assert.equal(C.calibrateStage('8º ano').id, 'ef_finais');
  assert.equal(C.calibrateStage('2º ano do Ensino Médio').id, 'em');
  assert.equal(C.calibrateStage('EJA - Ensino Médio').id, 'eja');
  assert.equal(C.calibrateStage('Graduação em Administração').id, 'superior');
  assert.equal(C.calibrateStage('Mestrado em Educação').id, 'pos');
  assert.equal(C.calibrateStage('8º ano', 'superior').id, 'superior');

  const req = C.buildRequestText({
    discipline: 'História', level: '2º ano do Ensino Médio', topic: 'Revolução Industrial',
    type: 'auto', sections: ['problematizacao', 'contexto', 'conceito', 'exemplo']
  });
  assert.ok(req.includes('NÃO substitui a epistemologia'), 'separa PHC da epistemologia da disciplina');
  assert.ok(req.includes('Histórica'), 'detecta epistemologia pela disciplina');
  assert.ok(req.includes('Ensino Médio'), 'inclui calibração pedagógica da etapa');
  assert.ok(req.includes('NÃO inclua lista de exercícios nem gabarito'), 'respeita seções modulares sem exercícios');

  const sc = C.scaffold({ discipline: 'Física', topic: 'Leis de Newton', sections: ['problematizacao', 'conceito', 'exemplo'] });
  assert.deepEqual(sc.blocks.map((b) => b.type), ['problematizacao', 'conceito', 'exemplo']);

  const coreSrc = ler('js/core.js');
  assert.ok(!coreSrc.includes('MASCOT_SVG'), 'MASCOT_SVG removido completamente de js/core.js');
  assert.ok(!coreSrc.includes('mlp-mascot') && !coreSrc.includes('mled-guide-av'), 'classes CSS órfãs de mascote renomeadas');
  assert.ok(!('svg' in C.AVATAR_OPTIONS), 'opção svg de mascote removida de AVATAR_OPTIONS');

  Object.keys(C.EPISTEMIC).forEach((tipo) => {
    const svg = C.emblemFor(tipo);
    assert.ok(svg.includes('<svg') && svg.includes('aria-label="Emblema editorial'), 'emblema com aria-label para ' + tipo);
    assert.ok(svg.includes('var(--tt') && svg.includes('var(--ac'), 'emblema usa cores do tema para ' + tipo);
  });

  const demo = C.demo();
  const coverWithPhoto = C.renderCleanCover(demo);
  const coverNoPhoto = C.renderCleanCover(Object.assign({}, demo, { poster: Object.assign({}, demo.poster, { avatarChoice: 'none' }) }));
  const poster = C.renderPoster(demo.poster, demo.author, demo.epistemicType);
  const apostila = C.toApostila(demo);
  const imgPrompt = C.buildImagePrompt(demo);

  assert.ok(coverNoPhoto.includes('Emblema editorial — Área Formal') && !coverNoPhoto.includes('class="mlclean-avatar"'), 'capa sem foto mostra emblema da área');
  assert.ok(!coverWithPhoto.includes('class="mlclean-avatar"') && !coverWithPhoto.includes('avatar-prof-ale-1.jpg') && coverWithPhoto.includes('Emblema editorial — Área Formal'), 'capa nunca mostra foto do autor, mesmo com avatar escolhido');
  assert.ok(poster.includes('class="mlp-emblema"') && poster.includes('Emblema editorial — Área Formal'), 'pôster usa .mlp-emblema com emblema da área');
  assert.ok(apostila.includes('class="mled-guide-emblema"') && apostila.includes('Emblema editorial — Área Formal'), 'guia da apostila usa .mled-guide-emblema');
  assert.ok(imgPrompt.includes('Sem personagem ou mascote. Emblema geométrico da área, selo MathLab, capa editorial limpa.'), 'prompt de imagem pede capa editorial sem mascote');
  [coverNoPhoto, coverWithPhoto, poster, apostila, imgPrompt].forEach((txt) => {
    assert.ok(!/MASCOT_SVG|estudante sorridente|PERSONAGEM MASCOTE/i.test(txt), 'nenhum resquício de mascote infantil no material gerado');
  });
});

test('Identidade editorial e Ficha Oficial do Professor Alê incorporadas ao núcleo e aos assets', () => {
  assert.equal(C.EDITORIAL_IDENTITY.palette.principal.hex, '#0D2B5B');
  assert.equal(C.EDITORIAL_IDENTITY.palette.destaque.hex, '#F7B500');
  assert.equal(C.EDITORIAL_IDENTITY.editorialSequence.length, 4);
  assert.deepEqual(
    C.EDITORIAL_IDENTITY.editorialSequence.map((s) => s.id),
    ['capa', 'folha_de_rosto', 'infografico_abertura', 'miolo_didatico']
  );
  assert.ok(C.PROFESSOR_ALE_IDENTITY.permanentElements.length >= 6);
  assert.ok(Object.keys(C.PROFESSOR_ALE_IDENTITY.disciplines).length >= 12);
  [
    C.EDITORIAL_IDENTITY.logos.cleanRef,
    C.EDITORIAL_IDENTITY.logos.seloRef,
    C.PROFESSOR_ALE_IDENTITY.referenceSheets.modelSheet,
    C.PROFESSOR_ALE_IDENTITY.referenceSheets.disciplineGrid,
  ].forEach((rel) => assert.ok(fs.existsSync(path.join(root, rel)), 'asset ausente: ' + rel));
});

test('KaTeX offline, Infográfico de Abertura (4 camadas) e seletor contextual do Professor Alê', () => {
  // 1. KaTeX offline em inline, bloco, parênteses, proteção de R$ e trust:false
  const md = 'Conjunto $\\mathbb{Z}$, temp \\(-4^\\circ\\text{C}\\), preço R$ 120,00.\n\n$$\\frac{a}{b} + \\sqrt{x}$$\n\nLink: $\\href{javascript:alert(1)}{x^2}$';
  const html = C.renderMarkdown(md);
  assert.ok(html.includes('class="katex"'), 'KaTeX renderizou HTML');
  assert.ok(html.includes('class="math math-display"'), 'bloco display renderizado');
  assert.ok(html.includes('R$ 120,00'), 'R$ 120,00 intacto');
  assert.ok(!html.includes('href="javascript:'), 'trust:false bloqueia javascript:');
  const visible = html.replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/g, '');
  assert.ok(!visible.includes('\\mathbb') && !visible.includes('\\frac') && !visible.includes('\\sqrt'), 'nenhum comando LaTeX cru no visual');

  // 2. Infográfico de Abertura opcional (sequência editorial 4 camadas)
  const demo = C.demo();
  const apDefault = C.toApostila(demo);
  const ap4 = C.toApostila(demo, { openingInfographic: true });
  assert.ok(!apDefault.includes('class="mlopen-info"'), 'padrão mantém 3 camadas sem alterar paginação anterior');
  assert.ok(ap4.includes('class="mlopen-info"') && ap4.includes('Infográfico de Abertura'), 'camada 3 de Infográfico de Abertura renderizada');
  assert.ok(ap4.includes('data:font/woff2;base64,'), 'fontes KaTeX embutidas offline na apostila');

  // 3. Seletor contextual do Professor Alê por disciplina
  assert.equal(C.getProfessorAleContext('Neuroanatomia').key, 'neuroanatomia');
  assert.equal(C.getProfessorAleContext('Educação Financeira').key, 'educacao_financeira');
  assert.equal(C.getProfessorAleContext('Física', 'quimica').key, 'quimica');
  const demoWithAle = Object.assign({}, demo, { poster: Object.assign({}, demo.poster, { profAleDiscipline: 'fisica' }) });
  const promptAle = C.buildImagePrompt(demoWithAle);
  assert.ok(promptAle.includes('Professor Alê (Física)') && promptAle.includes('#0D2B5B'), 'prompt contextual do Professor Alê');
});
