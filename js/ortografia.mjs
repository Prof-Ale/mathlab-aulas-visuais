// Conferência de ortografia pt-BR do MathLab (offline, no navegador ou no Node).
// Reaproveita o motor do ScriptaLab (js/ptbr/spell.js) e o dicionário VERO 3.2 em assets/ortografia/.
// Só SINALIZA. Não altera o material. Fórmulas, código, URLs e marcadores [F#] não são conferidos.
import { createSpellChecker, findMisspellings } from './ptbr/spell.js';
import { analisarPortugues, PT_REGISTROS } from './ptbr/ptRevisor.js';

export { createSpellChecker };

const PROTEGIDOS = [
  /\$\$[\s\S]+?\$\$/g, /(?<!\$)\$(?!\$)[^$\n]+\$(?!\$)/g, /\\\[[\s\S]+?\\\]/g, /\\\([\s\S]+?\\\)/g,
  /`[^`\n]+`/g, /https?:\/\/\S+|www\.\S+|[\w.+-]+@[\w-]+\.[\w.-]+/g, /\[(?:F|Fonte\s*)\d+\]/gi,
];
export function trechosProtegidos(texto) {
  const out = [];
  for (const re of PROTEGIDOS) { re.lastIndex = 0; let m; while ((m = re.exec(texto))) { if (!m[0]) { re.lastIndex++; continue; } out.push([m.index, m.index + m[0].length]); } }
  return out;
}

/** Textos conferíveis do material: título, objetivos, blocos, notas e capa. Cada item diz de onde veio. */
export function textosDoMaterial(m) {
  const t = [];
  const add = (onde, rotulo, texto) => { if (texto && String(texto).trim()) t.push({ onde, rotulo, texto: String(texto) }); };
  add('titulo', 'Título', m.title);
  (m.objectives || []).forEach((x, i) => add('objetivo', 'Objetivo ' + (i + 1), x));
  (m.prerequisites || []).forEach((x, i) => add('previo', 'Conhecimento prévio ' + (i + 1), x));
  (m.blocks || []).forEach((b) => {
    add('bloco:' + b.id, 'Bloco “' + b.title + '”', b.title + '\n\n' + (b.content || ''));
    if (b.callout) add('bloco:' + b.id, 'Destaque de “' + b.title + '”', b.callout.text);
  });
  const p = m.poster;
  if (p) { add('capa', 'Capa', [p.title, p.subtitle, p.goldTip, p.didYouKnow, p.attention].filter(Boolean).join('\n')); (p.sections || []).forEach((s, i) => add('capa', 'Capa, seção ' + (i + 1), s.label + '. ' + s.title + '. ' + s.text)); }
  (m.limitations || []).forEach((x, i) => add('limitacao', 'Limitação ' + (i + 1), x));
  return t;
}

/** Devolve [{onde, rotulo, palavra, sugestoes, contexto}], no máximo `max`. */
export function conferirOrtografiaMaterial(m, verificador, opts = {}) {
  const achados = [];
  const ignorar = opts.ignorar || [];
  for (const it of textosDoMaterial(m)) {
    const prot = trechosProtegidos(it.texto);
    for (const f of findMisspellings(it.texto, verificador, { ignorar, protegidos: prot })) {
      achados.push({ onde: it.onde, rotulo: it.rotulo, palavra: f.word, sugestoes: f.suggestions, contexto: it.texto.slice(Math.max(0, f.start - 30), f.end + 30).replace(/\s+/g, ' ') });
      if (achados.length >= (opts.max || 300)) return achados;
    }
  }
  return achados;
}

/** Registros que fazem sentido no MathLab. O acadêmico existe no motor, mas é do ScriptaLab. */
export const REGISTROS_MATHLAB = ['didatico', 'divulgacao'].map((id) => ({ id, label: PT_REGISTROS[id].label }));

/**
 * Revisão de português por regras e medidores (o mesmo motor do ScriptaLab). Só SINALIZA.
 * Devolve { registro, achados:[{onde, rotulo, regra, categoria, severidade, trecho, msg, fix, contexto}], resumo }.
 */
export function revisarPortuguesMaterial(m, opts = {}) {
  const registro = opts.registro === 'divulgacao' ? 'divulgacao' : 'didatico';
  const achados = [];
  const resumo = { total: 0, erro: 0, aviso: 0, estilo: 0 };
  for (const it of textosDoMaterial(m)) {
    const r = analisarPortugues(it.texto, { registro, ortografia: false, protegerCitacoes: true, termos: opts.termos || [] });
    for (const a of r.achados) {
      resumo.total++; resumo[a.severidade] = (resumo[a.severidade] || 0) + 1;
      if (achados.length < (opts.max || 200)) {
        achados.push({ onde: it.onde, rotulo: it.rotulo, regra: a.regra, categoria: a.categoria, severidade: a.severidade, trecho: a.trecho, msg: a.msg, fix: a.fix ?? null,
          contexto: it.texto.slice(Math.max(0, a.start - 30), a.end + 30).replace(/\s+/g, ' ') });
      }
    }
  }
  const ordem = { erro: 0, aviso: 1, estilo: 2 };
  achados.sort((x, y) => (ordem[x.severidade] ?? 3) - (ordem[y.severidade] ?? 3));
  return { registro, achados, resumo };
}
