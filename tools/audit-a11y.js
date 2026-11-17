// Medição objetiva de acessibilidade (WCAG / ARIA / Labels) nas telas do MathLab.
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

// Contagem estática objetiva de padrões de UI/A11y
const rawLabelsWithoutFor = (appJs.match(/<label>(?!<input)/g) || []).length;
const iconOnlyButtons = (appJs.match(/data-a="(?:bup|bdn|bdel|delsum)"[^>]*>(?:↑|↓|✕)<\/button>/g) || []).filter((b) => !/aria-label=/.test(b)).length;
const hasSkipLink = /href="#main"/.test(indexHtml);
const hasTabPanel = /role="tabpanel"/.test(appJs);

const pairs = [
  { name: '.pill.ok (#126134 on #dcf5e6)', fg: '#126134', bg: '#dcf5e6' },
  { name: '.pill.bad (#a8241c on #fde3e1)', fg: '#a8241c', bg: '#fde3e1' },
  { name: '.pill.warn (#7a4e08 on #fff1d1)', fg: '#7a4e08', bg: '#fff1d1' },
  { name: 'nav button (#cfd9f2 on #14264f)', fg: '#cfd9f2', bg: '#14264f' },
  { name: 'nav button.on (#14264f on #f2b705)', fg: '#14264f', bg: '#f2b705' },
  { name: 'body text (#1d2433 on #ffffff)', fg: '#1d2433', bg: '#ffffff' },
];

console.log('=== AUDITORIA OBJETIVA DE UI/UX E ACESSIBILIDADE ===');
console.log('1. Labels <label> sem atributo for= em js/app.js:', rawLabelsWithoutFor);
console.log('2. Botões só-ícone sem aria-label=:', iconOnlyButtons);
console.log('3. Skip-link (#main) presente em index.html:', hasSkipLink);
console.log('4. Tabpanel ARIA (role="tabpanel") presente:', hasTabPanel);
console.log('5. Contraste WCAG AA (mínimo 4.5:1):');
pairs.forEach((p) => {
  const r = contrast(p.fg, p.bg);
  console.log(`   - ${p.name}: ${r.toFixed(2)}:1 [${r >= 4.5 ? 'OK' : 'FALHA'}]`);
});
