/* Gerado automaticamente a partir de tools/*.mjs */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MathLabPortfolio = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
// Gera o portfólio (HTML em A4) a partir do diário, com checagens de privacidade e honestidade.
// Uso: node tools/portfolio.mjs diario.json [portfolio.json] [--saida portfolio.html] [--vigiar nomes.txt]
//   --vigiar: arquivo local com um nome de aluno por linha. Se algum aparecer em qualquer texto, NADA é gerado.
// Não valida o esquema JSON (use jsonschema/ajv). Não gera arquivo se houver achado bloqueante.

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pct = (a, n) => (n ? Math.round((100 * a) / n) : 0);
const dataBR = (iso) => String(iso).split("-").reverse().join("/");
const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ETAPA = { ef1: "Ensino Fundamental I", ef2: "Ensino Fundamental II", em: "Ensino Médio", tecnico: "Ensino Técnico", graduacao: "Graduação", pos: "Pós-graduação", outro: "" };
const TIPO = { aula: "Aula", avaliacao: "Avaliação", retomada: "Retomada", projeto: "Projeto", atividade_extra: "Atividade extra", outro: "Outro" };

const CFG_PADRAO = (d) => ({
  schema_versao: "portfolio.1", titulo: `Portfólio docente ${d.ano_letivo}`, destinatario: "direcao",
  periodos_ids: d.periodos.map((p) => p.id), privacidade: { exigir_rostos_borrados: true },
  secoes: ["matriz_cobertura", "linha_do_periodo", "destaques", "avaliacoes", "evolucao", "reflexao"],
});

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

function verificar(d, cfg, vigiar = []) {
  const out = [];
  const add = (nivel, regra, onde, msg) => out.push({ nivel, regra, onde, msg });
  const c = contexto(d, cfg);
  const incluidas = new Set(c.entradas.map((e) => e.id));
  const exigir = cfg.privacidade?.exigir_rostos_borrados !== false;

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

function matriz(d, cfg) {
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

function montarHtml(d, cfg) {
  const c = contexto(d, cfg);
  const secoes = new Set(cfg.secoes ?? CFG_PADRAO(d).secoes);
  const exigir = cfg.privacidade?.exigir_rostos_borrados !== false;
  const badge = (h) => (h && !h.verificado ? `<span class="aconf">a conferir</span>` : "");
  const codHtml = (cod) => `${esc(cod)}${badge(c.catalogo.get(cod))}`;
  const periodoTxt = c.periodos.map((p) => p.nome).join(" e ");
  const partes = [];

  partes.push(`<section class="pg capa"><h1>${esc(cfg.titulo)}</h1>${cfg.subtitulo ? `<div class="sub">${esc(cfg.subtitulo)}</div>` : ""}
    <div class="meta">${esc(d.professor?.nome ?? "")}${d.professor?.escola ? ` · ${esc(d.professor.escola)}` : ""}<br>Ano letivo ${esc(d.ano_letivo)} · ${esc(periodoTxt)}<br>${c.turmas.map((t) => esc(t.nome)).join(" · ")}</div></section>`);

  const resumo = [];
  if (cfg.apresentacao) resumo.push(`<h2>Apresentação</h2><p>${esc(cfg.apresentacao)}</p><p class="nota">Os dados abaixo vêm do diário de aula. As contagens de avaliações são agregadas por item, sem identificar estudantes.</p>`);

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
      const ds = eT.filter((e) => e.destaque);
      if (ds.length) h += `<h3>Em destaque</h3>${ds.map((e) => `<div class="card"><div class="t">${dataBR(e.data)} · ${esc(e.tema)}</div>${e.resumo ? `<div>${esc(e.resumo)}</div>` : ""}
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
    <li>A matriz de cobertura reflete o que foi registrado, não necessariamente tudo o que foi trabalhado.</li></ul></div></section>`);

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(cfg.titulo)}</title><style>${CSS}</style></head><body>${partes.join("\n")}</body></html>`;
}


  return { CFG_PADRAO, verificar, montarHtml };
});
