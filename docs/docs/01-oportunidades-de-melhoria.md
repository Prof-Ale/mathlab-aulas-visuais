# 01 — Oportunidades de melhoria

Base desta análise: o PDF da apostila de exemplo (37 páginas, gerado pela v1.5), o README 1.1 e as páginas públicas do site e do repositório. **Não li o código** (`js/core.js`, `js/app.js`), o `skill/SKILL.md`, o `gemini/GEM_INSTRUCOES.md` nem os testes. Onde algo é hipótese, está dito.

Esforço: P (pequeno) · M (médio) · G (grande).

## A. Apostila de exemplo (observado no PDF)

| ID | Achado | Evidência | Ação | Esforço |
|---|---|---|---|---|
| A-01 | **Paginação quebrada.** O rodapé diz "/32", mas o PDF tem 37 páginas. As páginas 2, 15 e 20 estão quase vazias; as 17, 22, 31 e 32 têm só uma caixa de destaque solta. | Miniaturas das 37 páginas | Hipótese: figura/caixa que não cabe vai para a página seguinte e deixa a anterior vazia. Usar `break-inside: avoid` nos cartões, deixar o texto fluir, calcular o "/N" **depois** de paginar e criar teste que falha se uma página (fora capa e última) ficar com menos de ~25% de ocupação. | M |
| A-02 | **Páginas de enchimento.** As páginas 30 a 32 repetem "Em resumo", "Dica de ouro" e "Atenção aos detalhes" da capa, uma por página. | PDF pp. 30–32 | Consolidar numa só página de síntese, ou não repetir a capa. | P |
| A-03 | **Alternativas ausentes.** O texto diz "Alternativa B: 1,41 kg", mas as alternativas A–D não aparecem. O estudante não acompanha. | Questões 01–10 | Esquema v2 exige `alternativas` (≥3) e `gabarito` em múltipla escolha. A importação rejeita sem isso. | P |
| A-04 | **Poucas figuras.** Só as questões 06 e 09 têm desenho. Frações são descritas ("imagine uma barra") em vez de mostradas. | Questões 02, 04, 05 | Biblioteca de figuras de fração (barras, reta numérica, áreas) e regra de auditoria "conteúdo que pede representação visual". O exemplo v2 traz a figura de fração de fração. | M |
| A-05 | **Atalho de palavra-chave.** "A palavra 'de' indica multiplicação" e "restante → subtrair" ensinam a caçar palavras, não a entender a situação. É uma crítica conhecida na educação matemática (**não conferi fonte nesta sessão**; vale rodar pela verificação v2). | Questões 01, 02 | Trocar por "desenhe/represente a situação e depois escolha a operação". O exemplo v2 já faz isso. | P |
| A-06 | **Rótulos do referencial sem o conteúdo.** As seções se chamam "Conceito científico & mediação semiótica", "Prática na ZDP", mas "Antes de começar" é uma lista de regras sem construir o *porquê* (por que denominador comum? por que 10% é 0,10?). | PDF pp. 8, 20 | `referencial_pedagogico.criterios` + `blocos[].criterios_referencial`: a auditoria checa se cada critério é efetivamente atendido por algum bloco. Rótulo sozinho não conta. | M |
| A-07 | **Orientação docente misturada à voz do estudante.** "Peça aos estudantes…" e "Durante a correção, peça…" estão no mesmo fluxo do caderno do aluno. | PDF pp. 22–24 | `blocos[].destinatario`: gerar caderno do aluno e guia do professor a partir do mesmo material. | M |
| A-08 | **Afirmações pedagógicas sem sustentação declarada.** "A verbalização do raciocínio ajuda a identificar…" é afirmada como fato. | PDF p. 22 | Declarar como `opiniao_autoral` (honesto) ou sustentar com referência + localizador. O exemplo v2 faz o primeiro. | P |
| A-09 | **Corpo de texto pequeno e meia folha vazia.** Em miniatura, cada questão ocupa a metade superior da folha com letra pequena. | Miniaturas | Ajustar escala tipográfica e densidade por registro (ex.: `ludico` e `escolar` com corpo maior). **Impressão real não testada.** | P |
| A-10 | **Sem referências, por honestidade.** "Nenhuma fonte externa foi consultada" é correto, mas o material não tem como crescer em profundidade sem um mecanismo de fontes. | PDF p. 29 | Núcleo da v2: referências + afirmações + verificação. | G |
| A-11 | **Contas conferidas.** As 10 questões e os 5 desafios relâmpago estão corretos (conferi todos). | — | Manter: transformar essa conferência em `calculos[]` rodados por máquina a cada exportação. | P |

## B. Repositório e README

| ID | Achado | Evidência | Ação | Esforço |
|---|---|---|---|---|
| B-01 | **Versões inconsistentes:** site v1.5, descrição do repositório 1.2, README 1.1. | Páginas públicas | Fonte única da versão (`package.json`), injetada no site, no README e no PDF. `CHANGELOG.md`. | P |
| B-02 | **Sem licença visível.** (Prioridade baixa: a ferramenta é de uso pessoal.) | Página do repositório | Só se decidir abrir o código: adicionar `LICENSE`. | P |
| B-03 | **Um commit só, sem histórico, sem estrelas.** | Página do repositório | Commits pequenos e `CHANGELOG`; tags por versão; releases com o `dist/mathlab-standalone.html`. | P |
| B-04 | **Landing sem aula nem exemplo.** A página estática mostra só o logo e a descrição. (Vi o HTML sem executar o app; pode haver mais dentro dele.) **Prioridade baixa: uso pessoal.** | Site | Ignorar, ou manter só um exemplo para você testar. | P |
| B-05 | **"Nenhum dado sai do navegador / sem chamada externa" conflita com a verificação por Crossref/OpenAlex.** | README | Reescrever a promessa: só o identificador/título da referência sai, com consentimento (já no README novo). | P |
| B-06 | **Persistência só em `localStorage`.** Perder o cache do navegador perde o trabalho. O README já manda fazer backup. | README | Lembrete de backup, exportação automática periódica e, depois, IndexedDB. | M |
| B-07 | **Gerador externo sem contrato validado.** O JSON vem de uma IA e é importado; sem esquema formal, erros chegam ao material. | README | Validar o esquema v2 na importação e mostrar erros legíveis ("falta `alternativas` na questão 03"). | M |
| B-08 | **Tema fixo "Psicologia Histórico-Cultural"** em capa e site, embora a ferramenta seja "para qualquer disciplina". | Site, capa | `referencial_pedagogico` configurável (pode ser HC, ou outro, ou nenhum). | P |
| B-09 | **Pasta `chatgpt/` existe e o README não a menciona.** | Página do repositório | Documentar ou remover. | P |
| B-10 | **Regras do projeto são ótimas** (não inventar, não aprovar, backup antes de excluir, nunca apagar versões). | README | Manter e acrescentar R08: estado nunca promete mais que o método. | P |

## C. O que eu não consegui ver (conferir você mesmo)

1. As **10 categorias da auditoria** atual. Em `docs/05` mapeio as regras novas sem saber quais já existem; é preciso reconciliar.
2. `skill/SKILL.md` e `gemini/GEM_INSTRUCOES.md`: o texto em `docs/06` foi escrito para **substituir ou complementar** esses arquivos.
3. `js/core.js`: se o miolo já impede o que a A-01 mostra, se há teste de paginação e como `POSTER_THEMES`/`BOOK_CSS` tratam quebra de página.
4. Se as exportações de PDF seguem as mesmas regras de página do HTML (a apostila de exemplo veio do "imprimir como PDF" do Chrome).
5. O README no GitHub pode estar mais atualizado que o arquivo que recebi (1.1).
