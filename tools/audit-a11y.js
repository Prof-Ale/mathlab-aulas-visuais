// Medição objetiva de acessibilidade (WCAG / ARIA / Labels + Contraste do Exportado) nas telas do MathLab.
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..');

function luminance(hex) {
  const m = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => {
    const c = parseInt(m.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrast(fg, bg) {
  const l1 = luminance(fg), l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
const coreJs = fs.readFileSync(path.join(root, 'js', 'core.js'), 'utf8');

// Contagem estática objetiva de padrões de UI/A11y
const rawLabelsWithoutFor = (appJs.match(/<label>(?!<input)/g) || []).length;
const iconOnlyButtons = (appJs.match(/data-a="(?:bup|bdn|bdel|delsum)"[^>]*>(?:↑|↓|✕)<\/button>/g) || []).filter((b) => !/aria-label=/.test(b)).length;
const hasSkipLink = /href="#main"/.test(indexHtml);
const hasTabPanel = /role="tabpanel"/.test(indexHtml) || /role="tabpanel"/.test(appJs);
const hasTabKeyboard = /ArrowRight/.test(appJs) && /ArrowLeft/.test(appJs);

const appPairs = [
  { name: 'app .pill.ok (#147041 on #dcf5e6)', fg: '#147041', bg: '#dcf5e6' },
  { name: 'app .pill.bad (#b3261e on #fde3e1)', fg: '#b3261e', bg: '#fde3e1' },
  { name: 'app .pill.warn (#8f5400 on #fff1d1)', fg: '#8f5400', bg: '#fff1d1' },
  { name: 'app nav (#c3d0ee on #0d2b5b)', fg: '#c3d0ee', bg: '#0d2b5b' },
  { name: 'app active tab (#0d2b5b on #f7b500)', fg: '#0d2b5b', bg: '#f7b500' },
  { name: 'app body (#0d2b5b on #ffffff)', fg: '#0d2b5b', bg: '#ffffff' },
  { name: 'app muted (#4d5d7e on #ffffff)', fg: '#4d5d7e', bg: '#ffffff' },
];

const exportedPairs = [
  { name: 'exportado título marinho (#0d2b5b on #f8f3e6)', fg: '#0d2b5b', bg: '#f8f3e6' },
  { name: 'exportado kicker acessível (#9a4600 on #f8f3e6)', fg: '#9a4600', bg: '#f8f3e6' },
  { name: 'exportado destaque dourado (#f7b500 on #0d2b5b)', fg: '#f7b500', bg: '#0d2b5b' },
  { name: 'exportado badge marinho/dourado (#0d2b5b on #f7b500)', fg: '#0d2b5b', bg: '#f7b500' },
  { name: 'exportado texto miolo (#1d2433 on #ffffff)', fg: '#1d2433', bg: '#ffffff' },
  { name: 'exportado legenda (#475569 on #ffffff)', fg: '#475569', bg: '#ffffff' },
];

// Verifica que o CSS exportado em js/core.js não usa laranja (#F57C00) como cor de texto
const forbiddenExportTextColor = /color\s*:\s*#F57C00/i.test(coreJs);

const allPairs = [...appPairs, ...exportedPairs];
const failures = [];

console.log('=== AUDITORIA OBJETIVA DE UI/UX E ACESSIBILIDADE ===');
console.log('1. Labels <label> sem atributo for= em js/app.js:', rawLabelsWithoutFor);
console.log('2. Botões só-ícone sem aria-label=:', iconOnlyButtons);
console.log('3. Skip-link (#main) presente em index.html:', hasSkipLink);
console.log('4. Tabpanel ARIA (role="tabpanel") presente:', hasTabPanel);
console.log('5. Navegação de abas por teclado (ArrowLeft/ArrowRight):', hasTabKeyboard);
console.log('6. Sem color:#F57C00 (contraste 2,7:1) no CSS exportado:', !forbiddenExportTextColor);
console.log('7. Contraste WCAG AA (mínimo 4.5:1 — app + exportado):');
allPairs.forEach((p) => {
  const r = contrast(p.fg, p.bg);
  const ok = r >= 4.5;
  if (!ok) failures.push(`${p.name}: ${r.toFixed(2)}:1 (< 4.5:1)`);
  console.log(`   - ${p.name}: ${r.toFixed(2)}:1 [${ok ? 'OK' : 'FALHA'}]`);
});

if (forbiddenExportTextColor) failures.push('CSS exportado usa color:#F57C00 (abaixo de 4.5:1 em fundo claro)');
if (!hasSkipLink) failures.push('Skip-link ausente');
if (!hasTabPanel) failures.push('role="tabpanel" ausente');

if (require.main === module) {
  if (failures.length) {
    console.error('\nFALHAS DE ACESSIBILIDADE:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

module.exports = { contrast, allPairs, failures, forbiddenExportTextColor, hasSkipLink, hasTabPanel, hasTabKeyboard, rawLabelsWithoutFor, iconOnlyButtons };
