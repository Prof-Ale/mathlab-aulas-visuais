# 07 — Diário de aula e portfólio para a direção

Como não há modelo definido pela escola ou pela rede, este desenho é livre e **genérico**. Se um modelo aparecer, o livro se adapta a ele: o diário continua sendo a fonte, só muda a montagem (`portfolio.v1`).

## 1. A ideia

```
diário de aula (o ano todo)  ──►  portfólio (escolhas editoriais)  ──►  PDF para a direção
 entradas, evidências,            período, seções, privacidade,
 avaliações agregadas             sua reflexão e próximos passos
```

- O **diário** (`schema/diario.v1.schema.json`) registra o que acontece: poucas linhas por aula, a habilidade trabalhada, uma evidência (foto de caderno, mural, quadro) e, quando houver avaliação, **contagens por item**.
- O **portfólio** (`schema/portfolio.v1.schema.json`) só escolhe o que mostrar e acrescenta a sua voz (apresentação, reflexão, próximos passos).
- O **gerador** (`tools/portfolio.mjs`) monta o livro em A4 e **recusa gerar** se houver risco de privacidade ou inconsistência.

Exemplo completo, com dados fictícios: `schema/exemplos/exemplo-diario.json` e `exemplo-portfolio-escolar.json`. Há um exemplo de configuração por perfil: `exemplo-portfolio-escolar.json`, `exemplo-portfolio-processo-seletivo.json` e `exemplo-portfolio-pos-graduacao.json`.

## 1.1 Perfis do portfólio

O mesmo diário alimenta três portfólios. O campo `perfil` do `portfolio.json` (ou `--perfil` na linha de comando) muda as seções padrão, os títulos e o que é mostrado.

| Perfil | Para quem | Seções padrão | O que muda |
|---|---|---|---|
| `escolar` (padrão) | direção e coordenação | cobertura curricular, linha do período, destaques, avaliações, evolução, reflexão | é o comportamento de sempre; arquivos antigos continuam válidos |
| `processo_seletivo` | banca, remoção, concurso, seleção | trajetória, competências com evidências, destaques, evolução, reflexão | até 3 práticas por turma; cada competência aponta registros do diário; sem tabelas longas de planejamento |
| `pos_graduacao` | programa de pós, mestrado, memorial | fundamentação, trajetória, destaques, avaliações, evolução, reflexão | questão de investigação, referências informadas por você e reflexão pedida em cada prática |

Campos novos e opcionais do `portfolio.json`:

- `perfil_profissional`: listas `formacao`, `atuacao`, `cursos` e `producao`, escritas por você.
- `competencias`: lista de `{ nome, descricao, entradas_ids }`. Cada `entradas_ids` aponta registros reais do diário.
- `fundamentacao`: `{ questao, texto, referencias }`. As referências são suas; o MathLab não cria nem confere citações. Revise na ABNT.

Os perfis para fora da escola **sempre exigem rostos borrados**, mesmo que a configuração diga `false` (a regra P14 avisa).

## 1.2 Saídas

```bash
node tools/portfolio.mjs diario.json portfolio.json --pacote saida/            # HTML, flipbook e PDF
node tools/portfolio.mjs diario.json --perfil processo_seletivo --saida p.html
node tools/portfolio.mjs diario.json portfolio.json --flipbook folhear.html    # só o flipbook
node tools/portfolio.mjs diario.json portfolio.json --pdf p.pdf                # só o PDF acessível
```

- **HTML em A4** (`portfolio.html`): o documento completo, com cabeçalhos de tabela marcados (`scope="col"`) e idioma `pt-BR`.
- **Flipbook** (`portfolio-flipbook.html`): arquivo único, funciona offline, com a biblioteca StPageFlip (MIT, em `assets/vendor/page-flip`) embutida. Folheia com mouse, toque, botões, setas, PageUp/PageDown, Home e End. A mesma página traz a **versão em página corrida**, que aparece quando o JavaScript está desligado, quando a biblioteca falha ou quando a pessoa aperta "Ler em página corrida". Com "reduzir movimento" ligado no sistema, a animação some. O flipbook é apresentação: o documento de referência é o PDF e o HTML corrido.
- **PDF acessível** (`portfolio.pdf`): gerado pelo Chromium com marcação, árvore de estrutura, idioma e marcadores; o comando confere e avisa se faltar algum. Precisa do pacote `playwright`. Os pedidos de rede são bloqueados.
- No site (aba Diário e Portfólio): seletor de perfil, importação do `portfolio.json`, HTML e flipbook. O PDF acessível sai pelo comando, não pelo navegador.

## 2. O que o livro contém

| Página | Conteúdo | Por que a direção quer ver |
|---|---|---|
| Capa | título, professor, escola, período, turmas | identificação |
| **Resumo** | apresentação + **matriz de cobertura** + **evolução por habilidade** | em uma folha: o que foi trabalhado e como foi |
| Capítulo por turma | linha do período, **destaques** com evidência, **avaliações** (acerto por item, erro mais frequente, o que você fez depois) | evidência concreta e ciclo formativo |
| Reflexão | sua análise e próximos passos | intenção pedagógica |
| Sobre este portfólio | origem dos dados, regras de privacidade, habilidades "a conferir" | honestidade |

### Matriz de cobertura

Linhas = habilidades; colunas = períodos. Cada célula mostra quantos registros trabalharam a habilidade e se houve avaliação dela. Estados:

- **ok** (verde): há registro;
- **lacuna** (vermelho): prevista no planejamento (`turmas[].habilidades_previstas`) e **sem registro**;
- **extra** (azul): trabalhada sem estar prevista;
- **—**: nem prevista nem trabalhada.

**Limite importante, dito no próprio documento:** a matriz mede o que foi **registrado**. Uma lacuna pode ser aula dada e não anotada. Por isso o diário precisa ser preenchido logo após a aula.

### Evolução por habilidade

Soma acertos e participantes dos itens de cada habilidade em cada avaliação e mostra a sequência (no exemplo, 43% → 78%). O documento avisa que compara itens de provas diferentes: **indica tendência, não é medida rigorosa**. São contagens de respostas, sem identificar estudantes.

## 3. Privacidade por desenho

1. **O diário não tem campo para nome de aluno.** Só turma e contagens.
2. **Fotos:** cada evidência declara `contem_rosto`, `rostos_borrados` e `autorizacao_imagem`. Com `exigir_rostos_borrados: true` (padrão), foto com rosto só entra se os rostos estiverem borrados.
3. **Lista de vigilância (`--vigiar nomes.txt`):** um arquivo **só seu**, com nomes de alunos, uma linha cada. Se algum nome aparecer em **qualquer** texto do diário ou do portfólio, nada é gerado. O arquivo nunca entra no JSON nem no livro.
4. **O arquivo da foto não fica no JSON** (`arquivo` é só uma chave). No aplicativo, as fotos vão para IndexedDB, redimensionadas e re-codificadas num canvas, o que descarta metadados como localização.
5. **Texto redigido por IA** só entra no livro depois de `revisada_pelo_professor: true`.

> Isto não substitui a orientação da escola sobre uso de imagem e dados de estudantes. A LGPD tem regras específicas para dados de crianças e adolescentes; confirme com a direção.

## 4. Regras de verificação do portfólio

| ID | Regra | Nível |
|---|---|---|
| P01 | Foto com rosto sem tratamento. Bloqueia se estiver em entrada em destaque; avisa nas demais | bloqueante / aviso |
| P02 | Código de habilidade ainda não conferido no documento oficial (sai como "a conferir" no livro) | aviso |
| P03 | Código usado que não está no catálogo de habilidades | bloqueante |
| P04 | Aula sem habilidade (não entra na matriz) | aviso |
| P05 | Ids duplicados; turma, período ou avaliação inexistente | bloqueante |
| P06 | Texto de IA não revisado pelo professor | bloqueante |
| P07 | Contagens impossíveis (acertos > n; n > participantes; erros típicos somam mais que as respostas incorretas) | bloqueante |
| P08 | Data da entrada fora do período | aviso |
| P09 | Nome da lista de vigilância encontrado | bloqueante |
| P10 | Entrada em destaque sem evidência | aviso |
| P11 | Competência com registro inexistente (bloqueante), fora do período ou das turmas escolhidos, ou sem nenhum registro (avisos) | bloqueante / aviso |
| P12 | Pós-graduação: prática em destaque sem reflexão | aviso |
| P13 | Perfil externo sem apresentação, ou com seção de trajetória, competências ou fundamentação sem conteúdo | aviso |
| P14 | Perfil externo com `exigir_rostos_borrados: false` (o valor é ignorado) | aviso |

Todas foram exercitadas com um diário quebrado de propósito, e o gerador não produziu arquivo. O texto do livro também é escapado: HTML colocado num tema ou descrição aparece como texto, não executa.

## 5. Como a entrada rápida deveria ser (para o aplicativo)

Ordem dos campos, pensando no celular, logo após a aula, em menos de um minuto:

1. Turma (lista) e data (hoje).
2. Tema (uma linha).
3. Habilidade (lista do catálogo, com a opção "adicionar").
4. Foto (câmera): o aplicativo pergunta "tem rosto?" e oferece borrar.
5. Resumo curto e, opcionalmente, reflexão.
6. Marcar **destaque** se for candidata ao portfólio.

Princípios: funcionar offline, salvar a cada campo, nunca perder o que foi digitado, lembrar de fazer backup.

## 6. Limites e pendências

- Os **códigos de habilidade do exemplo são ilustrativos** e não foram conferidos. O catálogo real deve ser montado a partir do documento oficial, com `verificado: true` só depois de conferido.
- As **fotos** do exemplo são marcadores de lugar. A inserção da imagem real (campo `dataurl`) depende do aplicativo ler o IndexedDB.
- O gerador gera HTML A4, flipbook e PDF acessível (este com Playwright). Imprimir pelo navegador continua possível, mas não garante a marcação para leitor de tela.
- O flipbook divide o conteúdo em páginas do tamanho da janela, então a divisão muda quando a janela muda. Tabelas longas continuam na página seguinte com o cabeçalho repetido; blocos que não cabem numa página inteira rolam dentro dela.
- O número de páginas e as quebras foram conferidos só no exemplo pequeno. Com um ano inteiro de entradas, será preciso testar a paginação (ver A-01 em `docs/01`).
- Sem modelo da escola, este formato é uma proposta; ajuste as seções em `portfolio.secoes`.
