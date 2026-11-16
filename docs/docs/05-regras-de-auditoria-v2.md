# 05 — Regras de auditoria v2

Implementadas no protótipo `tools/auditar-v2.mjs` (testadas com os dois exemplos e com um material deliberadamente quebrado). **Bloqueante** impede exportar. **Pendência** é aceita em rascunho e vira bloqueante com `--final`. **Aviso** nunca bloqueia.

A auditoria é por regras e **não substitui a revisão do professor**. Nenhuma regra marca `revisao_humana.aprovado`.

| ID | Regra | Nível | Por quê |
|---|---|---|---|
| R01 | Afirmação por referência cita `ref_id` existente e tem localizador não vazio | bloqueante | sem localizador ninguém confere |
| R02 | Toda referência é usada por ao menos uma afirmação (ou figura) | bloqueante | elimina referência de enfeite |
| R03 | Toda afirmação é carregada por ao menos um bloco (ou termo do glossário) | bloqueante | afirmação órfã é conteúdo invisível |
| R03b | Bloco de conteúdo (conceito, exemplo, aprofundamento) sem afirmações | aviso | o texto pode ter fato sem rastreio |
| R04 | Blocos só citam afirmações, figuras e questões que existem | bloqueante | integridade |
| R05 | Afirmação por cálculo cita cálculos que existem | bloqueante | integridade |
| R06 | **Todo cálculo e passo confere** em aritmética exata; afirmação que depende de cálculo errado é barrada | bloqueante | "conferido" de verdade para conteúdo formal |
| R07 | Não usar referência `divergente` ou `nao_encontrada` | bloqueante | |
| R08 | **Estado nunca promete mais que o método**: `confirmada` exige todas as refs `confirmada`; `localizada` exige refs ao menos localizadas; `calculada` só com modo `calculo`; etc. | bloqueante | a regra central contra falsa segurança |
| R09 | `fato` ou `resultado_empirico` sustentado só por declaração autoral | pendência | "sem inventar" |
| R10 | Afirmação `pendente`, referência `nao_verificada` ou só `localizada`; afirmação `reprovada` presente | pendência (reprovada: bloqueante) | trabalho de verificação em aberto |
| R11 | Questões: gabarito entre as alternativas, letras únicas, cálculos existentes; distrator sem `erro_tipico` (aviso); questão gerada por IA a revisar (pendência) | bloqueante / aviso / pendência | alternativas completas e com causa pedagógica |
| R12 | Público exige glossário e ele está vazio | bloqueante | |
| R13 | Média de palavras por frase acima do limite do registro | aviso | linguagem do público (valores a calibrar) |
| R14 | Nível e registro desencontrados (ex.: graduação em registro lúdico) | aviso | pode ser intencional |
| R15 | `transparencia.fontes_consultadas` coerente com as referências | bloqueante | o "Sobre este material" não pode mentir |
| R16 | Material não aprovado por humano | pendência | só o professor aprova |
| R17 | Figura não usada | aviso | |
| R18 | Ids duplicados | bloqueante | |

## Validações do esquema (antes da auditoria)

O esquema JSON recusa, entre outras coisas: referência sem DOI/ISBN/URL/localização; `confirmada` sem `conferido_por`; múltipla escolha sem alternativas e gabarito; imagem sem crédito e licença; figura sem texto alternativo (≥20 caracteres); `aprovado: true` sem nome, data e escopo; afirmação por referência sem `refs`, por cálculo sem `calculo_ids`, por demonstração sem texto.

## Mapa para as 10 categorias atuais

Não consegui ver as 10 categorias que a auditoria atual usa. Para reconciliar, a sugestão é: cada regra acima ganha uma **categoria** já existente (se couber) ou cria uma nova. Candidatas naturais, a confirmar contra o código:

| Tema | Regras v2 |
|---|---|
| Correção do conteúdo | R06, R08, R09 |
| Referências e fontes | R01, R02, R07, R10, R15 |
| Estrutura e coerência | R03, R03b, R04, R05, R17, R18 |
| Avaliação e questões | R11 |
| Público e linguagem | R12, R13, R14 |
| Revisão humana | R16 |

## Casos de teste obrigatórios (para quando integrar ao `npm test`)

Para cada regra, um caso que **passa** e um que **falha**. O protótipo já foi exercitado com: cálculo errado (R06), referência decorativa (R02), afirmação órfã (R03), estado `confirmada` com referência só `localizada` (R08), gabarito inexistente (R11) e transparência incoerente (R15).
