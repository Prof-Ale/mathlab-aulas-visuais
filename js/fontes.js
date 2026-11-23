/* MathLab Aulas Visuais: pasta de fontes do autor (RAG manual, sem API).
   O professor cola trechos de livros, normas ou anotações. As fontes escolhidas entram no pedido como
   "base obrigatória", com marcadores [F1], [F2]. Depois da resposta, a auditoria confere o uso:
   marcador inexistente, fonte escolhida e nunca citada, e cópia literal do trecho. Tudo local. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.MathLabFontes = factory(root.MathLabCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const LIM = { trecho: 3000, porFonte: 1500, total: 6000, max: 8, titulo: 160, campo: 120 };
  const strip = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const limpa = (s, n) => String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
  const uid = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function normalizarFonte(o) {
    o = o && typeof o === 'object' ? o : {};
    const texto = String(o.text == null ? '' : o.text).replace(/<[^>]*>/g, '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    const f = { id: typeof o.id === 'string' && o.id ? o.id.slice(0, 40) : uid(), title: limpa(o.title, LIM.titulo), authors: limpa(o.authors, LIM.campo), year: limpa(o.year, 8),
      venue: limpa(o.venue, LIM.campo), url: limpa(o.url, 300), text: texto.slice(0, LIM.trecho), truncated: texto.length > LIM.trecho,
      access: ['FULL', 'PARTIAL', 'SUMMARY'].includes(o.access) ? o.access : 'PARTIAL' };
    const erros = [];
    if (!f.title) erros.push('Dê um título à fonte.');
    if (f.text.length < 20) erros.push('Cole um trecho de pelo menos 20 caracteres.');
    return { ok: !erros.length, fonte: f, erros };
  }

  /* Escolhe quais trechos cabem no pedido. Devolve texto, marcadores e avisos. */
  function blocoDeFontes(fontes) {
    const lista = (Array.isArray(fontes) ? fontes : []).slice(0, LIM.max), avisos = [];
    if (!lista.length) return { texto: '', marcadores: [], avisos };
    if (Array.isArray(fontes) && fontes.length > LIM.max) avisos.push('Só as ' + LIM.max + ' primeiras fontes entram no pedido.');
    let restante = LIM.total; const marcadores = [], partes = [];
    lista.forEach((f, i) => {
      const m = 'F' + (i + 1), cabe = Math.min(LIM.porFonte, restante);
      if (cabe < 80) { avisos.push('A fonte "' + f.title + '" ficou de fora: o limite de ' + LIM.total + ' caracteres do pedido acabou.'); return; }
      const t = f.text.length > cabe ? f.text.slice(0, cabe).trimEnd() + ' […]' : f.text;
      if (f.text.length > cabe) avisos.push('O trecho de "' + f.title + '" foi cortado em ' + cabe + ' caracteres.');
      restante -= t.length;
      marcadores.push({ marcador: m, id: f.id, title: f.title });
      partes.push('[' + m + '] ' + [f.authors, f.title, f.year, f.venue].filter(Boolean).join('. ') + '\n"""\n' + t + '\n"""');
    });
    const texto = ['BASE OBRIGATÓRIA DO AUTOR (trechos fornecidos pelo professor):', ...partes,
      'Como usar: apoie nestes trechos o que eles sustentam e marque o uso no texto com [F1], [F2] etc. Não copie frases inteiras: reescreva com suas palavras. Não atribua às fontes o que elas não dizem. O que não estiver nelas e você não puder verificar, deixe sem fonte e sinalize.'].join('\n\n');
    return { texto, marcadores, avisos };
  }

  const palavras = (t) => strip(t).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  /* Maior trecho idêntico (em palavras) entre o texto gerado e a fonte. */
  function maiorCopia(gerado, fonte) {
    const a = palavras(gerado), b = palavras(fonte); if (!a.length || !b.length) return 0;
    const idx = new Map(); b.forEach((w, i) => { if (!idx.has(w)) idx.set(w, []); idx.get(w).push(i); });
    let melhor = 0;
    for (let i = 0; i < a.length; i++) for (const j of idx.get(a[i]) || []) { let k = 0; while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++; if (k > melhor) melhor = k; }
    return melhor;
  }

  /* Confere o material gerado contra as fontes escolhidas. Cada achado: {id, nivel, msg}. */
  function auditarUso(material, fontes, opts) {
    const m = C.normalize(material || {}), lista = (Array.isArray(fontes) ? fontes : []).slice(0, LIM.max), L = [];
    const limite = (opts && opts.copiaMin) || 12;
    if (!lista.length) return L;
    const corpo = m.blocks.map((b) => b.title + ' ' + b.content + ' ' + ((b.callout && b.callout.text) || '')).join('\n');
    const usados = new Set([...corpo.matchAll(/\[F(\d{1,2})\]/g)].map((x) => +x[1]));
    usados.forEach((n) => { if (n < 1 || n > lista.length) L.push({ id: 'marc_' + n, nivel: 'warn', msg: 'O texto cita [F' + n + '], mas só existem ' + lista.length + ' fonte(s) no pedido.' }); });
    lista.forEach((f, i) => {
      if (!usados.has(i + 1)) L.push({ id: 'nao_citada_F' + (i + 1), nivel: 'info', msg: 'A fonte "' + f.title + '" ([F' + (i + 1) + ']) foi escolhida, mas o texto não a cita.' });
      const c = maiorCopia(corpo, f.text);
      if (c >= limite) L.push({ id: 'copia_F' + (i + 1), nivel: 'warn', msg: 'Há um trecho de ' + c + ' palavras seguidas igual ao da fonte "' + f.title + '". Reescreva com suas palavras ou use aspas e citação direta.' });
    });
    return L;
  }

  /* Referências prontas, com o nível de acesso que o professor declarou. */
  function comoReferencias(fontes) {
    return (Array.isArray(fontes) ? fontes : []).map((f) => ({ authors: f.authors, title: f.title, year: f.year, venue: f.venue, doi: '', url: f.url, accessLevel: f.access, verified: false }));
  }

  return { LIM, normalizarFonte, blocoDeFontes, maiorCopia, auditarUso, comoReferencias };
});
