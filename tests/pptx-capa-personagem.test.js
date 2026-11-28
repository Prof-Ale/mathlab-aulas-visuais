'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const C = require('../js/core.js');
const Pptx = require('../js/pptx.js');

test('PPTX offline: gera arquivo ZIP/OOXML válido com slides, capa, conteúdo e controle de gabarito', () => {
  const demo = C.demo();
  const semGab = Pptx.buildPptxBytes(demo, { gabarito: false });
  const comGab = Pptx.buildPptxBytes(demo, { gabarito: true });
  assert.ok(semGab instanceof Uint8Array && semGab.length > 4000, 'PPTX gerado tem tamanho válido');
  assert.equal(semGab[0], 0x50); // 'P'
  assert.equal(semGab[1], 0x4b); // 'K'
  assert.equal(semGab[2], 0x03);
  assert.equal(semGab[3], 0x04);
  const txtSem = Buffer.from(semGab).toString('utf8');
  const txtCom = Buffer.from(comGab).toString('utf8');
  assert.ok(txtSem.includes('[Content_Types].xml') && txtSem.includes('ppt/presentation.xml') && txtSem.includes('ppt/slides/slide1.xml'));
  assert.ok(txtSem.includes(demo.title), 'título da aula presente no slide 1');
  assert.ok(comGab.length > semGab.length, 'versão com gabarito inclui slides extras');
  assert.ok(txtCom.includes('Gabarito'), 'versão com gabarito contém o bloco Gabarito');
});

test('PPTX offline: embute imagem PNG quando fornecida para um slide com figura', () => {
  const demo = C.demo();
  const fakePng = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const bytes = Pptx.buildPptxBytes(demo, { images: { 2: fakePng } });
  const txt = Buffer.from(bytes).toString('utf8');
  assert.ok(txt.includes('ppt/media/image3.png'), 'arquivo PNG gravado em ppt/media');
  assert.ok(txt.includes('ContentType="image/png"'), 'content type PNG declarado');
});

test('Capa Clean editorial redesenhada + opção de personagem Professor Alê na capa e no miolo', () => {
  const m = C.demo();
  // Padrão Clean: cabeçalho editorial, objetivos em destaque, emblema geométrico e sem foto pessoal
  const clean = C.renderCleanCover(m);
  assert.ok(clean.includes('mlclean-stage') && clean.includes('Objetivos de aprendizagem'), 'Capa Clean traz composição editorial com objetivos');
  assert.ok(clean.includes('mlclean-emblem') && !clean.includes('mlclean-character'), 'padrão não ativa personagem sem escolha');

  // Personagem Professor Alê ativado explicitamente pelo professor
  m.poster.showCharacter = true;
  m.poster.characterPose = 'avatars/prof-ale_descobridor.png';
  const withChar = C.renderCleanCover(m);
  assert.ok(withChar.includes('mlclean-character') && withChar.includes('assets/avatars/prof-ale_descobridor.png'), 'capa mostra personagem Professor Alê escolhido');
  assert.ok(fs.existsSync(path.join(root, 'assets', 'avatars', 'prof-ale_descobridor.png')), 'asset PNG do personagem existe no repositório');

  const apChar = C.toApostila(m);
  assert.ok(apChar.includes('mlco-char') && apChar.includes('assets/avatars/prof-ale_'), 'caixas de destaque da apostila exibem poses contextuais do Professor Alê');
});

test('Prompt da capa editorial e pedido de conteúdo (APB v2.0.0) são substantivos e adaptam personagem', () => {
  const m = C.demo();
  const pClean = C.buildCoverPrompt(m);
  assert.ok(pClean.includes('Direção de arte:') && pClean.includes('Conceitos-chave') && pClean.includes('#0D2B5B') && pClean.includes('#F7B500'), 'prompt de capa traz direção de arte e paleta oficial');

  m.poster.showCharacter = true;
  const pChar = C.buildCoverPrompt(m);
  assert.ok(pChar.includes('PERSONAGEM OPCIONAL ATIVADO') && pChar.includes('Professor Alê'), 'prompt da capa inclui Professor Alê quando ativado');

  const req = C.buildRequestText({ discipline: 'Matemática', level: '7º ano', topic: 'Números Inteiros' });
  assert.ok(req.includes('Arquitetura Pedagógica Brasileira (v2.0.0)') && req.includes('Padrão obrigatório de qualidade do conteúdo:'), 'pedido de conteúdo cobra profundidade e APB v2.0.0');
});
