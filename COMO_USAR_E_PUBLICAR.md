# MathLab Aulas Visuais v1.2 — Guia de Uso e Publicação

**Autor padrão:** Prof. Alê Barbosa  
**Base pedagógica:** Psicologia Histórico-Cultural (Vigotski, Luria, Leontiev — mediação semiótica, Zona de Desenvolvimento Proximal e passagem dos conceitos cotidianos aos científicos).

---

## O que mudou na v1.2

1. **Sem limite máximo de páginas no miolo:** o conteúdo cresce conforme a densidade do tema (acabou o teto de 6 páginas).
2. **Perfis de conteúdo modulares (`contentProfile`):**
   - `completo` — aula/apostila completa com exercícios graduados e gabarito comentado.
   - `expositivo` — apresentação conceitual aprofundada + exemplos comentados, **sem exercícios nem gabarito**.
   - `expositivo_visual` — foco em exposição conceitual e diagramas/esquemas SVG, **sem exercícios**.
   - `pratica` — oficina, atividades guiadas, exercícios graduados e gabarito.
3. **Capa ilustrada e colorida:** fontes manuscritas/divertidas (`Fredoka` + `Patrick Hand`), sombras estilo HQ, ícones de livros/lápis e selo **Prof. Alê Barbosa**.
4. **Auditoria coerente com o perfil:** materiais `expositivo` e `expositivo_visual` não são penalizados por não terem exercícios ou gabarito.

---

## 1. Como usar com cada IA

### Claude (Skill)
- Arquivo pronto para upload: `mathlab-aulas-visuais-skill_v1.2.zip` (na pasta `MathLab_Aulas_Visuais`) ou `skill/SKILL.md`.
- No Claude: **Configurações → Recursos (Capabilities) → Skills → Carregar skill** e envie o `.zip`.
- Depois peça normalmente, por exemplo:
  > *"Crie uma apostila expositiva (sem exercícios) sobre Equações do 1º Grau para o 7º ano, com bastante desenvolvimento conceitual."*

### Google Gemini (Gem)
- Abra [gemini.google.com](https://gemini.google.com) → **Explorar Gems → Novo Gem**.
- Cole o conteúdo de `gemini/GEM_INSTRUCOES.md` no campo de instruções e salve.

### ChatGPT (Custom GPT)
- Abra **Explorar GPTs → Criar → Configurar**.
- Cole o bloco de texto de `chatgpt/CHATGPT_GPT_INSTRUCOES.md` em **Instructions**.
- Opcional: anexe `skill/SKILL.md` em **Knowledge**.

### Fluxo no site MathLab
1. Copie o JSON gerado pela IA (ou gere o prompt em **Criar / Pedir à IA**).
2. Cole em **Importar JSON** no site MathLab (`index.html` ou `dist/mathlab-standalone.html`).
3. Ajuste na aba **Editor** e personalize a **Capa** (tema, autor, selos).
4. Exporte em **Apostila A4 (Capa + Miolo)** para imprimir ou salvar como PDF.

---

## 2. Como publicar no GitHub Pages

Esta pasta já está inicializada como repositório Git local (`main`) com o workflow `.github/workflows/pages.yml`.

1. Crie um repositório novo no GitHub (ex.: `mathlab-aulas-visuais`) — **sem** marcar README/.gitignore iniciais.
2. No PowerShell, dentro desta pasta (`MathLab_Aulas_Visuais_v1.2_GitHub`), execute:

```powershell
git remote add origin https://github.com/SEU_USUARIO/mathlab-aulas-visuais.git
git push -u origin main
```

3. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Em cerca de 1 minuto o site ficará publicado em `https://SEU_USUARIO.github.io/mathlab-aulas-visuais/`.
