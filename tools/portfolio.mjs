#!/usr/bin/env node
// Gera o portfólio (HTML em A4) a partir do diário, com checagens de privacidade e honestidade.
// Uso: node tools/portfolio.mjs diario.json [portfolio.json] [--perfil escolar|processo_seletivo|pos_graduacao]
//        [--saida portfolio.html] [--flipbook flipbook.html] [--pdf portfolio.pdf] [--pacote pasta] [--vigiar nomes.txt]
//   --perfil: escolhe o perfil (seções, tom e limites). Vale sobre o campo "perfil" do portfolio.json.
//   --flipbook: HTML único offline para folhear (StPageFlip embutida), com versão corrida e teclado.
//   --pdf: PDF acessível (marcado, com estrutura, idioma e marcadores). Precisa do pacote "playwright".
//   --pacote: gera HTML, flipbook e PDF numa pasta, com nomes fixos.
//   --vigiar: arquivo local com um nome de aluno por linha. Se algum aparecer em qualquer texto, NADA é gerado.
// Não valida o esquema JSON (use jsonschema/ajv). Não gera arquivo se houver achado bloqueante.
import { readFileSync, writeFileSync } from "node:fs";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pct = (a, n) => (n ? Math.round((100 * a) / n) : 0);
const dataBR = (iso) => String(iso).split("-").reverse().join("/");
const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ETAPA = { ef1: "Ensino Fundamental I", ef2: "Ensino Fundamental II", em: "Ensino Médio", tecnico: "Ensino Técnico", graduacao: "Graduação", pos: "Pós-graduação", outro: "" };
const TIPO = { aula: "Aula", avaliacao: "Avaliação", retomada: "Retomada", projeto: "Projeto", atividade_extra: "Atividade extra", outro: "Outro" };

const SECOES_ESCOLAR = ["matriz_cobertura", "linha_do_periodo", "destaques", "avaliacoes", "evolucao", "reflexao"];
/** Perfis: mudam as seções padrão, o tom dos títulos e quantas práticas em destaque aparecem por turma. */
export const PERFIS = {
  escolar: { rotulo: "Portfólio escolar", destinatario: "direcao", secoes: SECOES_ESCOLAR, maxDestaques: Infinity, tituloDestaques: "Em destaque" },
  processo_seletivo: { rotulo: "Processo seletivo", destinatario: "banca", secoes: ["trajetoria", "competencias", "destaques", "evolucao", "reflexao"], maxDestaques: 3, tituloDestaques: "Práticas selecionadas" },
  pos_graduacao: { rotulo: "Pós-graduação", destinatario: "programa_pos", secoes: ["fundamentacao", "trajetoria", "destaques", "avaliacoes", "evolucao", "reflexao"], maxDestaques: Infinity, tituloDestaques: "Registros de prática analisados" },
};
const perfilDe = (cfg) => (PERFIS[cfg.perfil] ? cfg.perfil : "escolar");
/** Perfis para fora da escola sempre exigem rostos borrados, mesmo que a configuração diga o contrário. */
const exigirRostos = (cfg) => perfilDe(cfg) !== "escolar" || cfg.privacidade?.exigir_rostos_borrados !== false;

const CFG_PADRAO = (d, perfil = "escolar") => {
  const pf = PERFIS[perfil] ? perfil : "escolar";
  return {
    schema_versao: "portfolio.1", perfil: pf, titulo: `${pf === "escolar" ? "Portfólio docente" : "Portfólio docente: " + PERFIS[pf].rotulo.toLowerCase()} ${d.ano_letivo}`, destinatario: PERFIS[pf].destinatario,
    periodos_ids: d.periodos.map((p) => p.id), privacidade: { exigir_rostos_borrados: true },
    secoes: [...PERFIS[pf].secoes],
  };
};

function contexto(d, cfg) {
  const periodos = d.periodos.filter((p) => cfg.periodos_ids.includes(p.id));
  const periodoDe = (data) => d.periodos.find((p) => data >= p.inicio && data <= p.fim)?.id;
  const pid = (e) => e.periodo_id ?? periodoDe(e.data);
  const turmas = d.turmas.filter((t) => !cfg.turmas_ids?.length || cfg.turmas_ids.includes(t.id));
  const idsPer = new Set(periodos.map((p) => p.id));
  const entradas = d.entradas.filter((e) => idsPer.has(pid(e)) && turmas.some((t) => t.id === e.turma_id)).sort((a, b) => a.data.localeCompare(b.data));
  const avals = (d.avaliacoes ?? []).filter((a) => idsPer.has(periodoDe(a.data)) && turmas.some((t) => t.id === a.turma_id)).sort((a, b) => a.data.localeCompare(b.data));
  return { periodos, periodoDe, pid, turmas, entradas, avals, idsPer, catalogo: new Map(d.habilidades.map((h) => [h.codigo, h])) };
}

export function verificar(d, cfg, vigiar = []) {
  const out = [];
  const add = (nivel, regra, onde, msg) => out.push({ nivel, regra, onde, msg });
  const c = contexto(d, cfg);
  const incluidas = new Set(c.entradas.map((e) => e.id));
  const exigir = exigirRostos(cfg);
  const perfil = perfilDe(cfg);
  const secoesSel = new Set(cfg.secoes ?? PERFIS[perfil].secoes);

  // P05 ids e referências
  for (const [nome, arr] of Object.entries({ turmas: d.turmas, periodos: d.periodos, entradas: d.entradas, avaliacoes: d.avaliacoes ?? [] })) {
    const vistos = new Set();
    for (const x of arr) { if (vistos.has(x.id)) add("bloqueante", "P05", `${nome}.${x.id}`, "id duplicado."); vistos.add(x.id); }
  }
  const turmaIds = new Set(d.turmas.map((t) => t.id)), perIds = new Set(d.periodos.map((p) => p.id)), avIds = new Set((d.avaliacoes ?? []).map((a) => a.id));
  for (const e of d.entradas) {
    if (!turmaIds.has(e.turma_id)) add("bloqueante", "P05", `entradas.${e.id}`, `turma "${e.turma_id}" não existe.`);
    if (e.periodo_id && !perIds.has(e.periodo_id)) add("bloqueante", "P05", `entradas.${e.id}`, `período "${e.periodo_id}" não existe.`);
    if (e.avaliacao_id && !avIds.has(e.avaliacao_id)) add("bloqueante", "P05", `entradas.${e.id}`, `avaliação "${e.avaliacao_id}" não existe.`);
    const per = d.periodos.find((p) => p.id === e.periodo_id);
    if (per && (e.data < per.inicio || e.data > per.fim)) add("aviso", "P08", `entradas.${e.id}`, `data ${dataBR(e.data)} fora do ${per.nome}.`);
  }

  // P03 / P02 habilidades
  const usados = new Map();
  const usa = (cod, onde) => { if (!usados.has(cod)) usados.set(cod, onde); };
  for (const e of d.entradas) for (const h of e.habilidades ?? []) usa(h, `entradas.${e.id}`);
  for (const a of d.avaliacoes ?? []) for (const i of a.itens) usa(i.habilidade, `avaliacoes.${a.id}`);
  for (const t of d.turmas) for (const p of t.habilidades_previstas ?? []) for (const h of p.codigos) usa(h, `turmas.${t.id}`);
  for (const [cod, onde] of usados) {
    const h = c.catalogo.get(cod);
    if (!h) add("bloqueante", "P03", onde, `código "${cod}" não está no catálogo de habilidades.`);
    else if (!h.verificado) add("aviso", "P02", `habilidades.${cod}`, "código ainda não conferido no documento oficial (aparece como \"a conferir\").");
  }

  // P01 rostos, P04, P06, P10 por entrada
  for (const e of d.entradas) {
    const dentro = incluidas.has(e.id);
    for (const ev of e.evidencias ?? []) {
      if (ev.tipo === "foto" && ev.contem_rosto) {
        const ok = ev.rostos_borrados === true || (!exigir && ev.autorizacao_imagem === "registrada");
        if (!ok) add(dentro && e.destaque ? "bloqueante" : "aviso", "P01", `entradas.${e.id}.${ev.id}`, `foto com rosto sem tratamento (${exigir ? "exige rostos borrados" : "exige borrar ou autorização registrada"}).`);
      }
    }
    if (dentro && e.tipo === "aula" && !(e.habilidades?.length)) add("aviso", "P04", `entradas.${e.id}`, "aula sem habilidade: não entra na matriz de cobertura.");
    if (dentro && e.redacao_ia?.usada && !e.redacao_ia.revisada_pelo_professor) add("bloqueante", "P06", `entradas.${e.id}`, "texto redigido com IA ainda não revisado pelo professor.");
    if (dentro && e.destaque && !(e.evidencias?.length)) add("aviso", "P10", `entradas.${e.id}`, "entrada em destaque sem evidência.");
  }

  // P07 contagens
  for (const a of d.avaliacoes ?? []) {
    for (const [i, it] of a.itens.entries()) {
      const onde = `avaliacoes.${a.id}.itens[${i}]`;
      if (it.n > a.n_participantes) add("bloqueante", "P07", onde, `n (${it.n}) maior que n_participantes (${a.n_participantes}).`);
      if (it.acertos > it.n) add("bloqueante", "P07", onde, `acertos (${it.acertos}) maior que n (${it.n}).`);
      const soma = (it.erros_tipicos ?? []).reduce((t, x) => t + x.contagem, 0);
      if (soma > it.n - it.acertos) add("bloqueante", "P07", onde, `erros típicos somam ${soma}, mas só há ${it.n - it.acertos} resposta(s) incorreta(s).`);
    }
  }

  // P11 a P14 perfis (competências, reflexão, conteúdo do perfil, privacidade)
  const ids = new Map(d.entradas.map((e) => [e.id, e]));
  for (const [i, comp] of (cfg.competencias ?? []).entries()) {
    const onde = `portfolio.competencias[${i}]`;
    if (!(comp.entradas_ids ?? []).length) add("aviso", "P11", onde, `competência "${comp.nome}" sem nenhum registro do diário como evidência.`);
    for (const id of comp.entradas_ids ?? []) {
      if (!ids.has(id)) add("bloqueante", "P11", onde, `registro "${id}" não existe no diário.`);
      else if (!incluidas.has(id)) add("aviso", "P11", onde, `registro "${id}" está fora dos períodos ou das turmas escolhidos e não aparecerá no portfólio.`);
    }
  }
  if (perfil === "pos_graduacao") for (const e of c.entradas) if (e.destaque && !e.reflexao) add("aviso", "P12", `entradas.${e.id}`, "o perfil de pós-graduação pede reflexão em cada prática em destaque.");
  if (perfil !== "escolar") {
    if (!cfg.apresentacao) add("aviso", "P13", "portfolio.apresentacao", "perfil externo sem apresentação: quem avalia não conhece você pelo diário.");
    const pp = cfg.perfil_profissional ?? {};
    if (secoesSel.has("trajetoria") && !["formacao", "atuacao", "cursos", "producao"].some((k) => pp[k]?.length)) add("aviso", "P13", "portfolio.perfil_profissional", "seção de trajetória selecionada, mas sem formação, atuação, cursos ou produção.");
    if (secoesSel.has("competencias") && !(cfg.competencias ?? []).length) add("aviso", "P13", "portfolio.competencias", "seção de competências selecionada, mas nenhuma competência foi descrita.");
    if (secoesSel.has("fundamentacao") && !(cfg.fundamentacao?.questao || cfg.fundamentacao?.texto)) add("aviso", "P13", "portfolio.fundamentacao", "seção de fundamentação selecionada, mas sem questão ou texto.");
    if (cfg.privacidade?.exigir_rostos_borrados === false) add("aviso", "P14", "portfolio.privacidade", "perfil para fora da escola sempre exige rostos borrados; o valor false foi ignorado.");
  }

  // P09 nomes vigiados (varre todos os textos; não imprime o contexto)
  const termos = vigiar.map(semAcento).filter(Boolean);
  if (termos.length) {
    const andar = (o, caminho) => {
      if (typeof o === "string") { const s = semAcento(o); for (const t of termos) if (s.includes(t)) add("bloqueante", "P09", caminho, "contém um nome da lista de vigilância."); }
      else if (Array.isArray(o)) o.forEach((x, i) => andar(x, `${caminho}[${i}]`));
      else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) andar(v, caminho ? `${caminho}.${k}` : k);
    };
    andar(d, ""); andar(cfg, "portfolio");
  }
  return out;
}

export function matriz(d, cfg) {
  const c = contexto(d, cfg);
  return c.turmas.map((t) => {
    const prev = new Map(c.periodos.map((p) => [p.id, new Set((t.habilidades_previstas ?? []).find((x) => x.periodo_id === p.id)?.codigos ?? [])]));
    const temPrev = [...prev.values()].some((s) => s.size);
    const eT = c.entradas.filter((e) => e.turma_id === t.id), aT = c.avals.filter((a) => a.turma_id === t.id);
    const codigos = [];
    const mais = (x) => { if (!codigos.includes(x)) codigos.push(x); };
    for (const p of c.periodos) prev.get(p.id).forEach(mais);
    for (const e of eT) (e.habilidades ?? []).forEach(mais);
    for (const a of aT) a.itens.forEach((i) => mais(i.habilidade));
    const linhas = codigos.map((cod) => ({
      codigo: cod, hab: c.catalogo.get(cod),
      celulas: c.periodos.map((p) => {
        const n = eT.filter((e) => c.pid(e) === p.id && (e.habilidades ?? []).includes(cod)).length;
        const av = aT.some((a) => c.periodoDe(a.data) === p.id && a.itens.some((i) => i.habilidade === cod));
        const prevista = prev.get(p.id).has(cod);
        const estado = n > 0 || av ? (temPrev && !prevista ? "extra" : "ok") : prevista ? "lacuna" : "vazio";
        return { n, av, estado };
      }),
    }));
    return { turma: t, periodos: c.periodos, linhas, temPrev };
  });
}

function evolucao(d, cfg, turmaId) {
  const c = contexto(d, cfg);
  const mapa = new Map();
  for (const a of c.avals.filter((x) => x.turma_id === turmaId)) {
    const porHab = new Map();
    for (const it of a.itens) { const r = porHab.get(it.habilidade) ?? { acertos: 0, n: 0 }; r.acertos += it.acertos; r.n += it.n; porHab.set(it.habilidade, r); }
    for (const [h, r] of porHab) { if (!mapa.has(h)) mapa.set(h, []); mapa.get(h).push({ data: a.data, ...r }); }
  }
  return mapa;
}

const CSS = `
@page{size:A4;margin:15mm}
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1b2430;font-size:11pt;line-height:1.45;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{page-break-after:always;padding:0}
.pg:last-child{page-break-after:auto}
h1{font-size:26pt;color:#1d3557;margin:0 0 4px}
h2{font-size:15pt;color:#1d3557;border-bottom:2px solid #2a9d8f;padding-bottom:4px;margin:0 0 10px}
h3{font-size:12pt;color:#1d3557;margin:14px 0 6px;break-after:avoid;page-break-after:avoid}
.bloco{break-inside:avoid;page-break-inside:avoid}
tr{break-inside:avoid;page-break-inside:avoid}
.capa{display:flex;flex-direction:column;justify-content:center;min-height:255mm;border-left:10px solid #2a9d8f;padding-left:18px}
.sub{font-size:13pt;color:#4a5a6a;margin-bottom:22px}
.meta{color:#4a5a6a;font-size:10.5pt}
table{border-collapse:collapse;width:100%;font-size:9.5pt;margin:6px 0}
th,td{border:1px solid #c9d3dc;padding:4px 6px;text-align:left;vertical-align:top}
th{background:#eef3f7}
td.c{text-align:center}
.ok{background:#e3f4ea}.lacuna{background:#fde8e8;color:#8a2b2b}.extra{background:#eef0ff}.vazio{color:#9aa5b0;text-align:center}
.aconf{font-size:8pt;background:#fff3cd;border:1px solid #e6c65c;border-radius:3px;padding:0 3px;margin-left:4px;white-space:nowrap}
.card{border:1px solid #c9d3dc;border-radius:6px;padding:8px 10px;margin:8px 0;break-inside:avoid;page-break-inside:avoid}
.card .t{font-weight:700;color:#1d3557}
.ev{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.ph{flex:1 1 150px;min-height:70px;border:1.5px dashed #9aa5b0;border-radius:4px;padding:6px;font-size:9pt;color:#4a5a6a;background:#f8fafc}
.ev img{max-width:100%;max-height:60mm;border-radius:4px}
.nota{font-size:9pt;color:#4a5a6a;margin-top:4px}
.refl{background:#f4f8fb;border-left:4px solid #2a9d8f;padding:6px 10px;margin:6px 0}
ul{margin:4px 0 4px 18px;padding:0}
.sobre{font-size:9.5pt;border:1px solid #c9d3dc;border-radius:6px;padding:8px 12px;background:#fafbfc}
`;

export function montarCorpo(d, cfg) {
  const c = contexto(d, cfg);
  const exigir = exigirRostos(cfg);
  const perfil = perfilDe(cfg);
  const PF = PERFIS[perfil];
  const secoes = new Set(cfg.secoes ?? PF.secoes);
  const badge = (h) => (h && !h.verificado ? `<span class="aconf">a conferir</span>` : "");
  const codHtml = (cod) => `${esc(cod)}${badge(c.catalogo.get(cod))}`;
  const periodoTxt = c.periodos.map((p) => p.nome).join(" e ");
  const partes = [];

  partes.push(`<section class="pg capa"><h1>${esc(cfg.titulo)}</h1>${cfg.subtitulo ? `<div class="sub">${esc(cfg.subtitulo)}</div>` : ""}
    <div class="meta">${perfil === "escolar" ? "" : `<b>${esc(PF.rotulo)}</b><br>`}${esc(d.professor?.nome ?? "")}${d.professor?.escola ? ` · ${esc(d.professor.escola)}` : ""}<br>Ano letivo ${esc(d.ano_letivo)} · ${esc(periodoTxt)}<br>${c.turmas.map((t) => esc(t.nome)).join(" · ")}</div></section>`);

  const resumo = [];
  if (cfg.apresentacao) resumo.push(`<h2>Apresentação</h2><p>${esc(cfg.apresentacao)}</p><p class="nota">Os dados abaixo vêm do diário de aula. As contagens de avaliações são agregadas por item, sem identificar estudantes.</p>`);

  const lista = (rot, arr) => (arr?.length ? `<h3>${rot}</h3><ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  if (secoes.has("fundamentacao") && (cfg.fundamentacao?.questao || cfg.fundamentacao?.texto || cfg.fundamentacao?.referencias?.length)) {
    const f = cfg.fundamentacao;
    resumo.push(`<h2>Fundamentação</h2>${f.questao ? `<div class="refl"><b>Questão que orienta a prática:</b> ${esc(f.questao)}</div>` : ""}${f.texto ? `<p>${esc(f.texto)}</p>` : ""}${lista("Referências informadas pelo autor", f.referencias)}
      <p class="nota">As referências foram escritas por você. O MathLab não cria nem confere citações: revise segundo a ABNT antes de enviar.</p>`);
  }
  if (secoes.has("trajetoria")) {
    const pp = cfg.perfil_profissional ?? {};
    const tem = ["formacao", "atuacao", "cursos", "producao"].some((k) => pp[k]?.length);
    if (tem) resumo.push(`<h2>Trajetória profissional</h2>${lista("Formação", pp.formacao)}${lista("Atuação", pp.atuacao)}${lista("Cursos e formação continuada", pp.cursos)}${lista("Produção e participações", pp.producao)}`);
  }
  if (secoes.has("competencias") && (cfg.competencias ?? []).length) {
    const porId = new Map(c.entradas.map((e) => [e.id, e]));
    const turmaNome = (id) => d.turmas.find((t) => t.id === id)?.nome ?? "";
    resumo.push(`<h2>Competências e evidências</h2>${cfg.competencias.map((comp) => {
      const es = (comp.entradas_ids ?? []).map((id) => porId.get(id)).filter(Boolean);
      return `<div class="card"><div class="t">${esc(comp.nome)}</div>${comp.descricao ? `<div>${esc(comp.descricao)}</div>` : ""}
        ${es.length ? `<ul>${es.map((e) => `<li>${dataBR(e.data)} · ${esc(turmaNome(e.turma_id))} · ${esc(e.tema)}${e.resumo ? `: ${esc(e.resumo)}` : ""}${(e.evidencias ?? []).length ? ` <span class="nota">(${e.evidencias.length} evidência(s))</span>` : ""}</li>`).join("")}</ul>` : `<div class="nota">Sem registro do diário ligado a esta competência.</div>`}</div>`;
    }).join("")}`);
  }
  if (secoes.has("matriz_cobertura")) {
    const blocos = matriz(d, cfg).map((m) => `<h3>${esc(m.turma.nome)} — ${esc(m.turma.componente)}${ETAPA[m.turma.etapa] ? ` (${esc(ETAPA[m.turma.etapa])})` : ""}</h3>
      <table><tr><th>Habilidade</th>${m.periodos.map((p) => `<th>${esc(p.nome)}</th>`).join("")}</tr>
      ${m.linhas.map((l) => `<tr><td>${codHtml(l.codigo)}${l.hab?.descricao ? `<br><span class="nota">${esc(l.hab.descricao)}</span>` : ""}</td>${l.celulas.map((x) => `<td class="c ${x.estado}">${x.estado === "lacuna" ? "lacuna" : x.estado === "vazio" ? "—" : `${x.n} reg.${x.av ? " · aval." : ""}${x.estado === "extra" ? " (não prevista)" : ""}`}</td>`).join("")}</tr>`).join("")}</table>`).join("");
    resumo.push(`<h2>Cobertura curricular</h2>${blocos}
      <p class="nota"><b>Como ler:</b> "reg." = registros no diário que trabalharam a habilidade; "aval." = houve avaliação dela no período; "lacuna" = prevista no planejamento e sem registro. Baseado nos registros: uma lacuna pode ser aula dada e não registrada.</p>`);
  }

  if (secoes.has("evolucao")) {
    const linhas = c.turmas.map((t) => [t, [...evolucao(d, cfg, t.id)].filter(([, v]) => v.length >= 2)]).filter(([, ev]) => ev.length);
    if (linhas.length) resumo.push(`<h2>Evolução por habilidade</h2>${linhas.map(([t, ev]) => `<div class="bloco"><h3>${esc(t.nome)}</h3><table><tr><th>Habilidade</th><th>Percentual de acerto nos itens, por avaliação</th></tr>${ev.map(([cod, v]) => `<tr><td>${codHtml(cod)}</td><td>${v.map((x) => `${pct(x.acertos, x.n)}% (${x.acertos}/${x.n}) em ${dataBR(x.data)}`).join(" → ")}</td></tr>`).join("")}</table></div>`).join("")}
      <p class="nota">Compara itens de provas diferentes: indica tendência, não é medida rigorosa de aprendizagem. Contagens de respostas, sem identificar estudantes.</p>`);
  }
  if (resumo.length) partes.push(`<section class="pg">${resumo.join("\n")}</section>`);

  for (const t of c.turmas) {
    const eT = c.entradas.filter((e) => e.turma_id === t.id);
    const aT = c.avals.filter((a) => a.turma_id === t.id);
    let h = `<section class="pg"><h2>${esc(t.nome)} — ${esc(t.componente)}</h2>`;
    if (secoes.has("linha_do_periodo")) {
      h += `<h3>Linha do período</h3><table><tr><th>Data</th><th>Tipo</th><th>Tema</th><th>Habilidades</th></tr>${eT.map((e) => `<tr><td>${dataBR(e.data)}</td><td>${esc(TIPO[e.tipo])}</td><td>${esc(e.tema)}</td><td>${(e.habilidades ?? []).map(codHtml).join("<br>")}</td></tr>`).join("")}</table>`;
    }
    if (secoes.has("destaques")) {
      const todos = eT.filter((e) => e.destaque), ds = todos.slice(0, PF.maxDestaques);
      if (ds.length) h += `<h3>${PF.tituloDestaques}</h3>${todos.length > ds.length ? `<p class="nota">Mostrando ${ds.length} de ${todos.length} práticas em destaque desta turma.</p>` : ""}${ds.map((e) => `<div class="card"><div class="t">${dataBR(e.data)} · ${esc(e.tema)}</div>${e.resumo ? `<div>${esc(e.resumo)}</div>` : ""}
        <div class="nota">${(e.habilidades ?? []).map(codHtml).join(" · ")}</div>
        ${(e.evidencias ?? []).length ? `<div class="ev">${e.evidencias.map((ev) => ev.dataurl ? `<figure style="margin:0"><img src="${esc(ev.dataurl)}" alt="${esc(ev.descricao)}"><figcaption class="nota">${esc(ev.descricao)}</figcaption></figure>` : `<div class="ph"><b>${esc(ev.tipo === "foto" ? `Foto (${ev.conteudo})` : ev.tipo)}</b><br>${esc(ev.descricao)}${ev.contem_rosto ? `<br><i>${ev.rostos_borrados ? "rostos borrados" : exigir ? "" : "autorização registrada"}</i>` : ""}</div>`).join("")}</div>` : ""}
        ${e.reflexao ? `<div class="refl"><b>Reflexão:</b> ${esc(e.reflexao)}</div>` : ""}</div>`).join("")}`;
    }
    if (secoes.has("avaliacoes") && aT.length) {
      h += `<h3>Avaliações e o que mostraram</h3>${aT.map((a) => `<div class="card"><div class="t">${dataBR(a.data)} · ${esc(a.instrumento)} · ${a.n_participantes} participantes</div>
        <table><tr><th>Item</th><th>Habilidade</th><th>Acerto</th><th>Erro mais frequente</th></tr>${a.itens.map((i) => { const top = [...(i.erros_tipicos ?? [])].sort((x, y) => y.contagem - x.contagem)[0]; return `<tr><td>${esc(i.item)}</td><td>${codHtml(i.habilidade)}</td><td class="c">${pct(i.acertos, i.n)}% (${i.acertos}/${i.n})</td><td>${top ? `${esc(top.descricao)} (${top.contagem})` : "—"}</td></tr>`; }).join("")}</table>
        ${a.intervencao ? `<div class="refl"><b>O que foi feito depois:</b> ${esc(a.intervencao)}</div>` : ""}</div>`).join("")}`;
    }
    partes.push(h + "</section>");
  }

  let refl = "";
  if (secoes.has("reflexao") && (cfg.reflexao_geral || cfg.proximos_passos?.length)) {
    refl = `<h2>Reflexão e próximos passos</h2>${cfg.reflexao_geral ? `<div class="refl">${esc(cfg.reflexao_geral)}</div>` : ""}${cfg.proximos_passos?.length ? `<h3>Próximos passos</h3><ul>${cfg.proximos_passos.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}`;
  }

  const aConf = [...new Set([...c.entradas.flatMap((e) => e.habilidades ?? []), ...c.avals.flatMap((a) => a.itens.map((i) => i.habilidade))])].filter((x) => c.catalogo.get(x) && !c.catalogo.get(x).verificado);
  partes.push(`<section class="pg">${refl}<h2>Sobre este portfólio</h2><div class="sobre"><ul>
    <li>Gerado a partir do diário de aula do próprio professor; nada foi acrescentado por terceiros.</li>
    <li>Não contém nomes de estudantes. As avaliações aparecem como contagens por item.</li>
    <li>Fotos: ${exigir ? "só entram fotos sem rosto ou com rostos borrados." : "fotos com rosto só entram se borradas ou com autorização registrada."}</li>
    <li>Habilidades ainda não conferidas no documento oficial: ${aConf.length ? aConf.map(esc).join("; ") : "nenhuma"}.</li>
    <li>A matriz de cobertura reflete o que foi registrado, não necessariamente tudo o que foi trabalhado.</li>${perfil === "processo_seletivo" ? `<li>Seleção de até ${PF.maxDestaques} práticas por turma; o diário completo permanece com o autor.</li>` : ""}${perfil === "pos_graduacao" ? `<li>A fundamentação e as referências são do autor; o MathLab não cria citações.</li>` : ""}</ul></div></section>`);

  return partes.join("\n");
}

const comEscopo = (h) => h.replace(/<th>/g, '<th scope="col">');

export function montarHtml(d, cfg) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(cfg.titulo)}</title><style>${CSS}</style></head><body><main>${comEscopo(montarCorpo(d, cfg))}</main></body></html>`;
}

// ---- Flipbook (StPageFlip) ----
// Roda no navegador: lê a versão corrida (#linear), divide em páginas do tamanho da janela e liga o StPageFlip.
// Sem JavaScript, ou se a biblioteca falhar, a pessoa continua vendo a versão corrida, que é o documento completo.
function paginadorNoNavegador() {
  var raiz = document.documentElement;
  var linear = document.getElementById("linear");
  var app = document.getElementById("app");
  var livro = document.getElementById("livro");
  var ind = document.getElementById("indicador");
  var btnPrev = document.getElementById("prev"), btnNext = document.getElementById("next"), btnModo = document.getElementById("modo");
  if (!window.St || !linear || !livro) return;
  var reduzir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var flip = null, total = 0, secaoAtual = 0, ativo = false;

  function medidas() {
    var w = Math.max(280, Math.min(window.innerWidth - 24, 1500));
    var h = Math.max(380, window.innerHeight - 120);
    var doisLados = w >= 900;
    var pw = doisLados ? Math.floor(w / 2) : w;
    var ph = Math.floor(pw * 1.414);
    if (ph > h) { ph = h; pw = Math.floor(ph / 1.414); }
    return { pw: pw, ph: ph, doisLados: doisLados };
  }
  function vars(el, m) { el.style.setProperty("--fs", Math.max(8.5, Math.min(13, m.pw / 52)) + "px"); el.style.setProperty("--pad", Math.round(m.pw * 0.07) + "px"); }
  function novaPagina(m, esc) {
    var p = document.createElement("div");
    p.className = "fp";
    var i = document.createElement("div"); i.className = "fpi"; vars(i, m); p.appendChild(i);
    if (esc !== undefined) p.setAttribute("data-secao", esc);
    return p;
  }
  function cabe(p) { return p.scrollHeight <= p.clientHeight + 1; }
  function paginar(m) {
    var medidor = document.createElement("div");
    medidor.className = "fpi medidor"; vars(medidor, m);
    medidor.style.width = m.pw + "px"; medidor.style.height = m.ph + "px";
    document.body.appendChild(medidor);
    var paginas = [];
    var fluxo = false, atual = null, conteudo = [];
    function fecha() { if (conteudo.length) { conteudo.forEach(function (n) { atual.firstChild.appendChild(n); }); paginas.push(atual); } atual = novaPagina(m, 0); conteudo = []; medidor.innerHTML = ""; }
    var secoes = linear.querySelectorAll(":scope > section.pg");
    secoes.forEach(function (sec, si) {
      if (sec.classList.contains("capa")) {
        if (fluxo) { fecha(); fluxo = false; }
        var cp = novaPagina(m, si); cp.classList.add("capa-fp");
        cp.firstChild.appendChild(sec.cloneNode(true)); paginas.push(cp); return;
      }
      if (!fluxo) { fluxo = true; atual = novaPagina(m, si); medidor.innerHTML = ""; conteudo = []; }
      function tenta(n) { medidor.appendChild(n); var ok = cabe(medidor); if (!ok) medidor.removeChild(n); return ok; }
      Array.prototype.slice.call(sec.children).forEach(function (filho) {
        var n = filho.cloneNode(true);
        if (tenta(n)) { conteudo.push(n); return; }
        // não coube: leva junto o título que ficou sozinho no fim da página
        var sozinhos = [];
        while (conteudo.length > 1 && /^H[23]$/.test(conteudo[conteudo.length - 1].tagName)) sozinhos.unshift(conteudo.pop());
        fecha();
        sozinhos.forEach(function (h) { medidor.appendChild(h); conteudo.push(h); });
        if (tenta(n)) { conteudo.push(n); return; }
        if (n.tagName === "TABLE") {
          var cab = n.rows[0], linhas = Array.prototype.slice.call(n.rows, 1);
          var t = null;
          linhas.forEach(function (l) {
            if (!t) { t = n.cloneNode(false); t.appendChild(cab.cloneNode(true)); medidor.appendChild(t); conteudo.push(t); }
            t.appendChild(l.cloneNode(true));
            if (!cabe(medidor) && t.rows.length > 2) { t.removeChild(t.lastChild); fecha(); t = null; t = n.cloneNode(false); t.appendChild(cab.cloneNode(true)); medidor.appendChild(t); conteudo.push(t); t.appendChild(l.cloneNode(true)); }
          });
        } else { n.classList.add("longo"); medidor.appendChild(n); conteudo.push(n); }
      });
    });
    if (fluxo) fecha();
    document.body.removeChild(medidor);
    paginas.forEach(function (p, i) {
      p.setAttribute("role", "group"); p.setAttribute("aria-roledescription", "página");
      p.setAttribute("aria-label", "Página " + (i + 1) + " de " + paginas.length);
      var rod = document.createElement("div"); rod.className = "pn"; rod.setAttribute("aria-hidden", "true"); rod.textContent = (i + 1) + " / " + paginas.length; p.appendChild(rod);
    });
    return paginas;
  }
  function texto(i) {
    var duas = flip && flip.getOrientation && flip.getOrientation() === "landscape" && i > 0 && i + 1 < total;
    return duas ? "Páginas " + (i + 1) + " e " + (i + 2) + " de " + total : "Página " + (i + 1) + " de " + total;
  }
  function monta() {
    if (flip) { try { flip.destroy(); } catch (e) { /* ignora */ } flip = null; }
    var m = medidas();
    livro.innerHTML = "";
    var paginas = paginar(m); total = paginas.length;
    paginas.forEach(function (p) { livro.appendChild(p); });
    flip = new window.St.PageFlip(livro, {
      width: m.pw, height: m.ph, size: "fixed", showCover: true, usePortrait: !m.doisLados, drawShadow: !reduzir, maxShadowOpacity: 0.35,
      flippingTime: reduzir ? 1 : 700, mobileScrollSupport: false, startPage: Math.min(secaoAtual, total - 1)
    });
    flip.loadFromHTML(livro.querySelectorAll(".fp"));
    flip.on("flip", function (e) { secaoAtual = e.data; ind.textContent = texto(e.data); });
    ind.textContent = texto(flip.getCurrentPageIndex());
  }
  function liga() {
    raiz.classList.add("flip-on"); app.hidden = false; ativo = true; btnModo.textContent = "Ler em página corrida";
    monta();
  }
  function desliga() {
    raiz.classList.remove("flip-on"); app.hidden = true; ativo = false; btnModo.textContent = "Folhear como livro";
    if (flip) { try { flip.destroy(); } catch (e) { /* ignora */ } flip = null; }
    linear.setAttribute("tabindex", "-1"); linear.focus();
  }
  btnModo.addEventListener("click", function () { ativo ? desliga() : liga(); });
  btnPrev.addEventListener("click", function () { if (flip) flip.flipPrev(); });
  btnNext.addEventListener("click", function () { if (flip) flip.flipNext(); });
  document.addEventListener("keydown", function (ev) {
    if (!ativo || !flip) return;
    var t = ev.target && ev.target.tagName;
    if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
    if (ev.key === "ArrowRight" || ev.key === "PageDown") { flip.flipNext(); ev.preventDefault(); }
    else if (ev.key === "ArrowLeft" || ev.key === "PageUp") { flip.flipPrev(); ev.preventDefault(); }
    else if (ev.key === "Home") { flip.flip(0); ev.preventDefault(); }
    else if (ev.key === "End") { flip.flip(total - 1); ev.preventDefault(); }
  });
  var tempo = null;
  window.addEventListener("resize", function () { if (!ativo) return; clearTimeout(tempo); tempo = setTimeout(monta, 250); });
  app.hidden = true;
  btnModo.hidden = false;
  btnModo.textContent = "Folhear como livro";
  window.__flipbook = { liga: liga, desliga: desliga, total: function () { return total; }, flip: function () { return flip; } };
  liga();
}

const CSS_FLIP = `
html.flip-on #linear{display:none}
#app{background:#2b3440;min-height:100vh;padding:8px 12px 16px;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#app[hidden]{display:none}
.barra{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:6px 0 12px}
.barra button,#modo{font:inherit;font-size:14px;background:#f7b500;color:#14264f;border:0;border-radius:8px;padding:9px 14px;cursor:pointer;min-height:40px}
.barra button:focus-visible,#modo:focus-visible{outline:3px solid #fff;outline-offset:2px}
.barra button:hover,#modo:hover{background:#ffd34d}
#indicador{min-width:9em;text-align:center;font-size:14px}
#livro{margin:0 auto}
.fp{background:#fff;color:#1b2430;overflow:hidden;position:relative}
.fpi,.medidor{box-sizing:border-box;width:100%;height:100%;overflow:hidden;line-height:1.4;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:var(--fs,11px);padding:var(--pad,24px);padding-bottom:calc(var(--pad,24px) + 1.8em)}
.medidor{position:absolute;left:-99999px;top:0;visibility:hidden}
.fp .pg,.medidor .pg{padding:0;page-break-after:auto}
.fpi h1,.medidor h1{font-size:2.1em}.fpi h2,.medidor h2{font-size:1.35em}.fpi h3,.medidor h3{font-size:1.1em}
.fpi table,.medidor table{font-size:.85em}
.fpi p,.medidor p{font-size:1em;margin:.4em 0}.fpi .nota,.medidor .nota,.fpi .meta,.medidor .meta,.fpi .sobre,.medidor .sobre{font-size:.82em}.fpi .sub,.medidor .sub{font-size:1.2em}.fpi .aconf,.medidor .aconf{font-size:.72em}.fpi .ph,.medidor .ph{font-size:.82em}
.fpi .capa{min-height:0;height:100%;border-left-width:6px;padding-left:1em}
.fpi .longo{overflow:auto;max-height:100%}
.fp .pn{position:absolute;left:0;right:0;bottom:6px;text-align:center;font-size:11px;color:#6b7785}
.pulo{position:absolute;left:-9999px}.pulo:focus{left:8px;top:8px;background:#fff;color:#14264f;padding:8px;z-index:10}
@media print{#app,.pulo{display:none!important}html.flip-on #linear{display:block!important}}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
`;

/**
 * Flipbook em HTML único. `opts.lib` é o texto da biblioteca StPageFlip (assets/vendor/page-flip/page-flip.browser.js).
 * O corpo é o mesmo do portfólio corrido, que fica na página como alternativa completa.
 */
export function montarFlipbook(d, cfg, opts = {}) {
  if (!opts.lib) throw new Error("montarFlipbook precisa do texto da biblioteca StPageFlip em opts.lib.");
  const lib = String(opts.lib).replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(cfg.titulo)} (para folhear)</title><style>${CSS}${CSS_FLIP}</style></head><body>
<a class="pulo" href="#linear">Ir para a versão em página corrida</a>
<div id="app" hidden><div class="barra" role="toolbar" aria-label="Controles do livro"><button id="prev" type="button" aria-label="Página anterior">◀ Anterior</button><span id="indicador" role="status" aria-live="polite"></span><button id="next" type="button" aria-label="Próxima página">Próxima ▶</button></div>
<p class="barra" style="font-size:13px;margin-top:0">Setas do teclado, Home e End também viram as páginas.</p><div id="livro" aria-label="${esc(cfg.titulo)}"></div></div>
<div class="barra" style="margin:8px"><button id="modo" type="button" hidden>Folhear como livro</button></div>
<main id="linear">${comEscopo(montarCorpo(d, cfg))}</main>
<script>${lib}</script>
<script>(${paginadorNoNavegador.toString()})();</script></body></html>`;
}

// ---- CLI ----
if (process.argv[1]?.endsWith("portfolio.mjs")) {
  const { mkdirSync, mkdtempSync, rmSync } = await import("node:fs");
  const path = await import("node:path");
  const { fileURLToPath, pathToFileURL } = await import("node:url");
  const { createRequire } = await import("node:module");
  const { tmpdir } = await import("node:os");
  const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const args = process.argv.slice(2);
  const val = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const flagsComValor = new Set(["--saida", "--vigiar", "--perfil", "--flipbook", "--pdf", "--pacote"]);
  const pos = args.filter((a, i) => !a.startsWith("--") && !flagsComValor.has(args[i - 1]));
  if (!pos.length) { console.error("Uso: node tools/portfolio.mjs diario.json [portfolio.json] [--perfil escolar|processo_seletivo|pos_graduacao] [--saida out.html] [--flipbook out.html] [--pdf out.pdf] [--pacote pasta] [--vigiar nomes.txt]"); process.exit(2); }
  const d = JSON.parse(readFileSync(pos[0], "utf8"));
  const perfilArg = val("--perfil");
  if (perfilArg && !PERFIS[perfilArg]) { console.error(`Perfil desconhecido: ${perfilArg}. Use ${Object.keys(PERFIS).join(", ")}.`); process.exit(2); }
  const cfg = pos[1] ? JSON.parse(readFileSync(pos[1], "utf8")) : CFG_PADRAO(d, perfilArg);
  if (perfilArg) cfg.perfil = perfilArg;
  const vigiar = val("--vigiar") ? readFileSync(val("--vigiar"), "utf8").split(/\r?\n/) : [];
  const achados = verificar(d, cfg, vigiar);
  for (const a of achados) console.log(`[${a.nivel.toUpperCase().padEnd(10)}] ${a.regra.padEnd(3)} ${a.onde}: ${a.msg}`);
  const nb = achados.filter((a) => a.nivel === "bloqueante").length;
  console.log(`-> ${nb} bloqueante(s), ${achados.length - nb} aviso(s)`);
  if (nb) { console.log("Portfólio NÃO gerado (resolva os bloqueantes)."); process.exit(1); }

  const pacote = val("--pacote");
  if (pacote) mkdirSync(pacote, { recursive: true });
  const saida = val("--saida") ?? (pacote ? path.join(pacote, "portfolio.html") : (val("--flipbook") || val("--pdf") ? null : "portfolio.html"));
  const saidaFlip = val("--flipbook") ?? (pacote ? path.join(pacote, "portfolio-flipbook.html") : null);
  const saidaPdf = val("--pdf") ?? (pacote ? path.join(pacote, "portfolio.pdf") : null);

  if (saida) { writeFileSync(saida, montarHtml(d, cfg)); console.log(`Gerado: ${saida}`); }
  if (saidaFlip) {
    const lib = readFileSync(path.join(RAIZ, "assets", "vendor", "page-flip", "page-flip.browser.js"), "utf8");
    writeFileSync(saidaFlip, montarFlipbook(d, cfg, { lib })); console.log(`Gerado: ${saidaFlip}`);
  }
  if (saidaPdf) {
    let chromium;
    try { ({ chromium } = createRequire(import.meta.url)("playwright")); }
    catch { console.error("PDF não gerado: o pacote \"playwright\" não está instalado (npm i -D playwright && npx playwright install chromium)."); process.exit(1); }
    const { normalizarPdf, acessibilidadePdf } = await import("./gerar-pdf.mjs");
    const tmp = mkdtempSync(path.join(tmpdir(), "mathlab-portfolio-"));
    const arq = path.join(tmp, "portfolio.html");
    writeFileSync(arq, montarHtml(d, cfg));
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const bloqueados = [];
      await page.route("**/*", (r) => { const u = r.request().url(); if (u.startsWith("file:") || u.startsWith("data:")) return r.continue(); bloqueados.push(u); return r.abort(); });
      await page.goto(pathToFileURL(arq).href, { waitUntil: "load" });
      await page.emulateMedia({ media: "print" });
      const pdf = normalizarPdf(await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true, outline: true }));
      writeFileSync(saidaPdf, pdf);
      const a = acessibilidadePdf(pdf);
      console.log(`Gerado: ${saidaPdf} (marcado: ${a.marcado ? "sim" : "não"}, estrutura: ${a.estrutura ? "sim" : "não"}, idioma: ${a.idioma ?? "ausente"}, marcadores: ${a.marcadores ? "sim" : "não"}, títulos: ${a.titulos})`);
      if (!a.marcado || !a.estrutura || !a.idioma) { console.error("Atenção: o PDF não passou na conferência de acessibilidade."); process.exitCode = 1; }
      if (bloqueados.length) console.error(`Pedidos de rede bloqueados: ${bloqueados.length}`);
    } finally { await browser.close(); rmSync(tmp, { recursive: true, force: true }); }
  }
}
