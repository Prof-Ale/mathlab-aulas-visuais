# 03 — Verificação por tipo de conhecimento

O objetivo é um material **correto**, não só um material com bibliografia. Por isso a verificação muda conforme o tipo de conhecimento (`meta.tipo_conhecimento`). A pergunta de fundo é sempre a mesma: *o que faria esta afirmação estar errada, e quem consegue checar?*

## 1. Os dois degraus que não podem ser confundidos

| Degrau | Pergunta | Quem responde |
|---|---|---|
| **Existência** | A obra existe e é a que o material diz? | Máquina (base pública) |
| **Sustentação** | O trecho indicado realmente apoia *esta* afirmação? | Humano (lê o localizador) |

Uma IA pode inventar uma referência plausível, ou citar uma obra **real** com uma ideia que a obra não contém. A primeira falha a máquina pega. A segunda só um leitor pega. Por isso os estados são:

`nao_verificada` → `localizada` (existe e confere) → `confirmada` (humano leu o trecho)
e os ramos de erro `divergente` (existe, mas metadados não batem) e `nao_encontrada`.

A regra **R08** impede que uma afirmação diga `confirmada` se alguma referência dela não está `confirmada`.

## 2. Algoritmo de verificação de uma referência

1. **Tem identificador?** Sem DOI, ISBN, URL ou localização, a referência nem entra (o esquema recusa).
2. **DOI:** consultar o registro do DOI (Crossref). Comparar com o que o material declara:
   - título (normalizado: caixa, acentos, pontuação),
   - sobrenome do primeiro autor,
   - ano (tolerância de ±1 por causa de publicação antecipada).
   Tudo bate → `localizada`. Algo não bate → `divergente`, com a lista em `divergencias`. DOI inexistente → `nao_encontrada`.
3. **Sem DOI, mas com título e autor:** buscar candidatos (OpenAlex). **Mostrar os candidatos; nunca escolher sozinho.** O humano escolhe ou rejeita.
4. **ISBN:** consultar catálogo aberto (Open Library) e comparar título/autor/ano.
5. **URL:** verificar se resolve e se o título da página confere. Gravar `acessado_em`. Páginas mudam: preferir versão arquivada quando houver.
6. **Retratação:** se a base oferecer, mostrar aviso de artigo retratado ou corrigido.
7. **Leitura do trecho:** o professor abre o localizador (página, seção, minuto), lê e marca `confirmada`. A ferramenta grava **quem** e **quando**.

> Pontos técnicos **a testar antes de prometer**: se cada API aceita chamada direta do navegador (CORS), limites de uso e política de identificação do cliente. O desenho funciona também com um pequeno serviço intermediário, mas isso quebraria o "sem servidor"; decisão sua.

## 3. Como cada tipo de conhecimento é conferido

### Formal (matemática, lógica, parte da computação)
- **Correto =** cálculo certo e prova sem lacunas.
- **Máquina:** recálculo exato de todo `calculos[]` e dos `passos` (aritmética racional, sem arredondamento). Distratores de múltipla escolha também são calculados (o que o erro produz).
- **Humano:** ler a demonstração e as hipóteses. A máquina **não** prova teoremas.
- **Risco típico de alucinação:** passo "óbvio" falso numa demonstração; resultado correto com justificativa errada.
- **Referência:** necessária para *definições adotadas* e *resultados citados* (teoremas de livro), não para contas.

### Empírico (ciências naturais, saúde, ciências sociais empíricas)
- **Correto =** o resultado existe na fonte, foi bem relatado e o escopo (população, método, limites) foi respeitado.
- **Máquina:** existência, metadados, retratação.
- **Humano:** conferir número, unidade, amostra e se o texto não generaliza além do estudo.
- **Risco típico:** número inventado atribuído a artigo real; correlação virando causa.
- **Regra:** `resultado_empirico` e `fato` sem referência viram pendência (R09).

### Interpretativo (filosofia, literatura, ciências humanas)
- **Correto =** a ideia está atribuída ao autor certo, no contexto certo, sem distorção.
- **Máquina:** existência da obra.
- **Humano:** ler o trecho e o contexto ao redor; distinguir o que é do autor, do comentador e do material.
- **Risco típico:** frase famosa atribuída a quem nunca a escreveu; paráfrase que inverte o sentido.
- **Regra:** `trecho_curto` (≤200 caracteres) para o revisor achar rápido; sem copiar passagens longas.

### Histórico
- **Correto =** fato e data sustentados por fonte, com a distinção entre fonte primária e secundária.
- **Máquina:** existência da fonte.
- **Humano:** cruzar fontes independentes para datas e números controversos; marcar divergência de historiografia como `interpretacao`.
- **Risco típico:** datas "redondas" e relatos populares sem fonte.

### Linguístico
- **Correto =** o uso descrito é atestado.
- **Máquina:** existência da gramática, dicionário ou corpus.
- **Humano:** conferir o exemplo na fonte; separar norma de uso.
- **Risco típico:** exemplo fabricado que "soa certo".

### Prático (procedimentos, laboratório, ofícios)
- **Correto =** funciona e é seguro.
- **Máquina:** existência da norma ou manual.
- **Humano:** alguém que executa testa; segurança sempre exige revisão humana, sem exceção.
- **Risco típico:** quantidade, temperatura ou ordem de passos errada.

## 4. O que a verificação NÃO garante

- Que a obra seja **boa** (revisão por pares, qualidade metodológica).
- Que a **edição** citada seja a mais atual.
- Que **todas** as afirmações do material estejam em `afirmacoes[]`: o gerador pode deixar texto factual dentro de um bloco sem registrar a afirmação. A auditoria avisa (R03b) quando um bloco de conteúdo não carrega afirmações, mas a leitura do professor continua necessária.
- Que fontes **sem identificador** (conversa, aula, material interno) sejam verificáveis: elas entram como `material_do_professor` ou `autoral_declarado`, nunca como `referencia`.

## 5. Quando não há fonte

Não é falha: é um estado declarado. Uma afirmação sem fonte entra como `autoral_declarado` ou `material_do_professor` e aparece assim no material e no relatório. O que é proibido é **fingir** fonte (R01, R02, R08, R09).
