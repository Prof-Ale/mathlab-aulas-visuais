# Identidade Editorial e Personagem Oficial: MathLab Aulas Visuais

Este documento registra a **identidade editorial**, a **arquitetura visual de cadernos/apostilas** e a **Ficha Oficial do Personagem Professor Alê (Versão 1.0)** do ecossistema **MathLab Aulas Visuais**, incorporados também como metadados estruturados em `js/core.js` (`EDITORIAL_IDENTITY` e `PROFESSOR_ALE_IDENTITY`).

> **Regra de preservação:** as imagens de referência oficiais estão em `assets/identidade/`. Os arquivos visuais de produção já existentes (`assets/logo-mathlab-clean.jpg`, `assets/logo-mathlab-selo.jpg`, `assets/avatar-prof-ale-*.jpg` e `assets/avatars/*`) permanecem preservados sem sobrescrita automática.

---

## 1. Organização Editorial Definitiva (Cadernos e Apostilas)

Sequência editorial adotada como padrão para cadernos temáticos (como o caderno de *Números Inteiros*):

1. **Capa**
   - Identidade MathLab preservada, hierarquia tipográfica clara, título, subtítulo, autoria e identificação do estudante.
   - Personagem do professor como elemento de identidade, sem repetição excessiva.
2. **Folha de rosto**
   - Título completo, autor, disciplina, ano escolar/etapa e identificação editorial limpa (separada de infográficos).
3. **Infográfico de abertura**
   - Síntese visual conceitual separada da folha de rosto, com linguagem e notação matemática corretas.
4. **Miolo didático (A4)**
   - Conceitos, exemplos resolvidos, representações visuais, situações-problema e exercícios graduados.
   - Fundo claro, boa legibilidade, contraste acessível, economia de tinta na impressão e adequação à leitura digital.

### Originais em resolução total

`assets/identidade/originais/` guarda as quatro imagens oficiais exatamente como foram enviadas, sem recorte, recompressão ou redesenho:

| Arquivo | Conteúdo | Tamanho |
| --- | --- | --- |
| `ficha-professor-ale-v1.0-original.png` | Ficha Oficial do Personagem Professor Alê, versão 1.0 | 1199 por 1312 px |
| `colagem-multidisciplinar-original.png` | Professor Alê nas 12 áreas (Matemática a Educação Financeira) | 1536 por 1024 px |
| `logo-mathlab-selo-circular-original.jpg` | Selo circular MathLab Educação, azul marinho e dourado | 1254 por 1254 px |
| `logotipo-mathlab-fundo-claro-original.png` | Logotipo MathLab, fundo claro | 1536 por 1024 px |

Os arquivos de `assets/identidade/` (1024 px) e de `assets/` são cópias reduzidas para uso no site. Qualquer ajuste visual parte dos originais.

### Capa e personagem

A Capa Clean não leva foto nem avatar do autor. O personagem entra na caixa "Sobre o Autor", no Infográfico de Abertura e nos prompts de imagem com a variação contextual por disciplina, sempre sem repetição excessiva.

---

## 2. Logotipos e Paleta de Cores Oficial

### Logotipos oficiais
- **Selo Circular MathLab Educação** (`assets/identidade/logo-mathlab-selo-oficial.jpg` · uso editorial em `assets/logo-mathlab-selo.jpg`): azul marinho e dourado, ideal para capas escuras, selos institucionais e favicon.
- **Logo MathLab, Fundo Claro** (`assets/identidade/logo-mathlab-clean-oficial.jpg` · uso editorial em `assets/logo-mathlab-clean.jpg`): azul marinho e amarelo ouro sobre fundo claro, ideal para folhas de rosto, cabeçalhos A4 e impressão com economia de tinta.

### Paleta de Cores Oficial (Ficha v1.0)

| Papel | Nome | Hex | Uso |
| --- | --- | --- | --- |
| Principal | Azul Marinho | `#0D2B5B` | Cabeçalhos, títulos, identidade institucional |
| Destaque | Amarelo Ouro | `#F7B500` | Faixas, bordas de destaque, selos |
| Fundo | Bege Claro | `#F8F3E6` | Fundos leves de apoio, caixas de leitura |
| Apoio | Azul Médio | `#1E88E5` | Elementos gráficos e conexões conceituais |
| Acesso | Laranja | `#F57C00` | Destaques pedagógicos e chamadas |
| Contraste | Verde | `#2E7D32` | Confirmações, exemplos corretos, natureza |
| Ênfase | Roxo | `#6A1B9A` | Reflexões, sínteses e aprofundamentos |
| Aviso | Vermelho | `#C62828` | Alertas conceituais e erros típicos |

---

## 3. Ficha Oficial do Personagem: Professor Alê (Versão 1.0)

**Conceito:** *Professor Alê (Prof. Alê Barbosa)*: personagem institucional multidisciplinar do MathLab Aulas Visuais (professor, pesquisador e mediador do conhecimento).

**Regra principal, consistência:** o personagem muda de roupa complementar, pose, expressão, objetos e cenário conforme a disciplina, mas continua imediatamente reconhecível como a mesma pessoa.

- Referência visual completa: `assets/identidade/ficha-oficial-personagem-prof-ale-v1.0.jpg`
- Grade multidisciplinar por área: `assets/identidade/prof-ale-disciplinas-multidisciplinar.jpg`

### Elementos permanentes
- Rosto inspirado nas fotografias oficiais do Prof. Alê Barbosa.
- Óculos com formato semelhante ao original.
- Cabelo curto e características faciais reconhecíveis.
- Camisa azul marinho ou camiseta com a marca MathLab.
- Logotipo MathLab em azul e amarelo.
- Estilo de ilustração cartoon 3D / cartoon editorial, amigável, didático e confiável.

### Elementos variáveis
- Expressão facial (sorriso padrão, atenção/escuta, reflexão, surpresa/descoberta, entusiasmo, confiança) e pose (explicar, dialogar, investigar, concluir).
- Figurino complementar (padrão, jaleco, moletom tecnologia, colete Educação/AEE, pesquisa/leitura, apresentação).
- Objetos e instrumentos próprios da disciplina.
- Cenário, cores auxiliares e elementos conceituais.

### Aplicações por área do conhecimento

| Área / Disciplina | Figurino e objetos característicos |
| --- | --- |
| **Matemática** | Camisa MathLab, régua, equações, gráficos e reta numérica |
| **Física** | Jaleco sobre camisa MathLab, experimentos, pêndulo, vetores e instrumentos |
| **Química** | Jaleco, tubos de ensaio, vidrarias e modelos moleculares |
| **Biologia** | Jaleco, microscópio, células, DNA e estruturas biológicas |
| **Neuroanatomia** | Jaleco, cérebro, neurônios e sistema nervoso |
| **Psicologia** | Postura reflexiva, livros, símbolo Ψ e elementos da cognição |
| **Psicanálise** | Livros, divã e referências aos conceitos psicanalíticos |
| **Educação e AEE** | Recursos de acessibilidade, mediação, quebra-cabeça inclusivo e múltiplas formas de representação |
| **Terapia Ocupacional** | Materiais sensoriais, blocos de coordenação e recursos de autonomia |
| **Filosofia** | Livros, pensadores clássicos e questões filosóficas |
| **História** | Mapas, globo, documentos e objetos históricos |
| **Tecnologia e Robótica** | Moletom MathLab, computador, código, circuitos e robôs |
| **Educação Financeira** | Moedas/cédulas, planejamento e gráficos de crescimento |

### Regras de uso da identidade
- **Fazer:** manter o mesmo rosto, óculos e expressão amigável; usar a logomarca MathLab em roupas e materiais; adaptar figurino e objetos conforme a disciplina; preservar a paleta oficial e o estilo cartoon editorial; garantir acessibilidade visual (contraste e legibilidade); evitar repetição excessiva do personagem nas páginas internas.
- **Não fazer:** alterar as características faciais do personagem; usar o personagem em contextos inadequados; modificar o logotipo ou suas cores principais.

> *Conhecimento em diferentes campos, rigor em cada produção.*
