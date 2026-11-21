/* MathLab Aulas Visuais — núcleo (sem dependências). Funciona no navegador e no Node (testes). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MathLabCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '2.0.0';
  const SCHEMA = 'mathlab.material/2';
  const DEFAULT_AUTHOR = 'Prof. Alê Barbosa';

  const REGISTROS = {
    escolar: 'Escolar (anos finais e ensino médio — termo técnico com apoio)',
    ludico: 'Lúdico (crianças, anos iniciais — frases curtas e narrativa)',
    acessivel: 'Acessível (público geral — sem jargão, glossário cotidiano)',
    tecnico: 'Técnico (ensino técnico e graduação — notação formal)',
    academico: 'Acadêmico (pós-graduação e pesquisa — demonstração e limites)',
  };

  const DESTINATARIOS = {
    estudante: 'Estudante (caderno do aluno)',
    professor: 'Professor (guia docente e mediação)',
    publico_geral: 'Público geral (divulgação científica)',
    pesquisador: 'Pesquisador (rigor formal)',
  };

  const INTERIOR_STYLES = {
    editorial: 'Editorial Clean (respiro, pílula de página, abertura com guia e colofão)',
    ludico: 'Lúdico / HQ (caixas coloridas numeradas)',
  };

  const AVATAR_OPTIONS = {
    'avatar-prof-ale-1.jpg': 'Prof. Alê — Jaleco e Livro (Pesquisa)',
    'avatar-prof-ale-2.jpg': 'Prof. Alê — Moletom MathLab',
    'avatar-prof-ale-3.jpg': 'Prof. Alê — Camisa Marinho MathLab',
    'avatar-prof-ale-4.jpg': 'Prof. Alê — Camisa Branca e Logo',
    svg: 'Mascote ilustrado (SVG offline)',
  };

  const LOGO_OPTIONS = {
    'logo-mathlab-clean.jpg': 'Logo MathLab — Fundo Claro',
    'logo-mathlab-selo.jpg': 'Selo Circular MathLab (Marinho e Dourado)',
    none: 'Sem logo',
  };

  const BLOCK_PEDAGOGY = {
    problematizacao: 'Vivência & Problema (Conceitos Cotidianos)',
    contexto: 'Contexto Histórico-Cultural',
    conceito: 'Conceito Científico & Mediação Semiótica',
    visual: 'Mediação Visual & Signos',
    exemplo: 'Exemplo Mediado Passo a Passo',
    atividade: 'Prática na ZDP (Com Apoio / Em Dupla)',
    exercicios: 'Desafios Graduados (Níveis 1 → 3)',
    gabarito: 'Conferência Comentada & Reflexão',
    avaliacao: 'Avaliação Formativa',
    acessibilidade: 'Desenho Universal & Acessibilidade',
    nota: 'Alerta Conceitual & Erros Típicos',
  };

  const CONTENT_PROFILES = {
    completo: 'Apostila completa (problematização, desenvolvimento conceitual, exemplos, atividade, exercícios graduados e gabarito)',
    expositivo: 'Somente exposição conceitual e exemplos analisados (sem exercícios nem gabarito)',
    expositivo_visual: 'Exposição conceitual + recursos visuais + exemplos (sem exercícios)',
    pratica: 'Foco em exercícios graduados + gabarito comentado',
  };

  /* ---------- utilidades ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const strip = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const minus = (v) => (v < 0 ? '−' + Math.abs(v) : String(v));

  /* ---------- tipos de conhecimento e blocos ---------- */
  const EPISTEMIC = {
    formal: { label: 'Formal (Matemática, Lógica, Estatística)', labels: ['Conceito', 'Desenvolvimento', 'Na prática', 'Pegadinhas', 'Resumo estratégico'] },
    empirica: { label: 'Empírica (Física, Química, Biologia, Ciências)', labels: ['O fenômeno', 'O modelo', 'Evidências', 'Erros comuns', 'Resumo estratégico'] },
    interpretativa: { label: 'Interpretativa (Filosofia, Sociologia, Literatura, Artes)', labels: ['A questão', 'Conceitos', 'Argumentos', 'Objeções', 'Resumo estratégico'] },
    historica: { label: 'Histórica (História, Geografia humana)', labels: ['Contexto', 'Fatos', 'Fontes', 'Consequências', 'Resumo estratégico'] },
    linguistica: { label: 'Linguística (Português, Línguas, Redação)', labels: ['Uso', 'Regra', 'Exemplos', 'Armadilhas', 'Resumo estratégico'] },
    pratica: { label: 'Prática (Ed. Física, Informática, Técnicos, Música)', labels: ['Para que serve', 'Passo a passo', 'Cuidados', 'Erros comuns', 'Resumo estratégico'] },
    geral: { label: 'Geral / mista', labels: ['Conceito', 'Desenvolvimento', 'Na prática', 'Pegadinhas', 'Resumo estratégico'] },
  };

  const BLOCK_TYPES = {
    problematizacao: ['Problematização', '💡'],
    contexto: ['Contexto', '🧭'],
    conceito: ['Desenvolvimento conceitual', '📘'],
    exemplo: ['Exemplo resolvido / analisado', '✏️'],
    visual: ['Recurso visual', '🖼️'],
    atividade: ['Atividade orientada', '🧩'],
    exercicios: ['Exercícios graduados', '📝'],
    gabarito: ['Gabarito comentado', '✅'],
    avaliacao: ['Avaliação formativa', '🎯'],
    acessibilidade: ['Acessibilidade', '♿'],
    nota: ['Nota', '📌'],
  };

  function detectType(discipline) {
    const d = strip(discipline);
    const has = (...k) => k.some((x) => d.includes(x));
    if (has('educacao fisica', 'informatica', 'programacao', 'musica', 'tecnic', 'culinaria', 'enfermagem', 'robotica')) return 'pratica';
    if (has('matematica', 'logica', 'geometria', 'algebra', 'estatistica', 'aritmetica', 'calculo')) return 'formal';
    if (has('fisica', 'quimica', 'biologia', 'ciencias', 'astronomia')) return 'empirica';
    if (has('portugues', 'lingua', 'ingles', 'espanhol', 'redacao', 'gramatica', 'frances')) return 'linguistica';
    if (has('historia', 'arqueologia')) return 'historica';
    if (has('filosofia', 'sociologia', 'literatura', 'arte', 'religios', 'psicologia', 'direito', 'etica')) return 'interpretativa';
    return 'geral';
  }

  /* ---------- SVG seguro ---------- */
  const DANGEROUS = /<script|<foreignObject|<iframe|<image\b|\son\w+\s*=|javascript:/i;
  function sanitizeSvg(s) {
    s = String(s || '');
    if (!/<svg[\s>]/i.test(s)) return '';
    return s
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<image\b[^>]*>(\s*<\/image>)?/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(xlink:href|href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '');
  }

  /* ---------- Markdown mínimo e seguro ---------- */
  // fórmula = $...$ cujo $ de abertura não vem colado em letra/número (assim "R$ 40" não vira fórmula)
  const MATH_RE = /(^|[^\w$])\$(?=\S)([^$\n]*?\S)\$(?!\w)/g;
  const MATH_OPEN = /(^|[^\w$])\$(?=\S)/;
  function inline(s) {
    const stash = [];
    const keep = (h) => '\u0000' + (stash.push(h) - 1) + '\u0000';
    s = String(s);
    s = s.replace(/`([^`]+)`/g, (_, c) => keep('<code>' + esc(c) + '</code>'));
    s = s.replace(MATH_RE, (_, pre, c) => pre + keep('<span class="math">' + esc(c) + '</span>'));
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[+i]);
  }

  function renderMarkdown(md) {
    const L = String(md || '').replace(/\r/g, '').split('\n');
    const out = [];
    let i = 0;
    const special = (l) => /^(#{1,4})\s/.test(l) || /^\s*[-*]\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l) || /^\s*\|/.test(l) || /^>\s?/.test(l);
    while (i < L.length) {
      const l = L[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { const n = Math.min(6, m[1].length + 2); out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); i++; continue; }
      if (/^\s*[-*]\s+/.test(l)) {
        const it = [];
        while (i < L.length && /^\s*[-*]\s+/.test(L[i])) { it.push('<li>' + inline(L[i].replace(/^\s*[-*]\s+/, '')) + '</li>'); i++; }
        out.push('<ul>' + it.join('') + '</ul>'); continue;
      }
      if ((m = l.match(/^\s*(\d+)[.)]\s+/))) {
        const start = +m[1]; const it = [];
        while (i < L.length && /^\s*\d+[.)]\s+/.test(L[i])) { it.push('<li>' + inline(L[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'); i++; }
        out.push('<ol start="' + start + '">' + it.join('') + '</ol>'); continue;
      }
      if (/^\s*\|/.test(l) && L[i + 1] && /^\s*\|?\s*:?-{2,}/.test(L[i + 1])) {
        const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const head = cells(l); i += 2; const rows = [];
        while (i < L.length && /^\s*\|/.test(L[i])) { rows.push(cells(L[i])); i++; }
        out.push('<table><thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
          rows.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>');
        continue;
      }
      if (/^>\s?/.test(l)) {
        const q = [];
        while (i < L.length && /^>\s?/.test(L[i])) { q.push(L[i].replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>'); continue;
      }
      const p = [];
      while (i < L.length && L[i].trim() && !special(L[i])) { p.push(L[i]); i++; }
      if (!p.length) { p.push(L[i]); i++; }
      out.push('<p>' + p.map(inline).join('<br>') + '</p>');
    }
    return out.join('\n');
  }

  /* ---------- geradores de SVG (funcionam offline, qualquer disciplina) ---------- */
  const NAVY = '#14264f', GOLD = '#f2b705', BLUE = '#1e6fd9', GREEN = '#22a559', RED = '#d6453d', GREY = '#6b7690';

  function svgWrap(w, h, title, desc, inner) {
    const id = uid('s');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-labelledby="' + id + 't ' + id + 'd" font-family="Arial, Helvetica, sans-serif">' +
      '<title id="' + id + 't">' + esc(title) + '</title><desc id="' + id + 'd">' + esc(desc) + '</desc>' + inner + '</svg>';
  }
  function wrapText(text, max) {
    const words = String(text).split(/\s+/); const lines = []; let cur = '';
    words.forEach((w) => { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }
  const tspans = (lines, x, y, lh) => lines.map((t, k) => '<tspan x="' + x + '" y="' + (y + k * lh) + '">' + esc(t) + '</tspan>').join('');

  function numberLine(o) {
    o = Object.assign({ min: -6, max: 6, marks: [], jump: null }, o || {});
    const W = 720, H = o.jump ? 190 : 120, pad = 40, y = o.jump ? 130 : 66;
    const x = (v) => pad + ((v - o.min) / (o.max - o.min)) * (W - 2 * pad);
    const step = o.max - o.min <= 30 ? 1 : Math.ceil((o.max - o.min) / 20);
    let g = '<line x1="' + (pad - 14) + '" y1="' + y + '" x2="' + (W - pad + 14) + '" y2="' + y + '" stroke="' + NAVY + '" stroke-width="3"/>';
    g += '<polygon points="' + (W - pad + 22) + ',' + y + ' ' + (W - pad + 8) + ',' + (y - 6) + ' ' + (W - pad + 8) + ',' + (y + 6) + '" fill="' + NAVY + '"/>';
    g += '<polygon points="' + (pad - 22) + ',' + y + ' ' + (pad - 8) + ',' + (y - 6) + ' ' + (pad - 8) + ',' + (y + 6) + '" fill="' + NAVY + '"/>';
    for (let v = o.min; v <= o.max; v += step) {
      g += '<line x1="' + x(v) + '" y1="' + (y - 8) + '" x2="' + x(v) + '" y2="' + (y + 8) + '" stroke="' + NAVY + '" stroke-width="2"/>';
      g += '<text x="' + x(v) + '" y="' + (y + 28) + '" text-anchor="middle" font-size="15" fill="' + NAVY + '" font-weight="' + (v === 0 ? 700 : 400) + '">' + minus(v) + '</text>';
    }
    if (o.jump) {
      const a = o.jump.from, b = a + o.jump.by, xa = x(a), xb = x(b), mid = (xa + xb) / 2, top = y - 86;
      g += '<path d="M ' + xa + ' ' + (y - 10) + ' Q ' + mid + ' ' + top + ' ' + (xb - (o.jump.by > 0 ? 3 : -3)) + ' ' + (y - 12) + '" fill="none" stroke="' + (o.jump.by >= 0 ? GREEN : RED) + '" stroke-width="4"/>';
      const dir = o.jump.by >= 0 ? -1 : 1;
      g += '<polygon points="' + xb + ',' + (y - 8) + ' ' + (xb + dir * 14) + ',' + (y - 24) + ' ' + (xb + dir * 4) + ',' + (y - 26) + '" fill="' + (o.jump.by >= 0 ? GREEN : RED) + '"/>';
      g += '<text x="' + mid + '" y="' + (top + 22) + '" text-anchor="middle" font-size="20" font-weight="700" fill="' + (o.jump.by >= 0 ? GREEN : RED) + '">' + (o.jump.by >= 0 ? '+' : '−') + Math.abs(o.jump.by) + '</text>';
      g += '<circle cx="' + xa + '" cy="' + y + '" r="8" fill="' + GOLD + '" stroke="' + NAVY + '" stroke-width="2"/>';
      g += '<circle cx="' + xb + '" cy="' + y + '" r="8" fill="' + BLUE + '" stroke="' + NAVY + '" stroke-width="2"/>';
    }
    (o.marks || []).forEach((m) => { g += '<circle cx="' + x(m) + '" cy="' + y + '" r="7" fill="' + GOLD + '" stroke="' + NAVY + '" stroke-width="2"/>'; });
    const desc = 'Reta numérica de ' + minus(o.min) + ' a ' + minus(o.max) + (o.jump ? ', com salto de ' + minus(o.jump.from) + ' para ' + minus(o.jump.from + o.jump.by) : '') + '.';
    return svgWrap(W, H, o.title || 'Reta numérica', desc, g);
  }

  function timeline(o) {
    const ev = (o && o.events) || []; const n = Math.max(ev.length, 1); const W = 760, H = 270, y = 135;
    let g = '<line x1="30" y1="' + y + '" x2="' + (W - 30) + '" y2="' + y + '" stroke="' + NAVY + '" stroke-width="4"/>';
    ev.forEach((e, i) => {
      const x = n === 1 ? W / 2 : 60 + (i * (W - 120)) / (n - 1); const up = i % 2 === 0;
      g += '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + GOLD + '" stroke="' + NAVY + '" stroke-width="3"/>';
      g += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (up ? y - 34 : y + 34) + '" stroke="' + NAVY + '" stroke-width="2"/>';
      const ly = up ? y - 102 : y + 74;
      g += '<text x="' + x + '" y="' + ly + '" text-anchor="middle" font-size="14" fill="' + NAVY + '">' + tspans(wrapText(e.label, 20), x, ly, 17) + '</text>';
      g += '<text x="' + x + '" y="' + (up ? y - 42 : y + 54) + '" text-anchor="middle" font-size="15" font-weight="700" fill="' + BLUE + '">' + esc(e.when) + '</text>';
    });
    return svgWrap(W, H, (o && o.title) || 'Linha do tempo', 'Linha do tempo com ' + ev.length + ' eventos: ' + ev.map((e) => e.when + ' ' + e.label).join('; ') + '.', g);
  }

  function flow(o) {
    const st = (o && o.steps) || []; const W = 420, bh = 50, gap = 28, H = st.length * (bh + gap) + 10;
    let g = '';
    st.forEach((s, i) => {
      const y = 5 + i * (bh + gap);
      g += '<rect x="40" y="' + y + '" width="340" height="' + bh + '" rx="12" fill="' + (i % 2 ? '#eaf2ff' : '#fff7d6') + '" stroke="' + NAVY + '" stroke-width="2"/>';
      g += '<circle cx="62" cy="' + (y + bh / 2) + '" r="13" fill="' + NAVY + '"/><text x="62" y="' + (y + bh / 2 + 5) + '" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">' + (i + 1) + '</text>';
      g += '<text x="86" y="' + (y + bh / 2 - (wrapText(s, 34).length > 1 ? 5 : -5)) + '" font-size="14" fill="' + NAVY + '">' + tspans(wrapText(s, 34), 86, y + bh / 2 - (wrapText(s, 34).length > 1 ? 5 : -5), 17) + '</text>';
      if (i < st.length - 1) g += '<path d="M 210 ' + (y + bh) + ' L 210 ' + (y + bh + gap - 4) + '" stroke="' + NAVY + '" stroke-width="3"/><polygon points="210,' + (y + bh + gap) + ' 203,' + (y + bh + gap - 10) + ' 217,' + (y + bh + gap - 10) + '" fill="' + NAVY + '"/>';
    });
    return svgWrap(W, H, (o && o.title) || 'Fluxograma', 'Fluxograma em ' + st.length + ' etapas: ' + st.join(' → ') + '.', g);
  }

  function conceptMap(o) {
    const nodes = (o && o.nodes) || []; const W = 720, H = 400, cx = 360, cy = 200, n = Math.max(nodes.length, 1);
    let g = '';
    nodes.forEach((t, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2; const x = cx + Math.cos(a) * 270, y = cy + Math.sin(a) * 150;
      g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" stroke="' + GREY + '" stroke-width="2"/>';
      g += '<ellipse cx="' + x + '" cy="' + y + '" rx="78" ry="34" fill="#eaf2ff" stroke="' + BLUE + '" stroke-width="2"/>';
      const ln = wrapText(t, 16); g += '<text x="' + x + '" y="' + (y - (ln.length - 1) * 8 + 5) + '" text-anchor="middle" font-size="13" fill="' + NAVY + '">' + tspans(ln, x, y - (ln.length - 1) * 8 + 5, 16) + '</text>';
    });
    const c = wrapText((o && o.center) || 'Tema', 14);
    g += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="90" ry="42" fill="' + GOLD + '" stroke="' + NAVY + '" stroke-width="3"/>';
    g += '<text x="' + cx + '" y="' + (cy - (c.length - 1) * 9 + 6) + '" text-anchor="middle" font-size="17" font-weight="700" fill="' + NAVY + '">' + tspans(c, cx, cy - (c.length - 1) * 9 + 6, 19) + '</text>';
    return svgWrap(W, H, (o && o.title) || 'Mapa conceitual', 'Mapa conceitual com tema central "' + ((o && o.center) || '') + '" ligado a: ' + nodes.join(', ') + '.', g);
  }

  const VISUALS = { numberLine, timeline, flow, conceptMap };

  /* ---------- Apostila visual (pôster de uma página) ---------- */
  const POSTER_THEMES = {
    alegre: { nome: 'Alegre (azul, verde, laranja, rosa, roxo)', c: ['#1e6fd9', '#22a559', '#f28a1f', '#e0457b', '#7a4bd1'], bg: '#fff8e6', title: '#1b2a6b', accent: '#ffd23f' },
    marinho: { nome: 'Marinho e dourado (identidade MathLab)', c: ['#14264f', '#b8860b', '#1e6fd9', '#8a5a00', '#2c4a8f'], bg: '#fffdf4', title: '#14264f', accent: '#f2b705' },
    suave: { nome: 'Suave (tons pastel, economiza tinta)', c: ['#5b8def', '#4fb286', '#f0a35e', '#d97a9c', '#9a7ad9'], bg: '#ffffff', title: '#26335f', accent: '#ffe08a' },
  };

  const MASCOT_SVG = '<svg viewBox="0 0 120 130" role="img" aria-label="Mascote estudante sorridente"><title>Mascote</title>' +
    '<ellipse cx="60" cy="122" rx="38" ry="6" fill="rgba(0,0,0,.12)"/><rect x="30" y="72" width="60" height="46" rx="14" fill="#1e6fd9"/>' +
    '<rect x="40" y="86" width="40" height="28" rx="4" fill="#fff" stroke="#14264f" stroke-width="3"/><line x1="60" y1="86" x2="60" y2="114" stroke="#14264f" stroke-width="3"/>' +
    '<circle cx="60" cy="44" r="32" fill="#ffd9b0" stroke="#14264f" stroke-width="3"/><path d="M28 40 Q30 10 62 12 Q92 12 92 40 Q80 24 60 26 Q40 26 28 40Z" fill="#4a2c17" stroke="#14264f" stroke-width="3"/>' +
    '<circle cx="48" cy="46" r="5" fill="#14264f"/><circle cx="72" cy="46" r="5" fill="#14264f"/><circle cx="50" cy="44" r="1.8" fill="#fff"/><circle cx="74" cy="44" r="1.8" fill="#fff"/>' +
    '<path d="M46 58 Q60 72 74 58" fill="#fff" stroke="#14264f" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="56" r="5" fill="#ff9aa2" opacity=".7"/><circle cx="82" cy="56" r="5" fill="#ff9aa2" opacity=".7"/></svg>';

  const BOOKS_ICON_SVG = '<svg viewBox="0 0 90 90" width="76" height="76" role="img" aria-label="Livros e lápis escolares"><title>Livros escolares</title>' +
    '<rect x="10" y="54" width="66" height="16" rx="4" fill="#e0457b" stroke="#1b2a6b" stroke-width="2.5"/>' +
    '<rect x="14" y="38" width="62" height="16" rx="4" fill="#22a559" stroke="#1b2a6b" stroke-width="2.5"/>' +
    '<rect x="8" y="22" width="66" height="16" rx="4" fill="#1e6fd9" stroke="#1b2a6b" stroke-width="2.5"/>' +
    '<line x1="20" y1="22" x2="20" y2="38" stroke="#ffd23f" stroke-width="3"/><line x1="24" y1="38" x2="24" y2="54" stroke="#fff" stroke-width="3"/>' +
    '<polygon points="68,8 78,12 62,48 52,44" fill="#ffd23f" stroke="#1b2a6b" stroke-width="2.2"/><polygon points="52,44 62,48 53,55" fill="#ffd9b0" stroke="#1b2a6b" stroke-width="2"/></svg>';

  const FONTS_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Fredoka:wght@600;700&family=Nunito:wght@400;600;700;800&family=Patrick+Hand&display=swap" rel="stylesheet">';

  const COVER_CSS = [
    '.mlclean{--c1:#1e6fd9;--c2:#22a559;--c3:#f28a1f;--c4:#e0457b;--c5:#7a4bd1;--bg:#fffdf8;--tt:#14264f;--ac:#f2b705;box-sizing:border-box;width:794px;max-width:100%;min-height:1100px;margin:0 auto;padding:42px 48px 36px;background:radial-gradient(circle at 88% 12%,rgba(242,183,5,.14) 0%,transparent 38%),radial-gradient(circle at 12% 88%,rgba(30,111,217,.10) 0%,transparent 42%),var(--bg);border:4px solid var(--tt);border-radius:16px;display:flex;flex-direction:column;justify-content:space-between;font-family:"Nunito","Segoe UI",Arial,sans-serif;color:var(--tt);-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '.mlclean-top{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:3px solid var(--ac);padding-bottom:18px}',
    '.mlclean-logo{max-height:76px;max-width:210px;object-fit:contain;border-radius:10px}',
    '.mlclean-brand{font-family:"Fredoka",sans-serif;font-size:15px;font-weight:700;color:var(--tt);letter-spacing:.6px;text-transform:uppercase;text-align:right}',
    '.mlclean-brand small{display:block;font-family:"Caveat",cursive;font-size:20px;font-weight:700;color:#b87700;text-transform:none;letter-spacing:0}',
    '.mlclean-mid{text-align:center;padding:24px 10px}',
    '.mlclean-pills{display:inline-flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:18px}',
    '.mlclean-pills span{background:#eef4ff;border:2px solid var(--tt);border-radius:99px;padding:4px 14px;font-size:13px;font-weight:800;color:var(--tt)}',
    '.mlclean-title{margin:0 auto 14px;max-width:650px;font-family:"Fredoka","Trebuchet MS",sans-serif;font-weight:700;font-size:48px;line-height:1.08;color:var(--tt);text-shadow:2px 2px 0 var(--ac)}',
    '.mlclean-sub{margin:0 auto 28px;max-width:600px;font-family:"Caveat","Patrick Hand",cursive;font-size:30px;line-height:1.18;color:#2c4a8f;font-weight:700}',
    '.mlclean-avatar-wrap{display:inline-flex;flex-direction:column;align-items:center;gap:10px;background:#fff;border:3px solid var(--tt);border-radius:22px;padding:18px 28px;box-shadow:6px 6px 0 var(--ac)}',
    '.mlclean-avatar{width:148px;height:148px;border-radius:50%;object-fit:cover;object-position:top center;border:4px solid var(--ac);box-shadow:0 4px 14px rgba(20,38,79,.18)}',
    '.mlclean-author{font-family:"Caveat","Patrick Hand",cursive;font-size:28px;font-weight:700;color:var(--tt);line-height:1.1}',
    '.mlclean-role{font-size:12.5px;font-weight:700;color:#55607a;letter-spacing:.3px}',
    '.mlclean-bot{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:2px dashed #b9c3d9;padding-top:14px;font-size:12.5px;color:#55607a;font-weight:700}',
    '@media print{.mlclean{width:210mm;min-height:296mm;border-radius:0;padding:18mm 18mm 14mm}}',
    '@media(max-width:620px){.mlclean{padding:24px 18px;min-height:0}.mlclean-title{font-size:34px}.mlclean-sub{font-size:24px}}',
  ].join('\n');

  const POSTER_CSS = [
    '.mlp{--c1:#1e6fd9;--c2:#22a559;--c3:#f28a1f;--c4:#e0457b;--c5:#7a4bd1;--bg:#fff8e6;--tt:#1b2a6b;--ac:#ffd23f;box-sizing:border-box;max-width:794px;margin:0 auto;padding:20px;background:radial-gradient(rgba(27,42,107,.07) 1.5px,transparent 1.5px) 0 0/18px 18px,var(--bg);border:4px solid var(--tt);border-radius:18px;font-family:"Patrick Hand","Trebuchet MS","Segoe UI",Arial,sans-serif;color:#1d2433;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '.mlp *{box-sizing:border-box}',
    '.mlp-head{display:flex;align-items:center;gap:14px;margin-bottom:14px;background:rgba(255,255,255,.72);border:3px solid var(--tt);border-radius:16px;padding:10px 14px;box-shadow:4px 4px 0 var(--tt)}',
    '.mlp-mascot{flex:0 0 112px;text-align:center}.mlp-mascot svg{width:112px;height:auto}.mlp-mascot img{width:104px;height:104px;border-radius:50%;object-fit:cover;object-position:top center;border:3px solid var(--tt);box-shadow:3px 3px 0 var(--ac)}',
    '.mlp-deco{flex:0 0 84px;text-align:right}.mlp-deco img{max-width:84px;max-height:74px;object-fit:contain;border-radius:8px}@media(max-width:620px){.mlp-deco{display:none}}',
    '.mlp-title{margin:0;font-family:"Fredoka",Impact,"Arial Black",sans-serif;font-weight:700;font-size:40px;line-height:1.02;color:var(--ac);-webkit-text-stroke:3px var(--tt);paint-order:stroke fill;text-shadow:3px 3px 0 var(--tt);letter-spacing:.4px;text-transform:none}',
    '.mlp-sub{display:inline-block;margin:8px 0 0;padding:4px 14px;background:#fff;border:2.5px solid var(--tt);border-radius:12px;font-family:"Caveat","Patrick Hand",cursive,sans-serif;font-size:22px;font-weight:700;color:var(--tt);line-height:1.15}',
    '.mlp-author{display:inline-block;margin:6px 0 0 6px;padding:3px 13px;background:var(--ac);border:2.5px solid var(--tt);border-radius:99px;font-family:"Caveat","Patrick Hand",cursive,sans-serif;font-size:20px;font-weight:700;color:var(--tt);box-shadow:2px 2px 0 var(--tt);line-height:1.15}',
    '.mlp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '.mlp-card{position:relative;background:#fff;border:3px solid var(--c);border-radius:14px;padding:34px 12px 12px;min-height:98px;box-shadow:4px 4px 0 rgba(27,42,107,.16)}',
    '.mlp-card:last-child:nth-child(odd){grid-column:1/-1}',
    '.mlp-tag{position:absolute;top:-3px;left:-3px;display:flex;align-items:center;gap:6px;background:var(--c);color:#fff;border-radius:14px 10px 10px 0;padding:3px 12px 3px 6px;font-family:"Fredoka","Trebuchet MS",sans-serif;font-weight:700;font-size:15px}',
    '.mlp-num{display:inline-flex;width:22px;height:22px;border-radius:50%;background:#fff;color:var(--c);align-items:center;justify-content:center;font-size:14px}',
    '.mlp-card b{display:block;font-size:15px;color:var(--c);margin-bottom:2px}',
    '.mlp-card p{margin:0;font-size:15px;line-height:1.32}',
    '.mlp-extras{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:12px}',
    '.mlp-box{border-radius:14px;padding:10px 12px;font-size:14.5px;line-height:1.32;border:3px solid var(--tt);box-shadow:3px 3px 0 var(--tt)}',
    '.mlp-box h4{margin:0 0 4px;font-family:"Fredoka",Impact,"Arial Black",sans-serif;font-size:17px;letter-spacing:.3px}',
    '.mlp-gold{background:#fff3b8}.mlp-know{background:#dff3ff}.mlp-warn{background:#ffe0dc;border-color:#d6453d}.mlp-warn h4{color:#d6453d}',
    '.mlp-summary{display:grid;grid-template-columns:auto repeat(4,1fr);gap:8px;align-items:stretch;margin-top:12px;background:#fff;border:3px solid var(--c2);border-radius:14px;padding:8px;box-shadow:4px 4px 0 rgba(34,165,89,.22)}',
    '.mlp-sumlabel{align-self:center;font-family:"Fredoka",Impact,"Arial Black",sans-serif;font-size:20px;color:var(--c2);padding:0 6px}',
    '.mlp-item{text-align:center;font-size:13px;line-height:1.25}.mlp-item i{display:block;font-style:normal;font-size:26px}.mlp-item strong{display:block;color:var(--tt)}',
    '@media(max-width:620px){.mlp-grid,.mlp-extras{grid-template-columns:1fr}.mlp-summary{grid-template-columns:1fr 1fr}.mlp-sumlabel{grid-column:1/-1}.mlp-title{font-size:32px}.mlp-head{flex-direction:column;align-items:flex-start}}',
    '@media print{.mlp{border-radius:0;max-width:none;padding:12px}}',
  ].join('\n');

  function themeStyle(name) {
    const t = POSTER_THEMES[name] || POSTER_THEMES.alegre;
    return '--c1:' + t.c[0] + ';--c2:' + t.c[1] + ';--c3:' + t.c[2] + ';--c4:' + t.c[3] + ';--c5:' + t.c[4] + ';--bg:' + t.bg + ';--tt:' + t.title + ';--ac:' + t.accent;
  }

  function assetSrc(file) {
    const inlineMap = typeof window !== 'undefined' && window.MATHLAB_INLINE_ASSETS;
    if (inlineMap && inlineMap[file]) return inlineMap[file];
    return 'assets/' + esc(file);
  }

  function avatarHtml(choice, cls) {
    const c = choice || 'avatar-prof-ale-1.jpg';
    if (c === 'svg' || !AVATAR_OPTIONS[c]) return MASCOT_SVG;
    return '<img class="' + (cls || 'ml-av') + '" src="' + assetSrc(c) + '" alt="Prof. Alê Barbosa">';
  }

  function logoHtml(choice, cls) {
    const c = choice || 'logo-mathlab-clean.jpg';
    if (c === 'none' || !LOGO_OPTIONS[c]) return '';
    return '<img class="' + (cls || 'ml-lg') + '" src="' + assetSrc(c) + '" alt="MathLab Educação">';
  }

  function renderCleanCover(m) {
    m = normalize(m);
    const p = m.poster || {};
    const auth = String(p.author || m.author || DEFAULT_AUTHOR).trim();
    const title = (p && p.title) || m.title || 'Material Didático';
    const sub = (p && p.subtitle) || (m.topic && m.topic !== title ? m.topic : 'Material didático visual');
    const lg = logoHtml(p.logoChoice, 'mlclean-logo');
    const profLabel = m.contentProfile === 'expositivo' ? 'Expositivo' : m.contentProfile === 'expositivo_visual' ? 'Expositivo Visual' : m.contentProfile === 'pratica' ? 'Prática' : 'Completo';
    const pills = [m.discipline, m.level, profLabel].filter(Boolean).map((x) => '<span>' + esc(x) + '</span>').join('');
    return '<article class="mlclean" style="' + themeStyle(p.theme) + '">' +
      '<header class="mlclean-top">' + (lg || '<div></div>') + '<div class="mlclean-brand">MathLab Educação<small>Matemática em Investigação</small></div></header>' +
      '<section class="mlclean-mid"><div class="mlclean-pills">' + pills + '</div>' +
      '<h1 class="mlclean-title">' + esc(title) + '</h1>' +
      '<p class="mlclean-sub">' + esc(sub) + '</p>' +
      '<div class="mlclean-avatar-wrap"><div style="width:128px">' + MASCOT_SVG + '</div>' +
      '<div class="mlclean-author">' + esc(auth) + '</div><div class="mlclean-role">Autoria Docente · Psicologia Histórico-Cultural</div></div></section>' +
      '<footer class="mlclean-bot"><span>' + (m.duration ? '⏱️ ' + esc(m.duration) : 'Material de Apoio Pedagógico') + '</span><span>' + esc(estadoRevisao(m).texto) + '</span></footer>' +
      '</article>';
  }

  function renderPoster(p, author) {
    if (!p) return '';
    const auth = String(p.author || author || DEFAULT_AUTHOR).trim();
    const av = MASCOT_SVG;
    const lg = logoHtml(p.logoChoice);
    const secs = (p.sections || []).map((s, i) =>
      '<div class="mlp-card" style="--c:var(--c' + ((i % 5) + 1) + ')"><div class="mlp-tag"><span class="mlp-num">' + (i + 1) + '</span>' + esc(s.label || '') + '</div>' +
      (s.title ? '<b>' + esc(s.title) + '</b>' : '') + '<p>' + esc(s.text || '') + '</p></div>').join('');
    const extra = [];
    if (p.goldTip) extra.push('<div class="mlp-box mlp-gold"><h4>💡 DICA DE OURO</h4>' + esc(p.goldTip) + '</div>');
    if (p.didYouKnow) extra.push('<div class="mlp-box mlp-know"><h4>VOCÊ SABIA?</h4>' + esc(p.didYouKnow) + '</div>');
    if (p.attention) extra.push('<div class="mlp-box mlp-warn"><h4>⚠️ ATENÇÃO AOS DETALHES!</h4>' + esc(p.attention) + '</div>');
    const sum = (p.summary || []).map((s) => '<div class="mlp-item"><i>' + esc(s.icon || '⭐') + '</i><strong>' + esc(s.label) + '</strong>' + esc(s.text || '') + '</div>').join('');
    return '<article class="mlp" style="' + themeStyle(p.theme) + '"><header class="mlp-head"><div class="mlp-mascot">' + av + '</div><div style="flex:1"><h1 class="mlp-title">' + esc(p.title || '') + '</h1>' +
      '<div>' + (p.subtitle ? '<span class="mlp-sub">' + esc(p.subtitle) + '</span>' : '') +
      (auth ? '<span class="mlp-author">✍️ ' + esc(auth) + '</span>' : '') + '</div></div><div class="mlp-deco">' + (lg || BOOKS_ICON_SVG) + '</div></header><section class="mlp-grid">' + secs + '</section>' +
      (extra.length ? '<section class="mlp-extras">' + extra.join('') + '</section>' : '') +
      (sum ? '<footer class="mlp-summary"><span class="mlp-sumlabel">EM RESUMO:</span>' + sum + '</footer>' : '') + '</article>';
  }

  /* Prompt para IA de imagem (Nano Banana / Gemini): texto exato, curto, sem proporção. */
  function buildImagePrompt(m) {
    const p = m.poster; if (!p) return '';
    const auth = String(p.author || m.author || DEFAULT_AUTHOR).trim();
    const L = [];
    L.push('Crie uma apostila visual em forma de pôster infográfico educativo colorido, em página única, com ilustração estilo cartoon 3D vibrante, letras manuscritas/arredondadas estilo HQ e acabamento profissional.');
    L.push('Assunto: ' + (m.topic || m.title || p.title) + (m.discipline ? ' (' + m.discipline + (m.level ? ', ' + m.level : '') + ')' : '') + '.');
    L.push('TÍTULO grande no topo, em letras 3D arredondadas e divertidas, cor amarela com contorno azul-marinho e sombra sólida: "' + p.title + '".');
    if (p.subtitle) L.push('Subtítulo em faixa clara estilo manuscrito logo abaixo: "' + p.subtitle + '".');
    if (auth) L.push('Assinatura/Selo de autoria visível na capa: "' + auth + '".');
    L.push('PERSONAGEM MASCOTE: ' + (p.mascot || 'um estudante simpático e original, sorridente, segurando livros coloridos') + ' — personagem original, expressivo, com balões de fala curtos e ícones escolares ao redor (pilha de livros, lápis, lâmpada, globo).');
    L.push('CAIXAS NUMERADAS, cada uma com cor própria, borda grossa, sombra sólida, número em círculo e rótulo em destaque (escreva o texto exatamente como abaixo):');
    (p.sections || []).forEach((s, i) => L.push((i + 1) + ') ' + String(s.label || '').toUpperCase() + (s.title ? ' — ' + s.title : '') + ': "' + s.text + '"'));
    const ex = [];
    if (p.goldTip) ex.push('DICA DE OURO (ícone de lâmpada): "' + p.goldTip + '"');
    if (p.didYouKnow) ex.push('VOCÊ SABIA? (ícone de lâmpada ou interrogação): "' + p.didYouKnow + '"');
    if (p.attention) ex.push('ATENÇÃO AOS DETALHES! (ícone de alerta, caixa em vermelho): "' + p.attention + '"');
    if (ex.length) L.push('CAIXAS EXTRAS: ' + ex.join(' | '));
    if ((p.summary || []).length) L.push('FAIXA FINAL "EM RESUMO:" com ' + p.summary.length + ' ícones ilustrados e legendas curtas: ' + p.summary.map((s) => s.icon + ' "' + s.label + (s.text ? ' — ' + s.text : '') + '"').join('; ') + '.');
    L.push('REGRAS: todo o texto em português do Brasil, escrito exatamente como fornecido, sem erros de ortografia e sem inventar textos extras; letras grandes, manuscritas/arredondadas e legíveis; fundo claro com textura sutil; muitos ícones e pequenas ilustrações relacionadas ao assunto; hierarquia visual clara; sem marca d\'água de terceiros e sem personagens de filmes ou desenhos conhecidos.');
    return L.join('\n');
  }

  /* ---------- Pedido para colar no Gem/Claude/ChatGPT (modo sem custo) ---------- */
  function buildRequestText(r) {
    r = r || {};
    const t = r.type && r.type !== 'auto' ? r.type : detectType(r.discipline);
    const prof = CONTENT_PROFILES[r.contentProfile] ? r.contentProfile : 'completo';
    const reg = REGISTROS[r.registro] ? r.registro : 'escolar';
    const dest = DESTINATARIOS[r.destinatario] ? r.destinatario : 'estudante';
    const auth = String(r.author || DEFAULT_AUTHOR).trim();
    return [
      'Use o MathLab Aulas Visuais para criar um material didático.',
      'Autor: ' + auth,
      'Base pedagógica: Psicologia Histórico-Cultural (Vigotski, Luria, Leontiev — ZDP, mediação semiótica e formação de conceitos científicos; sem confundir ZDP com scaffolding de Wood, Bruner & Ross, 1976).',
      'Disciplina: ' + (r.discipline || '[informe]'),
      'Etapa de ensino: ' + (r.level || '[informe]'),
      'Público e registro: ' + DESTINATARIOS[dest] + ' · Registro ' + REGISTROS[reg],
      'Tema: ' + (r.topic || '[informe]'),
      'Duração: ' + (r.duration || '1 aula de 50 minutos'),
      'Tipo de conhecimento: ' + EPISTEMIC[t].label,
      'Perfil de conteúdo desejado (' + prof + '): ' + CONTENT_PROFILES[prof],
      prof === 'expositivo' || prof === 'expositivo_visual' ? 'ATENÇÃO: O professor solicitou SOMENTE exposição conceitual/exemplos, SEM lista de exercícios e SEM gabarito.' : '',
      'Extensão do miolo: SEM limite máximo de páginas — desenvolva com profundidade adequada ao tema e à duração.',
      r.objectives ? 'Objetivos desejados: ' + r.objectives : '',
      'Entregue o material (com caixas de destaque nos blocos) e a apostila visual (capa em pôster com author "' + auth + '") no formato ' + SCHEMA + '.',
      'Responda SOMENTE com um bloco de código JSON válido, sem texto antes nem depois.',
      'Não invente referências; se não pesquisou, deixe "references" vazio e declare a limitação em "limitations".',
    ].filter(Boolean).join('\n');
  }

  /* ---------- normalização, validação, importação ---------- */
  const CALLOUTS = { dica: ['💡 DICA DE OURO', 'gold'], sabia: ['🔎 VOCÊ SABIA?', 'know'], atencao: ['⚠️ ATENÇÃO AOS DETALHES!', 'warn'], prova: ['🎯 COBRANÇA EM PROVAS', 'prova'] };

  /* ---------- estado de revisão: só o professor valida, aqui no site ---------- */
  function hashConteudo(m) {
    const p = m.poster || {};
    const base = JSON.stringify({
      t: m.title, o: m.objectives, q: m.prerequisites, l: m.limitations, r: m.references,
      b: (m.blocks || []).map((b) => [b.type, b.title, b.content, b.svg, b.callout]),
      p: [p.title, p.subtitle, p.mascot, p.sections, p.goldTip, p.didYouKnow, p.attention, p.summary],
    });
    let h = 0x811c9dc5;
    for (let i = 0; i < base.length; i++) { h ^= base.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }
  function fmtData(iso) { const t = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return t ? t[3] + '/' + t[2] + '/' + t[1] : String(iso || ''); }
  function estadoRevisao(m) {
    const r = (m && m.revisao) || {};
    const completa = r.aprovado === true && String(r.revisadoPor || '').trim() && String(r.data || '').trim();
    if (!completa) return { validado: false, desatualizada: false, texto: 'Rascunho · aguarda revisão do professor', nota: 'Aguarda a revisão do docente.' };
    if (!r.hash || r.hash !== hashConteudo(m)) return { validado: false, desatualizada: true, texto: 'Validação desatualizada · material alterado depois da revisão', nota: 'A validação anterior ficou desatualizada: o material foi alterado depois da revisão.' };
    const quem = String(r.revisadoPor).trim(), quando = fmtData(r.data);
    return { validado: true, desatualizada: false, texto: 'Validado pelo professor · ' + quem + ' · ' + quando, nota: 'Validado por ' + quem + ' em ' + quando + '.' };
  }
  const REVISAO_VAZIA = () => ({ aprovado: false, revisadoPor: '', data: '', hash: '' });

  function normalize(o) {
    o = o && typeof o === 'object' ? o : {};
    const arr = (x) => (Array.isArray(x) ? x.map(String).filter((s) => s.trim()) : typeof x === 'string' && x.trim() ? x.split(/\n+/).map((s) => s.trim()).filter(Boolean) : []);
    const m = {
      schema: SCHEMA,
      title: String(o.title || o.titulo || '').trim(),
      author: String(o.author || o.autor || (o.poster && o.poster.author) || DEFAULT_AUTHOR).trim(),
      discipline: String(o.discipline || o.disciplina || '').trim(),
      level: String(o.level || o.etapa || '').trim(),
      topic: String(o.topic || o.tema || '').trim(),
      duration: String(o.duration || o.duracao || '').trim(),
      epistemicType: EPISTEMIC[o.epistemicType] ? o.epistemicType : detectType(o.discipline || o.disciplina),
      contentProfile: CONTENT_PROFILES[o.contentProfile] ? o.contentProfile : 'completo',
      registro: REGISTROS[o.registro] ? o.registro : (o.publico && REGISTROS[o.publico.registro] ? o.publico.registro : 'escolar'),
      destinatario: DESTINATARIOS[o.destinatario] ? o.destinatario : (o.publico && DESTINATARIOS[o.publico.destinatario] ? o.publico.destinatario : 'estudante'),
      objectives: arr(o.objectives), prerequisites: arr(o.prerequisites), limitations: arr(o.limitations),
      blocks: [], references: [], poster: null,
      revisao: REVISAO_VAZIA(),
      meta: Object.assign({ generatedBy: 'manual', createdAt: new Date().toISOString() }, o.meta || {}),
    };
    (Array.isArray(o.blocks) ? o.blocks : []).forEach((b) => {
      if (!b || typeof b !== 'object') return;
      const type = BLOCK_TYPES[b.type] ? b.type : 'nota';
      const co = b.callout && typeof b.callout === 'object' && String(b.callout.text || '').trim() ? { kind: CALLOUTS[b.callout.kind] ? b.callout.kind : 'dica', text: String(b.callout.text).trim() } : null;
      m.blocks.push({ id: b.id || uid('b'), type, title: String(b.title || BLOCK_TYPES[type][0]), content: String(b.content || ''), svg: b.svg ? String(b.svg) : '', callout: co });
    });
    (Array.isArray(o.references) ? o.references : []).forEach((r) => {
      if (!r || typeof r !== 'object') return;
      m.references.push({ authors: String(r.authors || ''), title: String(r.title || ''), year: String(r.year || ''), venue: String(r.venue || ''), doi: String(r.doi || ''), url: String(r.url || ''),
        accessLevel: String(r.accessLevel || 'nao-verificado'), verified: !!r.verified });
    });
    if (o.poster && typeof o.poster === 'object') {
      const p = o.poster;
      const isLegacy = o.meta && o.meta.version && /^1\.[0-3]\./.test(String(o.meta.version));
      m.poster = {
        title: String(p.title || m.title), subtitle: String(p.subtitle || ''), author: String(p.author || m.author || DEFAULT_AUTHOR), mascot: String(p.mascot || ''),
        coverClean: p.coverClean !== false,
        interiorStyle: INTERIOR_STYLES[p.interiorStyle] ? p.interiorStyle : (isLegacy ? 'ludico' : 'editorial'),
        avatarChoice: AVATAR_OPTIONS[p.avatarChoice] ? p.avatarChoice : 'avatar-prof-ale-1.jpg',
        logoChoice: LOGO_OPTIONS[p.logoChoice] ? p.logoChoice : 'logo-mathlab-clean.jpg',
        videoTitle: String(p.videoTitle || '').trim(),
        videoUrl: String(p.videoUrl || '').trim(),
        sections: (Array.isArray(p.sections) ? p.sections : []).slice(0, 6).map((s, i) => ({ label: String(s.label || 'Seção ' + (i + 1)), title: String(s.title || ''), text: String(s.text || '') })),
        goldTip: String(p.goldTip || ''), didYouKnow: String(p.didYouKnow || ''), attention: String(p.attention || ''),
        summary: (Array.isArray(p.summary) ? p.summary : []).slice(0, 5).map((s) => ({ icon: String(s.icon || '⭐'), label: String(s.label || ''), text: String(s.text || '') })),
        theme: POSTER_THEMES[p.theme] ? p.theme : 'alegre',
      };
    }
    if (o.revisao && typeof o.revisao === 'object') {
      m.revisao = { aprovado: o.revisao.aprovado === true, revisadoPor: String(o.revisao.revisadoPor || ''), data: String(o.revisao.data || ''), hash: String(o.revisao.hash || '') };
    }
    if (!m.title) m.title = m.topic || (m.poster && m.poster.title) || 'Material sem título';
    if (o._v2) m._v2 = o._v2;
    return m;
  }

  function parseModelJson(text) {
    let t = String(text || '').trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b <= a) return { ok: false, error: 'Não encontrei um JSON na resposta. Cole o bloco inteiro que o Gem devolveu.' };
    try { return { ok: true, data: JSON.parse(t.slice(a, b + 1)) }; }
    catch (e) { return { ok: false, error: 'JSON inválido: ' + e.message + '. Peça ao Gem: "Reenvie apenas o JSON válido, completo".' }; }
  }

  function fromV2(raw) {
    const meta = raw.meta || {};
    const pub = raw.publico || {};
    const figs = new Map((raw.figuras || []).map((f) => [f.id, f]));
    const fnMap = { abertura: 'problematizacao', historia: 'contexto', desenvolvimento: 'conceito', intuicao: 'conceito', formalizacao: 'conceito', exemplo: 'exemplo', atividade: 'atividade', exercicio: 'exercicios', sintese: 'nota', referencia_rapida: 'nota' };
    const blocks = (raw.blocos || []).map((b) => {
      const type = fnMap[b.funcao] || 'conceito';
      const fig = b.figura_id ? figs.get(b.figura_id) : null;
      return {
        id: b.id || uid('b'),
        type,
        title: b.titulo || BLOCK_TYPES[type][0],
        content: b.corpo || '',
        svg: fig && fig.svg ? String(fig.svg) : '',
        callout: b.callout || null,
      };
    });
    if ((raw.questoes || []).length) {
      const qTxt = raw.questoes.map((q, i) => (i + 1) + '. ' + q.enunciado + (q.alternativas ? '\n' + q.alternativas.map((a) => '   - **' + a.letra + ')** ' + a.texto).join('\n') : '')).join('\n\n');
      const gTxt = raw.questoes.map((q, i) => (i + 1) + '. **Resposta:** ' + q.gabarito + (q.resolucao ? ' — ' + q.resolucao : '')).join('\n\n');
      blocks.push({ id: uid('b'), type: 'exercicios', title: 'Questões', content: qTxt, svg: '', callout: null });
      blocks.push({ id: uid('b'), type: 'gabarito', title: 'Gabarito comentado', content: gTxt, svg: '', callout: null });
    }
    const refs = (raw.referencias || []).map((r) => ({
      authors: r.autores || '', title: r.titulo || '', year: String(r.ano || ''), venue: r.obra || '',
      doi: r.doi || '', url: r.url || '',
      accessLevel: (r.verificacao && r.verificacao.estado) || 'nao_verificada',
      verified: !!(r.verificacao && r.verificacao.estado === 'confirmada'),
    }));
    const lims = (raw.transparencia && raw.transparencia.nao_verificado_ou_assumido) || [];
    if (raw.transparencia && raw.transparencia.para_o_professor_conferir && raw.transparencia.para_o_professor_conferir.length) {
      lims.push('Conferir: ' + raw.transparencia.para_o_professor_conferir.join('; '));
    }
    return normalize({
      schema: SCHEMA,
      title: meta.titulo || 'Material v2',
      author: meta.autor || DEFAULT_AUTHOR,
      discipline: meta.area || meta.disciplina || '',
      level: pub.serie_ou_curso || pub.nivel || '',
      topic: meta.titulo || '',
      duration: meta.duracao_minutos ? meta.duracao_minutos + ' minutos' : '',
      epistemicType: meta.tipo_conhecimento || detectType(meta.area),
      registro: pub.registro || 'escolar',
      destinatario: pub.destinatario || 'estudante',
      objectives: raw.objetivos || [],
      prerequisites: pub.conhecimentos_previos || [],
      blocks,
      references: refs,
      limitations: lims.length ? lims : ['Material v2 importado; verificar referências e aprovação docente.'],
      poster: raw.poster || { title: meta.titulo || 'Material v2', subtitle: pub.registro ? 'Registro: ' + pub.registro : '', author: meta.autor || DEFAULT_AUTHOR, sections: blocks.slice(0, 5).map((b) => ({ label: BLOCK_TYPES[b.type][0], title: b.title, text: String(b.content).slice(0, 120) })), summary: [], theme: 'alegre' },
      meta: { generatedBy: 'v2-import', version: VERSION },
      _v2: raw,
    });
  }

  function importFromText(text) {
    const r = parseModelJson(text); if (!r.ok) return r;
    const isV2 = Array.isArray(r.data.blocos);
    const m = isV2 ? fromV2(r.data) : normalize(r.data);
    const warnings = [];
    if (!m.blocks.length && !m.poster) return { ok: false, error: 'O JSON não tem "blocks"/"blocos" nem "poster".' };
    const trouxe = (r.data.revisao && r.data.revisao.aprovado === true) || (r.data.revisao_humana && r.data.revisao_humana.aprovado === true);
    m.revisao = REVISAO_VAZIA();
    if (trouxe) warnings.push('O JSON trazia uma revisão marcada como aprovada. Ignorei: só o professor valida, aqui no site, depois de revisar.');
    if (!r.data.schema && !r.data.schema_versao) warnings.push('O JSON não declara "schema"; importei assim mesmo.');
    if (m.meta.generatedBy === 'manual') m.meta.generatedBy = 'skill';
    return { ok: true, material: m, warnings };
  }

  /* ---------- auditoria (10 categorias, Hard Fail / Soft Warning) ---------- */
  const PLACEHOLDER = /\[PREENCHER|\bTODO\b|lorem ipsum|\[\.\.\.\]|\bXXX\b/i;
  const FILLER = ['e muito importante', 'nos dias de hoje', 'desde os primordios', 'sem duvida', 'vale ressaltar', 'como todos sabemos'];

  function audit(m) {
    m = normalize(m);
    const cats = [];
    const cat = (id, name) => { const c = { id, name, score: 10, findings: [] }; cats.push(c); return c; };
    const add = (c, sev, msg, pen) => { c.findings.push({ sev, msg }); c.score = Math.max(0, c.score - (pen != null ? pen : sev === 'hard' ? 10 : sev === 'warn' ? 2 : 0)); };
    const blocks = m.blocks; const has = (t) => blocks.some((b) => b.type === t);
    const allText = blocks.map((b) => b.title + ' ' + b.content).join(' ');
    const total = wc(allText);

    const c1 = cat('fundamentacao', 'Fundamentação científica');
    if (!m.references.length) {
      if (['empirica', 'historica', 'interpretativa'].includes(m.epistemicType)) add(c1, 'warn', 'Sem referências: para este tipo de conhecimento, a fundamentação em fontes é esperada.', 3);
      else add(c1, 'info', 'Sem referências. Aceitável em conteúdo consolidado, desde que declarado nas limitações.', 1);
      if (!m.limitations.length) add(c1, 'warn', 'Sem referências e sem declaração de limitação.', 2);
    }

    const c2 = cat('rastreabilidade', 'Rastreabilidade das fontes');
    m.references.forEach((r, i) => {
      const n = '#' + (i + 1) + ' ' + (r.title || '(sem título)');
      if (!r.title || !r.authors || !r.year) add(c2, 'hard', 'Referência ' + n + ' incompleta (autor, título e ano são obrigatórios): pode ser inventada.');
      if (!['integral', 'parcial', 'resumo', 'metadados', 'localizada', 'nao-verificado'].includes(r.accessLevel)) add(c2, 'warn', 'Referência ' + n + ' sem nível de acesso válido.', 2);
      if (['integral', 'parcial'].includes(r.accessLevel) && !r.doi && !r.url) add(c2, 'warn', 'Referência ' + n + ' declara acesso ' + r.accessLevel + ' sem DOI/URL para conferir.', 1);
      if (r.doi && !/^10\.\d{4,9}\/\S+$/.test(r.doi)) add(c2, 'warn', 'DOI da referência ' + n + ' fora do formato.', 2);
    });

    const c3 = cat('conceitual', 'Correção conceitual');
    const ph = blocks.filter((b) => PLACEHOLDER.test(b.title + ' ' + b.content));
    if (ph.length) add(c3, 'hard', 'Conteúdo ainda não preenchido (marcadores como [PREENCHER]) em ' + ph.length + ' bloco(s).');
    blocks.forEach((b) => { if (MATH_OPEN.test(b.content.replace(MATH_RE, '$1'))) add(c3, 'warn', 'Delimitador de fórmula "$" desbalanceado em "' + b.title + '".', 2); });
    add(c3, 'info', 'A verificação automática não confirma a correção científica. A revisão conceitual é do professor.', 0);

    const isExpository = m.contentProfile === 'expositivo' || m.contentProfile === 'expositivo_visual';
    const c4 = cat('alinhamento', 'Alinhamento construtivo');
    if (!m.objectives.length) add(c4, 'warn', 'Sem objetivos de aprendizagem.', 4);
    if (!isExpository) {
      if (!(has('atividade') || has('exercicios'))) add(c4, 'warn', 'Sem atividade ou exercícios que evidenciem o aprendizado.', 3);
      if (!(has('avaliacao') || has('gabarito'))) add(c4, 'warn', 'Sem avaliação formativa ou gabarito.', 2);
      const practice = strip(blocks.filter((b) => ['atividade', 'exercicios', 'exemplo', 'avaliacao'].includes(b.type)).map((b) => b.content).join(' '));
      let unc = 0;
      m.objectives.forEach((o) => {
        const keys = strip(o).split(/[^a-z0-9]+/).filter((w) => w.length >= 6);
        if (keys.length && !keys.some((k) => practice.includes(k.slice(0, 6))) && unc < 3) { unc++; add(c4, 'warn', 'Objetivo sem evidência aparente nas atividades: "' + o.slice(0, 70) + '".', 1); }
      });
    } else {
      add(c4, 'info', 'Perfil expositivo selecionado: exercícios e gabarito são opcionais.', 0);
    }

    const c5 = cat('progressao', 'Progressão didática');
    const idx = (t) => blocks.findIndex((b) => b.type === t);
    if (idx('conceito') >= 0 && idx('exercicios') >= 0 && idx('exercicios') < idx('conceito')) add(c5, 'warn', 'Exercícios aparecem antes do desenvolvimento conceitual.', 2);
    if (idx('problematizacao') >= 0 && idx('conceito') >= 0 && idx('problematizacao') > idx('conceito')) add(c5, 'warn', 'A problematização deveria vir antes do conceito.', 1);
    const ex = blocks.find((b) => b.type === 'exercicios');
    if (ex && (ex.content.match(/^\s*\d+[.)]/gm) || []).length < 3) add(c5, 'warn', 'Exercícios com menos de 3 itens numerados: sem graduação perceptível.', 1);

    const c6 = cat('substancia', 'Substância do conteúdo');
    if (total < 60) add(c6, 'hard', 'Conteúdo praticamente vazio (' + total + ' palavras).');
    else if (total < 250) add(c6, 'warn', 'Material curto (' + total + ' palavras). Verifique se atende à duração pedida.', 3);
    const cc = blocks.find((b) => b.type === 'conceito');
    if (cc && wc(cc.content) < 50) add(c6, 'warn', 'Desenvolvimento conceitual muito curto.', 2);
    const nf = FILLER.filter((f) => strip(allText).includes(f)).length;
    if (nf >= 3) add(c6, 'warn', 'Várias frases genéricas de enchimento detectadas.', 2);
    const seen = new Set(); blocks.forEach((b) => { const k = strip(b.content).slice(0, 120); if (k.length > 40 && seen.has(k)) add(c6, 'warn', 'Conteúdo repetido em "' + b.title + '".', 2); seen.add(k); });

    const c7 = cat('visual', 'Recursos visuais');
    const svgs = blocks.filter((b) => b.svg);
    if (!svgs.length && !m.poster) add(c7, 'warn', 'Nenhum recurso visual (figura SVG ou apostila visual).', 1);
    svgs.forEach((b) => {
      if (DANGEROUS.test(b.svg)) add(c7, 'hard', 'SVG de "' + b.title + '" contém código não permitido (script/evento/imagem externa).');
      if (!/<title[\s>]/i.test(b.svg)) add(c7, 'warn', 'SVG de "' + b.title + '" sem <title>.', 2);
    });
    if (m.poster) {
      const p = m.poster;
      if (p.sections.length < 4) add(c7, 'warn', 'Apostila visual com menos de 4 seções.', 2);
      const long = p.sections.filter((s) => wc(s.text) > 45).length;
      if (long) add(c7, 'warn', long + ' seção(ões) do pôster com mais de 45 palavras: IA de imagem erra letras em textos longos.', 1);
      if (PLACEHOLDER.test(JSON.stringify(p))) add(c7, 'hard', 'Apostila visual com campos ainda não preenchidos.');
    }

    const c8 = cat('acessibilidade', 'Acessibilidade');
    if (!has('acessibilidade')) add(c8, 'warn', 'Sem bloco de estratégias de acessibilidade.', 3);
    svgs.forEach((b) => { if (!/<desc[\s>]/i.test(b.svg)) add(c8, 'warn', 'SVG de "' + b.title + '" sem <desc> (descrição para leitor de tela).', 1); });
    if (m.poster && m.poster.theme === 'alegre') add(c8, 'info', 'Para impressão econômica e baixa fadiga visual, o tema "Suave" pode ser mais indicado.', 0);

    const c9 = cat('editorial', 'Qualidade editorial');
    if (!m.title || !m.discipline || !m.level) add(c9, 'warn', 'Faltam título, disciplina ou etapa de ensino.', 2);
    blocks.forEach((b) => {
      if (!b.content.trim() && !b.svg) add(c9, 'warn', 'Bloco "' + b.title + '" está vazio.', 2);
      if (wc(b.content) > 200 && !/\n\s*\n|^#{1,4}\s/m.test(b.content)) add(c9, 'warn', 'Bloco "' + b.title + '" é um parágrafo único muito longo.', 1);
    });

    const c10 = cat('honestidade', 'Completude e honestidade');
    if (!m.limitations.length) add(c10, 'warn', 'Nenhuma limitação declarada.', 3);
    if (m.meta.generatedBy === 'offline-scaffold') add(c10, 'warn', 'Estrutura gerada sem IA: é um esqueleto, não conteúdo final.', 3);
    if (['skill', 'gemini'].includes(m.meta.generatedBy)) add(c10, 'info', 'Conteúdo gerado por IA: revisão docente obrigatória antes do uso.', 0);
    if (m.references.some((r) => !r.verified && r.accessLevel !== 'nao-verificado')) add(c10, 'warn', 'Há referências com nível de acesso declarado, mas sem verificação marcada.', 2);

    const hard = []; const soft = [];
    cats.forEach((c) => c.findings.forEach((f) => { if (f.sev === 'hard') hard.push({ cat: c.name, msg: f.msg }); else if (f.sev === 'warn') soft.push({ cat: c.name, msg: f.msg }); }));
    const totalScore = Math.round((cats.reduce((a, c) => a + c.score, 0) / cats.length) * 10);
    const level = hard.length ? 'Reprovado: falha grave' : totalScore < 60 ? 'Rascunho' : totalScore < 80 ? 'Em revisão' : 'Pronto para revisão docente';
    return { score: totalScore, level, hard, soft, categories: cats, words: total,
      note: 'Auditoria automática por regras. Não substitui a revisão científica e pedagógica do professor.' };
  }

  /* ---------- exportação ---------- */
  function toMarkdown(m) {
    m = normalize(m);
    const o = ['# ' + m.title, '', '**Disciplina:** ' + m.discipline + '  ', '**Etapa:** ' + m.level + '  ', '**Duração:** ' + m.duration, ''];
    if (m.objectives.length) o.push('## Objetivos de aprendizagem', '', ...m.objectives.map((x) => '- ' + x), '');
    if (m.prerequisites.length) o.push('## Conhecimentos prévios', '', ...m.prerequisites.map((x) => '- ' + x), '');
    m.blocks.forEach((b) => { o.push('## ' + b.title, '', b.content, ''); if (b.callout) o.push('> **' + CALLOUTS[b.callout.kind][0] + '** ' + b.callout.text, ''); if (b.svg) o.push('*[Figura SVG: exporte o arquivo .svg deste recurso]*', ''); });
    if (m.poster) {
      o.push('## Apostila visual', '', '**' + m.poster.title + '** — ' + m.poster.subtitle, '');
      m.poster.sections.forEach((s, i) => o.push((i + 1) + '. **' + s.label + '** — ' + s.text));
      if (m.poster.goldTip) o.push('', '💡 **Dica de ouro:** ' + m.poster.goldTip);
      if (m.poster.didYouKnow) o.push('', '**Você sabia?** ' + m.poster.didYouKnow);
      if (m.poster.attention) o.push('', '⚠️ **Atenção:** ' + m.poster.attention);
      o.push('');
    }
    if (m.references.length) o.push('## Referências', '', ...m.references.map((r) => '- ' + r.authors + ' (' + r.year + '). ' + r.title + '. ' + r.venue + (r.doi ? ' DOI: ' + r.doi : '') + (r.url ? ' ' + r.url : '') + ' [acesso: ' + r.accessLevel + ']'), '');
    if (m.limitations.length) o.push('## Limitações', '', ...m.limitations.map((x) => '- ' + x), '');
    return o.join('\n');
  }

  const DOC_CSS = [
    'body{font-family:"Segoe UI",Arial,sans-serif;color:#1d2433;line-height:1.55;margin:0;background:#eef1f7}',
    '.doc{max-width:820px;margin:0 auto;background:#fff;padding:36px 44px}',
    '.doc h1{color:#14264f;border-bottom:4px solid #f2b705;padding-bottom:8px;margin-top:0}',
    '.meta{color:#55607a;font-size:.92em;margin-bottom:18px}',
    '.sec{border-left:6px solid #14264f;background:#f7f9fd;border-radius:0 10px 10px 0;padding:6px 18px 10px;margin:18px 0;page-break-inside:avoid}',
    '.sec>h2{margin:.5em 0 .3em;font-size:1.2em;color:#14264f}',
    '.b-exemplo{border-color:#22a559;background:#f1faf4}.b-atividade{border-color:#f28a1f;background:#fff7ee}.b-exercicios{border-color:#7a4bd1;background:#f7f3ff}',
    '.b-gabarito{border-color:#1e6fd9;background:#eef5ff}.b-nota{border-color:#d6453d;background:#fff3f2}.b-acessibilidade{border-color:#0e8f8f;background:#effafa}.b-problematizacao{border-color:#f2b705;background:#fffbea}',
    '.math{font-family:Cambria,"Times New Roman",serif;font-style:italic;background:#fff8d6;padding:0 3px;border-radius:3px}',
    '.fig{text-align:center;margin:10px 0}.fig svg{max-width:100%;height:auto}',
    'table{border-collapse:collapse;margin:8px 0}th,td{border:1px solid #b9c3d9;padding:4px 10px}th{background:#e8edf8}',
    'blockquote{border-left:4px solid #f2b705;margin:8px 0;padding:2px 12px;color:#44506b}',
    '.refs li,.lims li{margin:3px 0}',
    '@page{size:A4;margin:14mm}',
    '@media print{body{background:#fff}.doc{max-width:none;padding:0}.pgbreak{page-break-after:always}}',
  ].join('\n');

  function toHTML(m, o) {
    m = normalize(m); o = o || {};
    const body = [];
    if (m.poster && o.poster !== false) body.push('<div class="pgbreak">' + renderPoster(m.poster, m.author) + '</div>');
    if (o.material !== false) {
      body.push('<div class="doc"><h1>' + esc(m.title) + '</h1><div class="meta">' + [m.discipline, m.level, m.duration, m.author].filter(Boolean).map(esc).join(' · ') + '</div>');
      if (m.objectives.length) body.push('<div class="sec b-conceito"><h2>🎯 Objetivos de aprendizagem</h2><ul>' + m.objectives.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul></div>');
      if (m.prerequisites.length) body.push('<div class="sec"><h2>🔑 Conhecimentos prévios</h2><ul>' + m.prerequisites.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul></div>');
      m.blocks.forEach((b) => {
        body.push('<section class="sec b-' + b.type + '"><h2>' + BLOCK_TYPES[b.type][1] + ' ' + esc(b.title) + '</h2>' + renderMarkdown(b.content) +
          (b.svg ? '<div class="fig">' + sanitizeSvg(b.svg) + '</div>' : '') + '</section>');
      });
      if (m.references.length) body.push('<div class="sec"><h2>📚 Referências</h2><ul class="refs">' + m.references.map((r) => '<li>' + esc(r.authors) + ' (' + esc(r.year) + '). <em>' + esc(r.title) + '</em>. ' + esc(r.venue) + (r.doi ? ' DOI: ' + esc(r.doi) : '') + ' <small>[acesso: ' + esc(r.accessLevel) + ']</small></li>').join('') + '</ul></div>');
      if (m.limitations.length) body.push('<div class="sec b-nota"><h2>⚠️ Limitações documentais</h2><ul class="lims">' + m.limitations.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul></div>');
      body.push('</div>');
    }
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(m.title) + '</title>' + FONTS_LINK + '<style>' + DOC_CSS + '\n' + POSTER_CSS + '</style></head><body>' + body.join('\n') + '</body></html>';
  }

  /* ---------- Apostila completa (capa + miolo em páginas A4) ---------- */
  const BOOK_CSS = [
    '.mlbook{font-family:"Nunito","Segoe UI",Arial,sans-serif;color:#1d2433;background:#e9edf5;padding:14px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '.mlbook *{box-sizing:border-box}',
    '.mlpage{position:relative;width:794px;max-width:100%;min-height:1100px;margin:0 auto 16px;padding:24px 32px 56px;background:var(--bg);border-radius:6px;box-shadow:0 2px 10px rgba(20,38,79,.18);overflow:hidden}',
    '.mlpage.mlcover{padding:0;background:transparent;box-shadow:none;min-height:0}',
    '.mlpage.mlcover .mlp,.mlpage.mlcover .mlclean{max-width:none;border-radius:6px;min-height:1100px}',
    '.mlph{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:3px solid var(--tt);padding-bottom:8px;margin-bottom:14px}',
    '.mlph-left{display:flex;align-items:center;gap:10px}.mlph-left img{height:38px;width:auto;border-radius:6px;object-fit:contain}.mlph-left svg{width:40px;height:auto;flex:0 0 40px}',
    '.mlph b{font-family:"Fredoka","Trebuchet MS",sans-serif;font-size:18px;color:var(--tt);letter-spacing:.2px;line-height:1.1;display:block}',
    '.mlph small{display:block;color:#55607a;font-size:12px;font-weight:700}',
    '.mlph-badge{font-family:"Caveat",cursive;font-size:19px;font-weight:700;color:var(--tt);background:#fff;border:2px solid var(--tt);border-radius:99px;padding:2px 12px;white-space:nowrap}',
    '.mlpf{position:absolute;left:32px;right:32px;bottom:14px;display:flex;justify-content:space-between;font-size:11.5px;color:#55607a;border-top:2px dashed var(--tt);padding-top:6px;font-weight:700}',
    '.mlpf span:last-child{font-family:"Fredoka",sans-serif;font-size:14px;color:var(--tt)}',
    '.mlh2{font-family:"Fredoka","Trebuchet MS",sans-serif;font-size:28px;line-height:1.08;margin:0 0 10px;color:var(--tt);border-left:6px solid var(--ac);padding-left:12px}',
    '.mlsub-hand{font-family:"Caveat","Patrick Hand",cursive;font-size:22px;font-weight:700;color:#2c4a8f;margin:-4px 0 12px}',
    '.mlc{position:relative;background:#fff;border:2.5px solid var(--c);border-radius:14px;padding:38px 18px 14px;margin:22px 0 14px;font-size:14.5px;line-height:1.52;box-shadow:3px 3px 0 rgba(20,38,79,.08)}',
    '.mlc-tag{position:absolute;top:-3px;left:-3px;display:flex;align-items:center;gap:7px;background:var(--c);color:#fff;border-radius:14px 12px 12px 0;padding:4px 14px 4px 7px;font-family:"Fredoka","Trebuchet MS",sans-serif;font-weight:700;font-size:15px;max-width:94%}',
    '.mlc-num{display:inline-flex;flex:0 0 24px;width:24px;height:24px;border-radius:50%;background:#fff;color:var(--c);align-items:center;justify-content:center;font-size:14px}',
    '.mlc-ped{display:inline-block;margin:0 0 8px;padding:2px 10px;border-radius:99px;background:#f3f6fc;border:1.5px solid var(--c);color:var(--c);font-size:11.5px;font-weight:800;letter-spacing:.2px}',
    '.mlc h3,.mlc h4,.mlc h5,.mlc h6{font-family:"Fredoka","Trebuchet MS",sans-serif;font-size:15.5px;color:var(--c);margin:12px 0 4px;font-weight:700}',
    '.mlc p{margin:6px 0}.mlc ul,.mlc ol{margin:6px 0;padding-left:22px}.mlc li{margin:3px 0}',
    '.mlc table{border-collapse:collapse;margin:8px 0;font-size:13.5px}.mlc th,.mlc td{border:2px solid var(--c);padding:4px 10px}.mlc th{background:#f3f6fc}',
    '.mlc blockquote{border-left:5px solid var(--ac);margin:8px 0;padding:4px 12px;background:#fffbea;border-radius:0 8px 8px 0}',
    '.mlc .math{font-family:Cambria,"Times New Roman",serif;font-style:italic;background:#fff3b8;padding:0 4px;border-radius:3px}',
    '.mlc .fig{text-align:center;margin:10px 0;padding:10px;border:2px dashed var(--c);border-radius:12px;background:#fcfdff}.mlc .fig svg{max-width:100%;height:auto}',
    '.mlco{border-radius:12px;padding:9px 13px;margin:10px 0 2px;border:2.5px solid var(--tt);font-size:13.5px;line-height:1.42;box-shadow:2px 2px 0 var(--tt)}',
    '.mlco h4{margin:0 0 3px;font-family:"Fredoka","Trebuchet MS",sans-serif;font-size:15.5px;letter-spacing:.2px}',
    '.mlco.gold{background:#fff3b8}.mlco.know{background:#dff3ff}.mlco.warn{background:#ffe0dc;border-color:#d6453d}.mlco.warn h4{color:#d6453d}.mlco.prova{background:#efe6ff;border-color:#7a4bd1}.mlco.prova h4{color:#7a4bd1}',
    '.mlinfo{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}.mlinfo span{background:#fff;border:2.5px solid var(--tt);border-radius:10px;padding:4px 11px;font-size:12.5px;font-weight:800;color:var(--tt)}',
    '.mltoc{list-style:none;padding:0;margin:6px 0}.mltoc li{display:flex;align-items:baseline;gap:6px;padding:4px 0;border-bottom:2px dotted #b9c3d9;font-size:14px}.mltoc li i{flex:1}.mltoc b{color:var(--tt)}',
    '.mlsum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:10px 0}',
    '.mlsum div{background:#fff;border:2.5px solid var(--c2);border-radius:14px;padding:10px;text-align:center;font-size:13px;line-height:1.3}.mlsum i{display:block;font-style:normal;font-size:28px}.mlsum strong{display:block;color:var(--tt)}',
    '.mlsynth{background:#fff;border:2.5px solid var(--tt);border-radius:14px;padding:12px 16px;margin:14px 0;box-shadow:3px 3px 0 var(--ac)}',
    '.mlsynth h3{margin:0 0 6px;font-family:"Fredoka",sans-serif;font-size:17px;color:var(--tt)}',
    '.mlsynth-q{margin:8px 0 4px;font-size:13.5px;font-weight:700;color:#2c4a8f}.mlsynth-line{border-bottom:1.5px dashed #9fb0cf;height:20px;margin-bottom:6px}',
    '.mlrefs{font-size:12.5px;line-height:1.4}.mlrefs li{margin:3px 0}',
    '.mlnote{font-size:12px;color:#55607a;border:2px dashed #b9c3d9;border-radius:10px;padding:6px 10px;margin-top:10px}',
    '.mlbook.ml-ed .mlpage:not(.mlcover){background:#ffffff;padding:22px 40px 58px}',
    '.mlbook.ml-ed .mlph{border-bottom:3px solid var(--c2);padding-bottom:6px;margin-bottom:18px}',
    '.mlph-pg{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:26px;padding:0 10px;border-radius:6px;background:var(--c2);color:#fff;font-family:"Fredoka",sans-serif;font-weight:700;font-size:14px}',
    '.mlbook.ml-ed .mlpf{left:40px;right:40px;border-top:2px solid var(--c2);border-bottom:0;align-items:center}',
    '.mlnav{display:inline-flex;gap:6px;align-items:center}.mlnav a{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:#eef2f8;color:var(--tt);text-decoration:none;font-size:13px;border:1px solid #cbd5e1}',
    '.mlbook.ml-ed .mlc{border:0;border-radius:0;box-shadow:none;padding:4px 0 6px;margin:16px 0 14px;background:transparent;font-size:15px;line-height:1.6}',
    '.mlbook.ml-ed .mlc-tag{position:static;background:transparent;color:var(--tt);padding:0;margin:0 0 4px;border-radius:0;font-size:18px;max-width:none}',
    '.mlbook.ml-ed .mlc-num{background:var(--tt);color:#fff;width:26px;height:26px;font-size:13px}',
    '.mlbook.ml-ed .mlc-ped{border:0;background:#eef4ff;color:#2c4a8f;margin:0 0 8px}',
    '.mlbook.ml-ed .mlco{border:0;border-left:5px solid var(--c1);border-radius:10px;box-shadow:none;background:#f1f5f9;padding:11px 15px;margin:12px 0}',
    '.mlbook.ml-ed .mlco.gold{background:#fff8db;border-left-color:#eab308}.mlbook.ml-ed .mlco.know{background:#e0f2fe;border-left-color:#0284c7}.mlbook.ml-ed .mlco.warn{background:#fee2e2;border-left-color:#dc2626}.mlbook.ml-ed .mlco.prova{background:#f3e8ff;border-left-color:#7c3aed}',
    '.mlbook.ml-ed .mlc .fig{border:1px solid #dbe4f0;background:#fafcff;padding:14px;margin:14px 0}',
    '.mled-guide{display:grid;grid-template-columns:130px 1fr;gap:18px;align-items:center;border:2px solid var(--c2);border-left:0;border-radius:0 18px 18px 0;padding:16px 18px 16px 0;margin:14px 0}',
    '.mled-guide-av{text-align:center}.mled-guide-av img{width:108px;height:108px;border-radius:50%;object-fit:cover;object-position:top center;border:3px solid var(--c2)}.mled-guide-av svg{width:100px;height:auto}',
    '.mlvid{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#e8f2dc;border:2px solid var(--c2);border-radius:12px;padding:10px 16px;margin:12px 0;text-decoration:none;color:var(--tt)}',
    '.mlvid strong{display:block;font-family:"Fredoka",sans-serif;font-size:15px}.mlvid span{font-size:12.5px;color:#334155}',
    '.mlauthor-box{display:flex;gap:14px;align-items:center;background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:12px;padding:12px 16px;margin:12px 0}',
    '.mlauthor-box img{width:64px;height:64px;border-radius:50%;object-fit:cover;object-position:top center;border:2px solid var(--ac)}',
    '.mlcolophon{font-size:11.5px;color:#475569;border-top:1.5px solid #cbd5e1;padding-top:10px;margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px}',
    '@page{size:A4;margin:0}',
    '@media print{.mlbook{background:#fff;padding:0}.mlpage{width:210mm;min-height:296mm;margin:0;border-radius:0;box-shadow:none;page-break-after:always;break-after:page;padding:12mm 12mm 18mm}.mlpage.mlcover .mlp,.mlpage.mlcover .mlclean{min-height:296mm;border-radius:0}.mlpf{left:12mm;right:12mm;bottom:6mm}.mlnav{display:none!important}.mlc,.mlco,.mlsynth{break-inside:avoid;page-break-inside:avoid}}',
    '@media(max-width:820px){.mlpage{padding:18px 14px 54px;min-height:0}.mlpf{left:14px;right:14px}.mlh2{font-size:23px}}',
  ].join('\n');

  const BLOCK_COLOR = { problematizacao: 3, contexto: 1, conceito: 1, exemplo: 2, visual: 1, atividade: 3, exercicios: 5, gabarito: 2, avaliacao: 4, acessibilidade: 5, nota: 4 };

  function blockWeight(b) {
    return 28 + wc(b.content) + (b.svg ? 150 : 0) + (b.callout ? 30 : 0);
  }

  const BOOK_SCRIPT = "<script>(function(){\nvar H=1123,pages=function(){return Array.prototype.slice.call(document.querySelectorAll('.mlpage:not(.mlcover)'));};\nfunction mk(src){var d=document.createElement('div');d.className='mlpage';d.setAttribute('data-kind','content');var h=src.querySelector('.mlph'),f=src.querySelector('.mlpf');if(h)d.appendChild(h.cloneNode(true));if(f)d.appendChild(f.cloneNode(true));return d;}\nfunction kids(p){return Array.prototype.filter.call(p.children,function(c){return c.classList.contains('mlmove');});}\nfunction over(p){return p.scrollHeight>H+1;}\nfunction run(){\n var list=pages();\n for(var i=0;i<list.length;i++){\n  var p=list[i];\n  var guard=0;\n  while(over(p)&&kids(p).length>1&&guard++<60){\n   var k=kids(p),last=k[k.length-1];\n   var nx=p.nextElementSibling;\n   if(!nx||!nx.classList.contains('mlpage')||nx.getAttribute('data-kind')==='final'||p.getAttribute('data-kind')==='final'||!nx.classList.contains('mlpage')||nx.getAttribute('data-moved')!=='1'){\n    nx=mk(p);nx.setAttribute('data-moved','1');p.parentNode.insertBefore(nx,p.nextSibling);list.splice(i+1,0,nx);\n   }\n   var first=nx.querySelector('.mlmove');\n   if(first)nx.insertBefore(last,first);else nx.insertBefore(last,nx.querySelector('.mlpf'));\n  }\n }\n var all=pages(),off=document.querySelectorAll('.mlcover').length,tot=all.length+off;\n var toc=[];\n all.forEach(function(p,i){\n  var f=p.querySelectorAll('.mlpf span');if(f.length)f[f.length-1].textContent=(i+1+off)+' / '+tot;\n  var pg=p.querySelector('.mlph-pg');if(pg)pg.textContent=(i+1+off);\n  Array.prototype.forEach.call(p.querySelectorAll('.mlc[data-n]'),function(c){if(c.getAttribute('data-n'))toc.push('<li><b>'+c.getAttribute('data-n')+'.</b> '+c.getAttribute('data-t')+'<i></i><b>pág. '+(i+1+off)+'</b></li>');});\n });\n var ul=document.querySelector('.mltoc');if(ul&&toc.length)ul.innerHTML=toc.join('');\n}\nif(document.readyState==='complete')run();else window.addEventListener('load',run);\n})();<\/script>";

  function toApostila(m, o) {
    m = normalize(m); o = o || {};
    const theme = (m.poster && m.poster.theme) || 'alegre';
    const isEd = !m.poster || m.poster.interiorStyle !== 'ludico';
    const BUDGET = isEd ? 640 : 580;
    const pages = []; /* cada página: { kind, html, title } */
    const lg = m.poster ? logoHtml(m.poster.logoChoice) : '';
    const av = m.poster ? avatarHtml(m.poster.avatarChoice) : MASCOT_SVG;
    const head = (pn) => isEd
      ? '<div class="mlph"><div class="mlph-left">' + (lg || MASCOT_SVG) + '<div><b>' + esc(m.title) + '</b><small>' + [m.discipline, m.level].filter(Boolean).map(esc).join(' · ') + '</small></div></div><span class="mlph-pg">' + (pn || '') + '</span></div>'
      : '<div class="mlph"><div class="mlph-left">' + (lg || MASCOT_SVG) + '<div><b>' + esc(m.title) + '</b><small>' + [m.discipline, m.level].filter(Boolean).map(esc).join(' · ') + '</small></div></div><span class="mlph-badge">' + esc(m.author || DEFAULT_AUTHOR) + '</span></div>';
    const card = (n, icon, label, inner, c, ttl, ped) => '<section class="mlc mlmove" data-n="' + (typeof n === 'number' ? n : '') + '" data-t="' + esc(ttl || '') + '" style="--c:var(--c' + c + ')"><div class="mlc-tag"><span class="mlc-num">' + n + '</span>' + (isEd ? '' : icon + ' ') + esc(label) + '</div>' + (ped ? '<div class="mlc-ped">' + esc(ped) + '</div>' : '') + inner + '</section>';

    /* abertura do miolo: percurso histórico-cultural */
    const profLabel = m.contentProfile === 'expositivo' ? 'Expositivo' : m.contentProfile === 'expositivo_visual' ? 'Expositivo Visual' : m.contentProfile === 'pratica' ? 'Prática' : 'Completo';
    let intro = '<div id="ml-toc"></div>@@HEAD@@<h2 class="mlh2">Antes de começar</h2><p class="mlsub-hand">Percurso de mediação — dos conhecimentos cotidianos aos científicos</p><div class="mlinfo">' +
      [m.discipline, m.level, m.duration && '⏱️ ' + m.duration, '📘 ' + profLabel, '🧠 Psicologia Histórico-Cultural'].filter(Boolean).map((x) => '<span>' + esc(x) + '</span>').join('') + '</div>';
    if (isEd) intro += '<div class="mled-guide mlmove"><div class="mled-guide-av">' + MASCOT_SVG + '</div><div>@@TOC@@</div></div>';
    if (m.poster && m.poster.videoUrl && /^https?:\/\//i.test(m.poster.videoUrl)) {
      intro += '<a class="mlvid mlmove" href="' + esc(m.poster.videoUrl) + '" target="_blank" rel="noopener"><div><strong>▶ Videoaula complementar</strong><span>' + esc(m.poster.videoTitle || m.title) + '</span></div><span>Abrir ↗</span></a>';
    }
    if (m.prerequisites.length) intro += card('🔑', '', 'O que você já traz (Conceitos cotidianos)', '<ul>' + m.prerequisites.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>', 2);
    if (m.objectives.length) intro += card('🎯', '', 'Para onde vamos juntos (Objetivos na ZDP)', '<ul>' + m.objectives.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>', 1);
    if (!isEd) intro += '<div class="mlmove mltocwrap">@@TOC@@</div>';
    pages.push({ kind: 'intro', html: intro, title: 'Antes de começar' });

    /* páginas de conteúdo: empacota por peso */
    let cur = null, w = 0, n = 0;
    const open = () => { cur = { kind: 'content', html: '@@HEAD@@', title: '', items: [] }; pages.push(cur); w = 0; };
    m.blocks.forEach((b) => {
      const bw = blockWeight(b);
      if (!cur || (w > 0 && w + bw > BUDGET)) open();
      n += 1; w += bw;
      const co = b.callout ? '<div class="mlco ' + CALLOUTS[b.callout.kind][1] + '"><h4>' + CALLOUTS[b.callout.kind][0] + '</h4>' + inline(b.callout.text) + '</div>' : '';
      cur.html += card(n, BLOCK_TYPES[b.type][1], b.title, renderMarkdown(b.content) + (b.svg ? '<div class="fig">' + sanitizeSvg(b.svg) + '</div>' : '') + co, BLOCK_COLOR[b.type] || 1, b.title, BLOCK_PEDAGOGY[b.type] || '');
      cur.items.push({ n: n, title: b.title });
    });

    /* página final: em resumo + minha síntese + sobre o autor + colofão */
    let fin = '@@HEAD@@<h2 class="mlh2">Em resumo e síntese</h2>';
    const sm = (m.poster && m.poster.summary) || [];
    if (sm.length) fin += '<div class="mlsum mlmove">' + sm.map((s) => '<div><i>' + esc(s.icon || '⭐') + '</i><strong>' + esc(s.label) + '</strong>' + esc(s.text || '') + '</div>').join('') + '</div>';
    if (m.poster && m.poster.goldTip) fin += '<div class="mlco gold mlmove"><h4>' + CALLOUTS.dica[0] + '</h4>' + esc(m.poster.goldTip) + '</div>';
    if (m.poster && m.poster.attention) fin += '<div class="mlco warn mlmove"><h4>' + CALLOUTS.atencao[0] + '</h4>' + esc(m.poster.attention) + '</div>';
    fin += '<div class="mlsynth mlmove"><h3>✍️ Minha Síntese (Registro do Estudante)</h3>' +
      '<div class="mlsynth-q">1. O que eu já percebia no dia a dia sobre este tema:</div><div class="mlsynth-line"></div>' +
      '<div class="mlsynth-q">2. A ideia científica principal que aprendi hoje:</div><div class="mlsynth-line"></div>' +
      '<div class="mlsynth-q">3. Uma dúvida ou exemplo próprio para discutir em aula:</div><div class="mlsynth-line"></div></div>';
    if (m.references.length) fin += card('📚', '', 'Referências', '<ul class="mlrefs">' + m.references.map((r) => '<li>' + esc(r.authors) + ' (' + esc(r.year) + '). <em>' + esc(r.title) + '</em>. ' + esc(r.venue) + (r.doi ? ' DOI: ' + esc(r.doi) : '') + ' <small>[acesso: ' + esc(r.accessLevel) + ']</small></li>').join('') + '</ul>', 3);
    if (m.limitations.length) fin += card('⚠️', '', 'Sobre este material', '<ul>' + m.limitations.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>', 4);
    fin += '<div class="mlauthor-box mlmove">' + (m.poster && m.poster.avatarChoice !== 'svg' ? av : '') + '<div><strong>' + esc(m.author || DEFAULT_AUTHOR) + '</strong><br><small>MathLab Educação · Matemática em Investigação. Material didático fundamentado na Psicologia Histórico-Cultural. ' + esc(estadoRevisao(m).nota) + '</small></div></div>';
    fin += '<div class="mlcolophon mlmove" id="ml-colophon"><div><b>Título:</b> ' + esc(m.title) + '</div><div><b>Autoria:</b> ' + esc(m.author || DEFAULT_AUTHOR) + '</div><div><b>Perfil:</b> ' + esc(profLabel) + '</div><div><b>Estilo do miolo:</b> ' + (isEd ? 'Editorial Clean' : 'Lúdico / HQ') + '</div><div><b>Tipografia:</b> Fredoka · Caveat · Nunito</div><div><b>Formato:</b> A4 · Versão ' + VERSION + '</div></div>';
    fin += '<p class="mlnote mlmove">' + (estadoRevisao(m).validado ? 'Material revisado e validado pelo professor. ' + esc(estadoRevisao(m).nota) : 'Este material deve ser conferido e validado pelo professor antes do uso em aula.') + '</p>';
    pages.push({ kind: 'final', html: fin, title: 'Em resumo' });

    /* numeração das páginas: Capa Clean (1) + Folha de Rosto/Pôster (2) + Miolo */
    const hasPoster = !!(m.poster && o.cover !== false);
    const hasCleanCover = !!(hasPoster && m.poster.coverClean !== false && o.cleanCover !== false);
    const coverCount = (hasCleanCover ? 1 : 0) + (hasPoster ? 1 : 0);
    const first = coverCount + 1;
    const total = pages.length + coverCount;
    const toc = [];
    pages.forEach((p, i) => { p.pn = first + i; if (p.items) p.items.forEach((it) => toc.push('<li><b>' + it.n + '.</b> ' + esc(it.title) + '<i></i><b>pág. ' + p.pn + '</b></li>')); });
    const tocHtml = toc.length ? '<h2 class="mlh2" style="margin-top:4px;font-size:22px">Nesta apostila</h2><ul class="mltoc">' + toc.join('') + '</ul>' : '';
    const out = [];
    if (hasCleanCover) out.push('<div class="mlpage mlcover mlcleanwrap" id="ml-top">' + renderCleanCover(m) + '</div>');
    if (hasPoster) out.push('<div class="mlpage mlcover"' + (!hasCleanCover ? ' id="ml-top"' : '') + '>' + renderPoster(m.poster, m.author) + '</div>');
    pages.forEach((p) => {
      const nav = isEd ? '<span class="mlnav"><a href="#ml-toc" title="Sumário">📑</a><a href="#ml-top" title="Início">🏠</a></span>' : '';
      out.push('<div class="mlpage" data-kind="' + p.kind + '">' + p.html.replace('@@HEAD@@', head(p.pn)).replace('@@TOC@@', tocHtml) + '<div class="mlpf">' + nav + '<span>MathLab Educação · ' + esc(m.title) + (m.author ? ' · ' + esc(m.author) : '') + '</span><span>' + p.pn + ' / ' + total + '</span></div></div>');
    });
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(m.title) + ' — apostila</title>' + FONTS_LINK + '<style>' + COVER_CSS + '\n' + POSTER_CSS + '\n' + BOOK_CSS + '</style></head><body><div class="mlbook' + (isEd ? ' ml-ed' : '') + '" style="' + themeStyle(theme) + '">' + out.join('\n') + '</div>' + BOOK_SCRIPT + '</body></html>';
  }

  /* ---------- esqueleto offline (honesto: não finge conteúdo) ---------- */
  const TEMPLATES = {
    formal: [['problematizacao', 'Situação-problema', 'Uma situação do cotidiano que só se resolve com este conceito.'], ['conceito', 'Definição e propriedades', 'Definição precisa, propriedades, justificativa ou demonstração.'], ['exemplo', 'Exemplos resolvidos', 'Dois ou três exemplos passo a passo, do simples ao mais elaborado.'], ['exercicios', 'Exercícios graduados', 'Itens numerados em níveis (básico, médio, desafio).'], ['gabarito', 'Gabarito comentado', 'Resposta e comentário de cada item.']],
    empirica: [['problematizacao', 'Fenômeno e pergunta', 'Fenômeno observável e a pergunta que ele provoca.'], ['conceito', 'Modelo e grandezas', 'Modelo explicativo, grandezas, unidades, limites de validade.'], ['exemplo', 'Evidência ou experimento', 'Dados, experimento simples ou observação que sustenta o modelo.'], ['exercicios', 'Aplicações', 'Problemas numerados que usam o modelo.'], ['gabarito', 'Gabarito comentado', 'Resolução comentada.']],
    interpretativa: [['problematizacao', 'Questão central', 'Pergunta que abre o debate.'], ['contexto', 'Contexto histórico e conceitual', 'Quem, quando, em que cenário surgem as ideias.'], ['conceito', 'Conceitos e argumentos', 'Conceitos-chave e a estrutura dos argumentos.'], ['exemplo', 'Análise de texto ou obra', 'Trecho-fonte (cite a fonte) e leitura guiada.'], ['atividade', 'Debate e objeções', 'Perguntas e objeções para discussão em sala.']],
    historica: [['problematizacao', 'Pergunta histórica', 'Questão que orienta o estudo.'], ['contexto', 'Contexto e temporalidade', 'Recorte de tempo e espaço, antecedentes.'], ['conceito', 'Narrativa e processos', 'Fatos, agentes, causas e consequências.'], ['exemplo', 'Análise de fonte', 'Documento ou imagem com perguntas de leitura (cite a fonte).'], ['atividade', 'Linha do tempo e produção', 'Atividade de organização e interpretação.']],
    linguistica: [['problematizacao', 'Uso real da língua', 'Texto ou situação em que o tema aparece.'], ['conceito', 'Regra e variação', 'Norma, exceções e variação de uso.'], ['exemplo', 'Análise de exemplos', 'Frases ou textos analisados.'], ['exercicios', 'Prática', 'Exercícios numerados graduados.'], ['atividade', 'Produção', 'Proposta de escrita ou fala.']],
    pratica: [['problematizacao', 'Para que serve', 'Situação real de uso da habilidade.'], ['conceito', 'Passo a passo', 'Procedimento em etapas.'], ['exemplo', 'Demonstração', 'Exemplo feito com todos os cuidados.'], ['atividade', 'Prática guiada', 'Tarefa com critérios de sucesso.'], ['avaliacao', 'Critérios de avaliação', 'Rubrica simples.']],
    geral: [['problematizacao', 'Problematização', 'Pergunta inicial.'], ['conceito', 'Desenvolvimento', 'Explicação organizada do tema.'], ['exemplo', 'Exemplos', 'Exemplos concretos.'], ['exercicios', 'Atividades', 'Itens numerados.'], ['gabarito', 'Respostas comentadas', 'Respostas.']],
  };

  function scaffold(r) {
    r = r || {};
    const t = r.type && r.type !== 'auto' && EPISTEMIC[r.type] ? r.type : detectType(r.discipline);
    const labels = EPISTEMIC[t].labels;
    const m = normalize({
      title: r.topic || 'Novo material', discipline: r.discipline, level: r.level, topic: r.topic, duration: r.duration, epistemicType: t,
      objectives: ['[PREENCHER: objetivo de aprendizagem 1]', '[PREENCHER: objetivo de aprendizagem 2]'],
      prerequisites: ['[PREENCHER: o que o estudante já precisa saber]'],
      blocks: TEMPLATES[t].map((x) => ({ type: x[0], title: x[1], content: '[PREENCHER: ' + x[2] + ']' })).concat([{ type: 'acessibilidade', title: 'Acessibilidade', content: '[PREENCHER: formas alternativas de representar e de participar]' }]),
      limitations: ['Esqueleto gerado offline, sem IA: nenhum conteúdo foi produzido nem pesquisado.'],
      poster: { title: r.topic || 'Título', subtitle: '[PREENCHER: subtítulo curto]', mascot: '', sections: labels.map((l) => ({ label: l, title: '', text: '[PREENCHER: até 25 palavras]' })), goldTip: '[PREENCHER]', didYouKnow: '[PREENCHER]', attention: '[PREENCHER]', summary: [{ icon: '⭐', label: '[PREENCHER]', text: '' }], theme: 'alegre' },
      meta: { generatedBy: 'offline-scaffold' },
    });
    return m;
  }

  /* ---------- exemplo completo (Matemática, 7º ano) ---------- */
  function demo() {
    return normalize({
      schema: SCHEMA, title: 'Soma de números inteiros', discipline: 'Matemática', level: '7º ano do Ensino Fundamental', topic: 'Adição de números inteiros', duration: '2 aulas de 50 minutos', epistemicType: 'formal',
      objectives: ['Calcular a soma de números inteiros de mesmo sinal e de sinais diferentes', 'Representar somas de inteiros na reta numérica', 'Interpretar situações do cotidiano (temperatura, saldo, elevador) como somas de inteiros'],
      prerequisites: ['Reconhecer números positivos, negativos e o zero', 'Localizar inteiros na reta numérica', 'Noção de módulo (distância até o zero)'],
      blocks: [
        { type: 'problematizacao', title: 'Temperatura, saldo e elevador', callout: { kind: 'sabia', text: 'Termômetros, extratos bancários e painéis de elevador usam números negativos todos os dias.' }, content: 'De manhã o termômetro marca **−3 °C**. Até o meio-dia a temperatura sobe 8 graus. Quanto marca agora?\n\nOutra situação: o saldo de uma conta é **−R$ 40** e a pessoa deposita R$ 25. Ela ficou com dinheiro sobrando ou ainda está devendo?\n\nPara responder, precisamos somar números positivos e negativos. É isso que vamos aprender.' },
        { type: 'conceito', title: 'Somando números inteiros', callout: { kind: 'dica', text: 'Números opostos se anulam: (+6) + (−6) = 0. Procure esse par antes de calcular.' }, content: '### Mesmo sinal\nSome os **módulos** e mantenha o sinal.\n\n- (+3) + (+5) = +8\n- (−3) + (−5) = −8\n\n### Sinais diferentes\nSubtraia o menor módulo do maior e use o sinal do número de **maior módulo**.\n\n- (−7) + (+4): módulos 7 e 4; 7 − 4 = 3; o maior módulo é o de −7; resultado **−3**\n- (+9) + (−2) = **+7**\n\n### Números opostos\nA soma de um número com o seu oposto é zero: $a + (−a) = 0$. Exemplo: (+6) + (−6) = 0.' },
        { type: 'visual', title: 'Somar é andar na reta', content: 'Começando em −2 e somando +5, andamos cinco passos para a direita e chegamos em **+3**. Somar um número positivo é andar para a direita; somar um negativo é andar para a esquerda.', svg: numberLine({ min: -6, max: 6, jump: { from: -2, by: 5 }, title: 'Soma (−2) + (+5) = +3 na reta numérica' }) },
        { type: 'exemplo', title: 'Exemplos resolvidos', callout: { kind: 'prova', text: 'Provas costumam misturar situações de temperatura e saldo. Traduza o texto para uma soma de inteiros.' }, content: '1. **(−8) + (+3)**: sinais diferentes; 8 − 3 = 5; o maior módulo é 8 (negativo); resultado **−5**.\n2. **Temperatura**: (−3) + (+8) = **+5**, ou seja, 5 °C.\n3. **Saldo**: (−40) + (+25): 40 − 25 = 15; o maior módulo é o de −40; resultado **−15**. A pessoa ainda deve R$ 15.' },
        { type: 'atividade', title: 'Atividade orientada: andando na reta', content: 'Desenhe uma reta numérica de −10 a 10. Para cada soma, marque o ponto de partida e desenhe os saltos:\n\n- a) (+4) + (−7)\n- b) (−5) + (−3)\n- c) (−6) + (+6)\n\nDepois, escreva com suas palavras: o que acontece com o resultado quando somamos números de sinais diferentes?' },
        { type: 'exercicios', title: 'Exercícios graduados', content: '**Nível 1: mesmo sinal**\n\n1. (+6) + (+9)\n2. (−4) + (−11)\n\n**Nível 2: sinais diferentes**\n\n3. (−8) + (+3)\n4. (+10) + (−10)\n5. (−12) + (+20)\n6. (+7) + (−15)\n\n**Nível 3: problemas**\n\n7. Um elevador está no 2º subsolo (−2) e sobe 5 andares. Em que andar chega?\n8. Mariana tinha saldo de −R$ 60, recebeu R$ 45 e depois gastou R$ 20. Qual o saldo final?' },
        { type: 'gabarito', title: 'Gabarito comentado', content: '1. +15\n2. −15\n3. −5 (8 − 3 = 5, sinal do −8)\n4. 0 (números opostos)\n5. +8 (20 − 12 = 8, sinal do +20)\n6. −8 (15 − 7 = 8, sinal do −15)\n7. +3: chega ao 3º andar, pois (−2) + (+5) = +3\n8. −35: (−60) + (+45) = −15 e depois (−15) + (−20) = −35' },
        { type: 'nota', title: 'Erros comuns', callout: { kind: 'atencao', text: 'O sinal do resultado é o do número de MAIOR módulo, não o do primeiro número.' }, content: '- Somar os módulos quando os sinais são diferentes: (−3) + (+5) **não** é −8.\n- Esquecer de usar o sinal do número de maior módulo.\n- Confundir o sinal de um número com o sinal da operação.' },
        { type: 'avaliacao', title: 'Verificação rápida', content: '1. Calcule (−9) + (+4).\n2. Calcule (−5) + (−6).\n3. Explique por que (+8) + (−8) = 0.\n\n**Critérios:** acerta o valor; indica o sinal corretamente; justifica usando módulo ou reta numérica.' },
        { type: 'acessibilidade', title: 'Estratégias de acessibilidade', content: '- Ler em voz alta a descrição da reta numérica (a figura tem título e descrição para leitor de tela).\n- Usar fichas de duas cores (positivas e negativas) como material concreto.\n- Oferecer a reta numérica impressa em tamanho ampliado e tempo extra nos exercícios.\n- Permitir resposta oral ou desenhada na atividade orientada.' },
      ],
      references: [],
      limitations: ['Material de demonstração: nenhuma fonte externa foi consultada na geração.', 'Conteúdo elementar de conhecimento consolidado; o professor deve conferir com o livro didático adotado.'],
      poster: {
        title: 'Soma de Números Inteiros', subtitle: 'Aprenda a somar positivos e negativos sem medo!', mascot: 'um estudante sorridente de mochila azul segurando uma reta numérica',
        sections: [
          { label: 'Conceito', title: '', text: 'Os inteiros são positivos, negativos e o zero. Somar é andar na reta numérica.' },
          { label: 'Desenvolvimento', title: '', text: 'Mesmo sinal: soma os módulos e mantém o sinal. Sinais diferentes: subtrai os módulos e fica o sinal do maior.' },
          { label: 'Na prática', title: '', text: 'Aparece em temperatura, saldo bancário e elevador. Travou? Desenhe a reta.' },
          { label: 'Pegadinhas', title: '', text: '(−3) + (+5) não é −8! O sinal do resultado é o do maior módulo.' },
          { label: 'Resumo estratégico', title: '', text: 'Passo 1: veja os sinais. Passo 2: some ou subtraia os módulos. Passo 3: escolha o sinal.' },
        ],
        goldTip: 'Números opostos se anulam: (+6) + (−6) = 0.', didYouKnow: 'Termômetros e extratos bancários usam números negativos todos os dias.', attention: 'Cuidado com o sinal do número de maior módulo!',
        summary: [{ icon: '➕', label: 'Mesmo sinal', text: 'soma e mantém' }, { icon: '↔️', label: 'Sinais diferentes', text: 'subtrai; sinal do maior' }, { icon: '0️⃣', label: 'Opostos', text: 'somam zero' }, { icon: '📏', label: 'Reta', text: 'direita ou esquerda' }], theme: 'alegre',
      },
      meta: { generatedBy: 'manual', demo: true },
    });
  }

  return { VERSION, SCHEMA, hashConteudo, estadoRevisao, DEFAULT_AUTHOR, REGISTROS, DESTINATARIOS, INTERIOR_STYLES, AVATAR_OPTIONS, LOGO_OPTIONS, BLOCK_PEDAGOGY, CONTENT_PROFILES, EPISTEMIC, BLOCK_TYPES, POSTER_THEMES, COVER_CSS, POSTER_CSS, DOC_CSS, VISUALS, esc, uid, wc, clone, detectType, sanitizeSvg, renderMarkdown, renderCleanCover, renderPoster, buildImagePrompt, buildRequestText, normalize, fromV2, parseModelJson, importFromText, audit, toMarkdown, toHTML, toApostila, CALLOUTS, scaffold, demo };
});
