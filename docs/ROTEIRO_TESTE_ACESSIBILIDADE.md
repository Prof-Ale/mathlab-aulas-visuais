# Roteiro de teste de acessibilidade com pessoas

Os testes automáticos (`tools/audit-a11y.js`, `npm test`) pegam o que dá para medir por código. **Eles não substituem uso real.** Este roteiro é para quem for testar: o próprio professor, um colega, alguém que use leitor de tela.

Registre cada resultado como **OK**, **Problema** (descreva) ou **Não testei**. Não marque OK sem ter feito.

## Preparação
- Gere um material (pode ser o exemplo do próprio MathLab) e exporte: apostila HTML, slides (Exportar → Apresentação em sala) e lista de exercícios.
- Teste em pelo menos: Windows + NVDA + Firefox ou Chrome; macOS/iOS + VoiceOver + Safari; Android + TalkBack (opcional).

## A. Teclado (sem mouse)
1. Na tela principal, chegar a todos os botões só com Tab/Shift+Tab. O foco fica visível? A ordem faz sentido?
2. Nos slides: ←/→, Espaço, Home/End navegam? `O` abre o índice, `F` tela cheia, `?` ajuda, `Esc` fecha? Há "pular para o conteúdo"?
3. Alguma tecla ou botão "prende" o foco (armadilha)?

## B. Leitor de tela
1. A apostila: título, cabeçalhos e listas são anunciados na ordem certa?
2. Figuras (SVG): o título e a descrição são lidos? Dizem o que a figura mostra, e não só "gráfico"?
3. Fórmulas: são lidas de forma compreensível? Anote as que ficam confusas.
4. Slides: ao trocar de slide, o novo título é anunciado? O número do slide é anunciado?
5. Selo de revisão ("Rascunho" ou "Validado pelo professor"): é lido?

## C. Visão
1. Zoom de 200% e 400%: algo é cortado ou sobrepõe?
2. Contraste: textos pequenos, rótulos de figuras e modo escuro legíveis? Anote os pontos duvidosos.
3. Sem cor: as informações que dependem de cor (callouts, erros) também têm texto ou ícone?
4. "Reduzir movimento" ligado no sistema: os slides deixam de animar?

## D. Cognitivo e uso em sala
1. O texto dos slides cabe no que dá para ler no fundo da sala? Algum slide está denso demais?
2. Aluno com dislexia ou TDAH (se possível, com a pessoa): o material é legível e organizado?
3. Projetor real: o contraste e o tamanho da letra aguentam?

## E. Impressão
1. Slides em PDF (um por página, paisagem): nenhum corte, nenhuma página em branco?
2. Apostila A4: quebras de página aceitáveis?

## Como devolver
Envie a lista (item, resultado, navegador/leitor de tela e versão). Itens com **Problema** viram tarefas. Itens **Não testei** continuam abertos no README como "validação humana pendente".
