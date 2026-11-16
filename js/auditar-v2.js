/* Gerado automaticamente a partir de tools/*.mjs */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./racional.js'));
  else root.MathLabAuditV2 = factory(root.MathLabRacional);
})(typeof self !== 'undefined' ? self : this, function (dep) {
  'use strict';
// Auditoria estrutural do material v2 (integridade, cálculos exatos, honestidade de estados).
// Uso:  node tools/auditar-v2.mjs material.json [outro.json ...] [--final] [--json]
//   --final : trata pendências de verificação e a falta de aprovação humana como BLOQUEANTES.
// Não valida o esquema JSON (use ajv ou jsonschema, ver README). Não aprova nada: só o professor aprova.
const { confere } = dep;

// Valores INICIAIS, a calibrar com materiais reais (docs/04).
const LIMITE_PALAVRAS_POR_FRASE = { ludico: 14, acessivel: 18, escolar: 20, tecnico: 26, academico: 32 };
const NIVEIS_BASICOS = ["ef1", "ef2", "em"];
const NIVEIS_SUPERIORES = ["graduacao", "pos_lato", "pos_stricto"];
const RANK_REF = { nao_verificada: 0, nao_encontrada: -1, divergente: -1, localizada: 1, confirmada: 2 };

function auditar(m, { final = false } = {}) {
  const achados = [];
  const add = (nivel, regra, onde, msg) => achados.push({ nivel, regra, onde, msg });
  const bloq = (r, o, m2) => add("bloqueante", r, o, m2);
  const aviso = (r, o, m2) => add("aviso", r, o, m2);
  const pend = (r, o, m2) => add(final ? "bloqueante" : "pendencia", r, o, m2);

  const por = (arr = []) => new Map(arr.map((x) => [x.id, x]));
  const refs = por(m.referencias), afs = por(m.afirmacoes), calcs = por(m.calculos);
  const figs = por(m.figuras), qs = por(m.questoes);

  // R18 ids duplicados
  for (const [nome, arr] of Object.entries({ referencias: m.referencias, afirmacoes: m.afirmacoes, calculos: m.calculos, figuras: m.figuras, questoes: m.questoes, blocos: m.blocos })) {
    const vistos = new Set();
    for (const x of arr ?? []) {
      if (vistos.has(x.id)) bloq("R18", `${nome}.${x.id}`, "id duplicado.");
      vistos.add(x.id);
    }
  }

  // R06 cálculos exatos
  const calcOk = new Map();
  for (const c of m.calculos ?? []) {
    let ok = true;
    try {
      const r = confere(c.expressao, c.resultado_esperado);
      if (!r.ok) { ok = false; bloq("R06", `calculos.${c.id}`, `"${c.expressao}" dá ${r.obtido}, mas o esperado é ${r.esperado}.`); }
      for (const [i, p] of (c.passos ?? []).entries()) {
        const rp = confere(p.expressao, p.resultado);
        if (!rp.ok) { ok = false; bloq("R06", `calculos.${c.id}.passos[${i}]`, `"${p.expressao}" dá ${rp.obtido}, mas o passo diz ${rp.esperado}.`); }
      }
    } catch (e) {
      ok = false;
      bloq("R06", `calculos.${c.id}`, `não consegui avaliar: ${e.message}`);
    }
    calcOk.set(c.id, ok);
  }

  // Afirmações: R01, R05, R07, R08, R09, R10
  const citadas = new Set();
  for (const a of m.afirmacoes ?? []) {
    const onde = `afirmacoes.${a.id}`;
    const s = a.sustentacao ?? {};
    const modo = s.modo;
    for (const r of s.refs ?? []) {
      citadas.add(r.ref_id);
      const ref = refs.get(r.ref_id);
      if (!ref) bloq("R01", onde, `cita a referência inexistente "${r.ref_id}".`);
      else {
        if (!String(r.localizador ?? "").trim()) bloq("R01", onde, `referência "${r.ref_id}" sem localizador.`);
        const e = ref.verificacao?.estado;
        if (e === "divergente" || e === "nao_encontrada") bloq("R07", onde, `usa a referência "${r.ref_id}" em estado "${e}".`);
      }
    }
    for (const id of s.calculo_ids ?? []) {
      if (!calcs.has(id)) bloq("R05", onde, `cita o cálculo inexistente "${id}".`);
      else if (calcOk.get(id) === false) bloq("R06", onde, `depende do cálculo "${id}", que NÃO confere.`);
    }

    // R08 coerência estado × modo (a ferramenta nunca deixa o estado prometer mais do que o modo entrega)
    const rotulos = {
      calculada: ["calculo"], demonstrada: ["demonstracao"], adotada: ["definicao_adotada"],
      autoral_declarada: ["autoral_declarado", "material_do_professor"],
      localizada: ["referencia", "fonte_primaria"], confirmada: ["referencia", "fonte_primaria"],
    };
    if (rotulos[a.estado] && !rotulos[a.estado].includes(modo)) bloq("R08", onde, `estado "${a.estado}" não combina com o modo "${modo}".`);
    if (["referencia", "fonte_primaria"].includes(modo)) {
      const ranks = (s.refs ?? []).map((r) => RANK_REF[refs.get(r.ref_id)?.verificacao?.estado] ?? -1);
      const menor = ranks.length ? Math.min(...ranks) : -1;
      if (a.estado === "confirmada" && menor < 2) bloq("R08", onde, `marcada "confirmada", mas há referência que não está "confirmada".`);
      if (a.estado === "localizada" && menor < 1) bloq("R08", onde, `marcada "localizada", mas há referência que não foi localizada.`);
      if (a.estado === "pendente" || (menor < 2 && a.estado !== "reprovada")) {
        pend("R10", onde, menor < 1 ? "sustentação por referência ainda não verificada." : "referência localizada, mas o trecho ainda não foi conferido por um humano.");
      }
    }
    if (a.estado === "pendente" && !["referencia", "fonte_primaria"].includes(modo)) pend("R10", onde, "afirmação pendente.");
    if (a.estado === "reprovada") bloq("R10", onde, "afirmação reprovada ainda presente no material.");

    // R09 fato empírico só com palavra do autor
    if (["fato", "resultado_empirico"].includes(a.tipo) && ["autoral_declarado", "material_do_professor"].includes(modo)) {
      pend("R09", onde, `afirmação do tipo "${a.tipo}" sustentada só por declaração autoral. Precisa de referência com localizador.`);
    }
  }

  // R02 referência decorativa
  for (const f of m.figuras ?? []) if (f.fonte_ref) citadas.add(f.fonte_ref);
  for (const r of m.referencias ?? []) {
    if (!citadas.has(r.id)) bloq("R02", `referencias.${r.id}`, "referência decorativa: nenhuma afirmação (nem figura) a utiliza.");
    const e = r.verificacao?.estado;
    if (e === "nao_verificada") pend("R10", `referencias.${r.id}`, "referência não verificada.");
  }

  // Blocos: R03, R04, R17, conteúdo sem afirmações
  const usadas = new Set(), figsUsadas = new Set();
  for (const b of m.blocos ?? []) {
    const onde = `blocos.${b.id}`;
    for (const id of b.afirmacoes ?? []) { usadas.add(id); if (!afs.has(id)) bloq("R04", onde, `cita afirmação inexistente "${id}".`); }
    for (const id of b.figura_ids ?? []) { figsUsadas.add(id); if (!figs.has(id)) bloq("R04", onde, `cita figura inexistente "${id}".`); }
    for (const id of b.questao_ids ?? []) if (!qs.has(id)) bloq("R04", onde, `cita questão inexistente "${id}".`);
    if (["conceito", "exemplo", "aprofundamento"].includes(b.tipo) && !(b.afirmacoes?.length)) aviso("R03b", onde, "bloco de conteúdo sem afirmações rastreáveis.");
  }
  for (const t of m.glossario ?? []) if (t.afirmacao_id) usadas.add(t.afirmacao_id);
  for (const a of m.afirmacoes ?? []) if (!usadas.has(a.id)) bloq("R03", `afirmacoes.${a.id}`, "afirmação órfã: nenhum bloco a carrega.");
  for (const f of m.figuras ?? []) if (!figsUsadas.has(f.id)) aviso("R17", `figuras.${f.id}`, "figura não usada por nenhum bloco.");

  // R11 questões
  for (const q of m.questoes ?? []) {
    const onde = `questoes.${q.id}`;
    if (q.formato === "multipla_escolha") {
      const letras = (q.alternativas ?? []).map((a) => a.letra);
      if (new Set(letras).size !== letras.length) bloq("R11", onde, "letras de alternativas repetidas.");
      if (!letras.includes(q.gabarito)) bloq("R11", onde, `gabarito "${q.gabarito}" não está entre as alternativas.`);
      for (const a of q.alternativas ?? []) {
        if (a.calculo_id && !calcs.has(a.calculo_id)) bloq("R11", onde, `alternativa ${a.letra} cita cálculo inexistente.`);
        if (a.letra !== q.gabarito && !a.erro_tipico) aviso("R11", onde, `alternativa incorreta ${a.letra} sem "erro_tipico" (distratores devem ter uma causa pedagógica).`);
      }
    }
    for (const p of q.resolucao ?? []) if (p.calculo_id && !calcs.has(p.calculo_id)) bloq("R11", onde, `resolução cita cálculo inexistente "${p.calculo_id}".`);
    if (q.origem === "gerada_ia_a_revisar") pend("R11", onde, "questão gerada por IA ainda a revisar.");
  }

  // R12 glossário obrigatório
  if (m.publico?.glossario_obrigatorio && !(m.glossario?.length)) bloq("R12", "glossario", "público exige glossário, mas ele está vazio.");

  // R13 / R14 registro de linguagem
  const reg = m.publico?.registro;
  const alvo = m.publico?.perfil ?? "estudante";
  const sentencas = (m.blocos ?? [])
    .filter((b) => (b.destinatario ?? "estudante") === alvo)
    .flatMap((b) => String(b.texto ?? "").replace(/\*\*|[#>`_]/g, "").split(/(?<=[.!?])\s+/))
    .map((s) => s.trim()).filter(Boolean);
  if (sentencas.length) {
    const media = sentencas.reduce((t, s) => t + s.split(/\s+/).length, 0) / sentencas.length;
    const lim = LIMITE_PALAVRAS_POR_FRASE[reg];
    if (lim && media > lim) aviso("R13", "publico.registro", `média de ${media.toFixed(1)} palavras por frase excede ${lim} para o registro "${reg}" (valor inicial, a calibrar).`);
  }
  const nivel = m.publico?.nivel;
  if (NIVEIS_SUPERIORES.includes(nivel) && ["ludico", "acessivel"].includes(reg)) aviso("R14", "publico", `nível "${nivel}" com registro "${reg}": confirme se é intencional (ex.: divulgação).`);
  if (NIVEIS_BASICOS.includes(nivel) && ["tecnico", "academico"].includes(reg)) aviso("R14", "publico", `nível "${nivel}" com registro "${reg}": confirme se é intencional.`);

  // R15 transparência coerente com as referências
  const temVerificada = (m.referencias ?? []).some((r) => ["localizada", "confirmada"].includes(r.verificacao?.estado));
  if (m.transparencia?.fontes_consultadas === false && temVerificada) bloq("R15", "transparencia", `diz que nenhuma fonte foi consultada, mas há referência "localizada/confirmada".`);
  if (m.transparencia?.fontes_consultadas === true && !(m.referencias?.length)) bloq("R15", "transparencia", "diz que fontes foram consultadas, mas não há nenhuma referência listada.");

  // R16 revisão humana
  if (!m.revisao_humana?.aprovado) pend("R16", "revisao_humana", "material ainda não aprovado por um professor.");

  return achados;
}


  return { auditar };
});
