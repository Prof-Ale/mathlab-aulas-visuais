// Portfólio docente: perfis (escolar, processo seletivo, pós-graduação), flipbook e PDF acessível.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const P = require('../js/portfolio.js');
const lerJson = (...p) => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), 'utf8'));
const diario = () => lerJson('schema', 'exemplos', 'exemplo-diario.json');
const ex = (nome) => lerJson('schema', 'exemplos', `exemplo-portfolio-${nome}.json`);
const LIB = fs.readFileSync(path.join(ROOT, 'assets/vendor/page-flip/page-flip.browser.js'), 'utf8');
const bloqueantes = (a) => a.filter((x) => x.nivel === 'bloqueante');
let temPlaywright = true;
try { require('playwright'); } catch { temPlaywright = false; }

test('há três perfis e o padrão antigo continua o mesmo (escolar, 6 seções)', () => {
  assert.deepEqual(Object.keys(P.PERFIS), ['escolar', 'processo_seletivo', 'pos_graduacao']);
  const c = P.CFG_PADRAO(diario());
  assert.equal(c.perfil, 'escolar');
  assert.deepEqual(c.secoes, ['matriz_cobertura', 'linha_do_periodo', 'destaques', 'avaliacoes', 'evolucao', 'reflexao']);
  assert.match(P.montarHtml(diario(), c), /Cobertura curricular/);
});

test('cada perfil tem seções, destinatário e título próprios', () => {
  const d = diario();
  const s = P.CFG_PADRAO(d, 'processo_seletivo'), g = P.CFG_PADRAO(d, 'pos_graduacao');
  assert.equal(s.destinatario, 'banca'); assert.equal(g.destinatario, 'programa_pos');
  assert.ok(s.secoes.includes('competencias') && !s.secoes.includes('matriz_cobertura'));
  assert.ok(g.secoes.includes('fundamentacao') && g.secoes.includes('avaliacoes'));
  assert.match(s.titulo, /processo seletivo/i); assert.match(g.titulo, /pós-graduação/i);
  assert.equal(P.CFG_PADRAO(d, 'inventado').perfil, 'escolar');
});

test('os três exemplos passam sem bloqueante e geram o conteúdo do perfil', () => {
  const d = diario();
  for (const [nome, esperado, ausente] of [['escolar', /Cobertura curricular/, /Competências e evidências/], ['processo-seletivo', /Competências e evidências/, /Cobertura curricular/], ['pos-graduacao', /Referências informadas pelo autor/, /Competências e evidências/]]) {
    const cfg = ex(nome);
    assert.equal(bloqueantes(P.verificar(d, cfg)).length, 0, nome);
    const h = P.montarHtml(d, cfg);
    assert.match(h, esperado, nome); assert.doesNotMatch(h, ausente, nome);
  }
});

test('processo seletivo mostra no máximo 3 práticas por turma e diz quantas ficaram de fora', () => {
  const d = diario();
  const e0 = d.entradas.find((e) => e.turma_id === d.turmas[0].id);
  for (let i = 0; i < 5; i++) d.entradas.push({ ...e0, id: 'x' + i, tema: 'Tema extra ' + i, destaque: true, data: e0.data });
  const cfg = { ...ex('processo-seletivo'), secoes: ['destaques'] };
  const h = P.montarHtml(d, cfg);
  assert.equal((h.match(/class="card"><div class="t">/g) || []).length <= 3 * d.turmas.length, true);
  assert.match(h, /Mostrando 3 de \d+ práticas em destaque/);
  const esc = P.montarHtml(d, { ...P.CFG_PADRAO(d), secoes: ['destaques'] });
  assert.doesNotMatch(esc, /Mostrando 3 de/);
});

test('regras dos perfis: P11 (competência), P12 (reflexão), P13 (conteúdo), P14 (privacidade)', () => {
  const d = diario();
  const cfg = ex('processo-seletivo');
  cfg.competencias = [...cfg.competencias, { nome: 'Fantasma', entradas_ids: ['nao-existe'] }, { nome: 'Sem evidência', entradas_ids: [] }];
  const a = P.verificar(d, cfg);
  assert.ok(a.some((x) => x.regra === 'P11' && x.nivel === 'bloqueante' && /nao-existe/.test(x.msg)));
  assert.ok(a.some((x) => x.regra === 'P11' && x.nivel === 'aviso' && /Sem evidência/.test(x.msg)));
  const vazio = { ...P.CFG_PADRAO(d, 'processo_seletivo') };
  const b = P.verificar(d, vazio).filter((x) => x.regra === 'P13').map((x) => x.onde);
  assert.ok(b.includes('portfolio.apresentacao') && b.includes('portfolio.perfil_profissional') && b.includes('portfolio.competencias'));
  const pos = P.verificar(d, { ...P.CFG_PADRAO(d, 'pos_graduacao') });
  assert.ok(pos.some((x) => x.regra === 'P13' && x.onde === 'portfolio.fundamentacao'));
  const frouxo = { ...ex('processo-seletivo'), privacidade: { exigir_rostos_borrados: false } };
  assert.ok(P.verificar(d, frouxo).some((x) => x.regra === 'P14'));
  assert.ok(!P.verificar(d, { ...P.CFG_PADRAO(d), privacidade: { exigir_rostos_borrados: false } }).some((x) => x.regra === 'P14'), 'escolar pode afrouxar');
});

test('perfil de fora da escola ignora privacidade frouxa: foto com rosto sem borrar continua barrada', () => {
  const d = diario();
  const e = d.entradas.find((x) => x.destaque);
  e.evidencias = [{ id: 'f1', tipo: 'foto', conteudo: 'sala', descricao: 'Turma em grupo', contem_rosto: true, rostos_borrados: false, autorizacao_imagem: 'registrada' }];
  const cfgEsc = { ...P.CFG_PADRAO(d), privacidade: { exigir_rostos_borrados: false } };
  const cfgSel = { ...ex('processo-seletivo'), privacidade: { exigir_rostos_borrados: false }, turmas_ids: undefined };
  assert.equal(bloqueantes(P.verificar(d, cfgEsc)).filter((x) => x.regra === 'P01').length, 0, 'escolar com autorização registrada passa');
  assert.ok(P.verificar(d, cfgSel).some((x) => x.regra === 'P01'), 'perfil externo não aceita só autorização');
});

test('nome vigiado em competência ou fundamentação bloqueia (P09)', () => {
  const d = diario();
  const cfg = ex('processo-seletivo'); cfg.competencias[0].descricao = 'Ajudei a Maria Eduarda a entender frações.';
  assert.ok(P.verificar(d, cfg, ['Maria Eduarda']).some((x) => x.regra === 'P09' && /competencias/.test(x.onde)));
  const pos = ex('pos-graduacao'); pos.fundamentacao.texto = 'Caso do João Pedro.';
  assert.ok(P.verificar(d, pos, ['João Pedro']).some((x) => x.regra === 'P09'));
});

test('esquema aceita os campos novos e os exemplos usam só o que ele declara', () => {
  const sch = lerJson('schema', 'portfolio.v1.schema.json');
  assert.equal(sch.additionalProperties, false);
  assert.deepEqual(sch.properties.perfil.enum, ['escolar', 'processo_seletivo', 'pos_graduacao']);
  for (const n of ['trajetoria', 'competencias', 'fundamentacao']) assert.ok(sch.properties.secoes.items.enum.includes(n), n);
  for (const dest of ['banca', 'programa_pos']) assert.ok(sch.properties.destinatario.enum.includes(dest), dest);
  for (const nome of ['escolar', 'processo-seletivo', 'pos-graduacao']) {
    const cfg = ex(nome);
    for (const k of sch.required) assert.ok(k in cfg, `${nome}: falta ${k}`);
    for (const k of Object.keys(cfg)) assert.ok(k in sch.properties, `${nome}: campo fora do esquema ${k}`);
    assert.ok(sch.properties.perfil.enum.includes(cfg.perfil || 'escolar'));
    assert.ok(sch.properties.destinatario.enum.includes(cfg.destinatario));
    for (const s of cfg.secoes || []) assert.ok(sch.properties.secoes.items.enum.includes(s), s);
  }
});

const normEol = (s) => String(s).replace(/\r\n/g, '\n');

test('o UMD do site (js/portfolio.js) está em dia com tools/portfolio.mjs', () => {
  const arq = path.join(ROOT, 'js', 'portfolio.js');
  const antesRaw = fs.readFileSync(arq, 'utf8');
  execFileSync(process.execPath, ['tools/build-v2-umd.js'], { cwd: ROOT });
  const depoisRaw = fs.readFileSync(arq, 'utf8');
  if (antesRaw !== depoisRaw && normEol(antesRaw) === normEol(depoisRaw)) {
    fs.writeFileSync(arq, antesRaw, 'utf8');
  }
  assert.equal(normEol(depoisRaw), normEol(antesRaw), 'rode node tools/build-v2-umd.js e envie js/portfolio.js');
  assert.equal(typeof P.PERFIS, 'object');
  for (const k of ['montarFlipbook', 'montarCorpo', 'montarHtml', 'verificar']) assert.equal(typeof P[k], 'function', k);
});

test('StPageFlip embutida: licença MIT presente e hash conferido', () => {
  const dir = path.join(ROOT, 'assets/vendor/page-flip');
  assert.match(fs.readFileSync(path.join(dir, 'LICENSE'), 'utf8'), /MIT License/);
  const h = crypto.createHash('sha256').update(normEol(LIB), 'utf8').digest('hex');
  assert.equal(h, 'bbaca0bbef57a22bb66a3fc69d67baf9a17fb9a9c89ec9ed35e2b91abe4bd1e7');
});

test('flipbook: HTML único, versão corrida completa, sem rede e com acessibilidade básica', () => {
  const d = diario(), cfg = ex('processo-seletivo');
  assert.throws(() => P.montarFlipbook(d, cfg), /StPageFlip/);
  const h = P.montarFlipbook(d, cfg, { lib: LIB });
  assert.match(h, /<html lang="pt-BR">/);
  assert.match(h, /<main id="linear">/);
  assert.match(h, /Competências e evidências/, 'a versão corrida traz o conteúdo todo');
  assert.match(h, /class="pulo" href="#linear"/);
  assert.match(h, /role="toolbar"/); assert.match(h, /aria-live="polite"/);
  assert.match(h, /prefers-reduced-motion/);
  assert.match(h, /<th scope="col">/);
  assert.doesNotMatch(h, /<(link|script)[^>]+(src|href)="https?:/i, 'nada de recurso externo');
  assert.equal((h.match(/<script>/g) || []).length, 2);
});

test('CLI --pacote gera HTML, flipbook e PDF acessível lado a lado', { skip: !temPlaywright && 'playwright não instalado' }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-'));
  const r = execFileSync(process.execPath, ['tools/portfolio.mjs', 'schema/exemplos/exemplo-diario.json', 'schema/exemplos/exemplo-portfolio-pos-graduacao.json', '--pacote', out], { cwd: ROOT, encoding: 'utf8' });
  for (const f of ['portfolio.html', 'portfolio-flipbook.html', 'portfolio.pdf']) assert.ok(fs.statSync(path.join(out, f)).size > 1000, f);
  assert.match(r, /marcado: sim, estrutura: sim, idioma: pt-BR, marcadores: sim/);
  const pdf = fs.readFileSync(path.join(out, 'portfolio.pdf'));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  fs.rmSync(out, { recursive: true, force: true });
});

test('CLI recusa perfil desconhecido e não gera nada com bloqueante', () => {
  assert.throws(() => execFileSync(process.execPath, ['tools/portfolio.mjs', 'schema/exemplos/exemplo-diario.json', '--perfil', 'inventado'], { cwd: ROOT, stdio: 'pipe' }), /Perfil desconhecido|status 2/);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-'));
  const cfgRuim = ex('processo-seletivo'); cfgRuim.competencias[0].entradas_ids = ['nao-existe'];
  const arq = path.join(out, 'cfg.json'); fs.writeFileSync(arq, JSON.stringify(cfgRuim));
  assert.throws(() => execFileSync(process.execPath, ['tools/portfolio.mjs', path.join(ROOT, 'schema/exemplos/exemplo-diario.json'), arq, '--saida', path.join(out, 'x.html')], { cwd: ROOT, stdio: 'pipe' }));
  assert.ok(!fs.existsSync(path.join(out, 'x.html')));
  fs.rmSync(out, { recursive: true, force: true });
});

test('flipbook no Chromium: folheia por teclado, mostra a versão corrida e não dá erro', { skip: !temPlaywright && 'playwright não instalado' }, async () => {
  const { chromium } = require('playwright');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-'));
  const arq = path.join(out, 'f.html');
  fs.writeFileSync(arq, P.montarFlipbook(diario(), ex('pos-graduacao'), { lib: LIB }));
  const b = await chromium.launch();
  try {
    const pg = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    const erros = []; pg.on('pageerror', (e) => erros.push(e.message)); pg.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
    await pg.goto('file://' + arq); await pg.waitForTimeout(500);
    const total = await pg.evaluate(() => window.__flipbook.total());
    assert.ok(total >= 3, 'páginas: ' + total);
    assert.match(await pg.textContent('#indicador'), /Página 1 de/);
    await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(900);
    assert.match(await pg.textContent('#indicador'), /Páginas 2 e 3 de/);
    const cortes = await pg.evaluate(() => [...document.querySelectorAll('.fp')].filter((e) => e.scrollHeight - e.clientHeight > 2).length);
    assert.equal(cortes, 0, 'nenhuma página com conteúdo cortado');
    await pg.click('#modo');
    assert.equal(await pg.evaluate(() => getComputedStyle(document.getElementById('linear')).display !== 'none'), true);
    assert.deepEqual(erros, []);
  } finally { await b.close(); fs.rmSync(out, { recursive: true, force: true }); }
});

test('interface do diário: seletor de perfil, flipbook e importação da configuração', () => {
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  for (const trecho of ['data-a="portperfil"', 'data-a="dlflipbook"', 'data-a="importportcfg"', 'portCfg(S.diario)', "el.tagName === 'SELECT'", 'node tools/portfolio.mjs']) assert.ok(app.includes(trecho), trecho);
  assert.ok(!/P\.CFG_PADRAO\(S\.diario\)/.test(app), 'download e impressão usam a configuração escolhida');
});
