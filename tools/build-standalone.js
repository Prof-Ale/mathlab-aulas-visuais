// Gera dist/mathlab-standalone.html: o site inteiro em UM arquivo (abre com duplo clique, funciona offline).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');

function inlineKatexCss() {
  const katexDir = path.join(root, 'assets', 'vendor', 'katex');
  let css = fs.readFileSync(path.join(katexDir, 'katex.min.css'), 'utf8');
  css = css.replace(/url\(fonts\/([^)]+\.woff2)\)\s*format\(["']woff2["']\)(?:,url\(fonts\/[^)]+\)\s*format\(["'](?:woff|truetype)["']\))*/g, (_, file) => {
    const b64 = fs.readFileSync(path.join(katexDir, 'fonts', file)).toString('base64');
    return 'url(data:font/woff2;base64,' + b64 + ') format("woff2")';
  });
  return css;
}

let html = rd('index.html');
const katexCss = inlineKatexCss();
html = html.replace('<link rel="stylesheet" href="assets/vendor/katex/katex.min.css">', '<style id="katex-inline-css">\n' + katexCss + '\n</style>');
html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<style>\n' + rd('css/styles.css') + '\n</style>');
html = html.replace(
  '<script src="assets/vendor/katex/katex.min.js"></script>',
  '<script>\n' + rd('assets/vendor/katex/katex.min.js').replace(/<\/script/gi, '<\\/script') + '\n</script>'
);
for (const s of ['js/racional.js', 'js/auditar-v2.js', 'js/portfolio.js', 'js/core.js', 'js/pptx.js', 'js/dominios.js', 'js/livro.js', 'js/fontes.js', 'js/app.js']) {
  html = html.replace('<script src="' + s + '"></script>', '<script>\n' + rd(s).replace(/<\/script/gi, '<\\/script') + '\n</script>');
}
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'mathlab-standalone.html'), html);
console.log('dist/mathlab-standalone.html', (html.length / 1024).toFixed(0) + ' KB');
