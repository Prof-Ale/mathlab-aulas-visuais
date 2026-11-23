// Gera dist/mathlab-standalone.html: o site inteiro em UM arquivo (abre com duplo clique, funciona offline).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let html = rd('index.html');
html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<style>\n' + rd('css/styles.css') + '\n</style>');
for (const s of ['js/racional.js', 'js/auditar-v2.js', 'js/portfolio.js', 'js/core.js', 'js/dominios.js', 'js/livro.js', 'js/fontes.js', 'js/app.js']) {
  html = html.replace('<script src="' + s + '"></script>', '<script>\n' + rd(s).replace(/<\/script/gi, '<\\/script') + '\n</script>');
}
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'mathlab-standalone.html'), html);
console.log('dist/mathlab-standalone.html', (html.length / 1024).toFixed(0) + ' KB');
