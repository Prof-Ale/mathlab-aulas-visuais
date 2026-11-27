'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const C = require('../js/core.js');
const a11y = require('../tools/audit-a11y.js');

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
const coreJs = fs.readFileSync(path.join(root, 'js', 'core.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('F-01: autosave persistente e honesto (recuperação e tratamento de erro sem falha silenciosa)', () => {
  assert.ok(appJs.includes("AUTOSAVE_KEY = 'mathlab.autosave.v1'"), 'chave dedicada de autosave');
  assert.ok(appJs.includes('function readPendingAutosave()'), 'leitura de rascunho pendente');
  assert.ok(appJs.includes('function saveAutosaveNow('), 'gravação explícita de autosave');
  assert.ok(appJs.includes('restoreautosave:') && appJs.includes('discardautosave:'), 'ações de restaurar e descartar rascunho');
  assert.ok(appJs.includes('Não foi possível salvar'), 'aviso honesto quando localStorage falha');
  assert.ok(!/catch\s*\([^)]*\)\s*\{\s*\/\*\s*ignora\s*\*\/\s*\}\s*\n\s*const m = \$\('#dirtymark'\)/.test(appJs), 'sem catch silencioso no autosave');
});

test('F-02: contraste WCAG AA >= 4.5:1 na UI e nos artefatos exportados + tokens unificados', () => {
  assert.equal(a11y.failures.length, 0, 'nenhuma falha na auditoria de contraste e teclado: ' + JSON.stringify(a11y.failures));
  assert.ok(!coreJs.includes('color:#F57C00'), 'laranja #F57C00 não usado como cor de texto sobre fundo claro em core.js');
  assert.ok(stylesCss.includes('--navy:#0d2b5b'), 'token --navy unificado com a paleta oficial #0d2b5b');
  assert.ok(stylesCss.includes('--gold:#f7b500'), 'token --gold unificado com a paleta oficial #f7b500');
  assert.ok(stylesCss.includes('--orange-text:#9a4600'), 'token --orange-text acessível');
});

test('F-03: WAI-ARIA tablist (ArrowLeft/ArrowRight/Home/End, roving tabindex, aria-controls, foco)', () => {
  assert.ok(appJs.includes("'ArrowRight'") && appJs.includes("'ArrowLeft'") && appJs.includes("'Home'") && appJs.includes("'End'"), 'navegação por setas, Home e End');
  assert.ok(appJs.includes('aria-controls="main"'), 'aria-controls nas abas');
  assert.ok(/tabindex=.*'0'.*'-1'/.test(appJs), 'roving tabindex em tablists');
  assert.ok(appJs.includes('document.activeElement'), 'preservação sistemática de foco no render()');
});

test('F-04 e F-05: faixa de progresso na etapa Revisar + importação por arquivo .json e drag-and-drop', () => {
  assert.ok(appJs.includes('function revisarProgressHtml()'), 'faixa de progresso de Revisar derivada de dados reais');
  assert.ok(appJs.includes('id="importDropzone"') && appJs.includes('data-a="importfile"'), 'dropzone e input de arquivo .json em Criar');
  assert.ok(appJs.includes("addEventListener('drop'") && appJs.includes('function importJsonFile('), 'drag-and-drop chama o mesmo fluxo de importação');
});

test('F-06: visibilidade de backup, cota de armazenamento e otimização de arte grande', () => {
  assert.ok(appJs.includes('function storageUsageInfo()'), 'medição de uso do localStorage');
  assert.ok(appJs.includes('ultimoBackupEm') && appJs.includes('materiaisDesdeBackup'), 'registro de último backup e lembrete');
  assert.ok(appJs.includes('quota-bar'), 'barra visual de uso de armazenamento na Biblioteca');
  assert.ok(appJs.includes('function resizeCoverIfLarge('), 'aviso/otimização para imagem de capa acima de 10% da cota');
});

test('F-07 e F-08: linguagem pedagógica com detalhes técnicos em <details> e Exportar por intenção', () => {
  assert.ok(appJs.includes('Para imprimir') && appJs.includes('Para projetar') && appJs.includes('Para continuar editando'), 'Exportar agrupado por intenção de uso');
  assert.ok(appJs.includes('Disponível neste navegador') && appJs.includes('Requer programa no computador'), 'badges de requisito de execução');
  assert.ok(appJs.includes('não é PDF/UA acessível para leitores de tela'), 'aviso explícito de acessibilidade do PDF LaTeX na aba Exportar');
  assert.ok(appJs.includes('<details><summary>Detalhes técnicos'), 'jargão técnico recolhido em <details>');
});

test('F-09: diff por bloco desde a validação e revalidação a partir do delta', () => {
  const base = C.demo();
  const edited = C.clone(base);
  edited.blocks[0].content += '\n\nParágrafo revisado pelo professor.';
  edited.blocks.push({ id: 'b_extra', type: 'activity', title: 'Atividade extra', content: 'Resolva.', svg: '' });
  const diffs = C.diffMaterialBlocks(base, edited);
  assert.ok(diffs.some((d) => d.kind === 'altered' && d.label.includes(base.blocks[0].title)), 'detecta bloco alterado');
  assert.ok(diffs.some((d) => d.kind === 'added' && d.label.includes('Atividade extra')), 'detecta bloco adicionado');
  assert.ok(appJs.includes('togglediff:') && appJs.includes('revalidatedelta:'), 'botões de diff e revalidação no Editor');
});

test('F-10 e F-12: Diário com badge Beta + responsividade 360px/touch', () => {
  assert.ok(appJs.includes('class="beta-tag">Beta</span>'), 'Diário sinalizado como Beta');
  assert.ok(stylesCss.includes('overflow-x:clip'), 'proteção contra overflow horizontal em 360px');
  assert.ok(stylesCss.includes('@media (pointer:coarse)') && stylesCss.includes('min-height:44px'), 'alvos táteis >= 44px em dispositivos touch');
});

test('F-11: licença MIT na raiz e package.json, sem .whl solto e README com link de uso imediato', () => {
  assert.ok(fs.existsSync(path.join(root, 'LICENSE')), 'arquivo LICENSE presente na raiz');
  assert.equal(pkg.license, 'MIT', 'package.json declara licença MIT');
  const rootFiles = fs.readdirSync(root);
  assert.equal(rootFiles.filter((f) => f.endsWith('.whl')).length, 0, 'nenhum .whl solto na raiz');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.includes('https://prof-ale.github.io/mathlab-aulas-visuais/'), 'README traz link direto para o GitHub Pages no topo');
});

test('F-13, F-14 e F-15: privacidade 100% local sem Google Fonts, versão motor v2.0.0 e exemplo multidisciplinar de História', () => {
  assert.ok(!indexHtml.includes('fonts.googleapis.com') && !indexHtml.includes('fonts.gstatic.com'), 'index.html não carrega Google Fonts externos');
  assert.ok(stylesCss.includes("@font-face") && stylesCss.includes('assets/fontes/'), 'css/styles.css usa fontes OFL locais');
  assert.ok(indexHtml.includes('Nenhum conteúdo seu sai do navegador'), 'chip de privacidade preciso');
  assert.ok(indexHtml.includes('motor v2.0.0') && appJs.includes("'motor v' + C.VERSION"), 'versão qualificada como motor v2.0.0');
  assert.ok(indexHtml.includes('data-a="previewdemo"') && indexHtml.includes('data-a="previewdemohist"'), 'hero oferece exemplos de Matemática e História');
  const hist = C.demoHistoria();
  assert.equal(hist.epistemicType, 'historica');
  const aud = C.audit(hist);
  assert.equal(aud.hard.length, 0, 'demoHistoria() passa na auditoria sem falhas graves');
});
