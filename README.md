# MathLab Aulas Visuais

> **▶ [Usar agora no navegador (GitHub Pages)](https://prof-ale.github.io/mathlab-aulas-visuais/)** · **📥 [Baixar versão offline única (`dist/mathlab-standalone.html`)](https://github.com/Prof-Ale/mathlab-aulas-visuais/releases/latest)** · **Licença:** [MIT](LICENSE)

**Versão do pacote:** `1.6.0` · **Motor (`js/core.js`):** `2.0.0` · **Contrato:** `mathlab.material/2` (versão menor `2.1`)  
*Fonte única de versão:* [`manifest.json`](manifest.json) (verificada automaticamente por `tests/manifesto.test.js`).

Ambiente de **autoria docente multidisciplinar** para criar, estruturar, editar, auditar, validar e exportar aulas, apostilas visuais e cadernos didáticos para **qualquer disciplina**: não apenas Matemática.

---

## Finalidade e público usuário

O **MathLab Aulas Visuais** apoia professores da Educação Básica (Anos Iniciais, Anos Finais, Ensino Médio, EJA), Educação Profissional, Ensino Superior, Pós-Graduação e Atendimento Educacional Especializado (AEE) na produção de materiais didáticos rigorosos, acessíveis e prontos para leitura digital ou impressão em A4.

- **Mediação pedagógica:** fundamentada na Psicologia Histórico-Cultural (mediação semiótica, passagem dos conceitos cotidianos aos científicos, Zona de Desenvolvimento Proximal e Desenho Universal para a Aprendizagem, DUA).
- **Respeito epistemológico:** a mediação pedagógica **não substitui** a epistemologia própria de cada disciplina; o formulário detecta e calibra o pedido conforme o tipo de conhecimento e a etapa de ensino.
- **Autoria humana no centro:** o site organiza e audita por regras, mas **somente o professor valida** o material antes do uso.

---

## Tipos de conhecimento contemplados

O núcleo (`js/core.js`, constante `EPISTEMIC`) contempla **7 tipos de conhecimento**:

| Tipo (`epistemicType`) | Áreas típicas |
| --- | --- |
| `formal` | Matemática, Lógica, Estatística, Álgebra, Geometria, Cálculo |
| `empirica` | Física, Química, Biologia, Ciências, Astronomia, Ecologia, Saúde |
| `interpretativa` | Filosofia, Sociologia, Literatura, Artes, Psicologia, Direito, Pedagogia |
| `historica` | História, Geografia humana, Arqueologia, Antropologia |
| `linguistica` | Português, Línguas estrangeiras, Redação, Gramática, Libras |
| `pratica` | Educação Física, Informática, Robótica, Música, cursos técnicos |
| `geral` | Temas gerais, mistos ou interdisciplinares |

Para assuntos que não cabem nos 7 perfis padrão, o professor pode gerar **pacotes de domínio** sob medida (`mathlab.domain/1`).

---

## Arquitetura: Skill / Gem / GPT + Site estático

O repositório reúne duas peças complementares que operam **sem servidor e sem chamadas automáticas a APIs externas**:

| Peça | Arquivos | O que faz | Onde roda |
| --- | --- | --- | --- |
| **Instruções de IA (Skill / Gem / Custom GPT)** | `skill/SKILL.md`, `gemini/GEM_INSTRUCOES.md`, `chatgpt/CHATGPT_GPT_INSTRUCOES.md` | Gera conteúdo didático estruturado em JSON (`mathlab.material/2`), sem inventar referências nem aprovar revisão | Claude (Skill), Gemini (Gem) ou ChatGPT (Custom GPT) |
| **Site estático** | `index.html`, `js/*.js`, `css/styles.css`, `dist/mathlab-standalone.html` | Monta o pedido, importa e normaliza o JSON, edita por blocos, versiona, audita, registra validação humana, compila livros e exporta | Navegador (GitHub Pages ou arquivo HTML único offline) |

> **Transferência manual para IA externa:** o site **não** realiza chamadas automáticas a APIs externas nem exige chave de API. O professor copia o pedido gerado na aba **Criar**, cola na ferramenta de IA de sua preferência e traz o JSON de volta para o site.

---

## Fluxo de trabalho completo

1. **Criar pedido:** na aba **Criar**, informe disciplina, etapa de ensino (com calibração pedagógica automática), tema, duração, seções modulares desejadas e, se quiser, **Fontes do autor** e **Regras do domínio**.
2. **Gerar conteúdo na IA externa:** clique em **Copiar pedido** e cole no seu Gem (Gemini), Skill (Claude) ou Custom GPT (ChatGPT). Também é possível gerar um **esqueleto offline** (sempre reprovado na auditoria até ser preenchido).
3. **Importar:** cole o JSON retornado em **Criar → Importar material**. O site exibe **avisos de importação** detalhando qualquer campo normalizado, cortado ou descartado.
4. **Editar, conferir e reparar:** edite bloco a bloco com histórico de versões (restaurar versão nunca apaga as anteriores). O cartão **Conferência e reparo** gera um pedido focado apenas nos blocos com pendências (`mathlab.repair/1`).
5. **Auditar:** execute a auditoria automática (10 categorias + verificador v2 + conferência de fontes e regras de domínio).
6. **Validar:** marque **"Revisei e valido este material"** na aba **Editor** informando o nome de quem revisou.
7. **Exportar:** baixe o material em HTML (Apostila completa A4, Material HTML, Pôster/Capa), imprima/salve como PDF pelo navegador, gere **PDF reproduzível e acessível** via CLI (`npm run pdf`), ou exporte em Markdown, JSON e SVG.

---

## Contrato `mathlab.material/2` e formatos auxiliares

- **Contrato principal:** `mathlab.material/2`, versão menor `2.1` ([`docs/CONTRATO_MATERIAL_2.md`](docs/CONTRATO_MATERIAL_2.md), [`schema/mathlab.material.2.schema.json`](schema/mathlab.material.2.schema.json), exemplo em [`schema/exemplos/exemplo-material2-1.json`](schema/exemplos/exemplo-material2-1.json)). Campos opcionais introduzidos na `2.1`: `claims`, `calculations`, `provenance` e `contractVersion`.
- **Formatos auxiliares:**
  - `mathlab.blueprint/1`: plano de curso/apostila por unidades.
  - `mathlab.unit/1`: unidade individual gerada a partir de um plano aprovado.
  - `mathlab.repair/1`: correção localizada apenas em blocos existentes.
  - `mathlab.domain/1`: pacote de regras de um domínio/assunto novo.
- **Interoperabilidade com o App Node (`mathlab-aulas-visuais-app`):** arquivos exportados pelo App em `mathlab.material/2` (como `tests/fixtures/app-export.mathlab.json`) são importados diretamente pelo site, preservando objetivos, referências, afirmações e proveniência, sempre chegando **sem validação humana**.

---

## Plano por unidades e memória acumulada

Na aba **Plano por unidades**, o professor pode estruturar obras maiores em etapas:

1. A IA propõe um plano (`mathlab.blueprint/1`, de 2 a 8 unidades com objetivos, dependências e tipos de bloco).
2. O professor **aprova o plano com nome e data** (alterar o plano depois invalida a aprovação e bloqueia novas unidades).
3. Cada unidade (`mathlab.unit/1`) é pedida e aplicada em ordem.
4. **Memória acumulada (`estadoAcumulado`):** o pedido de cada unidade carrega automaticamente o que já foi ensinado nas anteriores, sem repetição (ignorando maiúsculas e acentos) e com tetos explícitos: **24 termos**, **12 notações**, **16 pressupostos** e **12 exemplos/atividades**. Ao aplicar uma unidade, o site avisa se um conceito anterior foi redefinido.

---

## Pacotes de domínio

Os 7 tipos de conhecimento já vêm configurados. Em **Criar → Regras do domínio**, o professor visualiza o pacote ativo e pode criar um **Assunto novo** (`mathlab.domain/1`, módulo `js/dominios.js`) com blocos esperados, erros típicos, visuais válidos, cuidados de segurança e critérios de auditoria. O site normaliza o pacote, descarta itens inválidos com aviso e salva no navegador (incluído no backup da Biblioteca).

---

## Fontes do autor e rastreabilidade

Em **Criar → Fontes do autor** (`js/fontes.js`), o professor pode colar trechos de livros, normas ou anotações pessoais. As fontes selecionadas entram no pedido como base obrigatória numerada `[F1]`, `[F2]`, … com instrução de reescrita autoral e marcação explícita de uso.

- **Limites:** até **3.000 caracteres** por trecho salvo, **1.500 caracteres** por fonte no pedido, **6.000 caracteres** no total e no máximo **8 fontes** (com aviso quando houver corte).
- **Conferência na Auditoria:** detecta marcadores inexistentes, fontes selecionadas não citadas e sequências de **12 ou mais palavras** idênticas à fonte (possível cópia literal).

---

## Validação humana e auditoria automática

- **Nenhum material nasce validado.** Capa e caixa de autoria exibem *"Rascunho, aguarda revisão do professor"* até a validação explícita com nome e data.
- **Impressão digital do conteúdo (`hashConteudo`):** editar o texto ou aplicar um reparo torna a validação anterior **desatualizada**; alterar apenas aparência (logo/foto) preserva a validação.
- **A validação não viaja no arquivo:** qualquer JSON importado com revisão aprovada é rebaixado a rascunho com aviso.
- **Auditoria automática (`audit` e `js/auditar-v2.js`):** verifica estrutura, referências, segurança de SVG, coerência com o perfil de conteúdo (`completo`, `expositivo`, `expositivo_visual`, `pratica`), uso das fontes e regras de domínio. É uma conferência por regras e **não substitui a leitura crítica do professor**.

---

## Compilação de livros e cadernos

A aba **Livro** (`js/livro.js`) reúne vários materiais da Biblioteca em uma única obra HTML autocontida (imprimível em PDF pelo navegador):

- **Estrutura gerada:** capa, sumário navegável por links, ficha de revisão por capítulo, capítulos na ordem escolhida, glossário consolidado (ordem alfabética, sem repetição), caderno de respostas (opcional, movendo blocos de gabarito para o final) e referências consolidadas.
- **Honestidade editorial:** o livro só se declara validado quando **todos** os capítulos possuem validação humana atualizada.
- **Avisos prévios:** título repetido, capítulo sem blocos e exercícios sem gabarito.
- **Limitação conhecida:** números de página não aparecem no sumário HTML (o navegador não calcula paginação no DOM); os links internos funcionam normalmente.

### Livro de alta qualidade (PDF editorial + EPUB)

Além do HTML, o mesmo livro pode virar **Markdown** (dialeto do Pandoc) e, a partir dele, **PDF de qualidade gráfica** (XeLaTeX) e **EPUB3**. O JSON continua sendo a fonte de verdade (validado, com BNCC); o Markdown é só uma camada de saída, então o livro herda as mesmas regras de honestidade: a ficha de revisão mostra o estado real de cada capítulo e o livro nunca se declara validado.

- **Pelo app:** aba **Livro → 📚 Baixar Markdown (livro de alta qualidade)** (figuras SVG embutidas no próprio `.md`).
- **Pela linha de comando (no seu computador):**

```bash
node tools/livro.mjs cap1.mathlab.json cap2.mathlab.json --titulo "Caderno de Matemática" --subtitulo "7º e 8º anos" --saida livro/
# opções: --formato pdf,epub,md   --papel a4|a5   --modelo didatico|narrativo   --sangria 3   --sem-gabarito   --sem-glossario   --sem-referencias
node tools/livro.mjs --demo --saida /tmp/livro      # material de demonstração
```

- **Requisitos (só para PDF/EPUB):** Pandoc 3, TeX Live com XeLaTeX e `texlive-lang-portuguese` (hifenização), fontes TeX Gyre (Pagella, Heros) e, de preferência, Fira Sans; `rsvg-convert` (librsvg) para figuras SVG no PDF e capa do EPUB. Em Debian/Ubuntu: `apt install pandoc texlive-xetex texlive-latex-extra texlive-fonts-extra texlive-lang-portuguese librsvg2-bin`.
- **Modelos:** `didatico` (padrão: capa azul, número de capítulo grande, caixas coloridas por tipo de bloco, A4) e `narrativo` (livro de leitura: serifada clássica, capa clara, blocos discretos com filete lateral, páginas espelhadas com margens de livro, A5 por padrão; `--papel a4` continua valendo).
- **Ficha técnica (opcional):** `--editora "…" --isbn 978… --edicao "1ª edição" --ano 2026 --licenca "CC BY-NC-SA 4.0" --contato "…"`. A página só aparece com o que você informar; o ISBN é conferido pelo dígito verificador (aviso se estiver errado) e nunca é inventado. A ficha catalográfica (CIP) exige bibliotecário e não é gerada.
- **Modo gráfica:** `--sangria 3` gera páginas do formato final + 2 × 3 mm (capa de fundo cheio sangra de verdade), com margens somadas à sangria. Não inclui marcas de corte: informe à gráfica o formato final (A4 210 × 297 mm ou A5 148 × 210 mm) e a sangria.
- **Índice remissivo (opcional):** `--indice` lista cada termo do glossário com todos os capítulos em que ele aparece no texto (busca por palavra inteira, sem diferenciar acento). Só sai com glossário e pelo menos dois capítulos; os termos vêm do glossário, não de uma análise do texto inteiro.
- **PDF/A:** `--pdfa` converte o PDF para PDF/A-2b com Ghostscript (fontes embutidas, cores em sRGB, metadados de título e autor) para arquivamento de longo prazo. Requer Ghostscript. A conversão não foi validada com veraPDF aqui, então valide antes de enviar a um repositório; PDF/A também não torna o PDF acessível (sem tags): para acessibilidade use o EPUB3.
- **O que sai:** capa, sumário com páginas, ficha de revisão, capítulos com número grande, caixas coloridas por tipo de bloco (conceito, exemplo, atividade, exercícios…), fórmulas em LaTeX, tabelas, figuras com legenda, glossário, caderno de respostas e referências. No EPUB, fórmulas em MathML e as mesmas caixas via CSS.
- **Limitações declaradas:** o PDF do LaTeX **não é marcado para acessibilidade** (use o EPUB3 ou o HTML como formatos acessíveis); sem ficha catalográfica nem marcas de corte; o PDF/EPUB só são gerados localmente (o app no navegador gera apenas o Markdown).
- **Crédito:** a ideia de "Markdown + Pandoc + XeLaTeX" vem de [romankurnovskii/markdown-to-pdf-book-converter](https://github.com/romankurnovskii/markdown-to-pdf-book-converter) (MIT); os arquivos de `tools/livro/` são originais deste projeto.

---

## Geração de PDF

O projeto oferece dois caminhos para PDF:

1. **Pelo navegador:** abra a aba **Apostila completa** (ou o HTML exportado de Apostila/Livro) e use *Imprimir → Salvar como PDF*.
2. **PDF reproduzível e acessível via CLI (`tools/gerar-pdf.mjs`):**
   ```bash
   npm run pdf -- material.json saida.pdf     # a partir de um JSON do site ou do App
   npm run pdf -- --demo apostila-demo.pdf    # material de demonstração
   ```
   - Requer `playwright` com Chromium instalado (`npx playwright install chromium`).
   - Embute localmente as fontes OFL de `assets/fontes/` (Fredoka, Caveat, Nunito, Patrick Hand e Noto Sans Math), bloqueia requisições de rede, valida que cada folha gerou uma página sem cortes e normaliza metadados de data/ID (saída reproduzível byte a byte).
   - Gera **PDF marcado (tagged)** em `pt-BR` com estrutura de títulos, listas, figuras com `alt` e marcadores, verificado no próprio arquivo PDF. *Nota: a conformidade formal PDF/UA não foi certificada externamente.*

---

## Matriz de funcionalidades (implementado × experimental × planejado × outro projeto)

| Recurso | Situação | Onde está / Observação |
| --- | --- | --- |
| Editor por blocos, histórico de versões, Biblioteca em `localStorage`, busca, tema claro/escuro | **Implementado** | `index.html`, `js/app.js`, `js/core.js`, `css/styles.css` |
| Exportação **HTML** (Apostila A4, Material, Pôster/Capa, Livro), **Markdown**, **JSON** (`mathlab.material/2`) e **SVG** acessível | **Implementado** | `js/core.js`, `js/livro.js` |
| **PDF** via navegador e **PDF reproduzível/acessível** via CLI (`npm run pdf`) | **Implementado** | `tools/gerar-pdf.mjs` (requer `playwright` + Chromium) |
| Plano por unidades, memória acumulada, reparo localizado, pacotes de domínio e fontes do autor | **Implementado** | `js/core.js`, `js/dominios.js`, `js/fontes.js` |
| Auditoria automática v1/v2, validação humana por hash e verificação de acessibilidade (`tools/audit-a11y.js`) | **Implementado** | `js/core.js`, `js/auditar-v2.js`, `tools/audit-a11y.js` |
| **Central de revisão** (barra nas abas Revisar): próximo passo, auditar de novo, pedir correção à IA, colar o JSON de correção (reparo ou material inteiro), antes e depois com notas e pontos resolvidos, desfazer, revisar português, ortografia e apresentação | **Implementado** | `js/app.js` (`acoesRevisaoHtml`), `tests/central-revisao.test.js` com Chromium |
| Flipbook do portfólio com **StPageFlip** (MIT, 44 KB, embutida) | **Implementado** | `assets/vendor/page-flip/` com a licença; sem rede, sem CDN |
| Diário de bordo e Portfólio docente (`js/racional.js`, `js/portfolio.js`, `tools/portfolio.mjs`) | **Experimental** | Schemas `diario.v1` e `portfolio.v1` em `schema/`; três perfis (escolar, processo seletivo, pós-graduação); saídas HTML A4, flipbook offline (StPageFlip) e PDF acessível pelo comando. Ver `docs/docs/07-diario-e-portfolio.md` |
| Renderização matemática **KaTeX 100% offline** (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`, protegendo `R$`) | **Implementado** | `assets/vendor/katex/` (MIT, zero dependência npm) + `js/core.js` + `js/livro.js` + `dist/mathlab-standalone.html` |
| **Capa Clean sem foto do autor**, **arte de capa opcional** (prompt só da ilustração, sem texto e sem pessoas, para o Gemini/Nano Banana; o arquivo PNG, JPEG ou WebP até 3 MB volta pelo site, com texto alternativo) e proteção de `R$` e de `$$...$$` na renderização | **Implementado** | `js/core.js` (`renderCleanCover`, `buildCoverPrompt`, `coverArtOk`), `js/app.js` (aba Apostila visual), `tests/capa-formulas.test.js`. O site não gera a imagem: o professor leva o prompt à ferramenta de imagem e traz o arquivo |
| **Infográfico de Abertura** (sequência editorial 4 camadas) e **Seletor contextual do Professor Alê** (13 áreas) | **Implementado** | `js/core.js` (`renderOpeningInfographic`, `getProfessorAleContext`) + `js/app.js` |
| Exportação **DOCX** e **PPTX** (com OMML nativo) e exportação Direção AB | **Outro projeto** | Implementados nos repositórios irmãos [`mathlab-aulas-visuais-app`](https://github.com/Prof-Ale/mathlab-aulas-visuais-app) e [`MathLab-Editorial-System`](https://github.com/Prof-Ale/MathLab-Editorial-System): **não** estão neste repositório estático |
| Auditoria ABNT / revisão editorial assistida e consulta CrossRef/OpenAlex | **Outro projeto** | Implementados no repositório irmão [`ScriptaLab`](https://github.com/Prof-Ale/ScriptaLab) e no App Node |
| Integração direta com APIs de IA a partir do site | **Planejado / Fora do escopo do site estático** | O site permanece intencionalmente sem backend e sem chave de API |

---

## Identidade editorial e Personagem Oficial (Professor Alê)

As diretrizes visuais oficiais e a **Ficha Oficial do Personagem Professor Alê (Versão 1.0)** estão documentadas em [`docs/IDENTIDADE_EDITORIAL_E_PERSONAGEM.md`](docs/IDENTIDADE_EDITORIAL_E_PERSONAGEM.md), com referências oficiais em `assets/identidade/` e metadados estruturados em `js/core.js` (`EDITORIAL_IDENTITY` e `PROFESSOR_ALE_IDENTITY`):

- **Paleta oficial:** azul marinho (`#0D2B5B`), amarelo ouro (`#F7B500`), laranja (`#F57C00`) e fundo claro (`#F8F3E6` / branco), além das cores auxiliares de apoio (`#1E88E5`, `#2E7D32`, `#6A1B9A`, `#C62828`).
- **Identidade MathLab:** preservação integral dos logotipos oficiais (Selo Circular Marinho/Dourado e Logo Fundo Claro) sem alteração de formas ou cores principais.
- **Organização editorial definitiva de cadernos:**
  1. **Capa**: identidade MathLab, hierarquia tipográfica clara, título, subtítulo, autoria e identificação do estudante.
  2. **Folha de rosto**: título completo, autor, disciplina, ano escolar/etapa e identificação editorial limpa.
  3. **Infográfico de abertura**: síntese visual conceitual separada da folha de rosto, com linguagem e notação matemática corretas.
  4. **Miolo didático A4**: conceitos, exemplos resolvidos, representações visuais, situações-problema e exercícios graduados, com boa legibilidade e economia de tinta na impressão e leitura digital.
- **Capa:** a Capa Clean não leva foto nem avatar do autor. Mostra o emblema da área ou a arte de capa anexada pelo professor. O personagem aparece na caixa "Sobre o Autor", no Infográfico de Abertura e nos prompts de imagem, quando o professor escolhe a variação contextual.
- **Arquivos oficiais em resolução total:** `assets/identidade/originais/` guarda as quatro imagens como foram enviadas (ficha do personagem, grade multidisciplinar, selo circular e logotipo de fundo claro). Os arquivos de `assets/identidade/` e de `assets/` são cópias reduzidas para uso no site. Os logotipos não são recriados nem redesenhados.
- **Personagem oficial, Professor Alê (Prof. Alê Barbosa):** usado como elemento de identidade sem repetição excessiva nas páginas internas. Mantém consistência facial, óculos, cabelo curto, marca MathLab e estilo cartoon editorial, variando figurino, expressão, pose, objetos e cenário conforme a disciplina (Matemática, Física, Química, Biologia, Neuroanatomia, Psicologia, Psicanálise, Educação e AEE, Terapia Ocupacional, Filosofia, História, Tecnologia e Robótica, Educação Financeira).

---

## Funcionamento offline e privacidade

- **Zero backend e zero telemetria:** nenhum conteúdo autoral sai do navegador. Todos os projetos, versões, fontes, planos e pacotes de domínio ficam salvos apenas no `localStorage` do navegador (faça backup periódico pela aba **Biblioteca**).
- **Uso offline:** abra [`dist/mathlab-standalone.html`](dist/mathlab-standalone.html) diretamente no navegador (arquivo único autocontido). Tanto o site publicado (`index.html`) quanto o `npm run pdf` usam fontes OFL locais de `assets/fontes/` sem requisições externas ao Google Fonts.

---

## Instalação, uso e desenvolvimento

### Requisitos
- **Uso no navegador:** qualquer navegador moderno (ou GitHub Pages).
- **Desenvolvimento e testes:** Node.js `>= 20` (sem dependências obrigatórias no `package.json`).
- **PDF reproduzível (opcional):** Playwright + Chromium (`npx playwright install chromium`).

### Comandos
```bash
npm test                                  # executa todas as 21 suítes em tests/
npm run build                             # gera dist/mathlab-standalone.html
npm run pdf -- --demo apostila-demo.pdf   # gera PDF acessível e reproduzível (requer Playwright)
```

### Publicação e configuração de IA
Veja o passo a passo completo para configurar **Claude (Skill)**, **Gemini (Gem)**, **ChatGPT (Custom GPT)** e publicar no **GitHub Pages** (`.github/workflows/pages.yml`) em [`COMO_USAR_E_PUBLICAR.md`](COMO_USAR_E_PUBLICAR.md).

### Manter as instruções e versões em sincronia
- `manifest.json` é a fonte única de versões. Ao subir de versão, atualize primeiro `manifest.json` e depois os arquivos verificados por `tests/manifesto.test.js`.
- `skill/SKILL.md` é a fonte completa das instruções (v2.0.0, incluindo a Arquitetura Pedagógica Brasileira — seções 11 a 19); `gemini/GEM_INSTRUCOES.md` e `chatgpt/CHATGPT_GPT_INSTRUCOES.md` trazem o mesmo conteúdo integral (`tests/instrucoes.test.js` confere os campos, a versão em `manifest.json` e a integridade das 19 seções).

---

## Testes e limitações conhecidas

- **Suíte automatizada:** `npm test` executa 21 arquivos de teste (`core`, `instrucoes`, `validacao`, `contrato`, `avisos`, `reparo`, `plano`, `app-bridge`, `pdf`, `dominios`, `livro`, `fontes`, `manifesto`, `capa-formulas`, `slides`, `banco`, `ortografia`, `revisor-portugues`, `portfolio-perfis`, `central-revisao`, `ui-ux-roadmap`). Os 2 testes end-to-end de geração de PDF em `tests/pdf.test.js` são ignorados automaticamente quando o `playwright` não está instalado.
- **Limitações conhecidas:**
  - Não exporta `.docx` nem `.pptx` neste repositório (disponíveis no App Node `mathlab-aulas-visuais-app`).
  - Persistência em `localStorage` depende do navegador/perfil local (use o backup JSON da Biblioteca).
  - No `npm run pdf`, emojis e alguns subscritos Unicode podem recorrer à fonte do sistema operacional.
  - A auditoria automática não substitui a revisão pedagógica e científica do professor.

---

## Histórico de versões

| Versão | Destaques |
| --- | --- |
| **1.6.0** *(motor 2.0.0, contrato 2.1)* | Redesign UI/UX v2 (3 grupos de navegação, modo escuro, busca na biblioteca, stepper de 4 passos), formulário pedagógico com calibração por etapa e seções modulares, emblemas editoriais geométricos por área (`emblemFor`), PDF reproduzível e acessível (tagged `pt-BR`), manifesto único de versões (`manifest.json`), incorporação da identidade editorial e da Ficha Oficial do Professor Alê v1.0. |
| **Em validação** *(26/11/2026, sem nova versão publicada)* | KaTeX offline, Infográfico de Abertura, seletor contextual do Professor Alê, Capa Clean sem foto, arte de capa opcional e correções de fórmula em bloco e de `R$`, **slides HTML interativos** (Exportar → Apresentação em sala; gabarito fora por padrão), **banco de questões por habilidade BNCC** (`mathlab.bank/1`, só habilidades escritas no material, nunca inventadas) e **conferência de ortografia pt-BR offline** (Auditoria; só em páginas servidas por http, não no arquivo único), mais **revisão de português por regras** (crase, concordância, vícios de linguagem, períodos longos, gerúndios; registros didático e divulgação; motor copiado do ScriptaLab v0.4.0 em `js/ptbr` com hash, atualizado por `node tools/sincronizar-ptbr.mjs <pasta-do-ScriptaLab>`; só sinaliza) e **livro de alta qualidade** (Livro → Markdown; `tools/livro.mjs` gera PDF editorial e EPUB3 com Pandoc, localmente). Aguardam a validação do professor em uso real antes de subir a versão no `manifest.json`. |
| **1.5.x** | Plano por unidades (`mathlab.blueprint/1` e `mathlab.unit/1`), memória acumulada, conferência e reparo (`mathlab.repair/1`), pacotes de domínio (`mathlab.domain/1`), fontes do autor (`[F1]`…), compilação de Livro/Caderno e interoperabilidade com o App Node (`mathlab.material/2` v2.1). |
| **1.3 – 1.4** | Capa Clean, Folha de Rosto, Miolo Editorial Clean com pílula de página, etiquetas Histórico-Culturais e caixa *Minha Síntese*. |
| **1.2** | Remoção do teto de 6 páginas, perfis modulares (`completo`, `expositivo`, `expositivo_visual`, `pratica`) e auditoria coerente com o perfil. |
| **1.1** | Miolo A4 completo na aba *Apostila completa* e caixas de destaque (`callout`: dica, sabia, atenção, prova). |

