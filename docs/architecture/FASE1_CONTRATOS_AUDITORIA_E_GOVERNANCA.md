# Arquitetura da Fase 1 — Contratos, Rastreabilidade, Auditoria, Validação e Governança

- **Projeto:** MathLab Aulas Visuais App Node (`MathLab_Aulas_Visuais_App`)
- **Referência Normativa:** `docs/architecture/PRINCIPIO_INTELIGENCIA_EPISTEMICA.md`
- **Branch:** `chore/fase1-saneamento-tecnico`
- **Data:** 2026-11-21
- **Escopo:** Documenta exclusivamente o que está efetivamente implementado e verificado ao encerramento da Fase 1, distinguindo explicitamente limitações atuais e itens reservados a fases posteriores.

---

## 1. Arquitetura Atual e Independência dos Projetos

O `MathLab_Aulas_Visuais_App` permanece independente do site estático (`MathLab_Aulas_Visuais_v1.2_GitHub`) e da arquitetura experimental (`MathLab_Editorial_System | Direção AB`).

- **Runtime:** Node.js `>=20.0.0` (ESM, zero dependências externas npm).
- **Núcleo universal (`src/core/`):** `requestInterpreter.js`, `knowledgeContext.js`, `workflowOrchestrator.js`, `contracts.js`, `scientificEngine.js`, `pedagogicalEngine.js`, `didacticEngine.js`, `editorialEngine.js`, `productionProfiles.js`, `qualityEngine.js`, `validationStates.js`, `manualLlmBridge.js` e `exportEngine.js`.
- **Adaptadores disciplinares (`src/adapters/disciplineAdapters.js`):** 17 áreas em 8 grupos, registráveis via `registerAdapter()`.
- **Base intelectual preservada (`knowledge_docs/`):** os 10 documentos originais M01–M05 verificados byte a byte em `knowledge_docs/MANIFESTO_SHA256.md`, lidos via `resolveKnowledgeDocsDir()` em `src/knowledge/knowledgeBase.js`.

---

## 2. Contratos e Política de Versionamento (`src/core/contracts.js`)

| Contrato | Versão Canônica | Campos Obrigatórios | Versões Legadas | Política de Incompatibilidade |
| :--- | :---: | :--- | :--- | :--- |
| `material` | `1.1.0` | `title` (string não vazia), `blocks` (array não vazio de `{ title, body }`) | Sem `contractVersion` (`legacy_unversioned`) | Major `!= 1` ou formato inválido → rejeição explícita (`CONTRATO_VERSAO_INCOMPATIVEL`) |
| `project` | `1.1.0` | `id`, `title`, `materials` (array) | Sem `contractVersion` (`legacy_unversioned`) | Major `!= 1` ou formato inválido → rejeição explícita |
| `auditReport` | `1.1.0` | `status`, `hardFails`, `softWarnings`, `dimensions`, `auditLimits` | `1.0.0` / `legacy_unversioned` | Major `!= 1` → incompatível |
| `reference` | `1.1.0` | `author`, `title`, `year`, `accessState`, `provenance`, `consulted` | `1.0.0` / `legacy_unversioned` | Major `!= 1` → incompatível |

- **Migração explícita (`migrateLegacyMaterial`):** materiais legados sem `contractVersion` são identificados como `LEGADO_MIGRAVEL` (com aviso explícito) e migrados sem mutação do objeto original, registrando `contractMigration.migratedFrom = 'legacy_unversioned'`.
- **Persistência protegida (`projectStorage.js`):** `saveMaterialToProject` e `updateMaterialVersion` executam `validateMaterialContract()` antes de gravar, impedindo a aceitação silenciosa de estruturas incompatíveis.

---

## 3. Rastreabilidade das Fontes (`src/core/scientificEngine.js`)

O módulo M01 distingue explicitamente cinco estados de proveniência (`SOURCE_PROVENANCE_STATES`):

1. `Fonte fornecida pelo autor` (`AUTHOR_PROVIDED`)
2. `Fonte localizada pela inteligência artificial` (`AI_LOCATED`)
3. `Fonte efetivamente consultada` (`CONSULTED`)
4. `Fonte utilizada na elaboração do material` (`USED_IN_PRODUCTION`)
5. `Referência ainda não verificada` (`UNVERIFIED_REFERENCE`)

### Invariantes aplicadas por `validateReferenceTraceability()`
- Nenhuma referência com nível de acesso `Não verificado`, `Referência localizada` ou `Metadados` pode ser declarada como `consulted: true` (`DOC_FALSA_DECLARACAO_CONSULTA`).
- Nenhuma referência com proveniência `Fonte localizada pela inteligência artificial` pode ser marcada automaticamente como efetivamente consultada (`DOC_IA_SUGERIDA_COMO_CONSULTADA`).
- Fontes fornecidas pelo autor (`customSources`) recebem `AUTHOR_PROVIDED` sem fabricação de autores, anos, páginas ou DOIs.

---

## 4. Integridade Epistemológica e 17 Adaptadores (`src/adapters/disciplineAdapters.js`)

Os 17 adaptadores ativos cobrem: Matemática, Física, Química, Biologia, Neuroanatomia, Neurociências, Psicanálise, Psicologia, Filosofia, Educação, Educação Especial e AEE, História, Teologia e Ciências da Religião, Teoria Musical, Geografia, Língua Portuguesa e Terapia Ocupacional.

- Cada adaptador declara `natures`, `evidenceTypes`, `representations`, `cautions`, `auditFocus`, `doNotRequire`, `limits` e `auditRules` próprias.
- Regras de uma área não vazam para outra.
- Quando o domínio é desconhecido (`policy.adapter === null`), o sistema **não aplica critérios de Matemática por padrão** e marca a Dimensão D2 como `REQUER_AVALIACAO_HUMANA`.

---

## 5. Quatro Dimensões de Auditoria e Limites (`src/core/qualityEngine.js`)

Todo relatório emitido por `auditLessonMaterial()` separa explicitamente quatro dimensões em `audit.dimensions`:

| Dimensão | Código | Verificação Automática | O que Verifica | Limite Explícito |
| :--- | :---: | :---: | :--- | :--- |
| **Integridade estrutural** | `D1` | Total (`true`) | Contrato, campos obrigatórios, versão, seções do perfil | Não comprova veracidade do conteúdo |
| **Integridade epistemológica** | `D2` | Parcial / `false` (domínio desconhecido) | Regras contextuais do adaptador da área e coerência conceitual | Não substitui especialista; domínio desconhecido exige avaliação humana |
| **Integridade científica e documental** | `D3` | Parcial | Consistência de proveniência, bloqueio de falsa consulta, presença de fontes | Não consulta fisicamente obras externas nem comprova citações primárias |
| **Integridade editorial e pedagógica** | `D4` | Parcial | Completude, clareza estrutural, DUA/alinhamento quando aplicável | Adequação didática real à turma exige avaliação docente |

O campo `audit.auditLimits` declara expressamente que ausência de erro detectado automaticamente não comprova correção nem substitui revisão humana.

---

## 6. Estados Editoriais e Validação Humana (`src/core/validationStates.js`)

Os cinco estados formais (`EDITORIAL_STATES`):

1. `GERADO` — material produzido, sem validação posterior.
2. `VALIDADO_ESTRUTURALMENTE` — contrato e estrutura verificados (automático).
3. `AUDITADO_AUTOMATICAMENTE` — submetido às verificações M05 disponíveis (automático).
4. `REVISADO_POR_ESPECIALISTA` — exige ação humana registrada (`recordHumanValidation`).
5. `VALIDADO_PELO_RESPONSAVEL_EDITORIAL` — exige ação humana registrada (`recordHumanValidation`).

### Regras implementadas
- `advanceAutomaticState()` bloqueia com `BLOQUEIO_VALIDACAO_HUMANA` qualquer tentativa automática de atribuir os estados 4 ou 5.
- `recordHumanValidation()` exige `actorType === 'HUMANO'`, responsável identificável (rejeita nomes de IA/sistema como `IA`, `LLM`, `Gemini`, `ChatGPT`, `Claude`, `AUTO`), escopo e data (`recordedAt`).
- Rota HTTP disponível: `POST /api/projects/:projectId/materials/:materialId/validate`.
- Nova edição de conteúdo (`updateMaterialVersion`) ou importação de rascunho de IA (`importManualDraft`) invalida aprovações humanas anteriores (`invalidateHumanValidationOnChange`).

---

## 7. Limites da Inteligência Artificial (`src/core/manualLlmBridge.js` e serviços)

- Chamadas externas (`AiProviderService` e `ResearchProviderService`) permanecem **bloqueadas por padrão** sem autorização explícita (`authorizedExternalCall === true` / `authorized === true`).
- A Ponte Manual de LLM opera 100% offline sem API, marcando blocos importados como `IA_EXTERNA_RASCUNHO_A_REVISAR`, registrando `aiParticipated: true` e rebaixando qualquer validação humana anterior.

---

## 8. Governança de Novos Domínios (Fluxo Documental — Frente G)

Para incorporar um novo domínio disciplinar ao MathLab, deve ser seguido obrigatoriamente o fluxo em 8 etapas:

1. **Identificação de domínio não contemplado:** o sistema detecta área sem adaptador (`unknownDomain: true`, D2 = `REQUER_AVALIACAO_HUMANA`).
2. **Proposta de novo conjunto de critérios:** levantamento preliminar das especificidades do campo.
3. **Definição da natureza epistemológica:** classificação entre as naturezas formais, empíricas, baseadas em evidências, teóricas, filosóficas, históricas, teológicas, linguísticas, normativas ou profissionais.
4. **Identificação de fontes e referências adequadas:** definição dos tipos de evidência exigidos (sem inventar obras ou autores).
5. **Definição de representações e métodos próprios:** especificação das linguagens e representações pertinentes ao domínio.
6. **Definição de critérios de auditoria:** regras contextuais (`auditFocus`, `doNotRequire`, `auditRules`, `limits`).
7. **Auditoria da proposta:** verificação estrutural, de isolamento de regras e ausência de vazamento para outras áreas.
8. **Validação humana especializada antes da aprovação:** aprovação explícita e registrada de especialista/responsável editorial antes do registro permanente no catálogo.

> **Limite de escopo da Fase 1:** o Meta Adapter funcional e a geração automática de DomainPacks **não** estão implementados nesta fase; permanecem reservados a fase posterior.

---

## 9. Interface M05 e Limitações Ainda Existentes

- **Interface M05 implementada (`public/m05View.js` + `public/app.js` + `public/styles.css`):** exibe separadamente as 4 dimensões de integridade (`D1`–`D4`) com problemas, alertas, recomendações, limites e destaque para domínios desconhecidos; exibe os 5 estados editoriais exatos de `validationStates.js` com indicador de invalidação após edição humana ou importação de IA; e disponibiliza formulário de registro de validação humana com `actorType: "HUMANO"`, confirmação explícita obrigatória e integração com `POST /api/projects/:id/materials/:matId/validate`.
- **Limitações conhecidas (fora do escopo da Fase 1 ou dependentes de ambiente):**
  - **Inspeção visual em navegador interativo local:** a interface M05 foi verificada por testes automatizados sobre o módulo real (`public/m05View.js`) integrado ao handler HTTP real (`server.js`), restando a inspeção visual direta em navegador desktop pelo professor (`npm start` em `http://127.0.0.1:4180`).
  - **Perfis editoriais da Fase 2:** Infográfico Educativo, Material de Consulta, Revisão Comentada e Guia Visual ainda não foram implementados (reservados à Fase 2).
  - **Camada editorial A4 e PDF determinístico:** paginação A4 (`210mm × 297mm`), fontes locais embarcadas, renderização matemática offline e exportação PDF nativa permanecem reservados às Fases 3 e 4.
  - **Testes de rede real:** chamadas reais à API Gemini, Crossref e OpenAlex continuam validadas apenas por testes offline com mocks e travas de autorização.
