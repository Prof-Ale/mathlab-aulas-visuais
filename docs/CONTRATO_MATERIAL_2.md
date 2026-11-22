# Contrato mathlab.material/2 (versão menor 2.1)

Decisão registrada em 21/11/2026: o `mathlab.material/2` é o contrato único de transporte entre quem gera o material (Gem, Skill, GPT, App Node) e o site. Não se cria `material/3` agora. Os campos de verificação entram como opcionais dentro do `/2`.

Arquivo de referência: `schema/mathlab.material.2.schema.json`. Exemplo: `schema/exemplos/exemplo-material2-1.json`. Teste: `tests/contrato.test.js`.

## Por que não criar o /3 agora

1. Gem, Skill e importador já falam `/2`. Um `/3` obriga a mexer em tudo antes de ganhar algo.
2. Não existe ainda mudança que quebre o formato antigo. Só existem campos novos.
3. Já havia dois "v2" diferentes (o `SCHEMA` do `core.js` e o `schema/material.v2.schema.json`, `schema_versao 2.0`). Um `/3` seria um terceiro.

O arquivo `schema/material.v2.schema.json` (`schema_versao 2.0`, chaves em português) fica como referência histórica e como origem das ideias de `afirmacoes`, `calculos` e `revisao_humana`. O importador `fromV2` continua convertendo esse formato para o `/2`.

## Regras do contrato

1. **Aditivo.** Campo novo é sempre opcional. Quem não o envia segue válido.
2. **Topo tolerante, blocos novos estritos.** Campos desconhecidos no topo passam. Dentro de `claims`, `calculations` e `provenance`, campo desconhecido é erro.
3. **Nunca corrigir em silêncio.** Quando o importador corrigir, cortar ou ignorar algo, ele registra um aviso que o professor vê. (Implementação prevista na Fase 2, hoje o `normalize` ainda é silencioso.)
4. **Sem referência inventada.** `references` pode ser vazio. A falta de fonte se declara em `limitations` e, por afirmação, com `support.mode = "sem_fonte"`.
5. **Validação humana é do site.** `revisao` só é escrita pelo site. Se o JSON importado trouxer `aprovado: true`, o importador ignora e avisa (já implementado).
6. **Versão.** `contractVersion` sobe a versão menor (2.1, 2.2) quando se acrescenta campo opcional. Mudança que quebra o formato antigo exige `material/3` e um conversor `/2` para `/3`.

## Campos novos da versão 2.1 (todos opcionais)

| Campo | O que é |
|---|---|
| `contractVersion` | Versão menor do contrato. Ausente equivale a 2.0. |
| `claims[]` | Afirmações factuais: `id`, `blockId`, `kind`, `text`, `support.mode` (`referencia`, `fonte_primaria`, `calculo`, `demonstracao`, `definicao_adotada`, `autoral_declarado`, `material_do_professor`, `sem_fonte`), `support.refId`, `support.note`. |
| `calculations[]` | Cálculos: `id`, `blockId`, `expression`, `result`, `checkedBy` (`nao_conferido`, `codigo`, `humano`). `codigo` só vale se um script recalculou de fato. |
| `provenance` | `generator`, `generatorVersion`, `aiParticipated`, `createdAt`, `estadoEditorial` (só os três estados automáticos). |
| `references[].refId` | Identificador para as afirmações apontarem. |
| `revisao.nivel`, `revisao.escopo` | Nível e escopo da validação humana, escritos pelo site. |

## Um vocabulário de estados

Os cinco estados do App Node são o vocabulário único. O site não cria estados próprios, ele guarda a ação humana em `revisao`.

| Estado do App | Onde vive no contrato | Quem pode atribuir |
|---|---|---|
| GERADO | `provenance.estadoEditorial` | gerador |
| VALIDADO_ESTRUTURALMENTE | `provenance.estadoEditorial` | validador automático |
| AUDITADO_AUTOMATICAMENTE | `provenance.estadoEditorial` | auditor automático |
| REVISADO_POR_ESPECIALISTA | `revisao` com `aprovado: true`, `revisadoPor`, `data`, `hash` e `nivel` ausente ou `especialista` | só pessoa, no site |
| VALIDADO_PELO_RESPONSAVEL_EDITORIAL | `revisao` completa com `nivel: "responsavel_editorial"` | só pessoa, no site |

Regras de derivação: `revisao` incompleta equivale a "ainda não revisado". `hash` diferente do conteúdo atual equivale a "validação desatualizada" e volta ao último estado automático. Os estados humanos nunca são aceitos em `provenance.estadoEditorial`.

## Níveis de acesso de referência

Continuam os seis valores atuais de `accessLevel`: `integral`, `parcial`, `resumo`, `metadados`, `localizada`, `nao-verificado`. O estado `verificacao.estado` do formato antigo se converte assim: confirmada para `integral` ou `parcial` conforme o que foi lido, localizada para `localizada`, nao_verificada para `nao-verificado`.

## Decisão em aberto

A validação do professor no site hoje é uma só. Proposta: sem `nivel`, conta como REVISADO_POR_ESPECIALISTA. O estado VALIDADO_PELO_RESPONSAVEL_EDITORIAL só existe com `nivel: "responsavel_editorial"` marcado de forma explícita. Aguarda confirmação do professor.

## O que este documento não faz

Não altera o `core.js`, as instruções do Gem, da Skill e do GPT, nem o App Node. Os avisos do importador, o prompt de reparo e o uso dos campos novos pelo App entram na Fase 2, em fatias.
