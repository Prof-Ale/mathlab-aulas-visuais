# 04 — Público e registro de linguagem

"Falar a língua do público" não é trocar uma palavra difícil por uma fácil. É decidir **o que mostrar primeiro, quanto rigor exigir e que tipo de frase usar**. A v2 separa três coisas:

| Eixo | Campo | Responde a |
|---|---|---|
| Quem lê | `publico.perfil` e `bloco.destinatario` | estudante, professor, público geral, pesquisador |
| Em que nível | `publico.nivel` | ef1, ef2, em, técnico, graduação, pós, livre |
| Com que língua | `publico.registro` | lúdico, acessível, escolar, técnico, acadêmico |

E um quarto, dentro do material: `bloco.camada`, que diz se o bloco trata de **intuição**, **formalização** ou **rigor**.

## 1. Os cinco registros

> Os limites numéricos são **valores iniciais para calibrar** com textos reais e com professores. Não são normas.

| Registro | Fala com | Frase (média máx. de palavras) | Vocabulário | Notação formal | Referências | Marca de qualidade |
|---|---|---|---|---|---|---|
| `ludico` | crianças, anos iniciais | 14 | cotidiano; termo técnico só com desenho | mínima | raramente; só na seção do professor | narrativa e desenho antes da regra |
| `acessivel` | público geral | 18 | sem jargão; termo técnico explicado na primeira vez | quase nenhuma | sim, em notas ou fim de página, para quem quiser conferir | exemplos do dia a dia; "o que isso muda para mim" |
| `escolar` | anos finais, ensino médio | 20 | termo técnico com apoio | simples, sempre explicada | opcional; obrigatória para dados e citações | passo a passo; erros típicos; desenho |
| `tecnico` | graduação, ensino técnico | 26 | termos da área sem rodeio | completa | sim, com localizador | definições explícitas, exemplos e contraexemplos |
| `academico` | pós-graduação, pesquisa | 32 | terminologia da subárea | rigorosa | obrigatória, com localizador e estado de verificação | demonstração/argumento completo, limites do resultado, literatura |

A auditoria compara a **média de palavras por frase** dos blocos do público-alvo com o limite do registro (R13) e avisa quando o nível e o registro parecem desencontrados (R14). Medir legibilidade com um índice adaptado ao português é uma melhoria futura: escolher o índice e conferir a fonte antes de adotar.

## 2. Camadas: o mesmo conceito, em profundidade crescente

| Camada | Pergunta que responde | Exemplo de bloco |
|---|---|---|
| `intuicao` | "Como eu *vejo* isso?" | desenho, situação, analogia |
| `formalizacao` | "Como se *diz* isso corretamente?" | definição, regra, notação |
| `rigor` | "Por que isso *vale sempre*?" | demonstração, hipóteses, limites, literatura |

O leitor (ou a exportação) escolhe até onde ir. Um material de 6º ano usa `intuicao` e `formalizacao`. Um de graduação inclui `rigor`. Um de divulgação fica quase todo em `intuicao`, com `rigor` em "para quem quer saber mais".

## 3. O mesmo conceito em três registros

Conceito: **produto de frações**.

**`ludico` (anos iniciais)**
> Você tem metade de uma pizza. Come metade dessa metade. Quanto da pizza inteira você comeu? Desenhe a pizza, pinte a metade que você tem e divida essa metade em duas partes. Você comeu 1 pedaço entre 4 pedaços iguais da pizza inteira: 1/4.

**`escolar` (6º ano)**
> Imagine o terreno como uma barra com 3 partes iguais. Duas foram preparadas. Divida cada parte preparada em 4 pedaços e pinte 3. Foram 2 × 3 = 6 pedaços pintados, em 3 × 4 = 12 pedaços do todo. Logo, 3/4 de 2/3 é 6/12, ou seja, 1/2.

**`academico` (graduação, rigor)**
> Se a/b = a'/b' e c/d = c'/d', então ac/bd = a'c'/b'd'. Por hipótese, ab' = a'b e cd' = c'd. Multiplicando, (ac)(b'd') = (a'c')(bd), o que é a definição de equivalência. Logo, o produto não depende dos representantes escolhidos.

Os três estão corretos e dizem a *mesma verdade*; mudam o que mostram primeiro, quanto justificam e como falam. (O terceiro está em `schema/exemplos/exemplo-graduacao-formal.json`; o segundo, em `exemplo-6ano-fracoes.json`.)

## 4. Destinatários: um material, várias saídas

| Destinatário | O que recebe | Exemplo |
|---|---|---|
| `estudante` | o caderno: situação, pistas, exercícios, síntese | "Bem-vindos, detetives!" |
| `professor` | guia: objetivos, tempo, erros típicos, gabarito comentado, alinhamento curricular, avaliação formativa, adaptações | bloco "Orientação ao professor" |
| `publico_geral` | versão de divulgação: "em 5 minutos", glossário, "por que isso importa", fontes para quem quiser conferir | resumo sem notação |
| `pesquisador` | rigor, literatura, limites, referências verificadas | bloco de aprofundamento |

Cada bloco declara `destinatario`. A exportação monta o caderno do aluno **sem** os blocos do professor, e o guia do professor **com** os blocos dos dois.

## 5. Regras práticas para o gerador (resumo)

1. Perguntar o público se ele não foi dito (perfil, nível, conhecimentos prévios).
2. Escrever **no registro declarado** e dentro do limite de frase, sem "simplificar" até errar.
3. Introduzir cada termo técnico antes de usar; no `ludico`/`acessivel`, só com glossário.
4. Mostrar a situação (desenho, exemplo) antes da regra, em `ludico` e `escolar`.
5. Não usar atalhos que funcionam "às vezes" (ex.: caça a palavra-chave) como se fossem regra.
6. Em `tecnico` e `academico`, declarar hipóteses, escopo e limites; citar com localizador.
7. Simplificar é permitido; **falsificar para simplificar não é**. Quando a versão simples é só aproximação, dizer isso numa frase.

## 6. O que calibrar com a prática

- Os limites de palavras por frase (tabela do item 1).
- Se `publico_geral` deve ser um `perfil` ou apenas um `destinatario`.
- Quais termos mínimos entram no glossário de cada ano/série.
- Testar com 3 a 5 estudantes de cada nível se o texto é entendido. Nenhuma métrica substitui isso.
