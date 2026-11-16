# 02 — Roadmap (uso pessoal)

**Premissas:** a ferramenta é de uso de um professor (você), roda no navegador e guarda tudo localmente. Quem lê o resultado: seus alunos (materiais) e a direção (portfólio). Não há compartilhamento com outros professores, então não há galeria, links clonáveis nem multiusuário.

Esforço: P · M · G. Sem datas: a ordem importa mais que o calendário.

## Fase 0 — Higiene, bugs visíveis e segurança dos dados (P)

- Corrigir paginação e páginas de enchimento; exigir alternativas em múltipla escolha. (A-01, A-02, A-03)
- Fonte única da versão e `CHANGELOG.md`. (B-01)
- **Backup**: com um único exemplar no navegador, perder o cache é perder o trabalho. Exportação automática periódica (JSON) e lembrete. (B-06, sobe de prioridade)
- Se o repositório continuar público: nunca commitar fotos, nomes ou registros de alunos. Os dados ficam só no navegador.

**Pronto quando:** a apostila sai sem páginas vazias, com "n/N" correto e alternativas visíveis; há um backup recente sempre à mão.

## Fase 1 — Contrato v2 e auditoria (M)

- Validar o esquema `material.v2` na importação, com mensagens legíveis. (B-07)
- Levar `racional.mjs` e as regras R01–R18 para `js/core.js`, com testes.
- Migração v1 → v2 (campos novos opcionais).
- Reconciliar com as 10 categorias atuais (docs/05).

**Pronto quando:** `npm test` cobre cada regra e os dois exemplos passam no esquema e na auditoria.

## Fase 2 — Diário de aula com fotos (M)

> Contratos e protótipo do gerador já estão neste pacote (`docs/07`). Falta o aplicativo: entrada rápida, IndexedDB, borrar rostos.

- Entrada rápida no celular, offline: data, turma, tema, foto, duas linhas, habilidade.
- Fotos em IndexedDB (o `localStorage` não aguenta), comprimidas e **sem metadados** (localização).
- Preferir fotos de cadernos, murais, quadro e trabalhos; opção de borrar rostos.

**Pronto quando:** você registra uma aula em menos de um minuto, sem internet, e a entrada aparece na linha do ano.

## Fase 3 — Portfólio para a direção (M/G)

> Protótipo do gerador A4 pronto (`tools/portfolio.mjs`); falta integrá-lo ao site e testar com um ano inteiro de entradas.

- **Matriz de cobertura** habilidade × bimestre, preenchida a partir do diário.
- Capítulo por turma/bimestre em A4, com evidências (fotos de trabalho) e duas linhas cada.
- Resumo das avaliações e das intervenções feitas.
- Exportar em PDF; opção de ocultar nomes de alunos.
- Se a escola ou a rede tem modelo de portfólio, **o livro segue o modelo**.

**Pronto quando:** você fecha um bimestre e obtém um PDF que a direção lê em poucos minutos, sem dado nominal de aluno.

## Fase 4 — Avaliação e plano de aula (M)

- Avaliação com **rubrica** e **análise de erros por item** (você digita quantos marcaram cada alternativa; sem nomes).
- Plano de aula com mapa visual da unidade (unidade → aulas → avaliação) e aviso quando o conteúdo excede o tempo.
- Habilidades da BNCC conferidas no documento oficial (campo `verificado`).

**Pronto quando:** uma avaliação aplicada mostra qual equívoco predomina e isso entra no portfólio como evidência.

## Fase 5 — Público, registro e verificação de referências (M/G, quando precisar)

- Registro de linguagem e camadas (docs/04) para as suas turmas, de acordo com o nível de cada uma.
- Referências: começar **manual** (identificador + estado + "li o trecho"). A consulta automática a Crossref/OpenAlex/Open Library (docs/03) é opcional e entra só se você sentir falta.

## Fase 6 — Visual e exportações (M/G)

- Figuras paramétricas, KaTeX, texto alternativo e descrição longa.
- Exportação Word/PowerPoint, se você precisar entregar nesses formatos.

## Fora do escopo (uso pessoal)

Galeria pública, links clonáveis, QR e versão pública para colegas, DOI no Zenodo, guia de contribuição, integração com LMS e login escolar, chatbot para alunos, acompanhamento individual de alunos em tempo real.

## Decisões em aberto (suas)

1. A escola/rede tem **modelo de portfólio**? (decide a Fase 3)
2. **Onde guardar o backup** (pasta do computador, Drive, pendrive)?
3. **Repositório público ou privado?** Para uso pessoal, o arquivo único `dist/mathlab-standalone.html` já funciona offline, sem publicar nada.
4. **Verificação automática de referências:** ligar ou deixar manual?
5. **Exigir referências "confirmadas" no modo final** (`--final`) ou deixar opcional?
