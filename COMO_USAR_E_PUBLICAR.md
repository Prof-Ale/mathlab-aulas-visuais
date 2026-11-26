# MathLab Aulas Visuais v1.6.0 — Guia de Uso e Publicação

**Versão do pacote:** `1.6.0` · **Motor:** `2.0.0` · **Contrato:** `mathlab.material/2` (`2.1`)  
**Autor padrão:** Prof. Alê Barbosa  
**Base pedagógica:** Psicologia Histórico-Cultural (mediação semiótica, Zona de Desenvolvimento Proximal e passagem dos conceitos cotidianos aos científicos, respeitando a epistemologia própria de cada disciplina).

---

## Principais recursos da versão atual (`1.6.0`)

1. **Ambiente multidisciplinar (7 tipos de conhecimento + pacotes de domínio):** Formal, Empírica, Interpretativa, Histórica, Linguística, Prática e Geral/Mista, além de pacotes sob medida (`mathlab.domain/1`).
2. **Seleção modular de seções e perfis (`contentProfile`):** `completo`, `expositivo`, `expositivo_visual` e `pratica`, sem limite fixo de páginas no miolo.
3. **Fluxo completo com IA externa (sem API no site):** stepper de 4 passos, fontes do autor (`[F1]`, `[F2]`), plano por unidades com memória acumulada e conferência/reparo localizado (`mathlab.repair/1`).
4. **Validação humana e auditoria automática:** nenhum material nasce validado; a validação fica registrada com nome, data e hash do conteúdo.
5. **Compilação de Livro/Caderno e PDF reproduzível/acessível:** exportação HTML autocontida, Markdown, JSON (`mathlab.material/2`), SVG e CLI `npm run pdf` (Playwright + fontes locais OFL).

---

## 1. Como usar com cada IA

### Claude (Skill)
- Use o arquivo [`skill/SKILL.md`](skill/SKILL.md) como skill chamada `mathlab-aulas-visuais`.
- No Claude: **Configurações → Recursos (Capabilities) → Skills** e carregue a skill.
- Exemplo de pedido:
  > *"Crie uma apostila expositiva (sem exercícios) sobre Equações do 1º Grau para o 7º ano, com bastante desenvolvimento conceitual."*

### Google Gemini (Gem)
- Abra [gemini.google.com](https://gemini.google.com) → **Explorar Gems → Novo Gem**.
- Cole o conteúdo de [`gemini/GEM_INSTRUCOES.md`](gemini/GEM_INSTRUCOES.md) no campo de instruções e salve.

### ChatGPT (Custom GPT)
- Abra **Explorar GPTs → Criar → Configurar**.
- Cole o bloco de texto de [`chatgpt/CHATGPT_GPT_INSTRUCOES.md`](chatgpt/CHATGPT_GPT_INSTRUCOES.md) em **Instructions** (cabe no limite de 8.000 caracteres).
- Opcional: anexe `skill/SKILL.md` em **Knowledge**.

### Fluxo no site MathLab
1. Na aba **Criar**, preencha disciplina, etapa, tema, seções desejadas e clique em **Copiar pedido**.
2. Cole o pedido na IA escolhida e copie o JSON (`mathlab.material/2`) devolvido.
3. No site (`index.html` ou `dist/mathlab-standalone.html`), cole em **Criar → Importar material**.
4. Revise no **Editor**, confira os avisos na **Auditoria**, marque **Revisei e valido este material** e exporte (**Apostila completa**, **HTML**, **Markdown**, **JSON** ou **Livro**).
5. Para PDF reproduzível e acessível por linha de comando:
   ```bash
   npm run pdf -- material.json saida.pdf
   ```

---

## 2. Como publicar no GitHub Pages

O repositório já possui o workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml), que executa `npm test` antes de publicar.

1. Suba o conteúdo do repositório para a branch `main` no GitHub:
   ```powershell
   git remote add origin https://github.com/SEU_USUARIO/mathlab-aulas-visuais.git
   git push -u origin main
   ```
2. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. A cada envio para `main`, o site será testado e publicado em `https://SEU_USUARIO.github.io/mathlab-aulas-visuais/`.

Sem GitHub, basta abrir [`dist/mathlab-standalone.html`](dist/mathlab-standalone.html) diretamente no navegador (100% offline).
