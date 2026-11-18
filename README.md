# MathLab Aulas Visuais — versão 1.5

Ferramenta de **autoria docente para qualquer disciplina**. O professor pede um material em linguagem natural e recebe:

- um **material didático completo**, adaptado ao tipo de conhecimento (formal, empírico, interpretativo, histórico, linguístico, prático);
- uma **apostila visual completa**: **capa** em pôster (caixas numeradas, dica de ouro, "você sabia?", atenção, faixa "Em resumo") + **miolo** em páginas A4 com o mesmo visual (apresentação, sumário com páginas, um cartão colorido por bloco, figuras, caixas de destaque, resumo final, referências);
- **editor por blocos** com histórico de versões, **auditoria** em 10 categorias e **exportação** (HTML, PDF pelo navegador, Markdown, JSON, SVG).

Duas peças que trabalham juntas:

| Peça | O que faz | Onde roda |
|---|---|---|
| **Skill / Gem** (`skill/SKILL.md`, `gemini/GEM_INSTRUCOES.md`) | Escreve o conteúdo, sem inventar referências, e devolve JSON | Claude ou Gemini Pro (Gem) |
| **Site** (`index.html`) | Importa o JSON, edita, audita, versiona, exporta, monta o pôster e o prompt da imagem | Navegador (GitHub Pages ou arquivo único) |

Nenhum dado sai do navegador. Não há servidor, chave de API nem chamada externa.

## Uso rápido (sem custo extra)

1. Abra o site e vá em **Criar**. Preencha disciplina, etapa, tema e duração.
2. Clique em **Copiar pedido** e cole no seu **Gem** do Gemini (ou no Claude com a skill).
3. Copie o JSON que ele devolver, cole em **Criar → Importar material**.
4. Revise no **Editor**, ajuste a **Capa (pôster)**, confira a **Apostila completa**, rode a **Auditoria** e **Exporte** (botão "Apostila completa").
5. Para a versão ilustrada: em **Capa (pôster)**, clique em **Copiar prompt da imagem** e cole no Gemini (Nano Banana). O pôster em HTML continua sendo a versão exata, porque IA de imagem pode errar letras.

## Instalar o Gem (Gemini Pro)

1. Em gemini.google.com, abra **Gems → Novo Gem**.
2. Nome: `MathLab`. Em **Instruções**, cole todo o texto de `gemini/GEM_INSTRUCOES.md`.
3. Salve. Use esse Gem sempre que for gerar material.

## Instalar a skill (Claude)

Use `skill/SKILL.md` como skill chamada `mathlab-aulas-visuais`.

## Publicar no GitHub Pages

1. Crie um repositório e suba **todo o conteúdo desta pasta**.
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
3. A cada envio para `main`, o fluxo `.github/workflows/pages.yml` roda os testes e publica o site.
4. O endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Sem GitHub: abra `dist/mathlab-standalone.html` com duplo clique (arquivo único, funciona offline).

## Desenvolvimento

```
npm test        # testes do núcleo (auditoria, importação, exportação, segurança do SVG)
npm run build   # gera dist/mathlab-standalone.html
```

- `js/core.js`: núcleo sem dependências (esquema, auditoria, Markdown seguro, geradores de SVG, pôster, exportação).
- `js/app.js`: interface. Persistência em `localStorage` (faça backup pela Biblioteca).
- Tema do pôster: `POSTER_THEMES` e `POSTER_CSS` em `js/core.js`. É onde se troca o visual.

## O que mudou na 1.1

- **Miolo da apostila**: antes só havia a capa (pôster) e o material em HTML simples. Agora a aba **Apostila completa** monta capa + miolo em páginas A4 no mesmo visual, com paginação pela altura real da folha, sumário com número de página e rodapé.
- **Caixas de destaque por bloco** (`callout`: dica, sabia, atencao, prova), campo opcional e compatível com materiais antigos.
- Aviso honesto: o desenho do miolo é **proposta nossa** no estilo da capa; não foi copiado de nenhuma apostila de terceiros. Se você tiver um modelo de miolo que prefere, o visual se ajusta em `BOOK_CSS` (`js/core.js`).

## Regras do projeto

Não inventar referências nem resultados de testes; não aprovar automaticamente (a auditoria é por regras e **não** substitui a revisão do professor); esqueleto offline é sempre reprovado até ser preenchido; exclusões pedem confirmação e baixam backup antes; versões nunca são apagadas ao restaurar.

## Ainda não está nesta versão

Exportação em **Word (.docx)** e **PowerPoint (.pptx)**, integração direta com API do Gemini e busca de referências no Crossref/OpenAlex. O caminho principal (Gem + importar JSON) cobre o essencial sem custo.
