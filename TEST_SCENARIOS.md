# Cenários de Teste - ScientiaGen

Este documento descreve os cenários de teste para a aplicação **ScientiaGen**, abrangendo autenticação, modos de estudo, criação de conteúdo, gerenciamento de biblioteca, persistência de dados, configurações e funcionalidades gerais de UI/UX.

---

## 1. Autenticação e Perfil de Usuário

### 1.1 Registro com E-mail e Senha
**Objetivo:** Verificar se um novo usuário consegue criar uma conta utilizando e-mail e senha.
- **Pré-condições:** Aplicação configurada com credenciais Firebase válidas.
- **Passos:**
    1. Acessar a aplicação e clicar no botão "Entrar" no cabeçalho.
    2. No modal de login, clicar em "Criar uma conta" para abrir o modal de registro.
    3. Inserir um nome de exibição (entre 2 e 100 caracteres).
    4. Inserir um endereço de e-mail válido.
    5. Inserir uma senha que atenda aos requisitos.
    6. Clicar em "Criar conta".
- **Resultado Esperado:** O usuário é registrado e autenticado automaticamente. Seus dados (nome) são exibidos no cabeçalho e o acesso às funcionalidades protegidas é liberado.
- **Cenário de Erro — E-mail já cadastrado via Google:**
    - O sistema detecta que o e-mail já possui login via Google e exibe a mensagem: "Este e-mail já está associado a uma conta Google. Faça login com o Google."
- **Cenário de Erro — Senha fraca:**
    - Inserir "12345678". O medidor de força exibe "Fraca" e o registro pode ser bloqueado ou alertado.

### 1.2 Validação de Senha (Registro)
**Objetivo:** Garantir que o medidor de força e as regras de senha funcionam corretamente.
- **Regras de Senha:**
    - Mínimo 8 caracteres, máximo 128 caracteres.
    - Espaços não são permitidos.
    - Caracteres Unicode são aceitos (exceto espaços).
    - Senhas comuns são bloqueadas (ex: `password`, `12345678`, `senha123`, `mudar123`).
- **Passos:**
    1. Abrir o modal de registro.
    2. Digitar senhas de diferentes complexidades e observar o medidor de força.
- **Cenários de Validação:**
    | Senha Inserida | Força Esperada | Comportamento |
    |---|---|---|
    | `abc` | — | Erro: mínimo 8 caracteres |
    | `12345678` | Fraca | Medidor vermelho, penalidade por senha comum |
    | `senha123` | Fraca | Medidor vermelho, bloqueada por blacklist |
    | `MinhaSenha1` | Boa | Medidor amarelo/verde |
    | `C0mpl3x@P4ss#2025!` | Forte | Medidor verde completo |
    | `abc abc abc` | — | Erro: espaços não permitidos |

### 1.3 Login com E-mail e Senha
**Objetivo:** Verificar login com credenciais de e-mail/senha existentes.
- **Pré-condições:** Conta já registrada.
- **Passos:**
    1. Clicar no botão "Entrar" no cabeçalho.
    2. Inserir e-mail e senha.
    3. Clicar em "Entrar".
- **Resultado Esperado:** Usuário autenticado com sucesso, dados exibidos na interface.
- **Cenário de Erro:** E-mail ou senha incorretos → mensagem de erro exibida.

### 1.4 Login com Google
**Objetivo:** Verificar se o usuário consegue autenticar-se utilizando sua conta Google.
- **Pré-condições:** Aplicação configurada com credenciais Firebase válidas.
- **Passos:**
    1. Acessar a aplicação e clicar em "Entrar".
    2. Clicar no botão "Entrar com Google".
    3. Completar o fluxo de autenticação na janela pop-up do Google.
- **Resultado Esperado:** O usuário é autenticado com sucesso, seus dados (nome, foto) são exibidos e o acesso às funcionalidades protegidas é liberado.

### 1.5 Migração de Dados no Login
**Objetivo:** Verificar que dados locais do usuário anônimo são migrados para o Firestore ao fazer login.
- **Pré-condições:** Usuário anônimo com dados salvos em `localStorage` (exercícios, histórico).
- **Passos:**
    1. Usar a aplicação como visitante: gerar e salvar flashcards e um quiz.
    2. Fazer login (e-mail/senha ou Google).
    3. Verificar a biblioteca do usuário.
- **Resultado Esperado:**
    - Os dados locais são automaticamente mesclados no Firestore (sem duplicatas, deduplicação por `id`).
    - Os dados em `localStorage` são limpos após migração.
    - A biblioteca exibe os exercícios previamente salvos.

### 1.6 Logout
**Objetivo:** Verificar se o usuário consegue encerrar sua sessão.
- **Pré-condições:** Usuário logado.
- **Passos:**
    1. Clicar no avatar/ícone de perfil no cabeçalho.
    2. Clicar no botão "Sair".
- **Resultado Esperado:** A sessão é encerrada, o usuário retorna ao estado de "visitante" e os dados de perfil são limpos da interface.

### 1.7 Edição de Perfil
**Objetivo:** Verificar a atualização do nome de exibição.
- **Pré-condições:** Usuário logado.
- **Passos:**
    1. Clicar no avatar/ícone de perfil no cabeçalho.
    2. Selecionar "Configurações".
    3. Na aba "Perfil", alterar o nome de exibição.
    4. Salvar as alterações.
- **Resultado Esperado:** O novo nome é salvo e refletido imediatamente na interface. O e-mail é exibido como somente leitura.

---

## 2. Modos de Estudo

> **Observação:** Todos os modos de estudo seguem um fluxo consistente de 3 fases:
> 1. **Configuração** (`ExerciseSetup`) — O usuário define tópico, dificuldade e quantidade.
> 2. **Exercício** — Interface interativa específica do modo com `ExerciseBackButton` (confirmação para sair).
> 3. **Conclusão** (`ExerciseCompletion`) — Exibe pontuação (X/Y), barra de porcentagem, tempo gasto e mensagem de desempenho (Excelente / Muito bem / Bom esforço / Continue praticando). Botões: "Jogar Novamente", "Salvar Resultado", "Voltar ao Menu".

### 2.1 Modo Aprender (Quiz com Perguntas Abertas)
**Objetivo:** Validar a geração e correção de perguntas abertas pela IA.
- **Métodos de Criação:** Geração por IA | Criação manual.
- **Passos:**
    1. Navegar para a página "Aprender".
    2. Escolher o método de criação (IA ou manual).
    3. Se IA: inserir um tópico (ex: "História do Brasil"), dificuldade e número de questões.
    4. Clicar em "Começar".
    5. Responder à pergunta apresentada em texto livre.
    6. Submeter a resposta.
- **Resultado Esperado:**
    - A IA gera perguntas relevantes ao tópico.
    - Após submissão, o sistema exibe feedback/correção gerado pela IA (`checkAnswer`) avaliando a precisão da resposta.
    - O tempo gasto é rastreado e exibido na conclusão.
- **Cenário de Exemplo:**
    - **Tópico:** "Fotossíntese"
    - **Ação:** O usuário insere "Ocorre nas mitocôndrias" para uma pergunta sobre onde ocorre a fotossíntese.
    - **Validação:** O sistema deve marcar a resposta como incorreta e explicar que ocorre nos cloroplastos.
    - **Ação:** O usuário insere "Conversão de luz solar em energia química nos cloroplastos".
    - **Validação:** O sistema deve marcar como correta.

### 2.2 Modo Flashcards
**Objetivo:** Testar a mecânica de criação, visualização e interação com flashcards.
- **Métodos de Criação:** Geração por IA | Criação manual | **Importação de planilha**.
- **Passos:**
    1. Navegar para "Cartões".
    2. Escolher o método de criação.
    3. Se IA: definir tópico, dificuldade e quantidade.
    4. Se planilha: fazer upload de arquivo `.xlsx`, `.xls`, `.csv`, `.ods` ou `.xlsm`.
    5. Clicar em um cartão para "virá-lo" (ver o verso).
    6. Navegar entre os cartões (próximo/anterior ou gestos de swipe).
    7. Testar atalhos de teclado (Espaço = virar, Setas = navegar).
    8. Testar o botão de áudio (Text-to-Speech).
- **Resultado Esperado:**
    - Flashcards são gerados com Termo (frente) e Definição (verso).
    - A animação de "virar" funciona corretamente.
    - Gestos de swipe funcionam (esquerda = errado, direita = correto).
    - Atalhos de teclado respondem corretamente.
    - Text-to-Speech lê o conteúdo do cartão em `pt-BR`.
    - A navegação percorre todos os cartões gerados.
- **Cenário de Exemplo:**
    - **Tópico:** "Inglês Básico"
    - **Resultado:** Gerar de 5 a 10 cartões. Ex: Frente "Hello", Verso "Olá".
    - **Interação:** Clicar no cartão "Hello" deve revelar "Olá". Pressionar `→` deve mostrar o próximo termo (ex: "Goodbye"). Pressionar `Espaço` deve virar o cartão.
    - **Áudio:** Clicar no ícone de áudio deve ler "Hello" ou "Olá" dependendo do lado visível.

### 2.3 Modo Combinar (Jogo de Arrastar e Soltar)
**Objetivo:** Verificar a lógica de associação de termos e definições com drag-and-drop.
- **Métodos de Criação:** Geração por IA | Criação manual | **Importação de planilha**.
- **Passos:**
    1. Navegar para "Combinar".
    2. Escolher o método de criação e iniciar o jogo com um tópico.
    3. Arrastar um termo e soltá-lo sobre sua definição correta.
    4. Tentar uma combinação incorreta.
    5. Verificar a revelação progressiva de pares (máximo 6 visíveis por vez).
- **Resultado Esperado:**
    - Pares corretos são marcados como concluídos (visuais verdes) e pontuação aumenta.
    - Pares incorretos exibem feedback visual de erro (vermelho) e não são removidos.
    - Novos pares aparecem conforme os anteriores são combinados (revelação progressiva).
    - O cronômetro é exibido durante o jogo.
    - O jogo finaliza quando todos os pares são encontrados.
- **Cenário de Exemplo:**
    - **Tópico:** "Capitais da Europa"
    - **Jogo:** Termos [França, Espanha] e Definições [Paris, Madrid] com máximo de 6 pares visíveis.
    - **Erro:** Arrastar "França" para "Madrid" → Feedback visual vermelho/erro.
    - **Acerto:** Arrastar "França" para "Paris" → Ambos itens ficam verdes; novos pares podem aparecer. Pontuação sobe.

### 2.4 Solução Guiada
**Objetivo:** Testar a geração de soluções passo a passo com múltiplos métodos de entrada.
- **Métodos de Criação:** Geração por IA | Criação manual.
- **Métodos de Entrada:** Texto | **Upload de arquivo** (imagens/documentos) | **Captura por câmera**.
- **Passos:**
    1. Navegar para "Solução Guiada".
    2. Inserir uma dúvida ou problema complexo via texto, upload de arquivo ou câmera.
    3. Solicitar a solução.
    4. Verificar a estrutura da resposta (título, passos, resposta final).
    5. Testar os botões de download (PDF, DOC, Markdown).
- **Resultado Esperado:**
    - A IA retorna uma explicação estruturada: `{title, steps[], finalAnswer}`.
    - O conteúdo é formatado corretamente com Markdown.
    - Os arquivos são baixados corretamente nos três formatos.
- **Cenário de Exemplo:**
    - **Problema (texto):** "Resolva a equação quadrática: x² - 5x + 6 = 0"
    - **Saída Esperada:**
        - Passo 1: Identificar coeficientes (a=1, b=-5, c=6).
        - Passo 2: Calcular Delta ($\Delta = (-5)^2 - 4(1)(6)$).
        - Passo 3: Encontrar raízes (x=2, x=3).
    - **Problema (câmera/upload):** Fotografar uma equação no caderno → A IA interpreta a imagem e gera a solução.
    - **Download:** Clicar em "PDF" → Arquivo `.pdf` baixado com título, passos e resposta final formatados.

### 2.5 Modo Misto
**Objetivo:** Validar a geração de múltiplos tipos de questões em uma única sessão.
- **Métodos de Criação:** Geração por IA | Criação manual.
- **Passos:**
    1. Navegar para "Misto".
    2. Definir tópico, dificuldade e quantidade de questões.
    3. Gerar o quiz.
    4. Verificar se aparecem questões de Múltipla Escolha, Preencher Lacunas e Abertas.
- **Resultado Esperado:**
    - O quiz apresenta variedade de formatos de perguntas.
    - A validação de respostas funciona adequadamente para cada tipo específico.
    - O tempo gasto é rastreado.
- **Cenário de Exemplo:**
    - **Tópico:** "Sistema Solar"
    - **Questão 1 (Múltipla Escolha):** "Qual o maior planeta?" [Terra, **Júpiter**, Marte, Vênus]. Selecionar Júpiter = Correto.
    - **Questão 2 (Lacuna):** "O sol é uma ___." (Resposta: estrela). Digitar "estrela" = Correto.
    - **Questão 3 (Aberta):** "Descreva um eclipse." → Digitar texto livre e aguardar avaliação da IA.

### 2.6 Modo Teste
**Objetivo:** Simular um exame de múltipla escolha.
- **Métodos de Criação:** Geração por IA | Criação manual.
- **Passos:**
    1. Navegar para "Teste".
    2. Definir tópico, dificuldade e quantidade de questões.
    3. Gerar perguntas sobre o tema.
    4. Selecionar uma alternativa.
    5. Confirmar a resposta.
- **Resultado Esperado:**
    - A IA gera questões com 4 alternativas e explicação para cada resposta.
    - Feedback imediato (Certo/Errado) após confirmação.
    - Pontuação é atualizada.
    - O usuário avança para a próxima pergunta até o final.
    - O tempo gasto é rastreado.
- **Cenário de Exemplo:**
    - **Tópico:** "JavaScript"
    - **Questão:** "Qual método converte JSON em objeto?"
    - **Opções:** A) JSON.stringify, B) JSON.parse, C) JSON.object, D) JSON.to.
    - **Ação:** Usuário seleciona B e confirma.
    - **Resultado:** Opção B fica Verde (Correta). Explicação exibida. Pontuação +1. Botão "Próximo" habilitado.

---

## 3. Criação de Conteúdo

### 3.1 Geração por IA
**Objetivo:** Verificar a geração de conteúdo via API Gemini (proxy serverless).
- **Pré-condições:** Variável de ambiente `GEMINI_API_KEY` configurada no servidor (Vercel).
- **Passos:**
    1. Em qualquer modo de estudo, selecionar "Gerar com IA".
    2. Inserir tópico, dificuldade (fácil/médio/difícil) e quantidade.
    3. Clicar em "Começar".
- **Resultado Esperado:**
    - Loading/skeleton é exibido durante a chamada.
    - Conteúdo gerado é válido, estruturado e relevante ao tópico.
    - Em caso de falha na API, uma mensagem de erro é exibida.

### 3.2 Criação Manual
**Objetivo:** Verificar a criação de conteúdo manualmente pelo usuário.
- **Passos:**
    1. Em qualquer modo de estudo, selecionar "Criar manualmente".
    2. Preencher os campos (perguntas, respostas, termos, definições, etc.).
    3. Iniciar o exercício.
- **Resultado Esperado:** O exercício é criado com o conteúdo fornecido pelo usuário.

### 3.3 Importação de Planilha
**Objetivo:** Verificar a importação de conteúdo via arquivo de planilha.
- **Modos Disponíveis:** Flashcards e Combinar.
- **Formatos Suportados:** `.xlsx`, `.xls`, `.csv`, `.ods`, `.xlsm`.
- **Passos:**
    1. Navegar para "Cartões" ou "Combinar".
    2. Selecionar "Importar Planilha".
    3. Fazer upload de um arquivo no formato suportado.
    4. Verificar o conteúdo importado.
- **Resultado Esperado:**
    - Coluna A = Termo, Coluna B = Definição.
    - Headers são auto-detectados (busca por palavras-chave: "termo", "term", "definição", "definition", "pergunta", "resposta", etc.).
    - O formulário de criação manual é preenchido automaticamente com os dados importados.
    - Suporte a UTF-8.
- **Cenários de Validação:**
    | Arquivo | Resultado Esperado |
    |---|---|
    | `vocabulario.xlsx` (com headers) | Headers detectados, dados importados corretamente |
    | `termos.csv` (sem headers) | Primeira linha tratada como dado |
    | Arquivo vazio | Mensagem de erro ou aviso |
    | Arquivo com 1 coluna | Erro: definições ausentes |

---

## 4. Biblioteca e Persistência

### 4.1 Persistência Dual (Local / Nuvem)
**Objetivo:** Verificar a estratégia de persistência conforme o estado de autenticação.
- **Cenário 1 — Usuário Anônimo:**
    1. Usar a aplicação sem fazer login.
    2. Gerar e salvar flashcards.
    3. Verificar `localStorage` via DevTools.
    - **Resultado Esperado:** Dados salvos em `localStorage`.
- **Cenário 2 — Usuário Autenticado:**
    1. Fazer login.
    2. Gerar e salvar flashcards.
    3. Verificar os dados no Firebase Firestore (coleção `userData/{userId}`).
    - **Resultado Esperado:** Dados salvos no Firestore.
- **Cenário 3 — Fallback:**
    1. Simular falha no Firestore (ex: desconectar internet após login).
    2. Tentar salvar conteúdo.
    - **Resultado Esperado:** Dados salvos em `localStorage` como fallback.

### 4.2 Salvar Exercício/Conteúdo
**Objetivo:** Garantir que o conteúdo gerado pode ser salvo.
- **Passos:**
    1. Ao final de um exercício, na tela de conclusão, clicar no botão "Salvar Resultado".
    2. Confirmar.
- **Resultado Esperado:** O sistema notifica sucesso e o item aparece na lista de exercícios salvos do respectivo modo.

### 4.3 Visualizar Histórico e Exercícios Salvos
**Objetivo:** Acessar conteúdos salvos e histórico de sessões.
- **Passos:**
    1. Na página de qualquer modo de estudo, visualizar a lista de exercícios salvos e o histórico.
    2. Clicar em um exercício salvo para jogar novamente.
    3. Clicar em um item do histórico para ver o relatório detalhado.
- **Resultado Esperado:**
    - Exercícios salvos podem ser rejogados com os dados originais.
    - O histórico exibe detalhes: modo, tópico, pontuação, data e tempo.
    - O modal de relatório exibe resultados por questão (correto/incorreto) e pontuação geral com barra de progresso.

### 4.4 Editar e Excluir Conteúdo
**Objetivo:** Gerenciar exercícios salvos.
- **Passos:**
    1. Na lista de exercícios salvos, clicar no ícone de "Editar" de um item.
    2. Modificar título ou conteúdo.
    3. Salvar as alterações.
    4. Clicar no ícone de "Excluir" de outro item.
    5. Confirmar exclusão.
- **Resultado Esperado:**
    - Edições são persistidas (localmente ou no Firestore conforme autenticação).
    - Itens excluídos são removidos permanentemente da lista.

---

## 5. Estatísticas

### 5.1 Dashboard de Estatísticas
**Objetivo:** Verificar a visualização de dados de desempenho.
- **Pré-condições:** Usuário autenticado com pelo menos algumas sessões de estudo concluídas.
- **Passos:**
    1. Clicar no avatar/perfil no cabeçalho.
    2. Selecionar "Estatísticas".
- **Resultado Esperado:**
    - **Cards de visão geral:** Total de exercícios resolvidos, Precisão média (%), Sequência atual (dias), Melhor precisão (%).
    - **Gráfico de atividade (30 dias):** Gráfico de barras mostrando sessões por dia com tooltips.
    - **Distribuição por modo:** Gráfico de barras horizontal com contagem e porcentagem por modo.
    - **Tópicos mais estudados:** Lista ranqueada (top 10) com frequência.
    - **Cards por modo:** Sessões, precisão média e melhor precisão para cada modo (Learn, Test, Mixed, Flashcards, Match, Guided).

### 5.2 Cálculo de Sequência (Streak)
**Objetivo:** Verificar o cálculo correto da sequência de dias consecutivos.
- **Cenário:** Usuário com sessões nos últimos 3 dias consecutivos.
    - **Resultado Esperado:** Sequência atual = 3.
- **Cenário:** Usuário sem atividade por mais de 1 dia.
    - **Resultado Esperado:** Sequência atual = 0 (ou 1 se ativo hoje).

### 5.3 Acesso sem Autenticação
**Objetivo:** Verificar que a página de estatísticas requer login.
- **Passos:**
    1. Acessar a aplicação sem fazer login.
    2. Tentar acessar as estatísticas.
- **Resultado Esperado:** Mensagem indicando necessidade de login ou redirecionamento.

---

## 6. Exportação de Conteúdo

### 6.1 Download de Solução Guiada
**Objetivo:** Verificar a exportação de soluções em múltiplos formatos.
- **Pré-condições:** Uma solução guiada gerada.
- **Passos para cada formato:**

**PDF:**
1. Clicar no botão "PDF".
2. Verificar o arquivo baixado.
- **Resultado Esperado:** Arquivo `.pdf` com título, passos numerados, cálculos em fonte monoespaçada e resposta final.

**DOC:**
1. Clicar no botão "DOC".
2. Abrir o arquivo em um editor de texto/Word.
- **Resultado Esperado:** Arquivo `.doc` formatado em HTML com renderização Markdown via `marked`.

**Markdown:**
1. Clicar no botão "Markdown".
2. Verificar o arquivo baixado.
- **Resultado Esperado:** Arquivo `.md` com conteúdo em texto puro formatado em Markdown.

---

## 7. Configurações

### 7.1 Modal de Configurações
**Objetivo:** Verificar todas as abas e opções do modal de configurações.
- **Passos:**
    1. Clicar no avatar/perfil no cabeçalho.
    2. Selecionar "Configurações".
- **Resultado Esperado:** Modal aberto com 4 abas: Perfil, Aparência, Exercícios, Dados.

### 7.2 Aba Perfil
**Objetivo:** Verificar edição de nome de exibição.
- **Passos:**
    1. Alterar o nome de exibição.
    2. Salvar.
- **Resultado Esperado:** Nome atualizado na interface. E-mail exibido como somente leitura.

### 7.3 Aba Aparência
**Objetivo:** Verificar alternância de tema e animações.
- **Passos:**
    1. Alternar entre tema Claro e Escuro.
    2. Ativar/desativar animações.
- **Resultado Esperado:**
    - Tema muda imediatamente e persiste após recarregar a página.
    - Animações da interface são ativadas/desativadas conforme a configuração.

### 7.4 Aba Exercícios
**Objetivo:** Verificar configurações padrão para exercícios.
- **Passos:**
    1. Alterar a dificuldade padrão (fácil/médio/difícil).
    2. Alterar a quantidade padrão de questões (1–20).
    3. Criar um novo exercício.
- **Resultado Esperado:** Os novos valores padrão são pré-selecionados na tela de configuração de exercícios.

### 7.5 Aba Dados
**Objetivo:** Verificar a limpeza de dados locais.
- **Passos:**
    1. Clicar em "Limpar dados locais".
    2. Confirmar no diálogo de confirmação.
- **Resultado Esperado:**
    - Dados de exercícios e histórico em `localStorage` são removidos.
    - Configurações de tema e preferências são preservadas.
    - Mensagem de confirmação exibida.

---

## 8. Funcionalidades Gerais e UI

### 8.1 Tema Claro/Escuro
**Objetivo:** Verificar a alternância de temas visuais.
- **Passos:**
    1. Localizar o botão de alternância de tema (sol/lua) no cabeçalho ou nas configurações.
    2. Clicar para mudar o tema.
- **Resultado Esperado:**
    - A interface muda as cores de fundo, texto e componentes conforme o tema selecionado.
    - A preferência é salva em `localStorage` e persiste ao recarregar a página.
    - Na primeira visita, o tema padrão segue a preferência do sistema (`prefers-color-scheme: dark`).

### 8.2 Acessibilidade (Text-to-Speech)
**Objetivo:** Validar a leitura de texto em voz alta via Web Speech API.
- **Modos Disponíveis:** Flashcards, Solução Guiada.
- **Passos:**
    1. No modo Flashcards, localizar o ícone de áudio/fala.
    2. Clicar no ícone.
- **Resultado Esperado:**
    - O navegador inicia a síntese de voz lendo o conteúdo textual exibido (locale `pt-BR`).
    - Clicar novamente para/reinicia a leitura.

### 8.3 Responsividade e Navegação Adaptativa
**Objetivo:** Garantir usabilidade em dispositivos de diferentes tamanhos.
- **Desktop (>768px):**
    1. Verificar a barra lateral colapsável (20px → 60px ao hover).
    2. Verificar `NavLink` items com ícones e labels.
    - **Resultado Esperado:** Sidebar expande ao passar o mouse, mostrando ícones e textos.
- **Mobile (≤768px):**
    1. Redimensionar o navegador para largura de celular (ex: 375px).
    2. Verificar a barra de navegação inferior (bottom tab bar).
    3. Verificar layout dos cartões e botões.
    - **Resultado Esperado:**
        - Barra de navegação inferior com ícones e labels visíveis.
        - O layout se adapta sem quebra de elementos.

### 8.4 Tela Inicial (Home)
**Objetivo:** Verificar o carrossel de modos de estudo na tela inicial.
- **Passos:**
    1. Acessar a página inicial (`/`).
    2. Verificar o carrossel (Swiper) com cards dos 6 modos de estudo.
    3. Navegar pelos cards (arrastar ou botões).
    4. Clicar em um card para acessar o modo.
- **Resultado Esperado:**
    - Carrossel com autoplay e breakpoints responsivos.
    - Cada card exibe título, descrição e ícone do modo.
    - Clicar no card redireciona para a rota correta.

### 8.5 Botão de Voltar no Exercício
**Objetivo:** Verificar o comportamento do botão de voltar durante um exercício ativo.
- **Passos:**
    1. Iniciar qualquer exercício.
    2. Durante o exercício, clicar no botão de voltar.
- **Resultado Esperado:**
    - Um modal de confirmação é exibido: "Você perderá todo o progresso atual. Deseja realmente voltar?"
    - Confirmar: retorna ao menu do modo.
    - Cancelar: permanece no exercício.
