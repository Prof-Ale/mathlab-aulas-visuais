# MATHLAB — Princípio da Inteligência Epistêmica Orientada por Domínio

**Documento de Arquitetura**

| Identificação | Definição |
| :--- | :--- |
| Projeto | Ecossistema MathLab |
| Natureza | Documento arquitetural normativo |
| Versão | 1.0 |
| Status | Aprovado |
| Responsável | Prof. Alê Barbosa |
| Abrangência | MathLab Aulas Visuais, MathLab Aulas Visuais App Node e MathLab Editorial System \| Direção AB |

---

## 1. Premissa fundamental

**O MathLab não deve saber tudo sobre todos os assuntos. Deve saber como organizar, solicitar, verificar e apresentar o conhecimento de cada assunto, respeitando os critérios próprios de cada área.**

Esta é a premissa orientadora da arquitetura do MathLab.

O sistema não pretende constituir uma enciclopédia universal, substituir especialistas ou concentrar artificialmente todo o conhecimento humano em um único mecanismo.

Sua finalidade é oferecer uma arquitetura capaz de organizar processos de produção intelectual e editorial, adaptando seus procedimentos às características epistemológicas, metodológicas, científicas, pedagógicas e técnicas de cada domínio.

O MathLab deve saber como trabalhar com o conhecimento, sem presumir que possui previamente todo o conhecimento necessário.

## 2. Fundamento arquitetural

A multidisciplinaridade do MathLab não significa aplicar uma metodologia única a todas as áreas.

Cada domínio possui formas próprias de construir, organizar, validar e comunicar conhecimento.

Uma demonstração matemática não é validada pelos mesmos critérios de uma interpretação filosófica. Uma afirmação histórica exige tratamento documental e contextual diferente de uma hipótese experimental em Física. Um material de Anatomia exige precisão terminológica e representação adequada. Um texto de Psicologia precisa distinguir evidências empíricas, modelos teóricos e interpretações.

Portanto, a arquitetura deve preservar uma distinção fundamental:

**Universalidade de arquitetura não significa universalidade de conhecimento.**

O MathLab compartilha uma estrutura de trabalho, mas respeita as particularidades de cada área.

## 3. Princípios derivados

### 3.1. Núcleo universal de organização

O Núcleo Universal deve oferecer mecanismos comuns para:

- Organizar projetos e produções.
- Estruturar materiais em unidades, capítulos e blocos.
- Gerenciar etapas de produção.
- Compilar instruções para modelos de inteligência artificial.
- Receber e validar respostas estruturadas.
- Controlar versões e histórico de alterações.
- Realizar auditorias estruturais e editoriais.
- Organizar a composição visual e a exportação.

O Núcleo Universal não deve determinar sozinho a validade científica de conteúdos de todas as disciplinas.

### 3.2. Inteligência específica por domínio

Cada área deve possuir um conjunto próprio de orientações, critérios e mecanismos de validação.

Essa responsabilidade será organizada por meio dos DomainPacks e dos adaptadores disciplinares.

Cada DomainPack poderá definir:

- Identidade epistemológica.
- Natureza e formas de construção do conhecimento.
- Terminologia específica.
- Métodos de investigação e validação.
- Referências e fontes exigidas.
- Estruturas de explicação recomendadas.
- Representações visuais adequadas.
- Tipos de erro conceitual ou metodológico.
- Critérios de auditoria.
- Limitações e restrições do domínio.

O DomainPack orienta o sistema. Não substitui o conhecimento especializado nem constitui, por si só, uma fonte científica.

### 3.3. Conhecimento fundamentado em fontes

O MathLab deve distinguir o conhecimento fundamentado em fontes daquilo que foi produzido por inferência ou elaboração textual da inteligência artificial.

Toda produção que exigir fundamentação deverá permitir rastrear:

- Fontes fornecidas pelo autor.
- Fontes consultadas durante a pesquisa.
- Afirmações sustentadas pelas fontes.
- Referências ainda não verificadas.
- Lacunas documentais.
- Limitações da produção.

Nenhuma referência deverá ser inventada ou apresentada como consultada sem evidência de consulta.

### 3.4. Inteligência artificial como colaboradora

A inteligência artificial participa da pesquisa, organização, redação, revisão e estruturação dos materiais.

Sua atuação deve ser orientada por:

- Instruções específicas do domínio.
- Fontes disponíveis.
- Contratos de dados.
- Objetivos definidos pelo autor.
- Critérios de qualidade.
- Limites de conhecimento identificados.

A inteligência artificial não deve ser tratada como autoridade científica automática.

O sistema deve permitir que diferentes modelos sejam utilizados por meio da ponte manual, sem depender de uma API específica ou de um fornecedor único.

### 3.5. Auditoria específica e multidimensional

A auditoria deve distinguir pelo menos quatro dimensões:

1. **Integridade estrutural:** verifica formato, campos, tipos, contratos e consistência dos dados.
2. **Integridade epistemológica:** verifica se o conteúdo respeita a natureza e os critérios do domínio.
3. **Integridade científica e documental:** verifica fontes, evidências, referências e limites das afirmações.
4. **Integridade editorial e pedagógica:** verifica organização, clareza, acessibilidade, progressão e adequação ao propósito.

Os critérios de cada dimensão devem ser configuráveis conforme o domínio.

A aprovação automática em uma dimensão não representa aprovação nas demais.

## 4. Arquitetura conceitual

A arquitetura deve manter separadas as seguintes responsabilidades:

| Componente | Responsabilidade |
| :--- | :--- |
| Núcleo Universal | Organizar os processos e contratos comuns |
| DomainPacks | Declarar as características e exigências de cada domínio |
| Adaptadores | Traduzir as exigências do domínio para os mecanismos do sistema |
| Fontes de conhecimento | Fundamentar a produção e permitir rastreabilidade |
| Prompt Compiler | Construir instruções específicas para cada etapa |
| Inteligência artificial | Colaborar na produção intelectual |
| Motor de auditoria | Verificar requisitos estruturais, epistemológicos e editoriais |
| Motor editorial | Organizar a apresentação e a composição dos materiais |
| Autor ou especialista | Avaliar e assumir a responsabilidade pela aprovação final |

A separação dessas responsabilidades deve ser preservada durante a evolução dos três projetos do ecossistema.

## 5. Aplicação aos diferentes domínios

A arquitetura deve permitir trabalhar com diferentes áreas sem obrigá-las a utilizar os mesmos critérios de produção e validação.

Exemplos:

**Matemática**

- Definições precisas.
- Demonstrações e justificativas.
- Exemplos resolvidos.
- Verificação de cálculos, símbolos e propriedades.
- Representações gráficas matematicamente coerentes.

**Física**

- Modelos físicos.
- Relações entre grandezas e unidades.
- Condições de validade.
- Interpretação dos fenômenos.
- Coerência entre modelo matemático e realidade física.

**História**

- Contextualização temporal.
- Análise documental.
- Distinção entre fontes primárias e secundárias.
- Cuidado com anacronismos.
- Reconhecimento de diferentes interpretações historiográficas.

**Filosofia**

- Precisão conceitual.
- Contextualização dos autores.
- Coerência argumentativa.
- Distinção entre argumento, interpretação e opinião.
- Reconhecimento de divergências teóricas.

**Psicologia e Psicanálise**

- Distinção entre evidência empírica, teoria e interpretação.
- Identificação das correntes teóricas.
- Precisão conceitual.
- Cuidado com generalizações.
- Reconhecimento dos limites de cada abordagem.

**Educação Especial e Psicopedagogia**

- Fundamentação normativa e científica.
- Respeito aos direitos educacionais.
- Acessibilidade e desenho universal para aprendizagem quando pertinentes.
- Distinção entre conceitos pedagógicos, clínicos e institucionais.
- Adequação das estratégias às necessidades educacionais.

**Música**

- Coerência entre teoria e prática.
- Precisão rítmica e intervalar.
- Representação musical correta.
- Relação entre notação, escuta e execução.

Esses exemplos são ilustrativos. A arquitetura não deve limitar a criação de novos domínios.

## 6. Meta Adaptação e expansão para novos assuntos

Quando o usuário solicitar um assunto ainda não contemplado pela biblioteca, o MathLab poderá iniciar um processo de Meta Adaptação.

Esse processo deverá:

1. Identificar a natureza do domínio.
2. Propor sua classificação epistemológica.
3. Identificar métodos e critérios de validação pertinentes.
4. Recomendar fontes e referências necessárias.
5. Definir representações visuais adequadas.
6. Identificar riscos de interpretação e erros recorrentes.
7. Gerar uma proposta de DomainPack.
8. Submeter a proposta à auditoria e à aprovação humana.

Um novo domínio não deverá ser considerado validado apenas porque um modelo de inteligência artificial conseguiu produzir seu arquivo JSON.

A Meta Adaptação propõe. A auditoria examina. O especialista valida.

## 7. Limites de responsabilidade

O MathLab deverá declarar com clareza o que foi efetivamente realizado em cada produção.

Devem ser diferenciados:

- Material gerado.
- Material estruturalmente validado.
- Material auditado automaticamente.
- Material revisado por especialista.
- Material validado pelo responsável editorial.

A validação humana exige uma ação explícita e registrada.

O sistema não poderá atribuir ao professor, autor ou especialista uma aprovação que não ocorreu.

Também deverá reconhecer situações em que não dispõe de fontes suficientes, critérios adequados ou conhecimento especializado para concluir uma auditoria.

Nessas circunstâncias, deverá registrar a limitação em vez de produzir uma aprovação artificial.

## 8. Consequências para o desenvolvimento

Este princípio deverá orientar as decisões técnicas futuras.

**No App Node:**

- Estruturar o Prompt Compiler.
- Organizar os DomainPacks.
- Implementar a memória cumulativa.
- Controlar os estados de produção.
- Validar contratos e rastreabilidade.

**No Site Estático:**

- Receber e validar materiais estruturados.
- Permitir edição e auditoria.
- Preservar compatibilidade com contratos anteriores.
- Oferecer visualização e composição editorial.

**No Editorial System | Direção AB:**

- Oferecer estrutura editorial compartilhada.
- Manter regras de composição e identidade visual.
- Preservar a independência entre apresentação e conhecimento disciplinar.
- Permitir materiais de diferentes domínios sem impor uma epistemologia única.

A integração entre esses projetos deverá ocorrer por contratos definidos e mecanismos de compatibilidade, sem eliminar sua independência arquitetural.

## 9. Critérios de conformidade arquitetural

Uma funcionalidade nova somente estará alinhada a este princípio quando:

- Respeitar a separação entre Núcleo Universal e conhecimento específico.
- Permitir a configuração de critérios por domínio.
- Não presumir validade científica a partir da qualidade textual.
- Não inventar fontes ou referências.
- Identificar limitações e incertezas relevantes.
- Preservar a rastreabilidade das decisões.
- Diferenciar auditoria automática de aprovação humana.
- Não impor um método epistemológico único a todas as áreas.

Toda decisão de arquitetura que contrarie esses critérios deverá apresentar justificativa técnica explícita e passar por avaliação antes de sua incorporação.

## 10. Declaração final

O MathLab não pretende substituir o conhecimento produzido pelas diferentes áreas, tampouco reivindicar domínio universal sobre elas.

Sua finalidade é construir uma infraestrutura intelectual, pedagógica e editorial capaz de trabalhar com conhecimentos diversos, respeitando a natureza de cada um.

A força do sistema não estará em presumir que sabe tudo, mas em reconhecer o que precisa saber, identificar onde buscar, organizar como produzir, verificar o que foi produzido e reconhecer os limites de suas próprias verificações.

**O MathLab será universal na arquitetura, multidisciplinar na aplicação e específico nos critérios de conhecimento.**

---

**Documento orientador da arquitetura MathLab**

Prof. Alê Barbosa

Direção e concepção do projeto
