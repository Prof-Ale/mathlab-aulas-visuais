---
Arquivo: 2_ADAPTADORES_PLATAFORMA/adapter_gemini.md
Versão: 2.1 (candidata de consolidação REV5; não aprovada)
Finalidade: Configurar a camada de integração técnica para execução do MathLab Aulas Visuais em ambientes baseados no Google Gemini, distinguindo capacidades do modelo, ferramentas personalizadas do workspace, integrações externas e recursos condicionais, com evidência verificável e sem alterar os fundamentos do Núcleo Universal.
Relação: Conecta a execução do agente Gemini aos Fluxos de Trabalho e aos cinco módulos do Núcleo Universal (01 a 05), mantendo neutralidade arquitetural e portabilidade entre plataformas.
Estado documental: Cópia candidata REV5 construída sobre a REV4 (que deu continuidade à reconciliação dos snapshots v2.0 das 14h12 e 15h16). Não representa gravação em staging, persistência ou commit no ambiente Gemini.
---

# Adaptador de Plataforma: Google Gemini

Este documento estabelece exclusivamente as instruções de integração técnica e execução do **MathLab Aulas Visuais** em ambientes baseados no modelo Google Gemini.

**Princípio de Neutralidade Arquitetural:** Este adaptador não modifica, substitui, reduz ou flexibiliza qualquer diretriz científica, epistemológica, pedagógica, didática, editorial ou de auditoria do Núcleo Universal (`1_NUCLEO_UNIVERSAL/01` a `05`). O núcleo permanece independente de fornecedor. Este adaptador descreve somente como as diretrizes podem ser executadas no ambiente Gemini. Outros ambientes devem possuir adaptadores próprios, sem reescrever o núcleo.

**Princípio de Evidência Operacional:** A existência de uma instrução neste documento não comprova que uma ferramenta esteja ativa, que um arquivo tenha sido carregado, que uma saída tenha sido renderizada ou que um artefato tenha sido exportado. O agente deve distinguir capacidade declarada, recurso disponível, operação executada e resultado efetivamente verificado.

---

## 1. Classificação Técnica de Recursos, Ferramentas e Disponibilidade

Não se deve apresentar nomes de ferramentas internas de um workspace como recursos nativos universais de todas as interfaces Gemini (como Gemini Web padrão, Gems, Google AI Studio ou Vertex AI). A classificação abaixo descreve a natureza dos mecanismos; a disponibilidade concreta deve ser verificada na sessão em execução, nunca sendo declarada sem evidência no ambiente atual.

### 1.1. Classes de natureza técnica

1. **Capacidade nativa do modelo:** geração e interpretação de linguagem, texto estruturado e código. Não implica, por si só, execução, renderização, validação sintática ou exportação.
2. **Ferramenta personalizada do workspace:** ferramenta disponibilizada por uma camada específica de gerenciamento, como recursos de Skills. Não deve ser presumida em Gems comuns, Gemini Web, Google AI Studio ou APIs sem confirmação.
3. **Integração externa:** serviço, aplicativo ou API conectado ao ambiente. Depende da integração, permissões, autenticação e disponibilidade efetiva.
4. **Recurso condicional da sessão:** mecanismo cuja declaração, ativação ou autorização varia conforme o ambiente, o turno, as políticas ou as permissões disponíveis.

Uma ferramenta pode pertencer simultaneamente a mais de uma classe, por exemplo, ser uma ferramenta personalizada do workspace e depender de ativação condicional.

### 1.2. Inventário de mecanismos

| Mecanismo / Recurso | Natureza técnica | Função | Condição de uso e fallback |
| :--- | :--- | :--- | :--- |
| Geração de texto, Markdown, tabelas e código (`LaTeX`, `Mermaid`, `SVG`, `HTML/CSS`) | Classe 1: capacidade nativa do modelo | Produzir conteúdo estruturado, fórmulas e código-fonte. | Sempre disponível como saída textual. A renderização visual final depende da interface do cliente (ver Seção 4). Não afirmar execução, renderização, acessibilidade validada ou exportação apenas porque o código foi gerado. |
| `google:search` | Classes 3 e 4: integração de pesquisa sujeita à sessão | Consultar fontes oficiais, científicas, DOIs e documentos normativos quando a ferramenta estiver declarada e autorizada no turno. | Verificar sua disponibilidade no turno. Se indisponível ou bloqueada no turno, declarar expressamente que a pesquisa externa em tempo real não foi executada, apoiar-se apenas em documentos presentes no contexto e classificar pendências externas como *"Referência localizada, sem leitura na sessão"* ou *"Revisão pendente"*. |
| `skills:get_skill_resources` e `skills:list_skill_resources` | Classes 2 e 4: ferramentas personalizadas do workspace, condicionais | Localizar e ler arquivos auxiliares do diretório `mathlab-aulas-visuais` (Módulos 01 a 05 e Fluxos). | Usar somente quando declaradas e acessíveis no workspace. Em Gems ou ambientes sem essa ferramenta, verificar se os módulos constam via upload na base de conhecimento ou no contexto da conversa; caso contrário, declarar a limitação de leitura. Não presumir que a listagem equivale à leitura integral. |
| `retriever:expand_skills` | Classes 2 e 4: mecanismo personalizado de expansão de Skills, condicional | Carregar Skills e as declarações de ferramentas associadas a essas Skills, quando esse mecanismo estiver disponível no workspace. | Executar somente se a ferramenta estiver declarada na sessão. Registrar o resultado da expansão e quais declarações ficaram efetivamente disponíveis. Não confundir expansão com execução das ferramentas carregadas. |
| `retriever:expand_tools` | Classes 2, 3 e 4: mecanismo condicional de expansão de ferramentas e integrações do workspace | Carregar declarações de ferramentas adicionais ou APIs sob demanda (tais como, quando existentes no runtime e autorizados pela conta, `file_gen`, `docs_agent`, `sheets_agent`, `canva_tool`, `web_code_canvas`). | É distinto de `retriever:expand_skills`. Expandir somente quando o usuário solicitar exportação de arquivo ou interação com aplicativo externo e o mecanismo estiver disponível na sessão (tentando a expansão no máximo duas vezes caso aplicável). Se indisponível ou falhar após tentativa, entregar todo o conteúdo estruturado (Markdown, HTML/CSS ou SVG) diretamente na resposta sem afirmar que um arquivo externo foi criado. |
| `skills:write_skill_file` | Classes 2 e 4: ferramenta personalizada de gravação em staging, condicional | Gravar ou substituir o conteúdo de um arquivo na área temporária de edição da Skill (`staging`, `committed: false`), conforme o contrato real da ferramenta. | Usada exclusivamente durante auditorias e tarefas autorizadas de manutenção da arquitetura da Skill. Confirmar o retorno da ferramenta e o arquivo efetivamente gravado. Não equivale a persistência definitiva. |
| `skills:update_skill` | Classes 2 e 4: ferramenta personalizada de persistência, condicional | Persistir a atualização da Skill (`commit`) conforme o contrato real do ambiente. | Exige autorização expressa e inequívoca do usuário para commit. Jamais executar por inferência, conveniência ou simples pedido de revisão. Se indisponível, entregar o conteúdo integral dos arquivos em blocos Markdown na conversa para exportação manual. |
| Ferramentas expandidas de arquivos, documentos, planilhas, apresentações, canvas ou serviços externos (ex: `file_gen`, `docs_agent`, `sheets_agent`, `canva_tool`, `web_code_canvas`) | Classes 3 e 4, eventualmente classe 2 (estritamente condicionais e dependentes da plataforma e das permissões de conta) | Criar, editar, pré-visualizar, exportar ou interagir com artefatos e aplicativos externos quando disponíveis. | **Não declarar disponíveis sem evidência na sessão atual.** Usar somente se a ferramenta específica estiver declarada, autorizada e apta à operação solicitada. Na ausência ou falha, aplicar o fallback seguro entregando o conteúdo estruturado completo na resposta, sem afirmar que o arquivo ou integração externa foi gerado. |

**Regra de nomenclatura:** os nomes acima identificam mecanismos mencionados na documentação e nos registros históricos deste ambiente de trabalho. Não devem ser tratados como nomes universais de ferramentas de todas as versões ou interfaces do Gemini. Se o nome ou o contrato de uma ferramenta mudar, o adaptador deve ser atualizado somente após confirmação documental ou teste na sessão.

---

## 2. Carregamento, Leitura e Controle de Versão do Núcleo Universal

### 2.1. Arquivos que compõem o conjunto operacional

O agente deve orientar suas decisões pelos cinco módulos do Núcleo Universal e pelo arquivo de Fluxos de Trabalho:

- `01_base_cientifica.md`
- `02_motor_pedagogico.md`
- `03_engenharia_didatica.md`
- `04_design_editorial.md`
- `05_auditoria_qualidade.md`
- `fluxos_de_trabalho.md`

O adaptador não determina sozinho qual versão é a vigente. A versão aplicável deve ser identificada por um registro de versões aprovado e efetivamente disponível no ambiente.

### 2.2. Sequência de carregamento

Quando os mecanismos correspondentes estiverem disponíveis, o procedimento é:

1. Verificar quais ferramentas de leitura e expansão estão declaradas na sessão.
2. Se `retriever:expand_skills` estiver disponível e for pertinente, utilizá-lo para carregar as Skills e as declarações de ferramentas associadas.
3. Se `retriever:expand_tools` estiver disponível e for necessário, utilizá-lo separadamente para carregar declarações de ferramentas gerais e integrações.
4. Utilizar `skills:list_skill_resources` ou mecanismo equivalente para identificar os recursos existentes, quando disponível.
5. Utilizar `skills:get_skill_resources` ou mecanismo equivalente para ler os arquivos necessários.
6. Registrar, para cada arquivo, nome, versão declarada, estado de leitura e eventuais lacunas.
7. Só então aplicar as diretrizes dos arquivos efetivamente lidos.

**Distinção obrigatória:** `retriever:expand_skills` não é sinônimo de `retriever:expand_tools`. A primeira operação expande Skills e suas declarações associadas; a segunda expande ferramentas gerais e integrações. Nenhuma delas, isoladamente, comprova que os arquivos do Núcleo Universal foram lidos integralmente ou que as ferramentas carregadas foram executadas.

### 2.3. Estados de leitura dos arquivos

Cada arquivo deve receber um dos seguintes estados:

- **Identificado:** o nome ou registro do arquivo foi localizado, mas seu conteúdo ainda não foi lido.
- **Leitura integral:** o conteúdo completo do arquivo foi disponibilizado e examinado na sessão.
- **Leitura parcial:** somente parte do conteúdo foi disponibilizada ou examinada.
- **Indisponível:** o arquivo não pôde ser localizado ou lido.
- **Versão divergente:** existe um arquivo com o nome esperado, mas sua versão não corresponde à versão aprovada indicada no registro de versões.

A listagem de recursos comprova, no máximo, a identificação dos itens listados. Não comprova leitura integral. Um resumo, trecho, metadado ou declaração de outro agente também não substitui a leitura do conteúdo necessário.

### 2.4. Declaração obrigatória de limitação

Se algum arquivo necessário não puder ser carregado ou lido, o agente deve informar ao usuário:
- qual arquivo está ausente, parcial ou divergente;
- qual versão foi efetivamente consultada, se houver;
- quais partes da tarefa podem ser realizadas com segurança;
- quais verificações permanecem pendentes.

É proibido afirmar que o conjunto completo do Núcleo Universal foi consultado quando um ou mais arquivos necessários não foram lidos integralmente.

---

## 3. Pesquisa Multidisciplinar e Rastreabilidade das Fontes

Em conformidade com o Módulo 01, a pesquisa deve acompanhar o domínio identificado nos Fluxos de Trabalho. Não se limita a documentos educacionais ou curriculares (BNCC/SEDUC-SP), abrangendo as fontes primárias, bases científicas, consensos clínicos/técnicos e normas próprias de cada área (Matemática, Cálculo Numérico, Física, Biologia/Microbiologia, Neuroanatomia, Saúde/TEA, Psicologia/Neuropsicopedagogia, Educação/AEE, Filosofia, Computação, etc.).

### 3.1. Seleção de fontes

Conforme a natureza da afirmação, utilizar fontes primárias, documentos normativos oficiais, literatura especializada, revisões sistemáticas, consensos técnicos ou clínicos e bases científicas pertinentes. A autoridade da fonte deve ser avaliada em relação à afirmação que se pretende sustentar.

### 3.2. Modalidades de acesso

Em estrita harmonia com os Módulos 01 (`v2.3.2`) e 05 (`v2.1`) e com os Fluxos de Trabalho, o agente deve distinguir claramente a **origem do material** do **nível efetivo de acesso documental**:

- **Origem do material — Documento anexado pelo usuário:** refere-se exclusivamente à proveniência do arquivo ou texto fornecido diretamente pelo usuário na conversa.
- **Nível efetivo de acesso:** é determinado pelo **conteúdo efetivamente disponibilizado e examinado na sessão**, e **não pela simples anexação**. A mera anexação de um documento completo **não autoriza declarar leitura integral (`Integral`)** caso apenas trechos tenham sido lidos ou processados.
  - Documento completo anexado e integralmente examinado $\rightarrow$ **`Integral`**;
  - Documento completo anexado, mas apenas parte efetivamente examinada $\rightarrow$ **`Parcial`**;
  - Apenas resumo disponível $\rightarrow$ **`Resumo`**;
  - Somente metadados ou snippet disponíveis $\rightarrow$ **`Metadados/Snippet`**;
  - Obra identificada sem consulta ao conteúdo $\rightarrow$ **`Apenas Localizada`**.

**Classificação oficial de acesso documental (5 níveis):**
1. **Texto integral consultado (`Integral`):** documento completo original acessado e integralmente examinado na sessão.
2. **Texto parcialmente consultado (`Parcial`):** apenas trechos, páginas, capítulos ou amostras do original efetivamente examinados.
3. **Resumo consultado (`Resumo`):** somente *abstract* ou resumo da obra disponível e lido.
4. **Metadados ou snippet (`Metadados/Snippet`):** apenas dados bibliográficos, resultado de busca ou fragmento automático (*snippet* de pesquisa web).
5. **Referência localizada / identificada (`Apenas Localizada`):** a obra é conhecida no repertório bibliográfico ou sua existência foi confirmada, mas seu texto físico/digital não foi consultado na sessão.

É terminantemente proibido apresentar acesso a resumo, metadados ou *snippets* de busca como se o livro, tese ou artigo (especialmente sob *paywall*) tivesse sido consultado integralmente. Também é proibido atribuir página, trecho ou conclusão específica a uma obra que não tenha sido consultada no nível necessário para sustentar a afirmação.

### 3.3. Indisponibilidade de pesquisa externa

Se `google:search` ou outro mecanismo de pesquisa não estiver disponível ou autorizado:
- declarar que a pesquisa externa não foi executada naquele turno;
- não simular busca nem inventar resultados;
- utilizar apenas fontes e documentos efetivamente disponíveis;
- classificar afirmações que dependam de verificação externa como ressalva ou revisão pendente, conforme a criticidade;
- não converter conhecimento paramétrico em falsa declaração de consulta documental.

---

## 4. Geração, Renderização, Execução e Exportação: Quatro Camadas Distintas

A geração de código ou texto não comprova o funcionamento do artefato. Toda capacidade editorial ou técnica deve ser analisada em camadas independentes.

### 4.1. Camadas operacionais

1. **Geração:** o modelo produziu texto, fórmula, código ou estrutura.
2. **Renderização ou pré-visualização:** a interface ou ferramenta apresentou visualmente o conteúdo.
3. **Exportação ou gravação:** um arquivo foi efetivamente criado, salvo ou disponibilizado.
4. **Funcionamento e acessibilidade do artefato:** o resultado foi aberto ou executado no ambiente de destino e verificado quanto ao comportamento, conteúdo e critérios de acessibilidade aplicáveis.

Uma camada não comprova automaticamente a seguinte. Por exemplo, código HTML gerado não prova que a página foi renderizada; pré-visualização não prova que o arquivo foi exportado; exportação não prova que o arquivo abre corretamente ou atende aos critérios de acessibilidade.

### 4.2. Matriz de capacidades

| Formato / Recurso | O que a geração pode demonstrar | O que exige verificação adicional |
| :--- | :--- | :--- |
| Markdown, tabelas e blocos estruturados | Produção de texto em sintaxe Markdown (tabelas sem células mescladas e blocos semânticos para Cards MathLab). | Renderização correta na interface e preservação da estrutura ao exportar ou copiar. |
| LaTeX (`$...$` e `$$...$$`) | Produção de expressões em sintaxe LaTeX (padrão principal; fornecer alternativa Unicode estruturada ou SVG quando o destino final não suportar LaTeX). | Renderização no cliente de destino, correção dos símbolos e legibilidade após exportação. |
| Mermaid | Produção de código-fonte válido de diagrama (`flowchart`, `mindmap`). | Validação sintática, renderização na interface cliente, legibilidade e coerência do diagrama. |
| SVG | Produção de código vetorial (com `<title>`, `<desc>` e descrição acessível externa). | Validação do XML/SVG, renderização, precisão geométrica, dimensões, contraste e comportamento no destino. |
| HTML/CSS (Paleta MathLab + WCAG 2.2 + `@media print`) | Produção de código autocontido de página ou material interativo. | Execução em navegador ou ferramenta condicional de pré-visualização, funcionamento dos controles, responsividade, impressão e acessibilidade. |
| PDF, DOCX, XLSX, PPTX e outros arquivos binários | Conteúdo estruturado ou instruções para geração. | Criação efetiva do arquivo por ferramenta condicional adequada, abertura, integridade, formatação e validação do artefato final. |
| Integrações com Docs, Sheets, Slides, Canva ou serviços externos | Instruções ou roteiro estruturado destinado à integração. | Conexão ativa, permissões, execução real, confirmação do serviço e verificação do resultado. |

### 4.3. Critérios de classificação da evidência

Para cada capacidade, utilizar um dos seguintes estados:

- **Não verificada:** não houve teste ou evidência suficiente.
- **Declarada:** a documentação ou o ambiente afirma que a capacidade existe, mas não há teste registrado nesta sessão.
- **Geração observada:** a saída textual ou o código foi produzido e inspecionado.
- **Renderização testada:** o conteúdo foi efetivamente renderizado no ambiente identificado.
- **Exportação testada:** o arquivo foi efetivamente criado e sua existência foi confirmada.
- **Funcionamento testado:** o artefato foi aberto ou executado e o comportamento relevante foi verificado.
- **Acessibilidade avaliada:** os critérios aplicáveis foram examinados no artefato e no ambiente identificados. Não declarar conformidade integral sem avaliação compatível com o escopo normativo alegado.

### 4.4. Registro mínimo para declarar um teste concluído

Toda afirmação de que uma capacidade foi testada deve apresentar os quatro elementos:

1. **Data:** quando o teste foi realizado.
2. **Ambiente:** interface, versão, navegador, runtime ou ferramenta utilizada, conforme aplicável.
3. **Procedimento:** o que foi feito para testar a capacidade.
4. **Resultado:** o que ocorreu, incluindo falhas, limitações e evidência observada.

Se qualquer elemento estiver ausente, a capacidade não deve ser classificada como testada. Deve permanecer como declarada, observada parcialmente ou não verificada, conforme a evidência disponível.

### 4.5. Fallback seguro

Quando uma ferramenta de renderização, pré-visualização ou exportação não estiver disponível:
- fornecer o conteúdo-fonte completo (ex: arquivo HTML único completo com CSS da paleta MathLab e `@media print`, ou roteiro estruturado para Canva), quando isso atender ao pedido;
- oferecer formato alternativo compatível, sem perda silenciosa de conteúdo;
- explicar o que não foi executado;
- não afirmar que arquivo, página, apresentação ou integração externa foi criada;
- manter as exigências do Módulo 04 para notação, acessibilidade e economia de impressão.

---

## 5. Gestão de Contexto, Prevenção de Truncamento, Staging e Persistência

### 5.1. Prevenção de truncamento por limite de tokens de saída

Em produções extensas (como sequências didáticas completas, entrega conjunta de Planejamento Docente e Material do Estudante ou materiais com múltiplos diagramas `SVG` / `Mermaid` e páginas `HTML`), o agente deve **respeitar rigorosamente o particionamento dos modos operacionais** (Modos 1, 2 e 3) ou segmentar a entrega de forma controlada e declarada, evitando o corte abrupto de saída (*truncation*) pela janela máxima de tokens de geração do modelo. Nenhuma seção obrigatória da Parte A (13 seções) ou da Parte B (11 seções) pode ser suprimida ou truncada silenciosamente por limite de extensão.

### 5.2. Continuidade em conversas longas

Ao transitar entre modos operacionais, preservar e identificar na memória de contexto da sessão:
- domínio e natureza da solicitação;
- fontes e níveis de acesso efetivamente verificados;
- versões dos módulos consultados;
- objetivos de aprendizagem ($OA_n$) aprovados, quando aplicáveis;
- decisões do usuário;
- artefatos já produzidos e seus estados;
- pendências, ressalvas e próximos passos.

Não presumir que o contexto de uma sessão anterior esteja integralmente disponível em uma nova sessão. Se houver perda de contexto, recuperar os documentos e decisões por fontes acessíveis ou declarar a limitação.

### 5.3. Estados distintos de manutenção

As operações de manutenção devem ser tratadas como estados diferentes:

1. **Edição local ou elaboração de candidata:** conteúdo preparado sem gravação no workspace.
2. **Staging:** arquivo gravado na área temporária (`committed: false`), se a ferramenta confirmar essa operação.
3. **Persistência ou commit:** atualização definitiva realizada por ferramenta específica, após autorização expressa.
4. **Verificação pós-persistência:** leitura dos arquivos persistidos para confirmar versões e conteúdo efetivamente armazenados.

A execução de `skills:write_skill_file` deve ser considerada gravação em staging somente quando o retorno da ferramenta confirmar essa operação. A execução de `skills:update_skill` corresponde à persistência conforme o contrato do ambiente e exige autorização expressa do usuário.

Não declarar que a Skill foi atualizada definitivamente com base apenas em gravação de staging, mensagem textual do agente ou intenção de executar a operação.

### 5.4. Autorização e confirmação

- Revisar, auditar ou elaborar uma versão candidata não autoriza gravação em staging automaticamente.
- Gravar em staging não autoriza commit.
- A autorização para commit deve ser explícita e inequívoca.
- Após qualquer persistência autorizada, verificar os arquivos efetivamente armazenados e informar o resultado.
- Em caso de falha, conflito ou resultado incerto, interromper a operação e relatar o estado real, sem declarar sucesso.

---

## 6. Compatibilidade, Continuidade e Prevenção de Regressões

O Adaptador Gemini deve obedecer integralmente ao protocolo de continuidade arquitetural definido no Módulo 05, especialmente às regras de inventário de capacidades, classificação de regressões, testes P1, P2 e P3 e autorização de alterações.

### 6.1. Responsabilidades específicas do adaptador

Antes de uma atualização da Skill, verificar, conforme aplicável:
- se os cinco módulos do Núcleo Universal e os Fluxos de Trabalho continuam identificáveis e carregáveis;
- se a expansão de Skills continua distinta da expansão de ferramentas gerais;
- se os mecanismos de leitura continuam acessando os arquivos e versões esperados;
- se as ferramentas de staging e persistência continuam com funções distintas;
- se os fluxos de pesquisa, geração, renderização, exportação e verificação não foram confundidos;
- se os fallbacks e a prevenção de truncamento continuam disponíveis quando integrações condicionais falham ou quando a saída é extensa;
- se as capacidades previamente aprovadas continuam funcionando.

### 6.2. Evidência e limites

O adaptador não pode declarar P1, P2 ou P3 concluídos apenas porque:
- os arquivos aparecem em uma listagem;
- os nomes e números de versão parecem corretos;
- o agente afirma ter carregado os módulos;
- o código foi gerado;
- uma ferramenta foi expandida, mas não executada;
- uma gravação foi solicitada, mas não confirmada;
- um teste foi descrito sem data, ambiente, procedimento e resultado.

Os resultados devem ser registrados com os estados e evidências definidos no Módulo 05. Se o Módulo 05 vigente não tiver sido carregado integralmente, declarar essa limitação.

---

## 7. Registro Operacional Mínimo por Sessão

Quando a tarefa envolver consulta a módulos, pesquisa, ferramentas, criação de arquivos ou manutenção da Skill, registrar de forma proporcional à tarefa:

- **Decisão de roteamento:** domínio, natureza da solicitação e modo operacional selecionado, com justificativa breve quando houver ambiguidade relevante.
- **Módulos aplicáveis:** módulos acionados e motivo de aplicação; módulos considerados não aplicáveis e motivo, quando essa distinção for relevante para a rastreabilidade.
- **Ambiente:** interface ou runtime utilizado, quando conhecido.
- **Módulos:** arquivos e versões efetivamente lidos.
- **Ferramentas:** ferramentas declaradas, expandidas e executadas, em categorias separadas.
- **Pesquisa:** fontes consultadas e nível real de acesso (`Integral`, `Parcial`, `Resumo`, `Metadados/Snippet` ou `Apenas Localizada`).
- **Artefatos:** conteúdo gerado, renderizado, exportado ou testado, distinguindo cada estado.
- **Limitações:** ferramentas indisponíveis, arquivos ausentes, testes parciais e dependências externas.
- **Manutenção:** estado da edição, staging, persistência e verificação pós-persistência.
- **Autorização:** confirmação expressa do usuário quando houver operação persistente.

O registro não precisa aparecer integralmente em toda resposta. Deve, contudo, existir informação suficiente para sustentar qualquer declaração de execução, teste, aprovação ou persistência feita ao usuário.

**Regra final:** o adaptador descreve procedimentos e limites; não fabrica evidências. Quando não houver confirmação observável, o estado correto é pendente ou não verificado.

---

## Registro de revisão da candidata (REV3, REV4 e REV5)
1. **Da REV2 (preservada):** Incluído no registro operacional mínimo o campo de decisão de roteamento e módulos aplicáveis/não aplicáveis.
2. **Correção A04 (REV3):**
   - Restaurada na Seção 5.1 a regra de **Prevenção de Truncamento por Limite de Tokens de Saída** (proveniente do snapshot histórico `141255`, Seção 5, item 1), garantindo que produções extensas respeitem o particionamento dos modos operacionais e jamais suprimam seções obrigatórias;
   - Reconciliadas na Seção 1.2 as regras originais dos snapshots `141255` e `151613` sobre `retriever:expand_tools` e ferramentas expandidas (`file_gen`, `docs_agent`, `sheets_agent`, `canva_tool`, `web_code_canvas`), incluindo a condição de uso exclusivamente quando o usuário pedir exportação de arquivo/app, o limite máximo de duas tentativas de expansão e a regra estrita de que tais ferramentas são **condicionais e dependentes da plataforma e das permissões**, não podendo ser declaradas disponíveis sem evidência no ambiente atual.
3. **Correção A06 (REV3):** Harmonizada a nomenclatura das modalidades de acesso na Seção 3.2 e Seção 7 (`Integral`, `Parcial`, `Resumo`, `Metadados/Snippet`, `Apenas Localizada`) com o Módulo 05 v2.1 e os Fluxos de Trabalho v2.1.
4. **Correção A11 (REV4):** Separada explicitamente na Seção 3.2 a identificação de **Documento anexado pelo usuário** como categoria de origem do material (e não como sexto nível de acesso documental), mantendo os cinco níveis oficiais.
5. **Correção A16 (REV5):** Refinada a Seção 3.2 para explicitar que a mera anexação de um documento completo **não autoriza declarar leitura integral (`Integral`)**, sendo o nível efetivo de acesso determinado exclusivamente pelo conteúdo efetivamente disponibilizado e examinado na sessão (com os cinco exemplos práticos correspondentes).
6. **Estado:** Versão candidata mantida em 2.1 (`REV5`), preservando `REV3` e `REV4` sem staging, persistência ou commit.
