# MathLab Aulas Visuais — versão 1.6.0

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

## Validação do professor

Nenhum material nasce validado. A capa e a caixa do autor mostram "Rascunho, aguarda revisão do professor" até que o professor marque "Revisei e valido este material" na aba Editor, com o nome de quem revisou. A data e uma impressão digital do conteúdo são gravadas nesse momento. Se o conteúdo mudar depois, a validação aparece como desatualizada. Um JSON que traga revisão aprovada (de uma IA ou de um arquivo antigo) é importado como rascunho, com aviso: a validação não viaja no arquivo.

## Plano por unidades, reparo e troca com o App

O contrato de troca é o `mathlab.material/2`, versão menor 2.1 (`docs/CONTRATO_MATERIAL_2.md`, `schema/mathlab.material.2.schema.json`). Os campos novos são opcionais: `claims`, `calculations`, `provenance` e `contractVersion`.

1. **Avisos na importação.** O site diz tudo que corrigiu, cortou ou descartou ao importar um JSON.
2. **Conferência e reparo.** No Editor, o cartão "Conferência e reparo" gera um pedido para o Gem corrigir só o que falta (`mathlab.repair/1`). A resposta troca apenas blocos que já existem e deixa a validação do professor desatualizada.
3. **Plano por unidades.** Na aba "Plano por unidades" o Gem propõe um plano (`mathlab.blueprint/1`), o professor aprova com nome e data, e cada unidade (`mathlab.unit/1`) é pedida e aplicada em ordem. Mudar o plano depois de aprovado desatualiza a aprovação.
4. **Arquivo do App Node.** O App gera o botão "Enviar ao site (JSON)". O site importa esse arquivo sem aviso, guarda objetivos, referências, afirmações e proveniência, e o material chega sem validação. Há um arquivo real do App em `tests/fixtures/app-export.mathlab.json`, usado nos testes.

Só o site registra validação humana. Estado de revisão que venha em um JSON é ignorado, com aviso.

## Pacotes de domínio (assuntos novos)

Cada tipo de assunto tem um pacote de regras: blocos que não podem faltar, erros típicos de quem aprende, visuais que fazem sentido, cuidados de segurança e o que a auditoria deve conferir. Na aba **Criar**, o card "Regras do domínio" mostra o pacote em uso e o texto que vai junto com o pedido.

Os 7 tipos de conhecimento já vêm prontos. Para um assunto que não cabe neles, como mecânica automotiva ou fotografia, abra "Assunto novo", copie o pedido de pacote, cole no Gem e traga a resposta de volta (formato `mathlab.domain/1`). O site normaliza o pacote, avisa o que descartou (bloco que não existe, visual fora do catálogo, regra contraditória) e guarda no seu navegador. Na aba **Auditoria**, um card novo confere o material contra as regras do pacote. A conferência olha tipos de bloco e palavras, então não substitui a leitura do professor. Planos e pacotes também entram no backup da Biblioteca.

## Livro ou caderno (vários materiais em uma obra)

A aba **Livro** junta materiais da biblioteca em uma obra só. Você marca os materiais, escolhe a ordem com as setas e define título, subtítulo e autor. A compilação gera capa, sumário com links, ficha de revisão, um capítulo por material, glossário consolidado, caderno de respostas e referências sem repetição.

* **Caderno de respostas:** os blocos de gabarito saem do capítulo e vão para o fim. Desmarque a opção se preferir o gabarito no próprio capítulo
* **Glossário:** reúne o título de cada bloco de conceito e os termos em negrito que aparecem em frases de definição. Ordem alfabética, sem repetição. Conferir as definições faz parte da revisão
* **Honestidade:** a ficha de revisão mostra o estado real de cada capítulo. O livro só afirma validação quando todos os capítulos têm a validação do professor atualizada. Se um capítulo mudou depois de validado, ele aparece como desatualizado
* **Avisos:** título repetido, capítulo sem blocos e exercícios sem gabarito aparecem antes de você baixar
* **Saída:** HTML autocontido, sem recursos externos, ou impressão em PDF pelo navegador. O número de página não aparece no sumário, porque o navegador não calcula isso em HTML; os links do sumário funcionam

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

## PDF reproduzível

Para gerar o PDF da apostila com as mesmas fontes e a mesma paginação em qualquer computador:

```bash
npm run pdf -- material.json saida.pdf     # a partir de um JSON do site
npm run pdf -- --demo apostila-demo.pdf    # material de demonstração
```

Precisa do pacote `playwright` com Chromium (`npx playwright install chromium`). O script embute as fontes de `assets/fontes` (Fredoka, Caveat, Nunito, Patrick Hand e Noto Sans Math, todas com licença OFL, texto das licenças na mesma pasta), bloqueia qualquer pedido de rede, confere que cada folha da apostila virou uma página do PDF e que nada foi cortado, e zera data e identificador do arquivo. Duas execuções com o mesmo material saem idênticas, byte a byte.

Caminho completo do App ao PDF: no App, **Enviar ao site (JSON)**; depois `npm run pdf -- arquivo.mathlab.json saida.pdf`. O arquivo do App é importado pelo mesmo código do site, com os mesmos avisos, e a apostila nasce marcada como rascunho até a revisão do professor.

Limites conhecidos: emojis usam a fonte de emojis do sistema, então o desenho pode variar entre computadores. Subscritos Unicode, como ₁, também caem em fonte do sistema; o script avisa quando isso acontece. Imprimir pelo navegador (Salvar como PDF) continua funcionando, e agora também usa a margem zero na impressão, mas depende das fontes do Google estarem acessíveis.

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

## Manter as instruções em sincronia

`skill/SKILL.md` é a fonte completa. `gemini/GEM_INSTRUCOES.md` e `chatgpt/CHATGPT_GPT_INSTRUCOES.md` são versões mais curtas e precisam acompanhar o esquema JSON: ao acrescentar ou renomear um campo, atualize os três. O teste `tests/instrucoes.test.js` confere os campos, a versão e as regras de pergunta e de tema interdisciplinar.
