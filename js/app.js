/* MathLab Aulas Visuais — interface. Tudo roda no navegador; nada é enviado a servidor algum. */
(function () {
  'use strict';
  const C = window.MathLabCore, esc = C.esc, D = window.MathLabDominios || null, LV = window.MathLabLivro || null, FT = window.MathLabFontes || null;
  const KEY = 'mathlab.lib.v2';
  const $ = (s, r) => (r || document).querySelector(s);

  /* ---------- armazenamento ---------- */
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && Array.isArray(j.projects)) return j; } catch (e) { /* ignora */ } return { projects: [] }; }
  let lib = load();
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(lib)); return true; }
    catch (e) { toast('Não consegui salvar no navegador (espaço cheio ou bloqueado). Baixe um backup na Biblioteca.', true); return false; }
  }

  const S = { tab: lib.projects.length ? 'biblioteca' : 'criar', pid: null, mid: null, draft: null, dirty: false, isPreviewExample: false, flowStep: 1, libQuery: '', showPrev: false, showVers: false, showArch: false,
    diario: (() => { try { return JSON.parse(localStorage.getItem('mathlab.diario.v1') || 'null'); } catch (e) { return null; } })(),
    book: { sel: [], title: '', subtitle: '', author: '', glossary: true, answers: true, references: true, show: false },
    form: { author: C.DEFAULT_AUTHOR, discipline: '', level: '', topic: '', duration: '1 aula de 50 minutos', objectives: '', type: 'auto', contentProfile: 'completo', sections: C.PROFILE_SECTIONS.completo.slice(), stageOverride: 'auto', registro: 'escolar', destinatario: 'estudante', target: '', pasted: '', lastPedido: '', domainId: '', domainResp: '', srcSel: [], srcDraft: { title: '', authors: '', year: '', venue: '', url: '', text: '', access: 'PARTIAL' } }, vis: { kind: 'numberLine', text: '-6, 6, -2, 5', title: '' } };

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
    S.pid = pid; S.mid = mid; S.isPreviewExample = false; S.draft = C.clone(curData(proj(pid).materials.find((m) => m.id === mid))); S.dirty = false; S.tab = 'editor'; render();
  }
  let autoTimer = null;
  function scheduleAutosave() {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      const rec = mat(); if (!rec || !S.draft) return;
      try { localStorage.setItem('mathlab.autosave.v1', JSON.stringify({ pid: S.pid, mid: S.mid, at: new Date().toISOString(), draft: S.draft })); } catch (e) { /* ignora */ }
      const m = $('#dirtymark'); if (m) { m.className = 'pill ok'; m.textContent = '✓ rascunho salvo automaticamente'; }
    }, 1200);
  }
  function saveDraft() {
    if (S.isPreviewExample && S.draft) { A.savepreviewdemo(); return; }
    const rec = mat(); if (!rec) return;
    S.draft = C.normalize(S.draft); pushVersion(rec, S.draft, 'Edição ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
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
  const assetCache = {};
  async function fetchDataUri(path) {
    if (assetCache[path]) return assetCache[path];
    try {
      const res = await fetch(path); if (!res.ok) return null;
      const blob = await res.blob();
      const uri = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(null); r.readAsDataURL(blob); });
      if (uri) assetCache[path] = uri;
      return uri;
    } catch (e) { return null; }
  }
  async function inlineAssets(html) {
    const matches = Array.from(new Set((html.match(/src="(assets\/[^"]+)"/g) || []).map((s) => s.slice(5, -1))));
    let out = html;
    for (const p of matches) {
      const uri = await fetchDataUri(p);
      if (uri) out = out.split('src="' + p + '"').join('src="' + uri + '"');
    }
    return out;
  }
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), S.draft);
  function setPath(path, val) { const k = path.split('.'); let o = S.draft; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = val; }
  const fid = (path) => 'f_' + path.replace(/[^a-zA-Z0-9_]/g, '_');
  const inp = (path, label, ph) => '<label for="' + fid(path) + '">' + label + '</label><input id="' + fid(path) + '" data-f="' + path + '" value="' + esc(get(path)) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>';
  const area = (path, label, rows, lines) => '<label for="' + fid(path) + '">' + label + '</label><textarea id="' + fid(path) + '" rows="' + (rows || 4) + '" data-f="' + path + '"' + (lines ? ' data-lines="1"' : '') + '>' + esc(lines ? (get(path) || []).join('\n') : get(path)) + '</textarea>';
  const lvlPill = (l) => '<span class="pill ' + (/Reprovado/.test(l) ? 'bad' : /Pronto/.test(l) ? 'ok' : 'warn') + '">' + esc(l) + '</span>';

  /* ---------- navegação em 3 grupos + estados vazios que ensinam ---------- */
  const GROUPS = {
    criar: {
      label: 'Criar',
      desc: '<strong>Criar</strong> — monte o pedido, gere com a IA externa e importe o JSON. As abas de Revisar abrem quando houver um material.',
      tabs: [['criar', '✨ Criar'], ['plano', '🧭 Plano por unidades']]
    },
    revisar: {
      label: 'Revisar',
      desc: '<strong>Revisar</strong> — ferramentas sobre o material aberto (edição, capa, apostila A4, auditoria e exportação).',
      tabs: [['editor', '✏️ Editor'], ['poster', '🖼️ Capa (pôster)'], ['apostila', '📘 Apostila completa'], ['auditoria', '🔍 Auditoria'], ['exportar', '📤 Exportar']]
    },
    organizar: {
      label: 'Organizar',
      desc: '<strong>Organizar</strong> — sua biblioteca de projetos, compilação de livros e diário docente.',
      tabs: [['biblioteca', '📚 Biblioteca'], ['livro', '📖 Livro'], ['diario', '📒 Diário & Portfólio']]
    }
  };
  const NEED = ['editor', 'poster', 'apostila', 'auditoria', 'exportar'];
  const EMPTY_HELP = {
    editor: ['O Editor', 'organiza o material em blocos editáveis, histórico de versões e validação humana do professor.'],
    poster: ['A Capa (pôster)', 'monta a capa visual da apostila com caixas numeradas, destaque e prompt de imagem.'],
    apostila: ['A Apostila completa', 'junta capa e miolo paginado em A4 com sumário, blocos didáticos e referências.'],
    auditoria: ['A Auditoria', 'confere o material em 10 categorias e aponta o que verificar — sem nunca aprovar por você.'],
    exportar: ['Exportar', 'gera HTML, JSON (mathlab.material/2), Markdown e SVGs diretamente no navegador.']
  };
  function groupOf(tab) {
    if (tab === 'criar' || tab === 'plano') return 'criar';
    if (NEED.includes(tab)) return 'revisar';
    return 'organizar';
  }
  function emptyStateFor(tab) {
    const info = EMPTY_HELP[tab] || ['Esta ferramenta', 'trabalha sobre um material aberto.'];
    return '<div class="card empty"><h2>Nenhum material aberto</h2><p><b>' + info[0] + '</b> ' + info[1] + '</p>' +
      '<div class="btns"><button class="b gold" data-a="previewdemo">👁️ Ver exemplo completo (sem salvar)</button><button class="b ghost" data-a="tab" data-t="criar">Ir para Criar</button><button class="b ghost" data-a="tab" data-t="biblioteca">Biblioteca</button></div></div>';
  }
  function exampleBannerHtml() {
    if (!S.isPreviewExample || !S.draft) return '';
    return '<div class="example-banner" role="status"><p>👁️ Você está explorando o <b>exemplo completo</b> sem alterar sua Biblioteca. Salve se quiser transformar em projeto seu.</p>' +
      '<div class="btns" style="margin:0"><button class="b sm gold" data-a="savepreviewdemo">Salvar na minha Biblioteca</button><button class="b sm ghost" data-a="exitpreviewdemo">Sair do exemplo</button></div></div>';
  }
  function continueStripHtml() {
    if (S.draft && S.tab !== 'editor') {
      return '<div class="continue-strip"><p><b>Continuar de onde parei:</b> “' + esc(S.draft.title) + '” está aberto' + (S.isPreviewExample ? ' (exemplo)' : '') + '.</p><button class="b sm" data-a="tab" data-t="editor">Continuar no Editor</button></div>';
    }
    if (!S.draft && S.form.lastPedido && S.tab !== 'criar') {
      return '<div class="continue-strip"><p><b>Continuar de onde parei:</b> seu último pedido está salvo na aba Criar esperando o JSON da IA.</p><button class="b sm gold" data-a="tab" data-t="criar">Voltar ao pedido</button></div>';
    }
    if (!S.draft && lib.projects.length && lib.projects[0].materials.length && S.tab === 'criar') {
      const p0 = lib.projects[0], m0 = p0.materials[0], d0 = curData(m0);
      return '<div class="continue-strip"><p><b>Último material da Biblioteca:</b> “' + esc(d0.title) + '” (' + esc(p0.name) + ').</p><button class="b sm" data-a="openmat" data-p="' + p0.id + '" data-m="' + m0.id + '">Continuar no Editor</button></div>';
    }
    return '';
  }

  function render() {
    const activeGroup = groupOf(S.tab);
    const gEl = $('#groups');
    if (gEl) {
      gEl.innerHTML = Object.keys(GROUPS).map((g) => '<button class="group-btn" type="button" role="tab" aria-selected="' + (activeGroup === g && S.tab !== 'ajuda' ? 'true' : 'false') + '" data-a="group" data-g="' + g + '">' + GROUPS[g].label + ' <span class="gcount">' + GROUPS[g].tabs.length + '</span></button>').join('');
    }
    const gdEl = $('#groupDesc');
    if (gdEl) gdEl.innerHTML = S.tab === 'ajuda' ? '<strong>Ajuda</strong> — como instalar o Gem/Skill, gerar PDF acessível e usar o contrato mathlab.material/2.' : GROUPS[activeGroup].desc;

    $('#tabs').innerHTML = GROUPS[activeGroup].tabs.map((t) => {
      const locked = NEED.includes(t[0]) && !S.draft;
      return '<button id="tab-' + t[0] + '" class="subtab' + (S.tab === t[0] ? ' on' : '') + (locked ? ' locked' : '') + '" role="tab" aria-selected="' + (S.tab === t[0] ? 'true' : 'false') + '" data-a="tab" data-t="' + t[0] + '"' + (locked ? ' title="Precisa de um material aberto — clique para ver o que faz ou abrir o exemplo"' : '') + '>' + t[1] + (locked ? ' 🔒' : '') + '</button>';
    }).join('');

    const v = { biblioteca: vBib, criar: vCriar, plano: vPlano, livro: vLivro, editor: vEditor, poster: vPoster, apostila: vApostila, auditoria: vAud, exportar: vExp, diario: vDiario, ajuda: vAjuda }[S.tab];
    const main = $('#main');
    main.setAttribute('role', 'tabpanel');
    main.setAttribute('aria-labelledby', 'tab-' + S.tab);
    const body = NEED.includes(S.tab) && !S.draft ? emptyStateFor(S.tab) : v();
    main.innerHTML = exampleBannerHtml() + continueStripHtml() + body;
  }

  /* ---------- Plano por unidades ---------- */
  function curPlan() { const ps = lib.plans || []; return ps.find((x) => x.id === S.planId) || ps[0] || null; }
  function vPlano() {
    const f = S.form, plans = lib.plans || [], bp = curPlan();
    let h = '<div class="card"><h2>Plano por unidades</h2><p class="muted">Para materiais grandes: primeiro o plano, que você aprova; depois uma unidade por vez, sempre dentro do que foi aprovado.</p>' +
      '<div class="step"><b>1. Peça o plano ao Gem.</b> Usa a disciplina, etapa, tema e duração da aba Criar.<div class="row"><div><label for="pl-disc">Disciplina</label><input id="pl-disc" data-form="discipline" value="' + esc(f.discipline || '') + '"></div><div><label for="pl-lvl">Etapa</label><input id="pl-lvl" data-form="level" value="' + esc(f.level || '') + '"></div></div>' +
      '<div class="row"><div><label for="pl-top">Tema</label><input id="pl-top" data-form="topic" value="' + esc(f.topic || '') + '"></div><div><label for="pl-dur">Duração</label><input id="pl-dur" data-form="duration" value="' + esc(f.duration || '') + '"></div></div>' +
      '<div class="btns"><button class="b gold" data-a="copyplanreq">Copiar pedido de plano</button></div></div>' +
      '<div class="step"><b>2. Cole o plano que ele devolveu.</b><textarea data-form="planoResp" id="pl-resp" rows="5" placeholder="Cole o JSON mathlab.blueprint/1…">' + esc(f.planoResp || '') + '</textarea><div class="btns"><button class="b" data-a="importplan">Importar plano</button></div></div>';
    if (plans.length) h += '<label for="pl-sel">Plano em andamento</label><select id="pl-sel" data-form-plan="1">' + plans.map((x) => '<option value="' + esc(x.id) + '"' + (bp && bp.id === x.id ? ' selected' : '') + '>' + esc(x.title || x.topic || 'Plano') + '</option>').join('') + '</select>';
    h += '</div>';
    if (!bp) return h;
    const e = C.estadoBlueprint(bp), prox = C.proximaUnidade(bp);
    h += '<div class="card" id="card-plano"><h3>' + esc(bp.title) + '</h3><p><span class="pill ' + (e.aprovado ? 'ok' : 'warn') + '" id="plano-estado">' + esc(e.texto) + '</span></p>' +
      '<ol class="units">' + bp.units.map((u, i) => {
        const feito = bp.progress && bp.progress[u.id];
        return '<li><b>' + esc(u.id) + '</b> ' + (feito ? '<span class="pill ok">gerada</span>' : prox && prox.id === u.id ? '<span class="pill warn">próxima</span>' : '<span class="pill">pendente</span>') +
          '<label for="pu-t-' + i + '">Título</label><input id="pu-t-' + i + '" data-pu="' + i + '.title" value="' + esc(u.title) + '">' +
          '<label for="pu-g-' + i + '">Objetivo</label><input id="pu-g-' + i + '" data-pu="' + i + '.goal" value="' + esc(u.goal) + '">' +
          (u.mustCover.length ? '<p class="muted">Cobrir: ' + esc(u.mustCover.join('; ')) + '</p>' : '') + '</li>';
      }).join('') + '</ol>' +
      '<p class="muted">Se você mudar título ou objetivo de uma unidade, a aprovação fica desatualizada e é preciso aprovar de novo.</p>' +
      '<div class="row"><div><label for="pl-quem">Quem aprova (pessoa)</label><input id="pl-quem" data-form="planoQuem" value="' + esc(f.planoQuem || '') + '" placeholder="Nome do professor"></div><div class="btns"><button class="b" data-a="approveplan">Aprovar plano</button></div></div></div>';
    if (e.aprovado) {
      h += '<div class="card"><h3>Gerar por unidade</h3>' + (prox
        ? '<p>Próxima: <b>' + esc(prox.id) + '</b> ' + esc(prox.title) + '</p>' + estadoAcumHtml(bp, prox) + '<div class="btns"><button class="b gold" data-a="copyunitreq">Copiar pedido da unidade</button></div>' +
          '<label for="pl-ures">Cole a resposta do Gem (formato ' + C.UNIT_SCHEMA + ')</label><textarea id="pl-ures" data-form="unidadeResp" rows="5">' + esc(f.unidadeResp || '') + '</textarea><div class="btns"><button class="b" data-a="applyunit">Aplicar unidade</button></div>'
        : '<p>Todas as unidades foram geradas.</p>') +
        (bp.material && bp.material.blocks.length ? '<div class="btns"><button class="b" data-a="openplanmat">Abrir o material montado no editor</button></div><p class="muted">' + bp.material.blocks.length + ' blocos até agora.</p>' : '') + '</div>';
    }
    return h;
  }

  /* ---------- Livro (compilador) ---------- */
  function matsDaBiblioteca() { const L = []; lib.projects.filter((p) => !p.archived).forEach((p) => p.materials.forEach((r) => L.push({ key: p.id + '|' + r.id, pid: p.id, mid: r.id, proj: p.name, data: curData(r) }))); return L; }
  function bookMats() { const all = matsDaBiblioteca(); return S.book.sel.map((k) => all.find((x) => x.key === k)).filter(Boolean); }
  function vLivro() {
    const b = S.book, all = matsDaBiblioteca(), sel = bookMats();
    if (!LV) return '<div class="card"><p>O compilador de livro não foi carregado.</p></div>';
    let h = '<div class="card"><h2>Compilar livro ou caderno</h2><p class="muted">Junte materiais já prontos em uma obra só: capa, sumário, capítulos na ordem que você escolher, glossário, caderno de respostas e referências. O livro mostra o estado real de revisão de cada capítulo e nunca se declara validado por conta própria.</p>';
    h += all.length ? '<h3>Materiais da biblioteca</h3>' + all.map((x) => '<div class="list-item"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" style="width:auto" data-a="booktoggle" data-k="' + esc(x.key) + '"' + (b.sel.includes(x.key) ? ' checked' : '') + '> <span><b>' + esc(x.data.title) + '</b><br><span class="muted">' + esc(x.proj) + '</span></span></label></div>').join('')
      : '<p class="muted">A biblioteca está vazia. Crie ou importe materiais primeiro.</p>';
    h += '</div>';
    if (!sel.length) return h;
    h += '<div class="card"><h3>Ordem dos capítulos</h3><ol>' + sel.map((x, i) => '<li>' + esc(x.data.title) + ' <span class="btns" style="display:inline-flex"><button class="b ghost sm" data-a="bookup" data-i="' + i + '" aria-label="Subir">↑</button><button class="b ghost sm" data-a="bookdown" data-i="' + i + '" aria-label="Descer">↓</button></span></li>').join('') + '</ol>' +
      '<div class="row"><div><label for="bk-t">Título do livro</label><input id="bk-t" data-book="title" value="' + esc(b.title) + '" placeholder="Ex.: Caderno do 8º ano"></div><div><label for="bk-s">Subtítulo</label><input id="bk-s" data-book="subtitle" value="' + esc(b.subtitle) + '"></div><div><label for="bk-a">Autor</label><input id="bk-a" data-book="author" value="' + esc(b.author) + '" placeholder="' + esc(C.DEFAULT_AUTHOR) + '"></div></div>' +
      '<label><input type="checkbox" style="width:auto" data-a="bookopt" data-o="glossary"' + (b.glossary ? ' checked' : '') + '> Glossário</label> <label><input type="checkbox" style="width:auto" data-a="bookopt" data-o="answers"' + (b.answers ? ' checked' : '') + '> Caderno de respostas</label> <label><input type="checkbox" style="width:auto" data-a="bookopt" data-o="references"' + (b.references ? ' checked' : '') + '> Referências</label>' +
      '<div class="btns"><button class="b gold" data-a="bookprev">👁️ Compilar e ver</button><button class="b" data-a="dlbook2">⬇️ Baixar HTML</button><button class="b ghost" data-a="printbook2">🖨️ Imprimir / salvar PDF</button></div></div>';
    if (b.show) { const r = compilar(); h += r.ok ? '<div class="card"><h3>Prévia</h3>' + (r.warnings.length ? '<div class="find warn">' + r.warnings.map((w) => '⚠️ ' + esc(w)).join('<br>') + '</div>' : '') + '<p class="muted">' + r.chapters + ' capítulo(s) · ' + r.glossary.length + ' termo(s) no glossário · ' + r.validated + ' de ' + r.chapters + ' com validação do professor</p><iframe title="Prévia do livro" style="width:100%;height:70vh;border:0;border-radius:10px;background:#e9edf5" srcdoc="' + esc(r.html) + '"></iframe></div>' : '<div class="card"><p>' + esc(r.error) + '</p></div>'; }
    return h;
  }
  function compilar() { const b = S.book; return LV.compileBook(bookMats().map((x) => x.data), { title: b.title, subtitle: b.subtitle, author: b.author, glossary: b.glossary, answers: b.answers, references: b.references }); }

  function estadoAcumHtml(bp, prox) {
    const i = bp.units.indexOf(prox); if (i < 1) return '';
    const a = C.estadoAcumulado(bp, i), n = a.terms.length + a.notation.length + a.assumed.length + a.usados.length; if (!n) return '';
    return '<details id="plano-acum"><summary>O que as unidades 1 a ' + i + ' já ensinaram (vai junto com o pedido)</summary><ul>' +
      [['Termos', a.terms], ['Notação', a.notation], ['Já ensinado', a.assumed], ['Exemplos e atividades usados', a.usados]].filter((x) => x[1].length).map((x) => '<li><b>' + x[0] + ':</b> ' + esc(x[1].join('; ')) + '</li>').join('') + '</ul></details>';
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
    const q = (S.libQuery || '').trim().toLowerCase();
    const vis = lib.projects.filter((x) => (S.showArch || !x.archived) && (!q || [x.name, x.discipline, x.level].concat(x.materials.map((m) => curData(m).title)).join(' ').toLowerCase().includes(q)));
    return '<div class="card"><h2>Seus projetos</h2>' +
      (lib.projects.length ? '<div class="search-row"><input id="libSearch" type="search" data-libsearch="1" value="' + esc(S.libQuery) + '" placeholder="Buscar por projeto, disciplina, etapa ou título do material…" aria-label="Buscar na biblioteca"></div>' : '') +
      (vis.length ? vis.map((x) =>
        '<div class="list-item"><div><b>' + esc(x.name) + '</b> ' + (x.archived ? '<span class="pill">arquivado</span>' : '') + '<br><span class="muted">' + esc([x.discipline, x.level].filter(Boolean).join(' · ')) + ' · ' + x.materials.length + ' material(is)</span></div><div class="btns"><button class="b sm" data-a="openproj" data-id="' + x.id + '">Abrir</button></div></div>').join('')
        : (q ? '<p class="muted">Nenhum projeto corresponde a “' + esc(S.libQuery) + '”.</p>' : '<p class="muted">Nenhum projeto ainda. Crie o primeiro abaixo ou explore o exemplo completo.</p>')) +
      '<label><input type="checkbox" data-a="toggleArch" ' + (S.showArch ? 'checked' : '') + ' style="width:auto"> mostrar arquivados</label></div>' +
      '<div class="card"><h3>Novo projeto</h3><div class="row"><div><label for="np-name">Nome</label><input id="np-name" placeholder="Ex.: 7º ano — Matemática"></div><div><label for="np-disc">Disciplina</label><input id="np-disc" placeholder="Ex.: Matemática"></div><div><label for="np-level">Etapa de ensino</label><input id="np-level" placeholder="Ex.: 7º ano do Ensino Fundamental"></div></div><div class="btns"><button class="b gold" data-a="newproj">Criar projeto</button><button class="b ghost" data-a="previewdemo">👁️ Ver exemplo completo</button></div></div>' +
      '<div class="card"><h3>Backup da Biblioteca</h3><p class="muted">Seus dados ficam só neste navegador. Baixe um backup periodicamente ou restaure um arquivo JSON anterior.</p><div class="btns"><button class="b" data-a="backup">⬇️ Baixar backup da biblioteca</button><label class="b" style="display:inline-flex;align-items:center;margin:0;cursor:pointer">⬆️ Restaurar backup<input type="file" accept=".json,application/json" data-a="restore" style="display:none"></label></div></div>';
  }

  /* ---------- Fontes do autor (base obrigatória do pedido) ---------- */
  function fontesEscolhidas() { return FT ? (lib.sources || []).filter((x) => S.form.srcSel.includes(x.id)) : []; }
  function cardFontes() {
    if (!FT) return '';
    const L = lib.sources || [], d = S.form.srcDraft, sel = fontesEscolhidas(), pre = FT.blocoDeFontes(sel);
    return '<div class="card" id="card-fontes"><h3>Fontes do autor</h3><p class="muted">Cole trechos do livro, da norma ou das suas anotações. As fontes marcadas vão no pedido como base obrigatória, com [F1], [F2]. Tudo fica só neste navegador.</p>' +
      (L.length ? L.map((x) => '<div class="list-item"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" style="width:auto" data-a="srctoggle" data-k="' + esc(x.id) + '"' + (S.form.srcSel.includes(x.id) ? ' checked' : '') + '> <span><b>' + esc(x.title) + '</b> <span class="muted">' + esc([x.authors, x.year].filter(Boolean).join(', ')) + ' · ' + x.text.length + ' caracteres</span></span></label> <button class="b ghost sm" data-a="srcdel" data-k="' + esc(x.id) + '" aria-label="Remover fonte">✕</button></div>').join('') : '<p class="muted">Nenhuma fonte ainda.</p>') +
      (pre.avisos.length ? '<div class="find warn">' + pre.avisos.map((w) => '⚠️ ' + esc(w)).join('<br>') + '</div>' : '') +
      '<details><summary>Adicionar fonte</summary><div class="row"><div><label for="sr-t">Título</label><input id="sr-t" data-src="title" value="' + esc(d.title) + '"></div><div><label for="sr-a">Autoria</label><input id="sr-a" data-src="authors" value="' + esc(d.authors) + '"></div><div><label for="sr-y">Ano</label><input id="sr-y" data-src="year" value="' + esc(d.year) + '"></div></div>' +
      '<label for="sr-x">Trecho (até ' + FT.LIM.trecho + ' caracteres)</label><textarea id="sr-x" data-src="text" rows="5">' + esc(d.text) + '</textarea><label for="sr-c">Quanto da obra você leu?</label><select id="sr-c" data-src="access"><option value="FULL"' + (d.access === 'FULL' ? ' selected' : '') + '>A obra inteira</option><option value="PARTIAL"' + (d.access === 'PARTIAL' ? ' selected' : '') + '>Parte da obra</option><option value="SUMMARY"' + (d.access === 'SUMMARY' ? ' selected' : '') + '>Só resumo</option></select>' +
      '<div class="btns"><button class="b" data-a="addsource">Guardar fonte</button></div></details></div>';
  }
  function fonteAud(d) {
    if (!FT || !d) return '';
    const sel = fontesEscolhidas(); if (!sel.length) return '';
    const L = FT.auditarUso(d, sel);
    return '<div class="card"><h3>Uso das fontes do autor</h3>' + (L.length ? L.map((x) => '<div class="find ' + (x.nivel === 'warn' ? 'warn' : 'info') + '">' + (x.nivel === 'warn' ? '⚠️' : 'ℹ️') + ' ' + esc(x.msg) + '</div>').join('') : '<p class="muted">Todas as fontes escolhidas foram citadas e não há cópia literal.</p>') + '<p class="muted">Conferência automática por marcadores e sequência de palavras. Não substitui a sua leitura.</p></div>';
  }

  /* ---------- Domínio do assunto (Passe 0) ---------- */
  function tipoDoForm(f) { return f.type && f.type !== 'auto' && C.EPISTEMIC[f.type] ? f.type : C.detectType(f.discipline); }
  function packDoForm(f) { return D ? D.achar(f.domainId, lib.domains, tipoDoForm(f)) : null; }
  function cardDominio() {
    if (!D) return '';
    const f = S.form, packs = D.listar(lib.domains), p = packDoForm(f);
    return '<div class="card" id="card-dominio"><h3>Regras do domínio</h3><p class="muted">O pedido leva as regras do tipo de assunto: blocos que não podem faltar, erros típicos e cuidados. Para um assunto fora dos 7 tipos (por exemplo mecânica automotiva), peça um pacote novo ao Gem.</p>' +
      '<label for="dm-sel">Pacote em uso</label><select id="dm-sel" data-form="domainId"><option value=""' + (f.domainId ? '' : ' selected') + '>Automático: ' + esc((D.achar('', lib.domains, tipoDoForm(f)) || {}).nome || '') + '</option>' +
      packs.map((x) => '<option value="' + esc(x.id) + '"' + (f.domainId === x.id ? ' selected' : '') + '>' + esc(x.nome) + (x.origem === 'meta-adaptador' ? ' (seu pacote)' : '') + '</option>').join('') + '</select>' +
      (p ? '<details><summary>Ver as regras que vão no pedido</summary><pre style="white-space:pre-wrap">' + esc(D.regrasTexto(p)) + '</pre></details>' : '') +
      '<details><summary>Assunto novo: pedir um pacote ao Gem</summary><div class="btns"><button class="b ghost" data-a="copydomainreq">Copiar pedido de pacote</button></div>' +
      '<label for="dm-resp">Cole a resposta (formato ' + D.DOMAIN_SCHEMA + ')</label><textarea id="dm-resp" data-form="domainResp" rows="4">' + esc(f.domainResp || '') + '</textarea><div class="btns"><button class="b" data-a="importdomain">Importar pacote</button></div></details></div>';
  }
  function dominioAud(d) {
    if (!D || !d) return '';
    const f = { type: d.epistemicType, discipline: d.discipline, domainId: S.form.domainId }, p = D.achar(f.domainId, lib.domains, tipoDoForm(f));
    if (!p) return '';
    const L = D.auditar(d, p);
    return '<div class="card"><h3>Regras do domínio: ' + esc(p.nome) + '</h3>' + (L.length ? L.map((x) => '<div class="find ' + (x.nivel === 'warn' ? 'warn' : 'info') + '">' + (x.nivel === 'warn' ? '⚠️' : 'ℹ️') + ' ' + esc(x.msg) + '</div>').join('') : '<p class="muted">O material atende às regras deste domínio.</p>') + '<p class="muted">São conferências por tipos de bloco e palavras. Não substituem a sua leitura.</p></div>';
  }

  /* ---------- Criar ---------- */
  function epistHintHtml(f) {
    const det = C.detectType(f.discipline);
    const manual = f.type && f.type !== 'auto' && C.EPISTEMIC[f.type];
    const eff = manual ? f.type : det;
    const msg = manual
      ? '<b>Epistemologia definida manualmente:</b> ' + esc(C.EPISTEMIC[eff].label) + (f.discipline ? ' <span class="muted">(sugestão automática pela disciplina seria ' + esc(C.EPISTEMIC[det].label.split(' (')[0]) + ')</span>' : '')
      : (f.discipline
        ? '<b>Detecção epistemológica inteligente:</b> para “' + esc(f.discipline) + '”, sugerimos <b>' + esc(C.EPISTEMIC[det].label) + '</b> — você pode alterar manualmente no seletor acima.'
        : '<b>Detecção epistemológica inteligente:</b> digite a disciplina para sugerir automaticamente o tipo de conhecimento (editável manualmente).');
    return msg + '<small>A <b>Psicologia Histórico-Cultural</b> fundamenta a organização pedagógica (mediação, ZDP), mas não substitui a epistemologia própria da disciplina.</small>';
  }
  function calibBodyHtml(f) {
    const cal = C.calibrateStage(f.level, f.stageOverride);
    return '<div class="calib-grid">' +
      '<div class="calib-cell"><b>Profundidade conceitual</b>' + esc(cal.profundidade) + '</div>' +
      '<div class="calib-cell"><b>Linguagem e registro</b>' + esc(cal.linguagem) + '</div>' +
      '<div class="calib-cell"><b>Exemplos</b>' + esc(cal.exemplos) + '</div>' +
      '<div class="calib-cell"><b>Complexidade das atividades</b>' + esc(cal.atividades) + '</div></div>';
  }
  function vCriar() {
    const f = S.form;
    const opt = (v, t, sel) => '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(t) + '</option>';
    const selSecs = Array.isArray(f.sections) ? f.sections : C.PROFILE_SECTIONS.completo;
    return '<div class="card"><h2>Criar material</h2><p class="muted">Funciona para qualquer disciplina. A <b>epistemologia própria da área</b> orienta o rigor do conteúdo; a <b>Psicologia Histórico-Cultural</b> fundamenta a organização pedagógica.</p>' +
      '<div class="row"><div><label for="cr-author">Autor</label><input id="cr-author" data-form="author" value="' + esc(f.author) + '" placeholder="Prof. Alê Barbosa"></div><div><label for="cr-disc">Disciplina</label><input id="cr-disc" data-form="discipline" value="' + esc(f.discipline) + '" placeholder="Ex.: História, Matemática, Biologia…"></div><div><label for="cr-level">Etapa de ensino</label><input id="cr-level" data-form="level" value="' + esc(f.level) + '" placeholder="Ex.: 8º ano EF, 2º ano EM, Graduação…"></div><div><label for="cr-topic">Tema</label><input id="cr-topic" data-form="topic" value="' + esc(f.topic) + '" placeholder="Ex.: Revolução Francesa"></div><div><label for="cr-dur">Duração</label><input id="cr-dur" data-form="duration" value="' + esc(f.duration) + '"></div></div>' +
      '<div class="row"><div><label for="cr-type">Tipo de conhecimento (epistemologia)</label><select id="cr-type" data-form="type">' + opt('auto', 'Automático pela disciplina', f.type === 'auto') + Object.keys(C.EPISTEMIC).map((k) => opt(k, C.EPISTEMIC[k].label, f.type === k)).join('') + '</select></div>' +
      '<div><label for="cr-prof">Atalho de perfil (ajusta as seções abaixo)</label><select id="cr-prof" data-form="contentProfile">' + Object.keys(C.CONTENT_PROFILES).map((k) => opt(k, C.CONTENT_PROFILES[k], f.contentProfile === k)).join('') + '</select></div>' +
      '<div><label for="cr-reg">Registro de linguagem</label><select id="cr-reg" data-form="registro">' + Object.keys(C.REGISTROS).map((k) => opt(k, C.REGISTROS[k], f.registro === k)).join('') + '</select></div>' +
      '<div><label for="cr-dest">Destinatário</label><select id="cr-dest" data-form="destinatario">' + Object.keys(C.DESTINATARIOS).map((k) => opt(k, C.DESTINATARIOS[k], f.destinatario === k)).join('') + '</select></div>' +
      '<div><label for="cr-target">Salvar no projeto</label><select id="cr-target" data-form="target">' + opt('', '(criar projeto novo)', !f.target) + lib.projects.filter((p) => !p.archived).map((p) => opt(p.id, p.name, f.target === p.id)).join('') + '</select></div></div>' +
      '<div class="epist-hint" id="epistemicHint" aria-live="polite">' + epistHintHtml(f) + '</div>' +
      '<div class="mod-wrap" id="modularSections"><div class="mod-head"><b>Seleção modular de seções (' + selSecs.length + ' de ' + C.SECTION_CATALOG.length + ' ativas)</b><span class="muted">Marque exatamente o que deseja incluir, sem modelo fechado</span></div>' +
      '<div class="mod-grid">' + C.SECTION_CATALOG.map((s) => '<label class="mod-item"><input type="checkbox" data-a="sectoggle" data-k="' + esc(s[0]) + '"' + (selSecs.includes(s[0]) ? ' checked' : '') + '> <span>' + esc(s[1]) + '</span></label>').join('') + '</div></div>' +
      '<div class="calib-box" id="stageCalibration"><div class="calib-head"><b>Calibração pedagógica automática por etapa</b><select id="cr-stage" data-form="stageOverride" aria-label="Calibração por etapa">' + opt('auto', 'Automático (' + C.calibrateStage(f.level, 'auto').label + ')', !f.stageOverride || f.stageOverride === 'auto') + Object.keys(C.STAGE_PROFILES).map((k) => opt(k, C.STAGE_PROFILES[k].label, f.stageOverride === k)).join('') + '</select></div><div id="stageCalibrationBody">' + calibBodyHtml(f) + '</div></div>' +
      '<label for="cr-obj">Objetivos desejados (opcional)</label><textarea id="cr-obj" data-form="objectives" rows="2">' + esc(f.objectives) + '</textarea></div>' +
      cardDominio() +
      cardFontes() +
      '<div class="card steps" id="card-fluxo-ia"><h3>Fluxo com IA externa (sem custo · 4 passos)</h3>' +
      '<div class="step' + (S.flowStep === 1 ? ' now' : S.flowStep > 1 ? ' done' : '') + '"><b>1. Gerar e copiar o pedido</b> — monta o texto completo com tema, regras do domínio e fontes marcadas.<div class="btns"><button class="b gold" data-a="copyreq">📋 Copiar pedido</button></div>' +
      (f.lastPedido ? '<details class="pedido-box"' + (S.flowStep === 2 ? ' open' : '') + '><summary>Rascunho do último pedido salvo (' + f.lastPedido.length + ' caracteres)</summary><pre>' + esc(f.lastPedido) + '</pre></details>' : '') + '</div>' +
      '<div class="step' + (S.flowStep === 2 ? ' now' : S.flowStep > 2 ? ' done' : '') + '"><b>2. Executar na IA externa</b> — cole o pedido no seu Gem do Gemini ou no Claude (com a skill <code>mathlab-aulas-visuais</code>) e copie o JSON devolvido.<div class="ext-links"><a class="b ghost sm" href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">Abrir Gemini ↗</a><a class="b ghost sm" href="https://claude.ai/" target="_blank" rel="noopener noreferrer">Abrir Claude ↗</a><button class="b sm" data-a="gotostep3">Já copiei o JSON, continuar ↓</button></div></div>' +
      '<div class="step' + (S.flowStep === 3 ? ' now' : S.flowStep > 3 ? ' done' : '') + '"><b>3. Colar o JSON de volta e importar</b><textarea id="cr-pasted" data-form="pasted" rows="6" placeholder="Cole aqui o bloco JSON inteiro devolvido pela IA…">' + esc(f.pasted) + '</textarea><div class="btns"><button class="b" data-a="importjson">Importar material</button></div></div>' +
      '<div class="step' + (S.flowStep === 4 ? ' now' : '') + '"><b>4. Revisar e validar</b> — revise no <b>Editor</b>, ajuste a <b>Capa</b> e a <b>Apostila</b>, rode a <b>Auditoria</b> e valide como professor.' + (S.draft ? '<div class="btns"><button class="b sm gold" data-a="tab" data-t="editor">Abrir no Editor →</button></div>' : '') + '</div></div>' +
      '<div class="card"><h3>Outras opções</h3><div class="btns"><button class="b ghost" data-a="scaffold">Criar esqueleto offline (sem IA)</button><button class="b ghost" data-a="previewdemo">👁️ Ver exemplo completo (sem salvar)</button><button class="b ghost" data-a="demo">Salvar exemplo na Biblioteca</button></div><p class="muted">O esqueleto offline só monta a estrutura certa para o tipo de conhecimento, com marcadores [PREENCHER]. Ele não escreve conteúdo e a auditoria o reprova até você preencher.</p></div>';
  }

  /* ---------- Editor ---------- */
  function vEditor() {
    const d = S.draft, rec = mat();
    if (!d.revisao) d.revisao = { aprovado: false, revisadoPor: '', data: '', hash: '' };
    const bc = { exemplo: '#22a559', atividade: '#f28a1f', exercicios: '#7a4bd1', gabarito: '#1e6fd9', nota: '#d6453d', acessibilidade: '#0e8f8f', problematizacao: '#f2b705' };
    let h = '<div class="card"><div class="btns" style="justify-content:space-between"><h2 style="margin:0">' + esc(d.title) + ' ' + (S.dirty ? '<span class="dirty" id="dirtymark">● alterações não salvas</span>' : '<span class="pill ok" id="dirtymark">salvo</span>') + '</h2>' +
      '<div class="btns"><button class="b gold" data-a="save">💾 Salvar nova versão</button><button class="b ghost" data-a="prev">👁️ Prévia</button><button class="b ghost" data-a="vers">🕘 Versões (' + (rec ? rec.versions.length : 0) + ')</button></div></div>';
    if (S.showPrev) h += '<iframe class="pv" sandbox="" srcdoc="' + esc(C.toHTML(d)) + '"></iframe>';
    if (S.showVers && rec) h += '<h3>Versões</h3>' + rec.versions.slice().reverse().map((v, i) => '<div class="list-item"><div>' + fmt(v.at) + ' — ' + esc(v.note || '') + ' ' + (v.vid === rec.cur ? '<span class="pill ok">atual</span>' : '') + ' ' + lvlPill(v.audit.level) + ' <span class="muted">nota ' + v.audit.score + '</span></div>' + (v.vid === rec.cur ? '' : '<button class="b ghost sm" data-a="restorever" data-v="' + v.vid + '">Restaurar como nova versão</button>') + '</div>').join('');
    h += '</div>';
    h += '<div class="card"><h3>Contexto do Conhecimento & Identificação</h3>' +
      '<div class="ctx-bar" aria-label="Resumo do contexto do conhecimento"><span class="pill">🧠 ' + esc(C.EPISTEMIC[d.epistemicType].label) + '</span><span class="pill">📘 Perfil: ' + esc(d.contentProfile || 'completo') + '</span><span class="pill">🗣️ ' + esc(d.registro || 'escolar') + '</span><span class="pill">👤 ' + esc(d.destinatario || 'estudante') + '</span><span class="pill ok">Psicologia Histórico-Cultural</span></div>' +
      '<div class="row"><div>' + inp('title', 'Título') + '</div><div>' + inp('author', 'Autor') + '</div><div>' + inp('discipline', 'Disciplina') + '</div><div>' + inp('level', 'Etapa de ensino') + '</div><div>' + inp('topic', 'Tema') + '</div><div>' + inp('duration', 'Duração') + '</div>' +
      '<div><label for="ed-epistemic">Tipo de conhecimento</label><select id="ed-epistemic" data-f="epistemicType">' + Object.keys(C.EPISTEMIC).map((k) => '<option value="' + k + '"' + (d.epistemicType === k ? ' selected' : '') + '>' + esc(C.EPISTEMIC[k].label) + '</option>').join('') + '</select></div>' +
      '<div><label for="ed-profile">Perfil do material</label><select id="ed-profile" data-f="contentProfile">' + Object.keys(C.CONTENT_PROFILES).map((k) => '<option value="' + k + '"' + (d.contentProfile === k ? ' selected' : '') + '>' + esc(C.CONTENT_PROFILES[k]) + '</option>').join('') + '</select></div>' +
      '<div><label for="ed-registro">Registro de linguagem</label><select id="ed-registro" data-f="registro">' + Object.keys(C.REGISTROS).map((k) => '<option value="' + k + '"' + ((d.registro || 'escolar') === k ? ' selected' : '') + '>' + esc(C.REGISTROS[k]) + '</option>').join('') + '</select></div>' +
      '<div><label for="ed-dest">Destinatário</label><select id="ed-dest" data-f="destinatario">' + Object.keys(C.DESTINATARIOS).map((k) => '<option value="' + k + '"' + ((d.destinatario || 'estudante') === k ? ' selected' : '') + '>' + esc(C.DESTINATARIOS[k]) + '</option>').join('') + '</select></div></div>' +
      area('objectives', 'Objetivos de aprendizagem (um por linha)', 4, true) + area('prerequisites', 'Conhecimentos prévios (um por linha)', 3, true) + '</div>';
    const rv = C.estadoRevisao(d);
    h += '<div class="card" id="card-revisao"><h3>Validação do professor</h3>' +
      '<p class="muted">Este campo só você preenche, depois de conferir o material. A IA e a auditoria nunca validam. Se você alterar o conteúdo depois, a validação fica desatualizada.</p>' +
      '<p><span class="pill ' + (rv.validado ? 'ok' : 'warn') + '" id="revisao-estado">' + esc(rv.texto) + '</span></p>' +
      '<div class="row"><div><label for="f_revisao_revisadoPor">Quem revisou</label><input id="f_revisao_revisadoPor" data-f="revisao.revisadoPor" value="' + esc(d.revisao.revisadoPor || '') + '" placeholder="Nome do professor"></div>' +
      '<div><label><input type="checkbox" id="f_revisao_aprovado" data-f="revisao.aprovado"' + (d.revisao.aprovado ? ' checked' : '') + '> Revisei e valido este material</label>' + (d.revisao.data ? '<p class="muted">Data da validação: ' + esc(d.revisao.data) + '</p>' : '') + '</div></div></div>';
    const probs = C.problemasParaReparo(d, S.avisosImport && S.avisosImport.mid === S.mid ? S.avisosImport.list : []);
    h += '<div class="card" id="card-reparo"><h3>Conferência e reparo</h3>' +
      (probs.length
        ? '<p class="muted">A conferência automática achou ' + probs.length + (probs.length === 1 ? ' ponto' : ' pontos') + ' para olhar. Você pode corrigir à mão, ou pedir ao Gem só o que precisa mudar.</p><ul>' + probs.slice(0, 8).map((x) => '<li>' + esc(x.texto) + '</li>').join('') + (probs.length > 8 ? '<li>e mais ' + (probs.length - 8) + '…</li>' : '') + '</ul>' +
          '<div class="btns"><button class="b gold" data-a="copyrepair">Copiar pedido de reparo</button></div>' +
          '<label for="rp-resp">Cole aqui a resposta do Gem (formato ' + C.REPAIR_SCHEMA + ')</label><textarea id="rp-resp" data-form="reparo" rows="4" placeholder="Cole o JSON do reparo…">' + esc(S.form.reparo || '') + '</textarea>' +
          '<div class="btns"><button class="b" data-a="applyrepair">Aplicar reparo</button></div><p class="muted">O reparo só troca blocos que já existem. Depois dele, a validação do professor fica desatualizada e você revisa de novo.</p>'
        : '<p class="muted">Nenhum ponto pendente na conferência automática. Isso não substitui a sua revisão.</p>') + '</div>';
    h += '<div class="card"><h3>Blocos do material</h3>' + d.blocks.map((b, i) =>
      '<div class="blk" style="border-left-color:' + (bc[b.type] || '#14264f') + '"><div class="head"><div><label for="ed-bt-' + i + '">Tipo</label><select id="ed-bt-' + i + '" data-f="blocks.' + i + '.type">' + Object.keys(C.BLOCK_TYPES).map((k) => '<option value="' + k + '"' + (b.type === k ? ' selected' : '') + '>' + C.BLOCK_TYPES[k][1] + ' ' + C.BLOCK_TYPES[k][0] + '</option>').join('') + '</select></div><div>' + inp('blocks.' + i + '.title', 'Título do bloco') + '</div>' +
      '<div class="btns"><button class="b ghost sm" data-a="bup" data-i="' + i + '" title="Subir" aria-label="Subir bloco ' + (i + 1) + '">↑</button><button class="b ghost sm" data-a="bdn" data-i="' + i + '" title="Descer" aria-label="Descer bloco ' + (i + 1) + '">↓</button><button class="b danger sm" data-a="bdel" data-i="' + i + '" title="Remover" aria-label="Remover bloco ' + (i + 1) + '">✕</button></div></div>' +
      area('blocks.' + i + '.content', 'Conteúdo (Markdown simples: # título, **negrito**, listas, tabelas, $fórmula$)', 7) +
      '<details' + (b.svg ? ' open' : '') + '><summary>Figura SVG ' + (b.svg ? '(com figura)' : '(sem figura)') + '</summary><textarea rows="4" data-f="blocks.' + i + '.svg" aria-label="Código SVG do bloco ' + (i + 1) + '" placeholder="Cole aqui um SVG ou use “Inserir figura” abaixo">' + esc(b.svg) + '</textarea>' + (b.svg ? '<div class="preview">' + C.sanitizeSvg(b.svg) + '</div>' : '') + '</details></div>').join('') +
      '<div class="btns"><select id="newtype" aria-label="Tipo do novo bloco" style="width:auto">' + Object.keys(C.BLOCK_TYPES).map((k) => '<option value="' + k + '">' + C.BLOCK_TYPES[k][0] + '</option>').join('') + '</select><button class="b" data-a="addblock">+ Adicionar bloco</button></div></div>';
    h += '<div class="card"><h3>Inserir figura (gerada offline)</h3><div class="row"><div><label for="vis-kind">Tipo de figura</label><select id="vis-kind" data-vis="kind">' + [['numberLine', 'Reta numérica'], ['timeline', 'Linha do tempo'], ['flow', 'Fluxograma'], ['conceptMap', 'Mapa conceitual']].map((x) => '<option value="' + x[0] + '"' + (S.vis.kind === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div><div><label for="vis-title">Título da figura</label><input id="vis-title" data-vis="title" value="' + esc(S.vis.title) + '"></div></div>' +
      '<label for="vis-text">Dados</label><textarea id="vis-text" data-vis="text" rows="4">' + esc(S.vis.text) + '</textarea><p class="muted" id="vishelp">' + visHelp(S.vis.kind) + '</p><div class="btns"><button class="b" data-a="addvis">+ Inserir como bloco visual</button></div></div>';
    h += '<div class="card"><h3>Referências</h3><p class="muted">Nunca invente referências. Marque o nível de acesso real: só "integral" se leu a obra inteira.</p>' + d.references.map((r, i) =>
      '<div class="blk"><div class="row"><div>' + inp('references.' + i + '.authors', 'Autor(es)') + '</div><div>' + inp('references.' + i + '.title', 'Título') + '</div><div>' + inp('references.' + i + '.year', 'Ano') + '</div><div>' + inp('references.' + i + '.venue', 'Periódico/editora') + '</div><div>' + inp('references.' + i + '.doi', 'DOI') + '</div><div>' + inp('references.' + i + '.url', 'URL') + '</div>' +
      '<div><label for="ed-ref-acc-' + i + '">Nível de acesso</label><select id="ed-ref-acc-' + i + '" data-f="references.' + i + '.accessLevel">' + ['integral', 'parcial', 'resumo', 'metadados', 'localizada', 'nao-verificado'].map((k) => '<option' + (r.accessLevel === k ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></div><div><label><input type="checkbox" style="width:auto" data-f="references.' + i + '.verified"' + (r.verified ? ' checked' : '') + '> verificada por mim</label></div></div><div class="btns"><button class="b danger sm" data-a="delref" data-i="' + i + '">Remover referência</button></div></div>').join('') +
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
    return '<div class="two"><div class="card"><h2>Capa Clean & Folha de Rosto</h2><p class="muted">A Capa Clean abre a apostila (título, subtítulo, logo, avatar e autor); a Folha de Rosto traz o mapa visual com caixas curtas (até 25 palavras).</p>' +
      '<label><input type="checkbox" style="width:auto" data-f="poster.coverClean"' + (p.coverClean !== false ? ' checked' : '') + '> Incluir Capa Clean (Página 1) antes da Folha de Rosto</label>' +
      '<label for="ps-avatar">Foto do autor na Capa Clean e em “Sobre o Autor”</label><select id="ps-avatar" data-f="poster.avatarChoice">' + Object.keys(C.AVATAR_OPTIONS).map((k) => '<option value="' + k + '"' + ((p.avatarChoice || 'none') === k ? ' selected' : '') + '>' + esc(C.AVATAR_OPTIONS[k]) + '</option>').join('') + '</select>' +
      '<label for="ps-logo">Logo MathLab</label><select id="ps-logo" data-f="poster.logoChoice">' + Object.keys(C.LOGO_OPTIONS).map((k) => '<option value="' + k + '"' + ((p.logoChoice || 'logo-mathlab-clean.jpg') === k ? ' selected' : '') + '>' + esc(C.LOGO_OPTIONS[k]) + '</option>').join('') + '</select>' +
      '<label for="ps-theme">Tema de cores</label><select id="ps-theme" data-f="poster.theme">' + Object.keys(C.POSTER_THEMES).map((k) => '<option value="' + k + '"' + (p.theme === k ? ' selected' : '') + '>' + esc(C.POSTER_THEMES[k].nome) + '</option>').join('') + '</select>' +
      inp('poster.title', 'Título do pôster') + inp('poster.subtitle', 'Subtítulo') + inp('poster.author', 'Autor na capa', C.DEFAULT_AUTHOR) + inp('poster.videoTitle', 'Videoaula complementar (título opcional)', 'Ex.: Aula em vídeo — Prof. Alê') + inp('poster.videoUrl', 'Link da videoaula (opcional)', 'https://youtube.com/...') + inp('poster.mascot', 'Elemento visual (descrição opcional para a IA de imagem)', 'Ex.: emblema geométrico ou diagrama próprio da disciplina') +
      '<h3>Caixas numeradas</h3>' + p.sections.map((s, i) => '<div class="blk"><div class="row"><div>' + inp('poster.sections.' + i + '.label', 'Rótulo ' + (i + 1), L[i] || '') + '</div><div>' + inp('poster.sections.' + i + '.title', 'Subtítulo (opcional)') + '</div></div>' + area('poster.sections.' + i + '.text', 'Texto', 3) + '<button class="b danger sm" data-a="delsec" data-i="' + i + '">Remover caixa</button></div>').join('') +
      (p.sections.length < 6 ? '<div class="btns"><button class="b ghost" data-a="addsec">+ Caixa numerada</button></div>' : '') +
      '<h3>Caixas extras</h3>' + inp('poster.goldTip', '💡 Dica de ouro') + inp('poster.didYouKnow', 'Você sabia?') + inp('poster.attention', '⚠️ Atenção aos detalhes') +
      '<h3>Faixa “Em resumo”</h3>' + p.summary.map((s, i) => '<div class="row"><div>' + inp('poster.summary.' + i + '.icon', 'Ícone (emoji)') + '</div><div>' + inp('poster.summary.' + i + '.label', 'Rótulo') + '</div><div>' + inp('poster.summary.' + i + '.text', 'Texto') + '</div><div><span class="muted" style="display:block;font-size:.82rem;margin:8px 0 3px">&nbsp;</span><button class="b danger sm" data-a="delsum" data-i="' + i + '" aria-label="Remover item ' + (i + 1) + ' do resumo">✕</button></div></div>').join('') +
      (p.summary.length < 5 ? '<div class="btns"><button class="b ghost" data-a="addsum">+ Item</button></div>' : '') + '</div>' +
      '<div><div class="card"><h3>Prévia (Capa Clean + Folha de Rosto)</h3><div id="posterPreview" class="preview">' + (p.coverClean !== false ? '<div style="margin-bottom:16px">' + C.renderCleanCover(d) + '</div>' : '') + C.renderPoster(p, d.author, d.epistemicType) + '</div></div>' +
      '<div class="card"><h3>Versão ilustrada com IA</h3><p class="muted">Copie o prompt, abra o Gemini (Nano Banana) e cole. O formato da imagem você escolhe no próprio app. IA de imagem às vezes erra letras: confira o texto na imagem. O pôster em HTML ao lado é sempre a versão exata.</p><div class="btns"><button class="b gold" data-a="copyimg">Copiar prompt da imagem</button><button class="b ghost" data-a="dlposter">Baixar pôster (HTML)</button><button class="b ghost" data-a="printposter">Imprimir / PDF</button></div><details><summary>Ver o prompt</summary><pre class="code">' + esc(C.buildImagePrompt(d)) + '</pre></details></div></div></div>';
  }

  /* ---------- Auditoria ---------- */
  function vAud() {
    const d = S.draft, a = C.audit(d), tr = d.meta.teacherReview;
    let v2Html = '';
    if (d._v2 && window.MathLabAuditV2) {
      const ach = window.MathLabAuditV2.auditar(d._v2, { final: !!(tr && tr.done) });
      const nb = ach.filter((x) => x.nivel === 'bloqueante').length;
      const np = ach.filter((x) => x.nivel === 'pendencia').length;
      v2Html = '<div class="card" style="border-left:5px solid ' + (nb ? 'var(--bad)' : 'var(--ok)') + '"><h3>Auditoria v2 (R01–R18 + Aritmética Racional Exata)</h3>' +
        '<p class="muted">' + nb + ' bloqueante(s) · ' + np + ' pendência(s) · ' + (ach.length - nb - np) + ' aviso(s)</p>' +
        (ach.length ? ach.map((x) => '<div class="find ' + (x.nivel === 'bloqueante' ? 'hard' : x.nivel === 'pendencia' ? 'warn' : 'info') + '">' + (x.nivel === 'bloqueante' ? '⛔' : x.nivel === 'pendencia' ? '⏳' : 'ℹ️') + ' <b>' + esc(x.regra) + '</b> (' + esc(x.onde) + '): ' + esc(x.msg) + '</div>').join('') : '<div class="find">✅ Nenhum achado na auditoria v2.</div>') + '</div>';
    }
    return '<div class="card"><h2>Auditoria de qualidade</h2><div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap"><div><div class="score">' + a.score + '</div><span class="muted">de 100 · ' + a.words + ' palavras</span></div><div>' + lvlPill(a.level) + '<p class="muted" style="max-width:520px">' + esc(a.note) + '</p></div></div></div>' +
      v2Html +
      (a.hard.length ? '<div class="card" style="border-color:var(--bad)"><h3 style="color:var(--bad)">Falhas graves (' + a.hard.length + ')</h3>' + a.hard.map((x) => '<div class="find hard">⛔ <b>' + esc(x.cat) + ':</b> ' + esc(x.msg) + '</div>').join('') + '</div>' : '') +
      dominioAud(d) +
      fonteAud(d) +
      '<div class="card"><h3>10 categorias</h3>' + a.categories.map((c) => '<div class="cat"><span>' + esc(c.name) + '</span><div class="bar"><i style="width:' + c.score * 10 + '%;background:' + (c.score >= 8 ? 'var(--ok)' : c.score >= 5 ? 'var(--warn)' : 'var(--bad)') + '"></i></div><b>' + c.score + '</b></div>' + c.findings.map((f) => '<div class="find ' + f.sev + '">' + (f.sev === 'hard' ? '⛔' : f.sev === 'warn' ? '⚠️' : 'ℹ️') + ' ' + esc(f.msg) + '</div>').join('')).join('') + '</div>' +
      '<div class="card"><h3>Revisão do professor</h3><p class="muted">A auditoria automática não confirma se o conteúdo está certo. Só você faz isso.</p><label><input type="checkbox" style="width:auto" data-a="review" ' + (tr && tr.done ? 'checked' : '') + '> Revisei o conteúdo e assumo a validação final' + (tr && tr.at ? ' (em ' + fmt(tr.at) + ')' : '') + '</label><p class="muted">Salve uma nova versão para registrar a revisão.</p></div>';
  }

  /* ---------- Apostila completa ---------- */
  function vApostila() {
    const d = S.draft;
    const style = (d.poster && d.poster.interiorStyle) || 'editorial';
    const pg = (C.toApostila(d).match(/class="mlpage/g) || []).length;
    return '<div class="card"><h2>Apostila completa</h2><p class="muted">Capa Clean + Folha de Rosto + miolo em páginas A4 (' + pg + ' páginas neste material). O arquivo HTML baixado embute as imagens para funcionar offline. Para PDF, use “Imprimir / salvar PDF”.</p>' +
      '<div class="style-grid">' +
      '<button type="button" class="style-opt' + (style === 'editorial' ? ' on' : '') + '" data-a="setstyle" data-v="editorial"><b>📄 Editorial Clean (padrão)</b><small>Cabeçalho com pílula de página, guia com emblema da área, caixas suaves e colofão.</small></button>' +
      '<button type="button" class="style-opt' + (style === 'ludico' ? ' on' : '') + '" data-a="setstyle" data-v="ludico"><b>🎨 Lúdico / HQ</b><small>Caixas coloridas numeradas estilo pôster em todo o miolo.</small></button></div>' +
      '<div class="btns"><button class="b gold" data-a="dlbook">📘 Baixar apostila (HTML autocontido)</button><button class="b" data-a="printbook">🖨️ Imprimir / salvar PDF</button></div></div>' +
      '<div class="card"><iframe id="bookFrame" title="Prévia da apostila completa" style="width:100%;height:78vh;border:0;border-radius:10px;background:#e9edf5" srcdoc="' + esc(C.toApostila(d)) + '"></iframe></div>';
  }

  /* ---------- Exportar ---------- */
  function vExp() {
    const d = S.draft, svgs = d.blocks.map((b, i) => [b, i]).filter((x) => x[0].svg);
    return '<div class="card"><h2>Exportar</h2><p class="muted">Exporta o que está no Editor agora (mesmo sem salvar).</p><div class="btns"><button class="b gold" data-a="dlbook">📘 Apostila completa (capa + miolo)</button><button class="b" data-a="printbook">🖨️ Imprimir apostila / salvar PDF</button><button class="b ghost" data-a="dlhtml">📄 Material em HTML simples</button><button class="b ghost" data-a="printall">🖨️ Imprimir material simples</button><button class="b ghost" data-a="dlposter">🖼️ Só o pôster (HTML)</button><button class="b ghost" data-a="dlmd">Markdown</button><button class="b ghost" data-a="dljson">JSON (para reimportar)</button></div>' +
      (svgs.length ? '<h3>Figuras SVG</h3><div class="btns">' + svgs.map((x) => '<button class="b ghost sm" data-a="dlsvg" data-i="' + x[1] + '">' + esc(x[0].title) + '.svg</button>').join('') + '</div>' : '') +
      '<p class="muted">Para PDF: use “Imprimir / salvar PDF” e escolha “Salvar como PDF” no navegador. Word e PowerPoint ainda não estão nesta versão.</p></div>';
  }

  /* ---------- Diário & Portfólio Docente ---------- */
  function saveDiario() { try { localStorage.setItem('mathlab.diario.v1', JSON.stringify(S.diario)); } catch (e) { /* ignora */ } }
  function demoDiario() {
    return {
      schema_versao: 'diario.1', ano_letivo: new Date().getFullYear(), professor: C.DEFAULT_AUTHOR, escola: 'Escola MathLab', area: 'Matemática',
      periodos: [{ id: 'b1', nome: '1º bimestre', inicio: '2026-02-01', fim: '2026-04-30' }, { id: 'b2', nome: '2º bimestre', inicio: '2026-05-01', fim: '2026-07-15' }],
      turmas: [{ id: '6a', nome: '6º A', etapa: 'ef2', habilidades_previstas: ['EF06MA08', 'EF06MA11'] }],
      habilidades: [{ codigo: 'EF06MA08', descricao: 'Frações e suas representações', verificado: false }, { codigo: 'EF06MA11', descricao: 'Operações com números decimais', verificado: false }],
      entradas: [
        { id: 'e1', data: '2026-02-24', turma_id: '6a', periodo_id: 'b1', tipo: 'aula', tema: 'Frações: parte de um todo', habilidades: ['EF06MA08'], resumo: 'Construção de barras de papel para comparar frações.', destaque: true },
        { id: 'e2', data: '2026-04-14', turma_id: '6a', periodo_id: 'b1', tipo: 'retomada', tema: 'Retomada dos erros mais frequentes', habilidades: ['EF06MA08'], resumo: 'Correção coletiva com desenho antes do cálculo.', destaque: true, reflexao: 'Desenhar antes de calcular reduziu a soma de denominadores.' },
      ],
      avaliacoes: [
        { id: 'av1', data: '2026-03-24', turma_id: '6a', instrumento: 'prova', n_participantes: 28, itens: [{ item: 'Q1 — fração de fração', habilidade: 'EF06MA08', acertos: 12, n: 28, erros_tipicos: [{ descricao: 'Somou numeradores e denominadores', contagem: 9 }] }], intervencao: 'Retomada com barras de papel (14/04).' },
      ],
    };
  }
  function vDiario() {
    const P = window.MathLabPortfolio;
    if (!S.diario) {
      return '<div class="card empty"><h2>Diário de Aula & Portfólio Docente</h2><p>Registre suas aulas e avaliações e gere um portfólio em A4 com cobertura curricular por habilidade, evolução e privacidade garantida.</p>' +
        '<div class="btns" style="justify-content:center"><button class="b gold" data-a="demodiario">Carregar exemplo de diário</button>' +
        '<label class="b ghost" style="display:inline-block;margin:0;cursor:pointer">Importar diario.json<input type="file" accept=".json,application/json" data-a="importdiario" style="display:none"></label></div></div>';
    }
    const d = S.diario, cfg = P.CFG_PADRAO(d), ach = P.verificar(d, cfg);
    const nb = ach.filter((x) => x.nivel === 'bloqueante').length;
    const htmlPort = nb ? '' : P.montarHtml(d, cfg);
    return '<div class="card"><div class="btns" style="justify-content:space-between"><h2 style="margin:0">Diário & Portfólio — ' + esc(d.professor || C.DEFAULT_AUTHOR) + '</h2>' +
      '<div class="btns"><button class="b ghost sm" data-a="dldiario">Baixar diario.json</button><label class="b ghost sm" style="display:inline-block;margin:0;cursor:pointer">Importar JSON<input type="file" accept=".json,application/json" data-a="importdiario" style="display:none"></label></div></div>' +
      '<p class="muted">' + d.turmas.length + ' turma(s) · ' + d.entradas.length + ' registro(s) · ' + (d.avaliacoes || []).length + ' avaliação(ões)</p>' +
      (ach.length ? '<div style="margin:8px 0">' + ach.map((x) => '<div class="find ' + (x.nivel === 'bloqueante' ? 'hard' : 'warn') + '">' + (x.nivel === 'bloqueante' ? '⛔' : '⚠️') + ' <b>' + esc(x.regra) + '</b>: ' + esc(x.msg) + '</div>').join('') + '</div>' : '') +
      '<div class="btns"><button class="b gold" data-a="dlportfolio"' + (nb ? ' disabled' : '') + '>📘 Baixar Portfólio (HTML)</button><button class="b" data-a="printportfolio"' + (nb ? ' disabled' : '') + '>🖨️ Imprimir / salvar PDF</button></div></div>' +
      '<div class="card"><h3>Novo registro no diário</h3><div class="row"><div><label for="dr-data">Data</label><input id="dr-data" type="date" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
      '<div><label for="dr-turma">Turma</label><select id="dr-turma">' + d.turmas.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.nome) + '</option>').join('') + '</select></div>' +
      '<div><label for="dr-tipo">Tipo</label><select id="dr-tipo"><option value="aula">Aula</option><option value="retomada">Retomada</option><option value="avaliacao">Avaliação</option><option value="projeto">Projeto</option></select></div>' +
      '<div><label for="dr-hab">Habilidades (vírgula)</label><input id="dr-hab" placeholder="Ex.: EF06MA08"></div></div>' +
      '<label for="dr-tema">Tema da aula</label><input id="dr-tema" placeholder="Ex.: Frações equivalentes na reta numérica">' +
      '<label for="dr-resumo">Resumo / evidência</label><textarea id="dr-resumo" rows="2"></textarea>' +
      '<label for="dr-refl">Reflexão docente (opcional)</label><textarea id="dr-refl" rows="2"></textarea>' +
      '<div class="btns"><button class="b gold" data-a="adddiario">+ Adicionar ao diário</button></div></div>' +
      (htmlPort ? '<div class="card"><h3>Prévia do Portfólio Docente (A4)</h3><iframe title="Prévia do portfólio" style="width:100%;height:72vh;border:0;border-radius:10px;background:#eef1f6" srcdoc="' + esc(htmlPort) + '"></iframe></div>' : '');
  }

  /* ---------- Ajuda ---------- */
  function vAjuda() {
    return '<div class="card steps"><h2>Como usar</h2>' +
      '<div class="step"><b>Gemini Pro (Gem):</b> em gemini.google.com, abra “Gems” → “Novo Gem”, cole o texto do arquivo <code>gemini/GEM_INSTRUCOES.md</code> nas instruções e salve com o nome “MathLab”.</div>' +
      '<div class="step"><b>Claude:</b> instale a skill <code>mathlab-aulas-visuais</code> (arquivo <code>skill/SKILL.md</code>).</div>' +
      '<div class="step">Aqui em <b>Criar</b>: preencha o pedido, copie, cole no Gem, copie o JSON que ele devolver e importe.</div>' +
      '<div class="step">Em <b>Apostila visual</b>: copie o prompt e gere a imagem ilustrada no Nano Banana (Gemini). O pôster em HTML já fica pronto para imprimir.</div>' +
      '<div class="step"><b>Publicar no GitHub Pages:</b> suba esta pasta num repositório, em Settings → Pages escolha “GitHub Actions”. O arquivo <code>.github/workflows/pages.yml</code> já está pronto.</div>' +
      '<div class="btns"><a class="b ghost" href="dist/mathlab-standalone.html" download="mathlab-standalone.html" style="text-decoration:none">⬇️ Baixar versão offline (arquivo único)</a></div></div>' +
      '<div class="card"><h3>Limites desta versão</h3><ul><li>Não escreve conteúdo sozinho: a IA vem da skill/Gem.</li><li>Exporta HTML, PDF (pelo navegador), Markdown, JSON e SVG. Word e PowerPoint ficam para a próxima etapa.</li><li>Dados ficam só neste navegador: faça backup na Biblioteca.</li></ul></div>';
  }

  /* ---------- ações ---------- */
  const A = {
    group: (el) => { const g = GROUPS[el.dataset.g]; if (!g) return; if (!g.tabs.some((t) => t[0] === S.tab)) S.tab = g.tabs[0][0]; render(); },
    tab: (el) => { S.tab = el.dataset.t; render(); },
    previewdemo: () => {
      if (S.dirty && !S.isPreviewExample && !confirm('Há alterações não salvas no material aberto. Abrir o exemplo assim mesmo?')) return;
      S.pid = null; S.mid = null; S.isPreviewExample = true; S.draft = C.clone(C.demo()); S.dirty = false; S.tab = 'editor'; render();
      toast('Exemplo completo aberto em modo prévia (sua Biblioteca não foi alterada).');
    },
    savepreviewdemo: () => {
      if (!S.draft) return;
      let p = lib.projects.find((x) => x.name === 'Exemplos');
      if (!p) p = newProject('Exemplos', S.draft.discipline || 'Matemática', S.draft.level || '7º ano');
      const rec = addMaterial(p, C.normalize(S.draft), 'Exemplo salvo da prévia');
      S.pid = p.id; S.mid = rec.id; S.isPreviewExample = false; S.dirty = false; render();
      toast('Exemplo salvo na sua Biblioteca (projeto "Exemplos").');
    },
    exitpreviewdemo: () => { S.draft = null; S.pid = null; S.mid = null; S.isPreviewExample = false; S.dirty = false; S.tab = lib.projects.length ? 'biblioteca' : 'criar'; render(); },
    gotostep3: () => { S.flowStep = 3; render(); const ta = $('[data-form="pasted"]'); if (ta) { ta.focus(); ta.scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
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
    backup: () => dl('mathlab-backup-' + new Date().toISOString().slice(0, 10) + '.json', 'application/json', JSON.stringify({ app: 'mathlab', version: 2, projects: lib.projects, plans: lib.plans || [], domains: lib.domains || [], sources: lib.sources || [] }, null, 2)),
    restore: (el) => {
      const f = el.files[0]; if (!f) return;
      const rd = new FileReader(); rd.onload = () => {
        try { const j = JSON.parse(rd.result); if (!Array.isArray(j.projects)) throw new Error('arquivo sem projetos'); let n = 0; j.projects.forEach((p) => { if (!lib.projects.some((x) => x.id === p.id)) { lib.projects.push(p); n++; } });
          ['plans', 'domains', 'sources'].forEach((k) => { if (Array.isArray(j[k])) { lib[k] = lib[k] || []; j[k].forEach((o) => { if (o && o.id && !lib[k].some((x) => x.id === o.id)) lib[k].push(o); }); } }); persist(); render(); toast(n + ' projeto(s) restaurado(s); os que já existiam foram mantidos.'); }
        catch (e) { toast('Backup inválido: ' + e.message, true); }
      }; rd.readAsText(f);
    },
    copyreq: async () => {
      const t = C.buildRequestText(S.form) + (D && packDoForm(S.form) ? '\n\n' + D.regrasTexto(packDoForm(S.form)) : '') + (FT && fontesEscolhidas().length ? '\n\n' + FT.blocoDeFontes(fontesEscolhidas()).texto : '');
      S.form.lastPedido = t; S.flowStep = 2;
      const ok = await copy(t); render();
      toast(ok ? 'Pedido copiado e salvo abaixo. Cole no seu Gem ou no Claude.' : 'Pedido salvo abaixo. Copie manualmente do rascunho.', !ok);
    },
    booktoggle: (el) => { const k = el.dataset.k, a = S.book.sel; if (el.checked) { if (!a.includes(k)) a.push(k); } else S.book.sel = a.filter((x) => x !== k); S.book.show = false; render(); },
    bookopt: (el) => { S.book[el.dataset.o] = el.checked; S.book.show = false; },
    bookup: (el) => { const i = +el.dataset.i, a = S.book.sel; if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; S.book.show = false; render(); } },
    bookdown: (el) => { const i = +el.dataset.i, a = S.book.sel; if (i < a.length - 1) { [a[i + 1], a[i]] = [a[i], a[i + 1]]; S.book.show = false; render(); } },
    bookprev: () => { S.book.show = true; render(); },
    dlbook2: () => { const r = compilar(); if (!r.ok) { toast(r.error, true); return; } dl(slug(r.title) + '-livro.html', 'text/html', r.html); },
    printbook2: () => { const r = compilar(); if (!r.ok) { toast(r.error, true); return; } printHTML(r.html); },
    sectoggle: (el) => {
      const k = el.dataset.k;
      if (!Array.isArray(S.form.sections)) S.form.sections = C.PROFILE_SECTIONS.completo.slice();
      if (el.checked) { if (!S.form.sections.includes(k)) S.form.sections.push(k); }
      else S.form.sections = S.form.sections.filter((x) => x !== k);
      render();
    },
    srctoggle: (el) => { const k = el.dataset.k, a = S.form.srcSel; if (el.checked) { if (!a.includes(k)) a.push(k); } else S.form.srcSel = a.filter((x) => x !== k); render(); },
    srcdel: (el) => { lib.sources = (lib.sources || []).filter((x) => x.id !== el.dataset.k); S.form.srcSel = S.form.srcSel.filter((x) => x !== el.dataset.k); persist(); render(); },
    addsource: () => {
      if (!FT) return; const r = FT.normalizarFonte(S.form.srcDraft); if (!r.ok) { toast(r.erros.join(' '), true); return; }
      lib.sources = lib.sources || []; lib.sources.push(r.fonte); S.form.srcSel.push(r.fonte.id); S.form.srcDraft = { title: '', authors: '', year: '', venue: '', url: '', text: '', access: 'PARTIAL' }; persist();
      toast('Fonte guardada e marcada para o pedido.' + (r.fonte.truncated ? ' O trecho foi cortado no limite.' : ''), false); render();
    },
    copydomainreq: async () => { if (!D) return; toast((await copy(D.buildDomainRequest({ topic: S.form.topic, discipline: S.form.discipline, level: S.form.level }))) ? 'Pedido de pacote copiado. Cole no seu Gem.' : 'Não consegui copiar automaticamente.', false); },
    importdomain: () => {
      if (!D) return; const r = D.importDomain(S.form.domainResp); if (!r.ok) { toast(r.error, true); return; }
      lib.domains = (lib.domains || []).filter((x) => x.id !== r.pack.id); lib.domains.unshift(r.pack); S.form.domainId = r.pack.id; S.form.domainResp = ''; persist();
      toast('Pacote "' + r.pack.nome + '" importado e em uso.' + (r.warnings.length ? ' ' + r.warnings.join(' ') : ''), false); render();
    },
    copyplanreq: async () => { toast((await copy(C.buildBlueprintRequest(S.form))) ? 'Pedido de plano copiado. Cole no seu Gem.' : 'Não consegui copiar automaticamente.', false); },
    importplan: () => {
      const r = C.importBlueprint(S.form.planoResp); if (!r.ok) { toast(r.error, true); return; }
      lib.plans = lib.plans || []; lib.plans.unshift(r.blueprint); S.planId = r.blueprint.id; S.form.planoResp = ''; persist();
      toast('Plano importado. Revise e aprove.' + (r.warnings.length ? ' ' + r.warnings.join(' ') : ''), false); render();
    },
    approveplan: () => {
      const bp = curPlan(); if (!bp) return;
      const r = C.approveBlueprint(bp, S.form.planoQuem); if (!r.ok) { toast(r.error, true); return; }
      Object.assign(bp, r.blueprint); persist(); toast('Plano aprovado.', false); render();
    },
    copyunitreq: async () => {
      const bp = curPlan(); const r = C.buildUnitRequest(bp); if (!r.ok) { toast(r.error, true); return; }
      toast((await copy(r.texto)) ? 'Pedido da unidade ' + r.unitId + ' copiado.' : 'Não consegui copiar automaticamente.', false);
    },
    applyunit: () => {
      const bp = curPlan(); const r = C.applyUnit(bp, S.form.unidadeResp); if (!r.ok) { toast(r.error, true); return; }
      Object.assign(bp, r.blueprint); S.form.unidadeResp = ''; persist();
      toast('Unidade ' + r.unitId + ' aplicada (' + r.added + ' blocos).' + (r.completo ? ' Plano completo.' : '') + (r.warnings.length ? ' ' + r.warnings.join(' ') : ''), false); render();
    },
    openplanmat: () => {
      const bp = curPlan(); if (!bp || !bp.material) return;
      const p = newProject(bp.discipline || bp.title, bp.discipline, bp.level); const rec = addMaterial(p, bp.material, 'Montado por unidades'); openMat(p.id, rec.id);
    },
    copyrepair: async () => {
      const pr = C.buildRepairPrompt(S.draft, C.problemasParaReparo(S.draft, S.avisosImport && S.avisosImport.mid === S.mid ? S.avisosImport.list : []));
      if (!pr.ok) { toast(pr.error, true); return; }
      toast((await copy(pr.texto)) ? 'Pedido de reparo copiado. Cole no mesmo Gem que gerou o material.' : 'Não consegui copiar automaticamente.', false);
    },
    applyrepair: () => {
      const r = C.applyRepair(S.draft, S.form.reparo); if (!r.ok) { toast(r.error, true); return; }
      S.draft = r.material; S.dirty = true; S.form.reparo = '';
      toast('Reparo aplicado em ' + r.changed.length + (r.changed.length === 1 ? ' bloco.' : ' blocos.') + (r.warnings.length ? ' ' + r.warnings.join(' ') : '') + ' Revise e salve.', false); render();
    },
    importjson: () => {
      const r = C.importFromText(S.form.pasted); if (!r.ok) { toast(r.error, true); return; }
      const m = r.material; const p = (S.form.target && proj(S.form.target)) || newProject(m.discipline || m.title, m.discipline, m.level);
      const rec = addMaterial(p, m, 'Importado da skill'); toast('Material importado.' + (r.warnings.length ? ' ' + r.warnings.join(' ') : '')); S.form.pasted = ''; S.flowStep = 4; S.dirty = false; openMat(p.id, rec.id); S.avisosImport = { mid: rec.id, list: r.warnings.filter((w) => !/^O JSON não declara/.test(w)) }; render();
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
    setstyle: (el) => { if (!S.draft.poster) A.mkposter(); S.draft.poster.interiorStyle = el.dataset.v; S.dirty = true; scheduleAutosave(); render(); },
    dlbook: async () => dl(slug(S.draft.title) + '-apostila-completa.html', 'text/html', await inlineAssets(C.toApostila(S.draft))),
    printbook: async () => printHTML(await inlineAssets(C.toApostila(S.draft))),
    dlposter: async () => dl(slug(S.draft.title) + '-apostila-visual.html', 'text/html', await inlineAssets(C.toHTML(S.draft, { material: false }))),
    printposter: async () => printHTML(await inlineAssets(C.toHTML(S.draft, { material: false }))),
    dlhtml: async () => dl(slug(S.draft.title) + '.html', 'text/html', await inlineAssets(C.toHTML(S.draft))),
    printall: async () => printHTML(await inlineAssets(C.toHTML(S.draft))),
    dlmd: () => dl(slug(S.draft.title) + '.md', 'text/markdown', C.toMarkdown(S.draft)),
    dljson: () => dl(slug(S.draft.title) + '.json', 'application/json', JSON.stringify(C.normalize(S.draft), null, 2)),
    dlsvg: (el) => { const b = S.draft.blocks[+el.dataset.i]; dl(slug(b.title) + '.svg', 'image/svg+xml', C.sanitizeSvg(b.svg)); },
    review: (el) => { S.draft.meta.teacherReview = el.checked ? { done: true, at: new Date().toISOString() } : { done: false }; S.dirty = true; render(); },
    demodiario: () => { S.diario = demoDiario(); saveDiario(); render(); toast('Exemplo de diário carregado.'); },
    importdiario: (el) => {
      const f = el.files[0]; if (!f) return;
      const rd = new FileReader(); rd.onload = () => {
        try { const j = JSON.parse(rd.result); if (!Array.isArray(j.entradas)) throw new Error('JSON sem "entradas"'); S.diario = j; saveDiario(); render(); toast('Diário importado.'); }
        catch (e) { toast('Diário inválido: ' + e.message, true); }
      }; rd.readAsText(f);
    },
    dldiario: () => S.diario && dl('diario-' + (S.diario.ano_letivo || '2026') + '.json', 'application/json', JSON.stringify(S.diario, null, 2)),
    adddiario: () => {
      if (!S.diario) return;
      const tema = $('#dr-tema').value.trim(); if (!tema) { toast('Informe o tema da aula.', true); return; }
      const habs = $('#dr-hab').value.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
      habs.forEach((h) => { if (!S.diario.habilidades.some((x) => x.codigo === h)) S.diario.habilidades.push({ codigo: h, descricao: 'Habilidade ' + h, verificado: false }); });
      S.diario.entradas.push({ id: C.uid('e'), data: $('#dr-data').value || new Date().toISOString().slice(0, 10), turma_id: $('#dr-turma').value, tipo: $('#dr-tipo').value, tema, habilidades: habs, resumo: $('#dr-resumo').value.trim(), reflexao: $('#dr-refl').value.trim(), destaque: !!$('#dr-resumo').value.trim() });
      saveDiario(); render(); toast('Registro adicionado ao diário.');
    },
    dlportfolio: () => { const P = window.MathLabPortfolio; if (S.diario && P) dl('portfolio-docente.html', 'text/html', P.montarHtml(S.diario, P.CFG_PADRAO(S.diario))); },
    printportfolio: () => { const P = window.MathLabPortfolio; if (S.diario && P) printHTML(P.montarHtml(S.diario, P.CFG_PADRAO(S.diario))); },
  };

  document.addEventListener('click', (e) => { const el = e.target.closest('[data-a]'); if (!el || el.type === 'checkbox' || el.type === 'file') return; if (A[el.dataset.a]) A[el.dataset.a](el, e); });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.formPlan) { S.planId = el.value; render(); return; }
    if (el.dataset.form === 'contentProfile' && C.PROFILE_SECTIONS[el.value]) {
      S.form.contentProfile = el.value;
      S.form.sections = C.PROFILE_SECTIONS[el.value].slice();
      render(); return;
    }
    if (el.dataset.form === 'type' || el.dataset.form === 'stageOverride') {
      S.form[el.dataset.form] = el.value;
      render(); return;
    }
    if ((el.type === 'checkbox' || el.type === 'file') && el.dataset.a && A[el.dataset.a]) A[el.dataset.a](el, e);
    else if (el.dataset.vis === 'kind') { S.vis.kind = el.value; S.vis.text = { numberLine: '-6, 6, -2, 5', timeline: '1789 | Revolução Francesa\n1822 | Independência do Brasil', flow: 'Observar\nFormular hipótese\nTestar\nConcluir', conceptMap: 'Tema central\nConceito A\nConceito B\nConceito C' }[el.value]; render(); }
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.libsearch) {
      const pos = el.selectionStart; S.libQuery = el.value; render();
      const inp2 = $('#libSearch'); if (inp2) { inp2.focus(); try { inp2.setSelectionRange(pos, pos); } catch (_) { /* ignora */ } }
      return;
    }
    if (el.dataset.pu) {
      const bp = curPlan(); const [i, k] = el.dataset.pu.split('.'); if (bp && bp.units[+i]) { bp.units[+i][k] = el.value; persist(); const st = $('#plano-estado'); if (st) { const e2 = C.estadoBlueprint(bp); st.textContent = e2.texto; st.className = 'pill ' + (e2.aprovado ? 'ok' : 'warn'); } }
      return;
    }
    if (el.dataset.src) { S.form.srcDraft[el.dataset.src] = el.value; return; }
    if (el.dataset.book) { S.book[el.dataset.book] = el.value; return; }
    if (el.dataset.form) {
      S.form[el.dataset.form] = el.value;
      if (el.dataset.form === 'discipline') {
        const eh = $('#epistemicHint'); if (eh) eh.innerHTML = epistHintHtml(S.form);
      }
      if (el.dataset.form === 'level') {
        const cb = $('#stageCalibrationBody'); if (cb) cb.innerHTML = calibBodyHtml(S.form);
        const sel = $('#cr-stage'); if (sel && sel.options && sel.options[0]) sel.options[0].textContent = 'Automático (' + C.calibrateStage(S.form.level, 'auto').label + ')';
      }
      return;
    }
    if (el.dataset.vis) { if (el.dataset.vis !== 'kind') S.vis[el.dataset.vis] = el.value; return; }
    if (el.dataset.f) {
      setPath(el.dataset.f, el.type === 'checkbox' ? el.checked : el.dataset.lines ? el.value.split('\n').map((x) => x.trim()).filter(Boolean) : el.value);
      if (el.dataset.f === 'revisao.aprovado') {
        if (el.checked) { S.draft.revisao.data = S.draft.revisao.data || new Date().toISOString().slice(0, 10); S.draft.revisao.hash = C.hashConteudo(S.draft); }
        else { S.draft.revisao.hash = ''; S.draft.revisao.data = ''; }
      }
      S.dirty = true; const m = $('#dirtymark'); if (m) { m.className = 'dirty'; m.textContent = '● salvando...'; }
      scheduleAutosave();
      const rs = $('#revisao-estado'); if (rs) { const e = C.estadoRevisao(S.draft); rs.textContent = e.texto; rs.className = 'pill ' + (e.validado ? 'ok' : 'warn'); }
      if (S.tab === 'poster' && S.draft.poster) { const pv = $('#posterPreview'); if (pv) pv.innerHTML = (S.draft.poster.coverClean !== false ? '<div style="margin-bottom:16px">' + C.renderCleanCover(S.draft) + '</div>' : '') + C.renderPoster(S.draft.poster, S.draft.author, S.draft.epistemicType); }
    }
  });
  window.addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- tema claro/escuro (respeita prefers-color-scheme; toggle na sessão) ---------- */
  function applyTheme(t) {
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    const btn = $('#themeBtn');
    if (btn) {
      const isDark = t === 'dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.innerHTML = (isDark ? '☀️' : '🌙') + ' <span>' + (isDark ? 'Claro' : 'Escuro') + '</span>';
    }
  }
  try { applyTheme(sessionStorage.getItem('mathlab.theme') || ''); } catch (e) { applyTheme(''); }
  const themeBtn = $('#themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const next = cur ? (cur === 'dark' ? 'light' : 'dark') : (sysDark ? 'light' : 'dark');
      try { sessionStorage.setItem('mathlab.theme', next); } catch (e) { /* ignora */ }
      applyTheme(next);
    });
  }

  /* ---------- versão unificada a partir do manifest.json ---------- */
  function setVersionText(verTopText, verFootText) {
    const vt = $('#verTop'), vf = $('#ver');
    if (vt) vt.textContent = verTopText;
    if (vf) vf.textContent = verFootText;
  }
  setVersionText('v' + C.VERSION, 'v' + C.VERSION);
  if (typeof fetch === 'function') {
    fetch('manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (!m || !m.motor) return;
      const top = 'v' + m.motor;
      const foot = 'v' + m.motor + (m.pacote ? ' · pacote ' + m.pacote : '') + (m.contrato && m.contrato.schema ? ' · ' + m.contrato.schema : '');
      setVersionText(top, foot);
    }).catch(() => { /* offline / standalone usa C.VERSION */ });
  }

  const st = document.createElement('style'); st.textContent = C.COVER_CSS + '\n' + C.POSTER_CSS; document.head.appendChild(st);
  render();
  window.__mathlab = { S, lib: () => lib, A, render };
})();
