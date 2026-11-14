/* MathLab Aulas Visuais — interface. Tudo roda no navegador; nada é enviado a servidor algum. */
(function () {
  'use strict';
  const C = window.MathLabCore, esc = C.esc;
  const KEY = 'mathlab.lib.v2';
  const $ = (s, r) => (r || document).querySelector(s);

  /* ---------- armazenamento ---------- */
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && Array.isArray(j.projects)) return j; } catch (e) { /* ignora */ } return { projects: [] }; }
  let lib = load();
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(lib)); return true; }
    catch (e) { toast('Não consegui salvar no navegador (espaço cheio ou bloqueado). Baixe um backup na Biblioteca.', true); return false; }
  }

  const S = { tab: 'biblioteca', pid: null, mid: null, draft: null, dirty: false, showPrev: false, showVers: false, showArch: false,
    form: { author: C.DEFAULT_AUTHOR, discipline: '', level: '', topic: '', duration: '1 aula de 50 minutos', objectives: '', type: 'auto', contentProfile: 'completo', target: '', pasted: '' }, vis: { kind: 'numberLine', text: '-6, 6, -2, 5', title: '' } };

  /* ---------- modelo: projetos > materiais > versões ---------- */
  const proj = (id) => lib.projects.find((p) => p.id === (id || S.pid));
  const mat = () => { const p = proj(); return p && p.materials.find((m) => m.id === S.mid); };
  const curData = (rec) => rec.versions.find((v) => v.vid === rec.cur).data;
  const logp = (p, msg) => { p.log.push({ at: new Date().toISOString(), msg }); if (p.log.length > 200) p.log.shift(); };
  const fmt = (iso) => { try { return new Date(iso).toLocaleString('pt-BR'); } catch (e) { return iso; } };
  const slug = (s) => String(s || 'material').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'material';

  function pushVersion(rec, data, note) {
    const a = C.audit(data);
    const v = { vid: C.uid('v'), at: new Date().toISOString(), note: note || '', audit: { score: a.score, level: a.level }, data: C.clone(data) };
    rec.versions.push(v); rec.cur = v.vid;
    if (rec.versions.length > 40) rec.versions.splice(1, 1); // preserva sempre a versão original (índice 0)
  }
  function newProject(name, discipline, level) {
    const p = { id: C.uid('p'), name: name || 'Meu projeto', discipline: discipline || '', level: level || '', archived: false, createdAt: new Date().toISOString(), materials: [], log: [] };
    logp(p, 'Projeto criado'); lib.projects.unshift(p); return p;
  }
  function addMaterial(p, data, note) {
    const rec = { id: C.uid('m'), cur: null, versions: [] };
    pushVersion(rec, data, note || 'Versão inicial'); p.materials.unshift(rec); logp(p, 'Material criado: ' + data.title); persist(); return rec;
  }
  function openMat(pid, mid) {
    if (S.dirty && !confirm('Há alterações não salvas no material aberto. Descartar e abrir outro?')) return;
    S.pid = pid; S.mid = mid; S.draft = C.clone(curData(proj(pid).materials.find((m) => m.id === mid))); S.dirty = false; S.tab = 'editor'; render();
  }
  function saveDraft() {
    const rec = mat(); if (!rec) return;
    const note = prompt('Anote o que mudou nesta versão (opcional):', '');
    if (note === null) return;
    S.draft = C.normalize(S.draft); pushVersion(rec, S.draft, note || 'Edição manual');
    logp(proj(), 'Nova versão salva: ' + S.draft.title); if (persist()) toast('Versão salva. As anteriores continuam disponíveis em "Versões".');
    S.dirty = false; render();
  }

  /* ---------- utilidades de interface ---------- */
  let tt;
  function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = 'show' + (err ? ' err' : ''); clearTimeout(tt); tt = setTimeout(() => { t.className = ''; }, err ? 6000 : 3200); }
  function dl(name, mime, text) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) { /* ignora */ } t.remove(); return ok; }
  }
  function printHTML(html) {
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
    f.onload = () => setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 3000); }, 300); f.srcdoc = html;
  }
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), S.draft);
  function setPath(path, val) { const k = path.split('.'); let o = S.draft; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = val; }
  const inp = (path, label, ph) => '<label>' + label + '</label><input data-f="' + path + '" value="' + esc(get(path)) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>';
  const area = (path, label, rows, lines) => '<label>' + label + '</label><textarea rows="' + (rows || 4) + '" data-f="' + path + '"' + (lines ? ' data-lines="1"' : '') + '>' + esc(lines ? (get(path) || []).join('\n') : get(path)) + '</textarea>';
  const lvlPill = (l) => '<span class="pill ' + (/Reprovado/.test(l) ? 'bad' : /Pronto/.test(l) ? 'ok' : 'warn') + '">' + esc(l) + '</span>';

  /* ---------- abas ---------- */
  const TABS = [['biblioteca', '📚 Biblioteca'], ['criar', '✨ Criar'], ['editor', '✏️ Editor'], ['poster', '🖼️ Capa (pôster)'], ['apostila', '📘 Apostila completa'], ['auditoria', '🔍 Auditoria'], ['exportar', '📤 Exportar'], ['ajuda', '❓ Ajuda']];
  const NEED = ['editor', 'poster', 'apostila', 'auditoria', 'exportar'];

  function render() {
    $('#tabs').innerHTML = TABS.map((t) => '<button data-a="tab" data-t="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('');
    const v = { biblioteca: vBib, criar: vCriar, editor: vEditor, poster: vPoster, apostila: vApostila, auditoria: vAud, exportar: vExp, ajuda: vAjuda }[S.tab];
    $('#main').innerHTML = NEED.includes(S.tab) && !S.draft
      ? '<div class="card empty"><h2>Nenhum material aberto</h2><p>Abra um material na <b>Biblioteca</b> ou crie um em <b>Criar</b>.</p><button class="b gold" data-a="tab" data-t="biblioteca">Ir para a Biblioteca</button></div>' : v();
  }

  /* ---------- Biblioteca ---------- */
  function vBib() {
    const p = S.pid && proj();
    if (p) {
      return '<div class="card"><div class="btns"><button class="b ghost" data-a="closeproj">← Todos os projetos</button></div><h2>' + esc(p.name) + '</h2><p class="muted">' + esc([p.discipline, p.level].filter(Boolean).join(' · ')) + '</p>' +
        '<div class="btns"><button class="b ghost sm" data-a="dupproj" data-id="' + p.id + '">Duplicar projeto</button><button class="b ghost sm" data-a="arch" data-id="' + p.id + '">' + (p.archived ? 'Desarquivar' : 'Arquivar') + '</button><button class="b danger sm" data-a="delproj" data-id="' + p.id + '">Excluir projeto</button></div></div>' +
        '<div class="card"><h3>Materiais (' + p.materials.length + ')</h3>' + (p.materials.length ? p.materials.map((r) => {
          const d = curData(r), last = r.versions[r.versions.length - 1];
          return '<div class="list-item"><div><b>' + esc(d.title) + '</b><br><span class="muted">' + r.versions.length + ' versão(ões) · atualizado ' + fmt(last.at) + '</span> ' + lvlPill(last.audit.level) + '</div><div class="btns"><button class="b sm" data-a="openmat" data-p="' + p.id + '" data-m="' + r.id + '">Abrir</button><button class="b ghost sm" data-a="dupmat" data-m="' + r.id + '">Duplicar</button><button class="b danger sm" data-a="delmat" data-m="' + r.id + '">Excluir</button></div></div>';
        }).join('') : '<p class="muted">Nenhum material ainda. Vá em <b>Criar</b>.</p>') + '</div>' +
        '<div class="card"><details><summary>Histórico do projeto</summary>' + p.log.slice().reverse().slice(0, 40).map((l) => '<div class="muted">' + fmt(l.at) + ' — ' + esc(l.msg) + '</div>').join('') + '</details></div>';
    }
    const vis = lib.projects.filter((x) => S.showArch || !x.archived);
    return '<div class="card"><h2>Seus projetos</h2>' + (vis.length ? vis.map((x) =>
      '<div class="list-item"><div><b>' + esc(x.name) + '</b> ' + (x.archived ? '<span class="pill">arquivado</span>' : '') + '<br><span class="muted">' + esc([x.discipline, x.level].filter(Boolean).join(' · ')) + ' · ' + x.materials.length + ' material(is)</span></div><div class="btns"><button class="b sm" data-a="openproj" data-id="' + x.id + '">Abrir</button></div></div>').join('')
      : '<p class="muted">Nenhum projeto ainda. Crie o primeiro abaixo ou carregue o exemplo.</p>') +
      '<label><input type="checkbox" data-a="toggleArch" ' + (S.showArch ? 'checked' : '') + ' style="width:auto"> mostrar arquivados</label></div>' +
      '<div class="card"><h3>Novo projeto</h3><div class="row"><div><label>Nome</label><input id="np-name" placeholder="Ex.: 7º ano — Matemática"></div><div><label>Disciplina</label><input id="np-disc" placeholder="Ex.: Matemática"></div><div><label>Etapa de ensino</label><input id="np-level" placeholder="Ex.: 7º ano do Ensino Fundamental"></div></div><div class="btns"><button class="b gold" data-a="newproj">Criar projeto</button><button class="b ghost" data-a="demo">Carregar exemplo completo</button></div></div>' +
      '<div class="card"><h3>Backup</h3><p class="muted">Seus dados ficam só neste navegador. Baixe um backup de vez em quando.</p><div class="btns"><button class="b ghost" data-a="backup">Baixar backup da biblioteca</button><label class="b ghost" style="display:inline-block;margin:0;cursor:pointer">Restaurar backup<input type="file" accept=".json,application/json" data-a="restore" style="display:none"></label></div></div>';
  }

  /* ---------- Criar ---------- */
  function vCriar() {
    const f = S.form;
    const opt = (v, t, sel) => '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(t) + '</option>';
    return '<div class="card"><h2>Criar material</h2><p class="muted">Funciona para qualquer disciplina, fundamentado na Psicologia Histórico-Cultural. Sem limite fixo de páginas e com escolha modular das seções.</p>' +
      '<div class="row"><div><label>Autor</label><input data-form="author" value="' + esc(f.author) + '" placeholder="Prof. Alê Barbosa"></div><div><label>Disciplina</label><input data-form="discipline" value="' + esc(f.discipline) + '" placeholder="Ex.: História"></div><div><label>Etapa de ensino</label><input data-form="level" value="' + esc(f.level) + '" placeholder="Ex.: 8º ano"></div><div><label>Tema</label><input data-form="topic" value="' + esc(f.topic) + '" placeholder="Ex.: Revolução Francesa"></div><div><label>Duração</label><input data-form="duration" value="' + esc(f.duration) + '"></div></div>' +
      '<div class="row"><div><label>Tipo de conhecimento</label><select data-form="type">' + opt('auto', 'Detectar pela disciplina', f.type === 'auto') + Object.keys(C.EPISTEMIC).map((k) => opt(k, C.EPISTEMIC[k].label, f.type === k)).join('') + '</select></div>' +
      '<div><label>O que você quer incluir?</label><select data-form="contentProfile">' + Object.keys(C.CONTENT_PROFILES).map((k) => opt(k, C.CONTENT_PROFILES[k], f.contentProfile === k)).join('') + '</select></div>' +
      '<div><label>Salvar no projeto</label><select data-form="target">' + opt('', '(criar projeto novo)', !f.target) + lib.projects.filter((p) => !p.archived).map((p) => opt(p.id, p.name, f.target === p.id)).join('') + '</select></div></div>' +
      '<label>Objetivos desejados (opcional)</label><textarea data-form="objectives" rows="2">' + esc(f.objectives) + '</textarea></div>' +
      '<div class="card steps"><h3>Caminho sem custo (recomendado)</h3>' +
      '<div class="step"><b>Copie o pedido</b> e cole no seu Gem do Gemini (ou no Claude com a skill instalada).<div class="btns"><button class="b gold" data-a="copyreq">Copiar pedido</button></div></div>' +
      '<div class="step"><b>Cole aqui o JSON</b> que ele devolveu e importe.<textarea data-form="pasted" rows="6" placeholder="Cole aqui o bloco JSON inteiro…">' + esc(f.pasted) + '</textarea><div class="btns"><button class="b" data-a="importjson">Importar material</button></div></div>' +
      '<div class="step">Revise no <b>Editor</b>, ajuste a <b>Apostila visual</b>, rode a <b>Auditoria</b> e exporte.</div></div>' +
      '<div class="card"><h3>Outras opções</h3><div class="btns"><button class="b ghost" data-a="scaffold">Criar esqueleto offline (sem IA)</button><button class="b ghost" data-a="demo">Carregar exemplo completo</button></div><p class="muted">O esqueleto offline só monta a estrutura certa para o tipo de conhecimento, com marcadores [PREENCHER]. Ele não escreve conteúdo e a auditoria o reprova até você preencher.</p></div>';
  }

  /* ---------- Editor ---------- */
  function vEditor() {
    const d = S.draft, rec = mat();
    const bc = { exemplo: '#22a559', atividade: '#f28a1f', exercicios: '#7a4bd1', gabarito: '#1e6fd9', nota: '#d6453d', acessibilidade: '#0e8f8f', problematizacao: '#f2b705' };
    let h = '<div class="card"><div class="btns" style="justify-content:space-between"><h2 style="margin:0">' + esc(d.title) + ' ' + (S.dirty ? '<span class="dirty" id="dirtymark">● alterações não salvas</span>' : '<span class="pill ok" id="dirtymark">salvo</span>') + '</h2>' +
      '<div class="btns"><button class="b gold" data-a="save">💾 Salvar nova versão</button><button class="b ghost" data-a="prev">👁️ Prévia</button><button class="b ghost" data-a="vers">🕘 Versões (' + (rec ? rec.versions.length : 0) + ')</button></div></div>';
    if (S.showPrev) h += '<iframe class="pv" sandbox="" srcdoc="' + esc(C.toHTML(d)) + '"></iframe>';
    if (S.showVers && rec) h += '<h3>Versões</h3>' + rec.versions.slice().reverse().map((v, i) => '<div class="list-item"><div>' + fmt(v.at) + ' — ' + esc(v.note || '') + ' ' + (v.vid === rec.cur ? '<span class="pill ok">atual</span>' : '') + ' ' + lvlPill(v.audit.level) + ' <span class="muted">nota ' + v.audit.score + '</span></div>' + (v.vid === rec.cur ? '' : '<button class="b ghost sm" data-a="restorever" data-v="' + v.vid + '">Restaurar como nova versão</button>') + '</div>').join('');
    h += '</div>';
    h += '<div class="card"><h3>Identificação</h3><div class="row"><div>' + inp('title', 'Título') + '</div><div>' + inp('author', 'Autor') + '</div><div>' + inp('discipline', 'Disciplina') + '</div><div>' + inp('level', 'Etapa de ensino') + '</div><div>' + inp('topic', 'Tema') + '</div><div>' + inp('duration', 'Duração') + '</div>' +
      '<div><label>Tipo de conhecimento</label><select data-f="epistemicType">' + Object.keys(C.EPISTEMIC).map((k) => '<option value="' + k + '"' + (d.epistemicType === k ? ' selected' : '') + '>' + esc(C.EPISTEMIC[k].label) + '</option>').join('') + '</select></div>' +
      '<div><label>Perfil do material</label><select data-f="contentProfile">' + Object.keys(C.CONTENT_PROFILES).map((k) => '<option value="' + k + '"' + (d.contentProfile === k ? ' selected' : '') + '>' + esc(C.CONTENT_PROFILES[k]) + '</option>').join('') + '</select></div></div>' +
      area('objectives', 'Objetivos de aprendizagem (um por linha)', 4, true) + area('prerequisites', 'Conhecimentos prévios (um por linha)', 3, true) + '</div>';
    h += '<div class="card"><h3>Blocos do material</h3>' + d.blocks.map((b, i) =>
      '<div class="blk" style="border-left-color:' + (bc[b.type] || '#14264f') + '"><div class="head"><div><label>Tipo</label><select data-f="blocks.' + i + '.type">' + Object.keys(C.BLOCK_TYPES).map((k) => '<option value="' + k + '"' + (b.type === k ? ' selected' : '') + '>' + C.BLOCK_TYPES[k][1] + ' ' + C.BLOCK_TYPES[k][0] + '</option>').join('') + '</select></div><div>' + inp('blocks.' + i + '.title', 'Título do bloco') + '</div>' +
      '<div class="btns"><button class="b ghost sm" data-a="bup" data-i="' + i + '" title="Subir">↑</button><button class="b ghost sm" data-a="bdn" data-i="' + i + '" title="Descer">↓</button><button class="b danger sm" data-a="bdel" data-i="' + i + '" title="Remover">✕</button></div></div>' +
      area('blocks.' + i + '.content', 'Conteúdo (Markdown simples: # título, **negrito**, listas, tabelas, $fórmula$)', 7) +
      '<details' + (b.svg ? ' open' : '') + '><summary>Figura SVG ' + (b.svg ? '(com figura)' : '(sem figura)') + '</summary><textarea rows="4" data-f="blocks.' + i + '.svg" placeholder="Cole aqui um SVG ou use “Inserir figura” abaixo">' + esc(b.svg) + '</textarea>' + (b.svg ? '<div class="preview">' + C.sanitizeSvg(b.svg) + '</div>' : '') + '</details></div>').join('') +
      '<div class="btns"><select id="newtype" style="width:auto">' + Object.keys(C.BLOCK_TYPES).map((k) => '<option value="' + k + '">' + C.BLOCK_TYPES[k][0] + '</option>').join('') + '</select><button class="b" data-a="addblock">+ Adicionar bloco</button></div></div>';
    h += '<div class="card"><h3>Inserir figura (gerada offline)</h3><div class="row"><div><label>Tipo de figura</label><select data-vis="kind">' + [['numberLine', 'Reta numérica'], ['timeline', 'Linha do tempo'], ['flow', 'Fluxograma'], ['conceptMap', 'Mapa conceitual']].map((x) => '<option value="' + x[0] + '"' + (S.vis.kind === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div><div><label>Título da figura</label><input data-vis="title" value="' + esc(S.vis.title) + '"></div></div>' +
      '<label>Dados</label><textarea data-vis="text" rows="4">' + esc(S.vis.text) + '</textarea><p class="muted" id="vishelp">' + visHelp(S.vis.kind) + '</p><div class="btns"><button class="b" data-a="addvis">+ Inserir como bloco visual</button></div></div>';
    h += '<div class="card"><h3>Referências</h3><p class="muted">Nunca invente referências. Marque o nível de acesso real: só "integral" se leu a obra inteira.</p>' + d.references.map((r, i) =>
      '<div class="blk"><div class="row"><div>' + inp('references.' + i + '.authors', 'Autor(es)') + '</div><div>' + inp('references.' + i + '.title', 'Título') + '</div><div>' + inp('references.' + i + '.year', 'Ano') + '</div><div>' + inp('references.' + i + '.venue', 'Periódico/editora') + '</div><div>' + inp('references.' + i + '.doi', 'DOI') + '</div><div>' + inp('references.' + i + '.url', 'URL') + '</div>' +
      '<div><label>Nível de acesso</label><select data-f="references.' + i + '.accessLevel">' + ['integral', 'parcial', 'resumo', 'metadados', 'localizada', 'nao-verificado'].map((k) => '<option' + (r.accessLevel === k ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></div><div><label><input type="checkbox" style="width:auto" data-f="references.' + i + '.verified"' + (r.verified ? ' checked' : '') + '> verificada por mim</label></div></div><div class="btns"><button class="b danger sm" data-a="delref" data-i="' + i + '">Remover referência</button></div></div>').join('') +
      '<div class="btns"><button class="b ghost" data-a="addref">+ Adicionar referência</button></div>' + area('limitations', 'Limitações documentais (uma por linha)', 3, true) + '</div>';
    return h;
  }
  function visHelp(k) {
    return { numberLine: 'Formato: mínimo, máximo, saltoDe, saltoPor. Ex.: -6, 6, -2, 5 (deixe só "-6, 6" para reta sem salto).', timeline: 'Uma linha por evento: ano | descrição. Ex.: 1789 | Revolução Francesa', flow: 'Uma etapa por linha.', conceptMap: 'Primeira linha: tema central. Demais linhas: conceitos ligados a ele.' }[k];
  }
  function buildVis() {
    const t = S.vis.text.split('\n').map((x) => x.trim()).filter(Boolean), title = S.vis.title.trim();
    if (S.vis.kind === 'numberLine') { const n = (t[0] || '').split(/[,;\s]+/).map(Number); if (n.length < 2 || n.some(isNaN) || n[1] <= n[0]) return null; return C.VISUALS.numberLine({ min: n[0], max: n[1], jump: n.length >= 4 ? { from: n[2], by: n[3] } : null, title }); }
    if (S.vis.kind === 'timeline') { const ev = t.map((l) => { const [a, ...b] = l.split('|'); return { when: (a || '').trim(), label: b.join('|').trim() }; }).filter((e) => e.when && e.label); return ev.length >= 2 ? C.VISUALS.timeline({ events: ev, title }) : null; }
    if (S.vis.kind === 'flow') return t.length >= 2 ? C.VISUALS.flow({ steps: t, title }) : null;
    return t.length >= 3 ? C.VISUALS.conceptMap({ center: t[0], nodes: t.slice(1), title }) : null;
  }

  /* ---------- Apostila visual ---------- */
  function vPoster() {
    const d = S.draft, p = d.poster;
    if (!p) return '<div class="card empty"><h2>Este material ainda não tem apostila visual</h2><p>A apostila visual é o pôster de uma página com caixas numeradas, dicas e resumo.</p><button class="b gold" data-a="mkposter">Criar apostila visual</button></div>';
    const L = C.EPISTEMIC[d.epistemicType].labels;
    return '<div class="two"><div class="card"><h2>Apostila visual</h2><p class="muted">Textos curtos (até uns 25 palavras por caixa) ficam melhores no pôster e na IA de imagem.</p>' +
      '<label>Tema de cores</label><select data-f="poster.theme">' + Object.keys(C.POSTER_THEMES).map((k) => '<option value="' + k + '"' + (p.theme === k ? ' selected' : '') + '>' + esc(C.POSTER_THEMES[k].nome) + '</option>').join('') + '</select>' +
      inp('poster.title', 'Título do pôster') + inp('poster.subtitle', 'Subtítulo') + inp('poster.author', 'Autor na capa', C.DEFAULT_AUTHOR) + inp('poster.mascot', 'Mascote (descrição para a IA de imagem)', 'Ex.: estudante sorridente de mochila azul') +
      '<h3>Caixas numeradas</h3>' + p.sections.map((s, i) => '<div class="blk"><div class="row"><div>' + inp('poster.sections.' + i + '.label', 'Rótulo ' + (i + 1), L[i] || '') + '</div><div>' + inp('poster.sections.' + i + '.title', 'Subtítulo (opcional)') + '</div></div>' + area('poster.sections.' + i + '.text', 'Texto', 3) + '<button class="b danger sm" data-a="delsec" data-i="' + i + '">Remover caixa</button></div>').join('') +
      (p.sections.length < 6 ? '<div class="btns"><button class="b ghost" data-a="addsec">+ Caixa numerada</button></div>' : '') +
      '<h3>Caixas extras</h3>' + inp('poster.goldTip', '💡 Dica de ouro') + inp('poster.didYouKnow', 'Você sabia?') + inp('poster.attention', '⚠️ Atenção aos detalhes') +
      '<h3>Faixa “Em resumo”</h3>' + p.summary.map((s, i) => '<div class="row"><div>' + inp('poster.summary.' + i + '.icon', 'Ícone (emoji)') + '</div><div>' + inp('poster.summary.' + i + '.label', 'Rótulo') + '</div><div>' + inp('poster.summary.' + i + '.text', 'Texto') + '</div><div><label>&nbsp;</label><button class="b danger sm" data-a="delsum" data-i="' + i + '">✕</button></div></div>').join('') +
      (p.summary.length < 5 ? '<div class="btns"><button class="b ghost" data-a="addsum">+ Item</button></div>' : '') + '</div>' +
      '<div><div class="card"><h3>Prévia</h3><div id="posterPreview" class="preview">' + C.renderPoster(p, d.author) + '</div></div>' +
      '<div class="card"><h3>Versão ilustrada com IA</h3><p class="muted">Copie o prompt, abra o Gemini (Nano Banana) e cole. O formato da imagem você escolhe no próprio app. IA de imagem às vezes erra letras: confira o texto na imagem. O pôster em HTML ao lado é sempre a versão exata.</p><div class="btns"><button class="b gold" data-a="copyimg">Copiar prompt da imagem</button><button class="b ghost" data-a="dlposter">Baixar pôster (HTML)</button><button class="b ghost" data-a="printposter">Imprimir / PDF</button></div><details><summary>Ver o prompt</summary><pre class="code">' + esc(C.buildImagePrompt(d)) + '</pre></details></div></div></div>';
  }

  /* ---------- Auditoria ---------- */
  function vAud() {
    const d = S.draft, a = C.audit(d), tr = d.meta.teacherReview;
    return '<div class="card"><h2>Auditoria de qualidade</h2><div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap"><div><div class="score">' + a.score + '</div><span class="muted">de 100 · ' + a.words + ' palavras</span></div><div>' + lvlPill(a.level) + '<p class="muted" style="max-width:520px">' + esc(a.note) + '</p></div></div></div>' +
      (a.hard.length ? '<div class="card" style="border-color:var(--bad)"><h3 style="color:var(--bad)">Falhas graves (' + a.hard.length + ')</h3>' + a.hard.map((x) => '<div class="find hard">⛔ <b>' + esc(x.cat) + ':</b> ' + esc(x.msg) + '</div>').join('') + '</div>' : '') +
      '<div class="card"><h3>10 categorias</h3>' + a.categories.map((c) => '<div class="cat"><span>' + esc(c.name) + '</span><div class="bar"><i style="width:' + c.score * 10 + '%;background:' + (c.score >= 8 ? 'var(--ok)' : c.score >= 5 ? 'var(--warn)' : 'var(--bad)') + '"></i></div><b>' + c.score + '</b></div>' + c.findings.map((f) => '<div class="find ' + f.sev + '">' + (f.sev === 'hard' ? '⛔' : f.sev === 'warn' ? '⚠️' : 'ℹ️') + ' ' + esc(f.msg) + '</div>').join('')).join('') + '</div>' +
      '<div class="card"><h3>Revisão do professor</h3><p class="muted">A auditoria automática não confirma se o conteúdo está certo. Só você faz isso.</p><label><input type="checkbox" style="width:auto" data-a="review" ' + (tr && tr.done ? 'checked' : '') + '> Revisei o conteúdo e assumo a validação final' + (tr && tr.at ? ' (em ' + fmt(tr.at) + ')' : '') + '</label><p class="muted">Salve uma nova versão para registrar a revisão.</p></div>';
  }

  /* ---------- Apostila completa ---------- */
  function vApostila() {
    const d = S.draft;
    const pg = (C.toApostila(d).match(/class="mlpage/g) || []).length;
    return '<div class="card"><h2>Apostila completa</h2><p class="muted">Capa (pôster) + miolo em páginas A4 com o mesmo visual: ' + pg + ' páginas neste material. O miolo é montado a partir dos blocos do Editor; o texto aqui é o exato, sem IA de imagem. Para PDF, use “Imprimir apostila” e escolha “Salvar como PDF”.</p>' +
      '<div class="btns"><button class="b gold" data-a="dlbook">📘 Baixar apostila (HTML)</button><button class="b" data-a="printbook">🖨️ Imprimir / salvar PDF</button></div></div>' +
      '<div class="card"><iframe id="bookFrame" title="Prévia da apostila completa" style="width:100%;height:78vh;border:0;border-radius:10px;background:#e9edf5" srcdoc="' + esc(C.toApostila(d)) + '"></iframe></div>';
  }

  /* ---------- Exportar ---------- */
  function vExp() {
    const d = S.draft, svgs = d.blocks.map((b, i) => [b, i]).filter((x) => x[0].svg);
    return '<div class="card"><h2>Exportar</h2><p class="muted">Exporta o que está no Editor agora (mesmo sem salvar).</p><div class="btns"><button class="b gold" data-a="dlbook">📘 Apostila completa (capa + miolo)</button><button class="b" data-a="printbook">🖨️ Imprimir apostila / salvar PDF</button><button class="b ghost" data-a="dlhtml">📄 Material em HTML simples</button><button class="b ghost" data-a="printall">🖨️ Imprimir material simples</button><button class="b ghost" data-a="dlposter">🖼️ Só o pôster (HTML)</button><button class="b ghost" data-a="dlmd">Markdown</button><button class="b ghost" data-a="dljson">JSON (para reimportar)</button></div>' +
      (svgs.length ? '<h3>Figuras SVG</h3><div class="btns">' + svgs.map((x) => '<button class="b ghost sm" data-a="dlsvg" data-i="' + x[1] + '">' + esc(x[0].title) + '.svg</button>').join('') + '</div>' : '') +
      '<p class="muted">Para PDF: use “Imprimir / salvar PDF” e escolha “Salvar como PDF” no navegador. Word e PowerPoint ainda não estão nesta versão.</p></div>';
  }

  /* ---------- Ajuda ---------- */
  function vAjuda() {
    return '<div class="card steps"><h2>Como usar</h2>' +
      '<div class="step"><b>Gemini Pro (Gem):</b> em gemini.google.com, abra “Gems” → “Novo Gem”, cole o texto do arquivo <code>gemini/GEM_INSTRUCOES.md</code> nas instruções e salve com o nome “MathLab”.</div>' +
      '<div class="step"><b>Claude:</b> instale a skill <code>mathlab-aulas-visuais</code> (arquivo <code>skill/SKILL.md</code>).</div>' +
      '<div class="step">Aqui em <b>Criar</b>: preencha o pedido, copie, cole no Gem, copie o JSON que ele devolver e importe.</div>' +
      '<div class="step">Em <b>Apostila visual</b>: copie o prompt e gere a imagem ilustrada no Nano Banana (Gemini). O pôster em HTML já fica pronto para imprimir.</div>' +
      '<div class="step"><b>Publicar no GitHub Pages:</b> suba esta pasta num repositório, em Settings → Pages escolha “GitHub Actions”. O arquivo <code>.github/workflows/pages.yml</code> já está pronto.</div></div>' +
      '<div class="card"><h3>Limites desta versão</h3><ul><li>Não escreve conteúdo sozinho: a IA vem da skill/Gem.</li><li>Exporta HTML, PDF (pelo navegador), Markdown, JSON e SVG. Word e PowerPoint ficam para a próxima etapa.</li><li>Dados ficam só neste navegador: faça backup na Biblioteca.</li></ul></div>';
  }

  /* ---------- ações ---------- */
  const A = {
    tab: (el) => { S.tab = el.dataset.t; render(); },
    openproj: (el) => { S.pid = el.dataset.id; render(); },
    closeproj: () => { S.pid = null; render(); },
    toggleArch: (el) => { S.showArch = el.checked; render(); },
    newproj: () => { const p = newProject($('#np-name').value.trim(), $('#np-disc').value.trim(), $('#np-level').value.trim()); persist(); S.pid = p.id; render(); },
    dupproj: (el) => {
      const p = proj(el.dataset.id), c = C.clone(p); c.id = C.uid('p'); c.name += ' (cópia)'; c.materials.forEach((r) => { r.id = C.uid('m'); }); logp(c, 'Duplicado de "' + p.name + '"');
      lib.projects.unshift(c); persist(); S.pid = c.id; render(); toast('Projeto duplicado.');
    },
    arch: (el) => { const p = proj(el.dataset.id); p.archived = !p.archived; logp(p, p.archived ? 'Arquivado' : 'Desarquivado'); persist(); S.pid = null; render(); },
    delproj: (el) => {
      const p = proj(el.dataset.id);
      if (!confirm('Excluir o projeto "' + p.name + '" e seus ' + p.materials.length + ' material(is)? Um backup dele será baixado antes.')) return;
      const t = prompt('Para confirmar, digite o nome do projeto:\n' + p.name); if (t !== p.name) { toast('Nome diferente. Nada foi excluído.', true); return; }
      dl('backup-' + slug(p.name) + '.json', 'application/json', JSON.stringify({ app: 'mathlab', version: 2, projects: [p] }, null, 2));
      lib.projects = lib.projects.filter((x) => x !== p); if (S.pid === p.id) { S.pid = null; S.mid = null; S.draft = null; S.dirty = false; } persist(); render();
    },
    openmat: (el) => openMat(el.dataset.p, el.dataset.m),
    dupmat: (el) => { const p = proj(), r = p.materials.find((x) => x.id === el.dataset.m), c = C.clone(r); c.id = C.uid('m'); const d = curData(c); d.title += ' (cópia)'; p.materials.unshift(c); logp(p, 'Material duplicado'); persist(); render(); },
    delmat: (el) => { const p = proj(), r = p.materials.find((x) => x.id === el.dataset.m); if (!confirm('Excluir "' + curData(r).title + '" com todas as versões? Isso não pode ser desfeito.')) return; p.materials = p.materials.filter((x) => x !== r); if (S.mid === r.id) { S.draft = null; S.mid = null; S.dirty = false; } logp(p, 'Material excluído'); persist(); render(); },
    backup: () => dl('mathlab-backup-' + new Date().toISOString().slice(0, 10) + '.json', 'application/json', JSON.stringify({ app: 'mathlab', version: 2, projects: lib.projects }, null, 2)),
    restore: (el) => {
      const f = el.files[0]; if (!f) return;
      const rd = new FileReader(); rd.onload = () => {
        try { const j = JSON.parse(rd.result); if (!Array.isArray(j.projects)) throw new Error('arquivo sem projetos'); let n = 0; j.projects.forEach((p) => { if (!lib.projects.some((x) => x.id === p.id)) { lib.projects.push(p); n++; } }); persist(); render(); toast(n + ' projeto(s) restaurado(s); os que já existiam foram mantidos.'); }
        catch (e) { toast('Backup inválido: ' + e.message, true); }
      }; rd.readAsText(f);
    },
    copyreq: async () => { const t = C.buildRequestText(S.form); toast((await copy(t)) ? 'Pedido copiado. Cole no seu Gem ou no Claude.' : 'Não consegui copiar automaticamente.', false); },
    importjson: () => {
      const r = C.importFromText(S.form.pasted); if (!r.ok) { toast(r.error, true); return; }
      const m = r.material; const p = (S.form.target && proj(S.form.target)) || newProject(m.discipline || m.title, m.discipline, m.level);
      const rec = addMaterial(p, m, 'Importado da skill'); toast('Material importado.' + (r.warnings.length ? ' ' + r.warnings.join(' ') : '')); S.form.pasted = ''; openMat(p.id, rec.id);
    },
    scaffold: () => {
      if (!S.form.topic.trim()) { toast('Preencha ao menos o tema.', true); return; }
      const m = C.scaffold(S.form); const p = (S.form.target && proj(S.form.target)) || newProject(m.discipline || m.title, m.discipline, m.level);
      const rec = addMaterial(p, m, 'Esqueleto offline'); openMat(p.id, rec.id);
    },
    demo: () => { let p = lib.projects.find((x) => x.name === 'Exemplos'); if (!p) { p = newProject('Exemplos', 'Matemática', '7º ano'); } const rec = addMaterial(p, C.demo(), 'Exemplo carregado'); openMat(p.id, rec.id); },
    save: saveDraft,
    prev: () => { S.showPrev = !S.showPrev; render(); },
    vers: () => { S.showVers = !S.showVers; render(); },
    restorever: (el) => { const rec = mat(), v = rec.versions.find((x) => x.vid === el.dataset.v); S.draft = C.clone(v.data); pushVersion(rec, S.draft, 'Restaurada de ' + fmt(v.at)); logp(proj(), 'Versão restaurada'); persist(); S.dirty = false; toast('Versão restaurada como nova versão. Nada foi apagado.'); render(); },
    bup: (el) => { const i = +el.dataset.i, b = S.draft.blocks; if (i > 0) { [b[i - 1], b[i]] = [b[i], b[i - 1]]; S.dirty = true; render(); } },
    bdn: (el) => { const i = +el.dataset.i, b = S.draft.blocks; if (i < b.length - 1) { [b[i + 1], b[i]] = [b[i], b[i + 1]]; S.dirty = true; render(); } },
    bdel: (el) => { if (confirm('Remover este bloco? (Você pode recuperar pela versão anterior.)')) { S.draft.blocks.splice(+el.dataset.i, 1); S.dirty = true; render(); } },
    addblock: () => { const t = $('#newtype').value; S.draft.blocks.push({ id: C.uid('b'), type: t, title: C.BLOCK_TYPES[t][0], content: '', svg: '' }); S.dirty = true; render(); },
    addvis: () => {
      const svg = buildVis(); if (!svg) { toast('Dados insuficientes para esta figura. Veja o formato abaixo do campo.', true); return; }
      const desc = (svg.match(/<desc[^>]*>([^<]*)<\/desc>/) || [])[1] || '';
      S.draft.blocks.push({ id: C.uid('b'), type: 'visual', title: S.vis.title.trim() || 'Figura', content: desc.replace(/&amp;/g, '&'), svg }); S.dirty = true; render(); toast('Figura inserida no fim do material. Use ↑ para posicionar.');
    },
    addref: () => { S.draft.references.push({ authors: '', title: '', year: '', venue: '', doi: '', url: '', accessLevel: 'nao-verificado', verified: false }); S.dirty = true; render(); },
    delref: (el) => { S.draft.references.splice(+el.dataset.i, 1); S.dirty = true; render(); },
    mkposter: () => { const L = C.EPISTEMIC[S.draft.epistemicType].labels; S.draft.poster = { title: S.draft.title, subtitle: '', mascot: '', sections: L.map((l) => ({ label: l, title: '', text: '' })), goldTip: '', didYouKnow: '', attention: '', summary: [], theme: 'alegre' }; S.dirty = true; render(); },
    addsec: () => { S.draft.poster.sections.push({ label: 'Nova caixa', title: '', text: '' }); S.dirty = true; render(); },
    delsec: (el) => { S.draft.poster.sections.splice(+el.dataset.i, 1); S.dirty = true; render(); },
    addsum: () => { S.draft.poster.summary.push({ icon: '⭐', label: '', text: '' }); S.dirty = true; render(); },
    delsum: (el) => { S.draft.poster.summary.splice(+el.dataset.i, 1); S.dirty = true; render(); },
    copyimg: async () => { toast((await copy(C.buildImagePrompt(S.draft))) ? 'Prompt copiado. Cole no Gemini (Nano Banana).' : 'Não consegui copiar automaticamente.'); },
    dlbook: () => dl(slug(S.draft.title) + '-apostila-completa.html', 'text/html', C.toApostila(S.draft)),
    printbook: () => printHTML(C.toApostila(S.draft)),
    dlposter: () => dl(slug(S.draft.title) + '-apostila-visual.html', 'text/html', C.toHTML(S.draft, { material: false })),
    printposter: () => printHTML(C.toHTML(S.draft, { material: false })),
    dlhtml: () => dl(slug(S.draft.title) + '.html', 'text/html', C.toHTML(S.draft)),
    printall: () => printHTML(C.toHTML(S.draft)),
    dlmd: () => dl(slug(S.draft.title) + '.md', 'text/markdown', C.toMarkdown(S.draft)),
    dljson: () => dl(slug(S.draft.title) + '.json', 'application/json', JSON.stringify(C.normalize(S.draft), null, 2)),
    dlsvg: (el) => { const b = S.draft.blocks[+el.dataset.i]; dl(slug(b.title) + '.svg', 'image/svg+xml', C.sanitizeSvg(b.svg)); },
    review: (el) => { S.draft.meta.teacherReview = el.checked ? { done: true, at: new Date().toISOString() } : { done: false }; S.dirty = true; render(); },
  };

  document.addEventListener('click', (e) => { const el = e.target.closest('[data-a]'); if (!el || el.type === 'checkbox' || el.type === 'file') return; if (A[el.dataset.a]) A[el.dataset.a](el, e); });
  document.addEventListener('change', (e) => { const el = e.target; if ((el.type === 'checkbox' || el.type === 'file') && el.dataset.a && A[el.dataset.a]) A[el.dataset.a](el, e); else if (el.dataset.vis === 'kind') { S.vis.kind = el.value; S.vis.text = { numberLine: '-6, 6, -2, 5', timeline: '1789 | Revolução Francesa\n1822 | Independência do Brasil', flow: 'Observar\nFormular hipótese\nTestar\nConcluir', conceptMap: 'Tema central\nConceito A\nConceito B\nConceito C' }[el.value]; render(); } });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.form) { S.form[el.dataset.form] = el.value; return; }
    if (el.dataset.vis) { if (el.dataset.vis !== 'kind') S.vis[el.dataset.vis] = el.value; return; }
    if (el.dataset.f) {
      setPath(el.dataset.f, el.type === 'checkbox' ? el.checked : el.dataset.lines ? el.value.split('\n').map((x) => x.trim()).filter(Boolean) : el.value);
      S.dirty = true; const m = $('#dirtymark'); if (m) { m.className = 'dirty'; m.textContent = '● alterações não salvas'; }
      if (S.tab === 'poster' && S.draft.poster) { const pv = $('#posterPreview'); if (pv) pv.innerHTML = C.renderPoster(S.draft.poster, S.draft.author); }
    }
  });
  window.addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

  const st = document.createElement('style'); st.textContent = C.POSTER_CSS; document.head.appendChild(st);
  $('#ver').textContent = 'v' + C.VERSION;
  render();
  window.__mathlab = { S, lib: () => lib, A, render };
})();
