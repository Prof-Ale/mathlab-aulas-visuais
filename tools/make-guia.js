// Gera dist/GUIA.html a partir do README (versão para ler no navegador).
const fs=require('fs'),path=require('path');const C=require('../js/core.js');
const md=fs.readFileSync(path.join(__dirname,'..','README.md'),'utf8');
const html='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MathLab — Guia</title><style>'+C.DOC_CSS+'.doc{margin-top:0}code,pre{background:#eef1f7;padding:2px 5px;border-radius:4px}pre{padding:10px;overflow:auto}</style></head><body><div class="doc">'+C.renderMarkdown(md.replace(/```[\s\S]*?```/g,(b)=>b.split('\n').slice(1,-1).map(l=>'- `'+l.trim()+'`').join('\n')))+'</div></body></html>';
fs.mkdirSync(path.join(__dirname,'..','dist'),{recursive:true});fs.writeFileSync(path.join(__dirname,'..','dist','GUIA.html'),html);console.log('dist/GUIA.html');
