#!/usr/bin/env node
/**
 * Copia o revisor de português do ScriptaLab (src/core) para js/ptbr e registra versão, commit e SHA-256
 * de cada arquivo em js/ptbr/VERSION.json. A cópia nunca é editada à mão: o teste confere os hashes.
 * Uso: node tools/sincronizar-ptbr.mjs <pasta-do-repositorio-ScriptaLab>
 *      node tools/sincronizar-ptbr.mjs --check [pasta-do-repositorio-ScriptaLab]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, 'js', 'ptbr');
export const ARQUIVOS = ['ptRevisor.js', 'abnt10520.js', 'stylometry.js', 'textUtils.js', 'spell.js',
  'rules/ptbr.json', 'rules/abnt10520.json', 'rules/stylometry.json'];

export const hashTexto = (buf) => createHash('sha256').update(Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8')).digest('hex');

async function sincronizar(origem) {
  if (!origem) { console.error('Uso: node tools/sincronizar-ptbr.mjs <pasta-do-ScriptaLab>'); process.exit(2); }
  const src = path.resolve(origem);
  const pkg = JSON.parse(await fs.readFile(path.join(src, 'package.json'), 'utf8'));
  let commit = 'desconhecido';
  try { commit = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* sem git */ }
  const arquivos = {};
  for (const rel of ARQUIVOS) {
    const buf = await fs.readFile(path.join(src, 'src', 'core', rel));
    const dest = path.join(DESTINO, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buf);
    arquivos[rel] = hashTexto(buf);
  }
  await fs.writeFile(path.join(DESTINO, 'VERSION.json'), JSON.stringify({ origem: 'Prof-Ale/ScriptaLab', versao: pkg.version, commit, arquivos }, null, 2) + '\n');
  console.log(`Revisor de português do ScriptaLab v${pkg.version} (${commit.slice(0, 7)}): ${ARQUIVOS.length} arquivos em js/ptbr`);
}

async function conferir(origem) {
  const info = JSON.parse(await fs.readFile(path.join(DESTINO, 'VERSION.json'), 'utf8'));
  const problemas = [];
  for (const [rel, esperado] of Object.entries(info.arquivos)) {
    try { if (hashTexto(await fs.readFile(path.join(DESTINO, rel))) !== esperado) problemas.push(`alterado na cópia: ${rel}`); }
    catch { problemas.push(`ausente na cópia: ${rel}`); }
    if (origem) {
      try { if (hashTexto(await fs.readFile(path.join(path.resolve(origem), 'src', 'core', rel))) !== esperado) problemas.push(`origem diferente da cópia: ${rel}`); }
      catch { problemas.push(`ausente na origem: ${rel}`); }
    }
  }
  if (problemas.length) { console.error(problemas.join('\n')); process.exit(1); }
  console.log(`Revisor de português v${info.versao}: ${Object.keys(info.arquivos).length} arquivos conferem${origem ? ' com a origem' : ''}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (process.argv[2] === '--check' ? conferir(process.argv[3]) : sincronizar(process.argv[2])).catch((e) => { console.error(e.message); process.exit(1); });
}
