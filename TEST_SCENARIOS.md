# Cenários de Teste - ScientiaGen

Este documento descreve os cenários de teste para a aplicação **ScientiaGen**, abrangendo autenticação, modos de estudo, gerenciamento de biblioteca e funcionalidades gerais.

## 1. Autenticação e Perfil de Usuário

### 1.1 Login com Google
**Objetivo:** Verificar se o usuário consegue autenticar-se utilizando sua conta Google.
- **Pré-condições:** Aplicação configurada com credenciais Firebase válidas.
- **Passos:**
    1. Acessar a aplicação.
    2. Clicar no botão de "Login" ou ícone de usuário na barra lateral/cabeçalho.
    3. Selecionar a opção "Entrar com Google".
    4. Completar o fluxo de autenticação na janela pop-up do Google.
- **Resultado Esperado:** O usuário é autenticado com sucesso, seus dados (nome, foto) são exibidos e o acesso às funcionalidades protegidas (como salvar na biblioteca) é liberado.

### 1.2 Logout
**Objetivo:** Verificar se o usuário consegue encerrar sua sessão.
- **Pré-condições:** Usuário logado.
- **Passos:**
    1. Abrir o modal de perfil do usuário.
    2. Clicar no botão "Sair" ou "Logout".
- **Resultado Esperado:** A sessão é encerrada, o usuário retorna ao estado de "visitante" e os dados de perfil são limpos da interface.

### 1.3 Edição de Perfil
**Objetivo:** Verificar a atualização de informações do perfil do usuário.
- **Pré-condições:** Usuário logado.
- **Passos:**
    1. Acessar "Configurações" ou "Editar Perfil".
    2. Alterar o nome de exibição.
    3. Tentar fazer upload de uma nova foto de perfil.
    4. Salvar as alterações.
- **Resultado Esperado:** As novas informações são salvas e refletidas imediatamente na interface do usuário.

## 2. Modos de Estudo

### 2.1 Modo Aprender (Quiz com Perguntas Abertas)
**Objetivo:** Validar a geração e correção de perguntas abertas pela IA.
- **Passos:**
    1. Navegar para a página "Aprender".
    2. Inserir um tópico (ex: "História do Brasil") e configurar número de questões.
    3. Clicar em "Começar".
    4. Responder à pergunta apresentada em texto livre.
    5. Submeter a resposta.
- **Resultado Esperado:**
    - A IA gera perguntas relevantes ao tópico.
    - Após submissão, o sistema exibe um feedback/correção gerado pela IA avaliando a precisão da resposta do usuário.

### 2.2 Modo Flashcards
**Objetivo:** Testar a mecânica de criação e visualização de flashcards.
- **Passos:**
    1. Navegar para "Cartões".
    2. Gerar um novo deck sobre um tópico específico.
    3. Clicar em um cartão para "virá-lo" (ver o verso).
    4. Navegar entre os cartões (próximo/anterior).
- **Resultado Esperado:**
    - Flashcards são gerados com Termo (frente) e Definição (verso).
    - A animação de "virar" funciona corretamente.
    - A navegação percorre todos os cartões gerados.

### 2.3 Modo Combinar (Jogo de Memória)
**Objetivo:** Verificar a lógica de associação de termos e definições.
- **Passos:**
    1. Navegar para "Combinar".
    2. Iniciar o jogo com um tópico.
    3. Selecionar/Arrastar um termo e tentar combiná-lo com sua definição correta.
    4. Tentar uma combinação incorreta.
- **Resultado Esperado:**
    - Pares corretos desaparecem ou são marcados como concluídos e pontuação aumenta.
    - Pares incorretos exibem feedback visual de erro e não são removidos.
    - O jogo finaliza quando todos os pares são encontrados.

### 2.4 Solução Guiada
**Objetivo:** Testar a geração de passos para resolução de problemas.
- **Passos:**
    1. Navegar para "Solução Guiada".
    2. Inserir uma dúvida ou problema complexo (ex: uma equação matemática ou conceito físico).
    3. Solicitar a solução.
- **Resultado Esperado:**
    - A IA retorna uma explicação estruturada passo a passo.
    - O conteúdo é formatado corretamente (podendo incluir Markdown/LaTeX se suportado).

### 2.5 Modo Misto
**Objetivo:** Validar a geração de múltiplos tipos de questões em uma única sessão.
- **Passos:**
    1. Navegar para "Misto".
    2. Gerar o quiz.
    3. Verificar se aparecem questões de Múltipla Escolha, Preencher Lacunas e Abertas.
- **Resultado Esperado:**
    - O quiz apresenta variedade de formatos de perguntas.
    - A validação de respostas funciona adequadamente para cada tipo específico.

### 2.6 Modo Teste
**Objetivo:** Simular um exame de múltipla escolha.
- **Passos:**
    1. Navegar para "Teste".
    2. Gerar perguntas sobre um tema.
    3. Selecionar uma alternativa.
    4. Confirmar a resposta.
- **Resultado Esperado:**
    - Feedback imediato (Certo/Errado) após confirmação.
    - Pontuação é atualizada.
    - O usuário avança para a próxima pergunta até o final.

## 3. Biblioteca e Persistência

### 3.1 Salvar Exercício/Conteúdo
**Objetivo:** Garantir que o conteúdo gerado pode ser salvo localmente ou na conta do usuário.
- **Pré-condições:** Usuário logado e uma sessão de estudo finalizada.
- **Passos:**
    1. Ao final de um exercício (Flashcards, Quiz, etc.), clicar no botão "Salvar".
    2. Definir um título/nome se solicitado.
    3. Confirmar.
- **Resultado Esperado:** O sistema notifica sucesso e o item aparece na biblioteca do usuário.

### 3.2 Visualizar Histórico e Biblioteca
**Objetivo:** Acessar conteúdos salvos anteriormente.
- **Passos:**
    1. Acessar a "Biblioteca" ou área de perfil.
    2. Navegar pelas abas (Exercícios, Soluções, Flashcards).
    3. Clicar em um item salvo.
- **Resultado Esperado:** O item é carregado corretamente com os dados originais (perguntas, cartões, etc.), permitindo revisão ou nova tentativa.

### 3.3 Editar/Excluir Conteúdo
**Objetivo:** Gerenciar itens da biblioteca.
- **Passos:**
    1. Na biblioteca, selecionar um item.
    2. Clicar em "Editar" para modificar título ou conteúdo(ex: texto de um cartão).
    3. Clicar em "Excluir" em outro item.
- **Resultado Esperado:**
    - Edições são persistidas.
    - Itens excluídos são removidos da lista e não aparecem mais.

## 4. Funcionalidades Gerais e UI

### 4.1 Tema Claro/Escuro
**Objetivo:** Verificar a alternância de temas visuais.
- **Passos:**
    1. Localizar o botão de alternância de tema (sol/lua).
    2. Clicar para mudar o tema.
- **Resultado Esperado:**
    - A interface muda as cores de fundo, texto e componentes conforme o tema selecionado (Dark/Light).
    - A preferência é lembrada ao recarregar a página (se implementado persistência de tema).

### 4.2 Acessibilidade (Text-to-Speech)
**Objetivo:** Validar a leitura de texto em voz alta.
- **Passos:**
    1. Em um modo de estudo (ex: Flashcards ou Solução Guiada), localizar o ícone de áudio/fala.
    2. Clicar no ícone.
- **Resultado Esperado:**
    - O navegador inicia a síntese de voz lendo o conteúdo textual exibido.

### 4.3 Responsividade
**Objetivo:** Garantir usabilidade em dispositivos móveis.
- **Passos:**
    1. Redimensionar o navegador para largura de celular (ex: 375px).
    2. Verificar o menu (hambúrguer ou barra lateral colapsada).
    3. Verificar layout dos cartões e botões.
- **Resultado Esperado:**
    - O layout se adapta sem quebra de elementos.
    - A navegação permanece acessível.
