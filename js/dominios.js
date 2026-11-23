/* MathLab Aulas Visuais: pacotes de domínio (mathlab.domain/1).
   Um pacote diz, para um tipo de assunto, quais blocos não podem faltar, quais erros são típicos,
   que visuais fazem sentido e o que a auditoria deve conferir. Serve para qualquer assunto:
   os 7 tipos já vêm prontos e um assunto novo ganha pacote pelo Passe 0 (meta-adaptador).
   Sem dependências além do núcleo. Funciona no navegador e no Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.MathLabDominios = factory(root.MathLabCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  const DOMAIN_SCHEMA = 'mathlab.domain/1';
  const VISUAIS = {
    reta_numerica: true, linha_do_tempo: true, fluxograma: true, mapa_conceitual: true, // desenhados pelo MathLab
    tabela_comparativa: false, grafico_cartesiano: false, diagrama_causa_efeito: false, ilustracao: false, // precisam de imagem externa ou tabela
  };
  const LIM = { texto: 240, lista: 8, chave: 40 };
  const strip = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const limpa = (s, n) => String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, n || LIM.texto);
  const lista = (x, n) => (Array.isArray(x) ? x : []).map((t) => limpa(t)).filter(Boolean).slice(0, n || LIM.lista);

  /* ---------- pacotes prontos ---------- */
  const P = (id, nome, tipo, o) => Object.assign({
    schema: DOMAIN_SCHEMA, id, nome, epistemicType: tipo, origem: 'pronto', rigor: '', required: [], recommended: [], forbidden: [],
    visuals: [], commonErrors: [], activityFormats: [], sourceExpectations: '', safety: [], checks: [],
  }, o);

  const PRONTOS = {
    formal: P('formal', 'Formal (Matemática, Lógica, Estatística)', 'formal', {
      rigor: 'Definição precisa, notação única do começo ao fim e resultado conferido por substituição ou por outro caminho.',
      required: ['conceito', 'exemplo'], recommended: ['exercicios', 'gabarito'],
      visuals: ['reta_numerica', 'fluxograma', 'mapa_conceitual'],
      commonErrors: ['trocar o sinal ao passar um termo para o outro lado', 'esquecer a condição de existência ou o domínio', 'aplicar a regra sem checar as unidades'],
      activityFormats: ['exemplo resolvido passo a passo', 'exercício graduado do simples ao complexo', 'verificação do resultado por substituição'],
      sourceExpectations: 'Conteúdo consolidado pode ir sem referências, desde que a limitação seja declarada.',
      checks: [{ id: 'conferencia', label: 'Há conferência do resultado (substituir, verificar ou testar)?', keywords: ['confer', 'substitu', 'verifi', 'teste', 'prova real'], nivel: 'info' }],
    }),
    empirica: P('empirica', 'Empírica (Física, Química, Biologia, Ciências)', 'empirica', {
      rigor: 'Separar fenômeno observado, modelo que o explica e evidência que o sustenta. Unidades e ordens de grandeza sempre explícitas.',
      required: ['conceito', 'exemplo'], recommended: ['atividade', 'exercicios', 'gabarito', 'contexto'],
      visuals: ['fluxograma', 'mapa_conceitual', 'linha_do_tempo'],
      commonErrors: ['confundir correlação com causa', 'misturar unidades', 'tratar o modelo como se fosse o próprio fenômeno'],
      activityFormats: ['observação guiada', 'previsão antes da explicação', 'análise de dados'],
      sourceExpectations: 'Alegações empíricas pedem fonte. Sem fonte consultada, declare a limitação.',
      checks: [{ id: 'unidades', label: 'Aparecem unidades de medida?', keywords: ['metro', ' m/s', 'kg', 'grau', 'litro', 'segundo', 'newton', 'joule', 'mol', ' cm', ' km', 'unidade'], nivel: 'info' }],
    }),
    interpretativa: P('interpretativa', 'Interpretativa (Filosofia, Sociologia, Literatura, Artes)', 'interpretativa', {
      rigor: 'Apresentar a questão, as posições e os argumentos de cada autor sem confundir uma posição com a outra. Citar só o que foi consultado.',
      required: ['problematizacao', 'conceito'], recommended: ['contexto', 'atividade', 'avaliacao'],
      visuals: ['mapa_conceitual', 'linha_do_tempo'],
      commonErrors: ['atribuir a um autor uma tese de outro', 'tratar uma interpretação como fato', 'resumir sem apresentar a objeção'],
      activityFormats: ['debate com regras', 'comparação de dois autores', 'leitura guiada de trecho'],
      sourceExpectations: 'Cada autor citado precisa de obra e ano. Sem obra consultada, não cite trecho.',
      checks: [{ id: 'objecao', label: 'Há objeção ou posição contrária?', keywords: ['objec', 'critic', 'contrari', 'discord', 'outro lado'], nivel: 'info' }],
    }),
    historica: P('historica', 'Histórica (História, Geografia humana)', 'historica', {
      rigor: 'Situar tempo e lugar, distinguir fato de interpretação e indicar de que fonte vem cada afirmação.',
      required: ['contexto', 'conceito'], recommended: ['visual', 'atividade', 'avaliacao'],
      visuals: ['linha_do_tempo', 'mapa_conceitual'],
      commonErrors: ['anacronismo', 'tratar causa única como explicação completa', 'confundir data de início com data de consolidação'],
      activityFormats: ['análise de fonte primária', 'linha do tempo comentada', 'comparação entre períodos'],
      sourceExpectations: 'Datas e fatos pedem fonte. Marque o que é interpretação.',
      checks: [
        { id: 'fontes', label: 'Há menção a fontes ou documentos?', keywords: ['fonte', 'document', 'relato', 'registro', 'arquivo'], nivel: 'warn' },
        { id: 'datas', label: 'Há datas ou períodos?', keywords: ['seculo', 'ano de', 'decada', 'periodo', 'em 1', 'em 2'], nivel: 'info' },
      ],
    }),
    linguistica: P('linguistica', 'Linguística (Português, Línguas, Redação)', 'linguistica', {
      rigor: 'Regra enunciada, exemplo de uso real e a exceção ou armadilha logo depois.',
      required: ['conceito', 'exemplo'], recommended: ['exercicios', 'gabarito', 'atividade'],
      visuals: ['fluxograma', 'mapa_conceitual'],
      commonErrors: ['aplicar a regra sem ver o contexto', 'confundir registro formal com correto', 'decorar a lista de exceções sem entender o critério'],
      activityFormats: ['reescrita de frases', 'análise de texto curto', 'correção comentada'],
      sourceExpectations: 'Citar a gramática ou o vocabulário de referência quando houver norma em disputa.',
      checks: [],
    }),
    pratica: P('pratica', 'Prática (Ed. Física, Informática, Técnicos, Música)', 'pratica', {
      rigor: 'Procedimento em passos que se possam executar, com o que fazer em caso de erro. Segurança antes do resultado.',
      required: ['conceito', 'atividade'], recommended: ['exemplo', 'acessibilidade', 'avaliacao'],
      visuals: ['fluxograma', 'linha_do_tempo'],
      commonErrors: ['pular a preparação ou o aquecimento', 'executar sem verificar o material', 'avançar de nível antes de dominar o anterior'],
      activityFormats: ['passo a passo com checklist', 'demonstração seguida de prática', 'prática em dupla com observação'],
      sourceExpectations: 'Normas de segurança e técnica pedem fonte. Sem fonte, declare a limitação.',
      safety: ['Indicar materiais e equipamentos antes de começar', 'Dizer quando parar e quando chamar o professor'],
      checks: [
        { id: 'seguranca', label: 'Há orientação de segurança ou cuidado?', keywords: ['seguranca', 'cuidado', 'atencao', 'risco', 'protecao', 'aquec'], nivel: 'warn' },
        { id: 'materiais', label: 'Há lista de materiais ou preparação?', keywords: ['material', 'materiais', 'prepar', 'ferramenta', 'equipamento'], nivel: 'info' },
      ],
    }),
    geral: P('geral', 'Geral / mista', 'geral', {
      rigor: 'Definir os termos, dar exemplo concreto e declarar o que não foi verificado.',
      required: ['conceito'], recommended: ['exemplo', 'atividade'], visuals: ['mapa_conceitual', 'fluxograma'],
      commonErrors: ['generalizar a partir de um único exemplo'], activityFormats: ['exemplo comentado', 'pergunta de aplicação'],
      sourceExpectations: 'Sem fonte consultada, declare a limitação.', checks: [],
    }),
  };

  /* ---------- normalização e importação ---------- */
  function normalizeDomain(o, origem) {
    const w = [];
    o = o && typeof o === 'object' ? o : {};
    const blocos = (x, campo) => lista(x).filter((t) => { if (C.BLOCK_TYPES[t]) return true; w.push('Bloco "' + t + '" em ' + campo + ' não existe e foi ignorado.'); return false; });
    const tipo = C.EPISTEMIC[o.epistemicType] ? o.epistemicType : 'geral';
    if (o.epistemicType && !C.EPISTEMIC[o.epistemicType]) w.push('Tipo de conhecimento "' + limpa(o.epistemicType, 30) + '" não existe. Usei "geral".');
    const required = blocos(o.required, 'required'), forbidden = blocos(o.forbidden, 'forbidden');
    const conflito = required.filter((t) => forbidden.includes(t));
    if (conflito.length) w.push('Os blocos ' + conflito.join(', ') + ' estavam em required e forbidden. Mantive só em forbidden.');
    const visuals = lista(o.visuals).filter((v) => { if (v in VISUAIS) return true; w.push('Visual "' + v + '" não faz parte do catálogo e foi ignorado.'); return false; });
    const checks = (Array.isArray(o.checks) ? o.checks : []).filter((c) => c && typeof c === 'object').slice(0, LIM.lista).map((c, i) => ({
      id: limpa(c.id || 'c' + (i + 1), LIM.chave).replace(/\s+/g, '_'), label: limpa(c.label), keywords: lista(c.keywords, 12).map(strip).filter((k) => k.length >= 3),
      nivel: c.nivel === 'warn' ? 'warn' : 'info',
    })).filter((c) => c.label && c.keywords.length);
    const id = strip(limpa(o.id || o.nome || 'assunto', LIM.chave)).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'assunto';
    return {
      pack: {
        schema: DOMAIN_SCHEMA, id, nome: limpa(o.nome, 80) || id, epistemicType: tipo, origem: origem || 'pronto', rigor: limpa(o.rigor, 400),
        required: required.filter((t) => !forbidden.includes(t)), recommended: blocos(o.recommended, 'recommended'), forbidden,
        visuals, commonErrors: lista(o.commonErrors), activityFormats: lista(o.activityFormats), sourceExpectations: limpa(o.sourceExpectations, 300),
        safety: lista(o.safety), checks,
      }, warnings: w,
    };
  }

  function importDomain(text) {
    const r = C.parseModelJson(text); if (!r.ok) return r;
    if (r.data.schema !== DOMAIN_SCHEMA) return { ok: false, error: 'A resposta não é um pacote de domínio (esperado "' + DOMAIN_SCHEMA + '"). Peça ao Gem para responder no formato do pedido.' };
    const n = normalizeDomain(r.data, 'meta-adaptador');
    if (!n.pack.rigor && !n.pack.commonErrors.length && !n.pack.required.length) return { ok: false, error: 'O pacote veio vazio de regras. Peça de novo, pedindo rigor, blocos obrigatórios e erros comuns.' };
    return { ok: true, pack: n.pack, warnings: n.warnings };
  }

  /* ---------- pedidos e texto para o prompt ---------- */
  function buildDomainRequest(r) {
    r = r || {};
    return [
      'Monte o PACOTE DE DOMÍNIO (não o material) para o assunto abaixo. Ele vai orientar outros pedidos e a auditoria.',
      'Assunto: ' + (r.topic || r.discipline || '[informe]'), 'Público: ' + (r.level || '[informe]'),
      '',
      'Responda SOMENTE com um bloco de código JSON no formato ' + DOMAIN_SCHEMA + ':',
      '{"schema":"' + DOMAIN_SCHEMA + '","id":"id-curto","nome":"","epistemicType":"' + Object.keys(C.EPISTEMIC).join('|') + '","rigor":"o que torna um material deste assunto confiável",',
      ' "required":["blocos que não podem faltar"],"recommended":["blocos desejáveis"],"forbidden":["blocos que não cabem"],',
      ' "visuals":["' + Object.keys(VISUAIS).join('|') + '"],"commonErrors":["erros típicos de quem aprende"],"activityFormats":["formatos de atividade adequados"],',
      ' "sourceExpectations":"que tipo de fonte este assunto exige","safety":["cuidados, se houver risco"],',
      ' "checks":[{"id":"curto","label":"pergunta que a auditoria deve fazer","keywords":["palavras que provam que foi atendido"],"nivel":"warn|info"}]}',
      'Blocos permitidos: ' + Object.keys(C.BLOCK_TYPES).join(', ') + '.',
      'Regras: até ' + LIM.lista + ' itens por lista, frases curtas, sem HTML. Não invente norma, lei ou autor. Se não tiver certeza de uma exigência, deixe de fora.',
    ].join('\n');
  }

  function regrasTexto(p) {
    if (!p) return '';
    const L = ['Regras do domínio (' + p.nome + '):'];
    if (p.rigor) L.push('Rigor: ' + p.rigor);
    if (p.required.length) L.push('Blocos obrigatórios: ' + p.required.join(', '));
    if (p.forbidden.length) L.push('Não use os blocos: ' + p.forbidden.join(', '));
    if (p.commonErrors.length) L.push('Trate estes erros comuns: ' + p.commonErrors.join('; '));
    if (p.activityFormats.length) L.push('Formatos de atividade adequados: ' + p.activityFormats.join('; '));
    if (p.visuals.length) L.push('Visuais adequados: ' + p.visuals.join(', '));
    if (p.safety.length) L.push('Segurança: ' + p.safety.join('; '));
    if (p.sourceExpectations) L.push('Fontes: ' + p.sourceExpectations);
    return L.join('\n');
  }

  /* ---------- auditoria do domínio ---------- */
  function auditar(m, p) {
    const out = []; if (!m || !p) return out;
    const tipos = new Set((m.blocks || []).map((b) => b.type));
    const texto = strip((m.blocks || []).map((b) => (b.title || '') + ' ' + (b.content || '')).join(' '));
    p.required.forEach((t) => { if (!tipos.has(t)) out.push({ id: 'req_' + t, nivel: 'warn', msg: 'O domínio "' + p.nome + '" exige o bloco "' + (C.BLOCK_TYPES[t] || [t])[0] + '", que não existe neste material.' }); });
    p.forbidden.forEach((t) => { if (tipos.has(t)) out.push({ id: 'proib_' + t, nivel: 'warn', msg: 'O domínio "' + p.nome + '" não prevê o bloco "' + (C.BLOCK_TYPES[t] || [t])[0] + '".' }); });
    p.recommended.forEach((t) => { if (!tipos.has(t)) out.push({ id: 'rec_' + t, nivel: 'info', msg: 'Bloco recomendado ausente: ' + (C.BLOCK_TYPES[t] || [t])[0] + '.' }); });
    p.checks.forEach((c) => { if (!c.keywords.some((k) => texto.includes(k))) out.push({ id: 'chk_' + c.id, nivel: c.nivel, msg: c.label + ' Não encontrei sinais disso no texto.' }); });
    if (p.visuals.some((v) => VISUAIS[v]) && !(m.blocks || []).some((b) => b.type === 'visual' && (b.svg || (b.visual && b.visual.kind)))) out.push({ id: 'visual', nivel: 'info', msg: 'Este domínio costuma pedir um recurso visual (' + p.visuals.filter((v) => VISUAIS[v]).join(', ') + ').' });
    return out;
  }

  function listar(custom) { return Object.values(PRONTOS).concat(Array.isArray(custom) ? custom : []); }
  function achar(id, custom, tipoFallback) {
    return listar(custom).find((p) => p.id === id) || PRONTOS[tipoFallback] || null;
  }

  return { DOMAIN_SCHEMA, VISUAIS, PRONTOS, normalizeDomain, importDomain, buildDomainRequest, regrasTexto, auditar, listar, achar };
});
