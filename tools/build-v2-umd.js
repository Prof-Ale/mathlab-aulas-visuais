// Gera módulos UMD (navegador + Node) em js/ a partir de tools/*.mjs
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const wr = (p, s) => fs.writeFileSync(path.join(root, p), s);

function wrapUmd(globalName, depsNode, depsBrowser, body, exportsList) {
  return `/* Gerado automaticamente a partir de tools/*.mjs */\n(function (root, factory) {\n  if (typeof module === 'object' && module.exports) module.exports = factory(${depsNode});\n  else root.${globalName} = factory(${depsBrowser});\n})(typeof self !== 'undefined' ? self : this, function (${depsNode ? 'dep' : ''}) {\n  'use strict';\n${body}\n  return { ${exportsList} };\n});\n`;
}

// 1. racional.mjs -> js/racional.js
let rac = rd('tools/racional.mjs')
  .replace(/export\s+(class|function)\s+/g, '$1 ');
wr('js/racional.js', wrapUmd('MathLabRacional', '', '', rac, 'Racional, avaliar, confere'));

// 2. auditar-v2.mjs -> js/auditar-v2.js
let aud = rd('tools/auditar-v2.mjs')
  .split('// ---- CLI ----')[0]
  .replace(/^#!.*\r?\n/, '')
  .replace(/import\s*\{[^}]+\}\s*from\s*["']node:fs["'];\r?\n/, '')
  .replace(/import\s*\{\s*confere\s*\}\s*from\s*["']\.\/racional\.mjs["'];\r?\n/, 'const { confere } = dep;\n')
  .replace(/export\s+function\s+/g, 'function ');
wr('js/auditar-v2.js', wrapUmd('MathLabAuditV2', "require('./racional.js')", 'root.MathLabRacional', aud, 'auditar'));

// 3. portfolio.mjs -> js/portfolio.js
let port = rd('tools/portfolio.mjs')
  .split('// ---- CLI ----')[0]
  .replace(/^#!.*\r?\n/, '')
  .replace(/import\s*\{[^}]+\}\s*from\s*["']node:fs["'];\r?\n/, '')
  .replace(/export\s+(function|const)\s+/g, '$1 ');
wr('js/portfolio.js', wrapUmd('MathLabPortfolio', '', '', port, 'CFG_PADRAO, PERFIS, verificar, montarCorpo, montarHtml, montarFlipbook, matriz'));

console.log('UMD gerados: js/racional.js, js/auditar-v2.js, js/portfolio.js');
