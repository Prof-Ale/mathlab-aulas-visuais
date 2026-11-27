/* MathLab Aulas Visuais: compilador de livro ou caderno.
   Junta materiais prontos em uma obra só: capa, ficha de revisão, sumário, capítulos,
   glossário consolidado, caderno de respostas e referências. Lógica pura: recebe materiais, devolve HTML e dados.
   Honestidade: o livro nunca se declara validado. Ele lista o estado real de cada capítulo. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.MathLabLivro = factory(root.MathLabCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const esc = C.esc;
  const strip = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const plano = (md) => String(md || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`|]/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
  const primeiraFrase = (t, n) => { const m = plano(t).match(/^.{12,}?[.!?](\s|$)/); const f = (m ? m[0] : plano(t)).trim(); return f.length > (n || 220) ? f.slice(0, (n || 220) - 1).trimEnd() + '…' : f; };

  /* Glossário: título de cada bloco "conceito" mais termos em negrito dentro de frases que definem. */
  function glossario(caps) {
    const mapa = new Map();
    const add = (termo, def, cap) => {
      const t = String(termo || '').replace(/[:.\s]+$/g, '').trim();
      if (t.length < 3 || t.length > 60 || !def) return;
      const k = strip(t);
      if (!mapa.has(k)) mapa.set(k, { termo: t, def, cap });
    };
    caps.forEach((m, ci) => m.blocks.filter((b) => b.type === 'conceito').forEach((b) => {
      add(b.title, primeiraFrase(b.content), ci + 1);
      const frases = plano(String(b.content).replace(/\*\*([^*]+)\*\*/g, '@@$1@@')).split(/(?<=[.!?])\s+/);
      frases.forEach((f) => { const t = f.match(/@@([^@]{3,60})@@/); if (t && /\b(é|são|chama|chamam|define|denomina|significa)\b/i.test(f)) add(t[1], f.replace(/@@/g, '').trim().slice(0, 220), ci + 1); });
    }));
    return [...mapa.values()].sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR'));
  }

  function referencias(caps) {
    const mapa = new Map();
    caps.forEach((m) => m.references.forEach((r) => {
      const k = strip([r.authors, r.title, r.year].join('|'));
      const atual = mapa.get(k);
      if (!atual) mapa.set(k, Object.assign({}, r));
      else if (r.verified && !atual.verified) mapa.set(k, Object.assign({}, r));
    }));
    return [...mapa.values()].sort((a, b) => strip(a.authors || a.title).localeCompare(strip(b.authors || b.title), 'pt-BR'));
  }

  const CSS = [
    'body{font-family:"Segoe UI",Arial,sans-serif;color:#1d2433;line-height:1.55;margin:0;background:#eef1f7}',
    '.pg{max-width:820px;margin:0 auto;background:#fff;padding:36px 44px;box-sizing:border-box}',
    '.capa{min-height:260mm;display:flex;flex-direction:column;justify-content:center;border:10px solid #14264f;padding:40px;text-align:center}',
    '.capa h1{font-size:2.4em;color:#14264f;margin:.2em 0}.capa .sub{font-size:1.3em;color:#55607a}.capa .aut{margin-top:2em;font-weight:700}',
    '.pg h1.cap{color:#14264f;border-bottom:4px solid #f2b705;padding-bottom:8px;margin-top:0}.pg h2{color:#14264f}',
    '.meta{color:#55607a;font-size:.92em;margin-bottom:14px}',
    '.sec{border-left:6px solid #14264f;background:#f7f9fd;border-radius:0 10px 10px 0;padding:6px 18px 10px;margin:16px 0;break-inside:avoid}.sec>h3{margin:.5em 0 .3em;font-size:1.15em;color:#14264f}',
    '.b-exemplo{border-color:#22a559;background:#f1faf4}.b-atividade{border-color:#f28a1f;background:#fff7ee}.b-exercicios{border-color:#7a4bd1;background:#f7f3ff}',
    '.b-nota{border-color:#d6453d;background:#fff3f2}.b-acessibilidade{border-color:#0e8f8f;background:#effafa}.b-problematizacao{border-color:#f2b705;background:#fffbe6}',
    '.fig{text-align:center;margin:10px 0}.fig svg{max-width:100%;height:auto}',
    'table{border-collapse:collapse;margin:8px 0}th,td{border:1px solid #b9c3d9;padding:4px 10px}th{background:#e8edf8}',
    'blockquote{border-left:4px solid #f2b705;margin:8px 0;padding:2px 12px;color:#44506b}',
    '.toc a{color:#14264f;text-decoration:none}.toc li{margin:4px 0}.estado{font-size:.85em;padding:1px 8px;border-radius:10px;background:#fff3cd}.estado.ok{background:#d9f2e3}',
    'dl.gl dt{font-weight:700;margin-top:8px}dl.gl dd{margin:0 0 0 16px}dl.gl small{color:#55607a}',
    '.aviso{border:2px dashed #d6453d;padding:8px 14px;border-radius:8px;background:#fff3f2}',
    '@page{size:A4;margin:14mm}',
    '@media print{body{background:#fff}.pg{max-width:none;padding:0}.quebra{break-before:page}}',
  ].join('\n');

  /* opts: { title, subtitle, author, glossary:true, answers:true, references:true } */
  function compileBook(materiais, opts) {
    opts = opts || {};
    const warnings = [];
    const caps = (Array.isArray(materiais) ? materiais : []).filter((m) => m && typeof m === 'object').map((m) => C.normalize(m));
    if (!caps.length) return { ok: false, error: 'Escolha ao menos um material para compilar.' };
    const titulo = String(opts.title || '').trim() || (caps.length === 1 ? caps[0].title : 'Caderno de ' + (caps[0].discipline || 'estudos'));
    const autor = String(opts.author || '').trim() || caps[0].author || C.DEFAULT_AUTHOR;
    const subt = String(opts.subtitle || '').trim() || [...new Set(caps.map((m) => m.discipline).filter(Boolean))].join(' · ');
    const usaGlossario = opts.glossary !== false, usaRespostas = opts.answers !== false, usaRefs = opts.references !== false;

    const vistos = new Map();
    caps.forEach((m, i) => {
      const k = strip(m.title);
      if (vistos.has(k)) warnings.push('Os capítulos ' + vistos.get(k) + ' e ' + (i + 1) + ' têm o mesmo título ("' + m.title + '"). Confira se não é o mesmo material duas vezes.');
      else vistos.set(k, i + 1);
      if (!m.blocks.length) warnings.push('O capítulo ' + (i + 1) + ' ("' + m.title + '") não tem blocos.');
      if (m.blocks.some((b) => b.type === 'exercicios') && !m.blocks.some((b) => b.type === 'gabarito')) warnings.push('O capítulo ' + (i + 1) + ' tem exercícios, mas nenhum gabarito. O caderno de respostas ficará sem ele.');
    });

    const estados = caps.map((m) => C.estadoRevisao(m));
    const validados = estados.filter((e) => e.validado).length;
    const gloss = usaGlossario ? glossario(caps) : [];
    const refs = usaRefs ? referencias(caps) : [];
    const respostas = usaRespostas ? caps.map((m, i) => ({ cap: i + 1, titulo: m.title, blocos: m.blocks.filter((b) => b.type === 'gabarito') })).filter((x) => x.blocos.length) : [];

    const toc = caps.map((m, i) => ({ href: '#cap-' + (i + 1), label: 'Capítulo ' + (i + 1) + '. ' + m.title }));
    if (gloss.length) toc.push({ href: '#glossario', label: 'Glossário' });
    if (respostas.length) toc.push({ href: '#respostas', label: 'Caderno de respostas' });
    if (refs.length) toc.push({ href: '#referencias', label: 'Referências' });

    const h = [];
    h.push('<div class="pg capa"><div class="sub">' + esc(subt) + '</div><h1>' + esc(titulo) + '</h1><div class="aut">' + esc(autor) + '</div><div class="meta">' + caps.length + (caps.length === 1 ? ' capítulo' : ' capítulos') + '</div></div>');
    h.push('<div class="pg quebra"><h2>Sumário</h2><ol class="toc" style="list-style:none;padding:0">' + toc.map((t) => '<li><a href="' + t.href + '">' + esc(t.label) + '</a></li>').join('') + '</ol>' +
      '<h2>Ficha de revisão</h2><p class="meta">Estado real de cada capítulo. A compilação não valida nada: só o professor valida, no Editor de cada material.</p><table><tr><th>Capítulo</th><th>Estado</th></tr>' +
      caps.map((m, i) => '<tr><td>' + (i + 1) + '. ' + esc(m.title) + '</td><td><span class="estado' + (estados[i].validado ? ' ok' : '') + '">' + esc(estados[i].texto) + '</span></td></tr>').join('') + '</table>' +
      '<p class="' + (validados === caps.length ? 'meta' : 'aviso') + '">' + (validados === caps.length ? 'Todos os capítulos têm validação do professor atualizada.' : 'Atenção: ' + validados + ' de ' + caps.length + ' capítulos têm validação do professor. Este livro ainda não é uma obra validada.') + '</p></div>');
    caps.forEach((m, i) => {
      let s = '<div class="pg quebra" id="cap-' + (i + 1) + '"><h1 class="cap">Capítulo ' + (i + 1) + '. ' + esc(m.title) + '</h1><div class="meta">' + [m.discipline, m.level, m.duration].filter(Boolean).map(esc).join(' · ') + '</div>';
      if (m.objectives.length) s += '<div class="sec b-conceito"><h3>🎯 Objetivos de aprendizagem</h3><ul>' + m.objectives.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
      m.blocks.filter((b) => !(usaRespostas && b.type === 'gabarito')).forEach((b) => {
        const imgHtml = typeof C.renderBlockImageHtml === 'function' ? C.renderBlockImageHtml(b.image) : '';
        s += '<section class="sec b-' + b.type + '"><h3>' + esc(C.BLOCK_TYPES[b.type][1]) + ' ' + esc(b.title) + '</h3>' + C.renderMarkdown(b.content) + (b.svg ? '<div class="fig">' + C.sanitizeSvg(b.svg) + '</div>' : '') + imgHtml + '</section>';
      });
      if (m.limitations.length) s += '<div class="sec"><h3>Limitações declaradas</h3><ul>' + m.limitations.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
      h.push(s + '</div>');
    });
    if (gloss.length) h.push('<div class="pg quebra" id="glossario"><h2>Glossário</h2><p class="meta">Termos reunidos dos blocos de conceito. Conferir as definições faz parte da revisão.</p><dl class="gl">' + gloss.map((g) => '<dt>' + esc(g.termo) + '</dt><dd>' + esc(g.def) + ' <small>(cap. ' + g.cap + ')</small></dd>').join('') + '</dl></div>');
    if (respostas.length) h.push('<div class="pg quebra" id="respostas"><h2>Caderno de respostas</h2>' + respostas.map((r) => '<h3>Capítulo ' + r.cap + '. ' + esc(r.titulo) + '</h3>' + r.blocos.map((b) => '<section class="sec b-gabarito">' + C.renderMarkdown(b.content) + (b.svg ? '<div class="fig">' + C.sanitizeSvg(b.svg) + '</div>' : '') + '</section>').join('')).join('') + '</div>');
    if (refs.length) h.push('<div class="pg quebra" id="referencias"><h2>Referências</h2><ul>' + refs.map((r) => '<li>' + esc([r.authors, r.title, r.year, r.venue].filter(Boolean).join('. ')) + (r.doi ? ' DOI ' + esc(r.doi) + '.' : '') + (r.url ? ' ' + esc(r.url) : '') + ' <small>(' + (r.verified ? 'conferida' : 'não conferida') + ')</small></li>').join('') + '</ul></div>');
    const katexTag = typeof C.getKatexStyleTag === 'function' ? C.getKatexStyleTag() : '';
    const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titulo) + '</title>' + katexTag + '<style>\n' + CSS + '\n</style></head><body>' + h.join('\n') + '</body></html>';
    return { ok: true, html, title: titulo, chapters: caps.length, validated: validados, toc, glossary: gloss, answers: respostas, references: refs, warnings };
  }

  return { compileBook, glossario, referencias };
});
