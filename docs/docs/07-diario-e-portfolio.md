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

Exemplo completo, com dados fictícios: `schema/exemplos/exemplo-diario.json` e `exemplo-portfolio-config.json`. O resultado está em `exemplos-gerados/portfolio-exemplo.html` (6 páginas A4).

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
- O gerador é um **protótipo**: gera HTML A4 e o PDF sai pelo "imprimir como PDF" do navegador (foi o que usei para conferir o layout).
- O número de páginas e as quebras foram conferidos só no exemplo pequeno. Com um ano inteiro de entradas, será preciso testar a paginação (ver A-01 em `docs/01`).
- Sem modelo da escola, este formato é uma proposta; ajuste as seções em `portfolio.secoes`.
