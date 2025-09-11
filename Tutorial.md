# Tutorial: Construindo o ScientiaGen, um Aplicativo de Estudos Completo com a API Gemini

Este tutorial irá guiá-lo na criação do ScientiaGen, uma aplicação web de estudos multifuncional. Em vez de construir tudo de uma vez, vamos adicionar recursos camada por camada, começando do básico e evoluindo para a aplicação complexa e rica em recursos que você vê agora.

## O Que Vamos Construir?

O ScientiaGen: uma aplicação web robusta que permite aos usuários gerar conteúdo de estudo de várias formas (cartões, quizzes, soluções) com a API Gemini, salvá-lo em uma biblioteca pessoal, editar esse conteúdo, ouvir o material com texto para fala e gerenciar sua conta e sessões de estudo com recursos avançados.

---

### Passo 1: A Estrutura da Aplicação (HTML & CSS)

Todo grande projeto precisa de uma fundação sólida. Vamos começar com a estrutura visual e o layout.

**1. Crie os arquivos essenciais:**
`index.html`, `index.css`, `index.tsx`, `metadata.json`.

**2. Configure o `index.html` com o Layout Principal:**

Vamos configurar a estrutura completa com uma barra lateral, o cabeçalho e a área de conteúdo principal. Inclua também o `importmap` para as futuras dependências e todos os contêineres de modais que usaremos mais tarde (é bom tê-los estruturados desde o início).

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>ScientiaGen</title>
    <script type="importmap">...</script>
    <link rel="stylesheet" href="index.css">
</head>
<body>
<div id="appShell">
    <!-- Sidebar -->
    <aside id="sidebar">
        <nav class="sidebar-nav">
            <a href="#" id="navHome" class="nav-item active">...</a>
            <!-- Outros itens de navegação -->
        </nav>
    </aside>

    <!-- Main Content -->
    <main id="mainContent">
        <!-- Header -->
        <header id="appHeader">
             <button id="headerBackBtn" class="hidden">...</button>
             <div class="header-actions">
                <button id="userProfileBtn">...</button>
            </div>
        </header>
        <!-- Dynamic Content Area -->
        <div id="contentWrapper">...</div>
    </main>
</div>
<!-- Modals (user profile, settings, etc.) -->
<div id="userProfileModal" class="modal-overlay hidden">...</div>
<div id="settingsModal" class="modal-overlay hidden">...</div>

<script type="module" src="index.tsx"></script>
</body>
</html>
```

**3. Configure `index.css` com a Barra Lateral Dinâmica:**

Em vez de um menu hambúrguer, faremos a barra lateral se expandir com `hover`. Adicione também as variáveis de tema.

```css
/* index.css */
:root {
  /* ... Variáveis dos temas claro e escuro ... */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 80px;
}
#sidebar {
  width: var(--sidebar-width-collapsed);
  transition: width 0.3s ease;
  overflow-x: hidden;
}
#appShell:hover #sidebar {
    width: var(--sidebar-width);
}
#sidebar .nav-item span {
    opacity: 0;
    transition: opacity 0.2s ease;
}
#appShell:hover #sidebar .nav-item span {
    opacity: 1;
}
```

---

### Passo 2: O Primeiro Recurso - Gerador de Cartões com Visualizador Focado

Vamos implementar a funcionalidade central e já adicionar uma ótima UX para o estudo.

**1. Adicione a UI dos Cartões no `index.html`:**

Dentro de `#studyViewContainer`, adicione a div para `#flashcardView` com os botões "Gerar", "Exibir" e "Salvar".

```html
<div id="flashcardView" class="hidden">
    <div class="container">
      ...
      <div class="flashcard-actions">
          <button id="generateButton">Gerar</button>
          <button id="viewGeneratedCardsBtn" class="secondary-btn hidden">Exibir</button>
          <button id="saveFlashcardsBtn" class="secondary-btn hidden">Salvar</button>
      </div>
      ...
      <div id="flashcardsContainer"></div>
    </div>
</div>
<!-- Adicione também a estrutura da `cardViewerModal` -->
```

**2. Implemente a Geração e Visualização em `index.tsx`:**

- No clique de `generateButton`, chame a API Gemini para obter os cartões.
- Após a geração, mostre o `viewGeneratedCardsBtn`.
- Implemente uma função `createFlippableCard(flashcard)` que cria o HTML de um cartão.
- No clique de `viewGeneratedCardsBtn`, popule e exiba a `cardViewerModal`, mostrando um cartão de cada vez com botões de navegação. Reutilize a função que renderiza os cartões da biblioteca.

---

### Passo 3: Aumentando a Acessibilidade com a Web Speech API

Vamos adicionar a funcionalidade de texto para fala.

**1. Crie o Ícone e a Função de Fala:**

- Em `index.tsx`, defina uma constante para o SVG do ícone de alto-falante.
- Crie uma função `speakText(text: string)` que utiliza `window.speechSynthesis` para vocalizar o texto.

```typescript
// index.tsx
function speakText(text: string) {
    if ('speechSynthesis' in window && text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}
```

**2. Integre os Botões de Fala na UI:**

- Use delegação de eventos para gerenciar os cliques. Adicione um ouvinte no `document.body` que procura por cliques em elementos com a classe `.speech-btn`.
- Modifique as funções que geram HTML (como `createFlippableCard`, `renderSolution`, `generate...ReportHtml`) para incluir o botão de fala ao lado do texto relevante. Estruture o HTML para que seja fácil encontrar o texto a ser falado a partir do botão clicado.

```html
<!-- Exemplo de estrutura -->
<div class="speech-text-wrapper">
  <div class="text-to-speak">Texto a ser falado</div>
  <button class="speech-btn">[SVG_DO_ALTO_FALANTE]</button>
</div>
```

---

### Passo 4: Gerenciamento de Usuário com Modais

Vamos substituir o antigo menu suspenso por modais mais funcionais e dar a todos acesso ao seletor de tema.

**1. Implemente a `userProfileModal`:**
   - Em `index.tsx`, altere o ouvinte de eventos do `userProfileBtn` para abrir a `userProfileModal`.
   - Dentro do ouvinte, verifique o estado `isLoggedIn`.
   - Se logado, preencha a modal com as informações do usuário e mostre os botões "Configurações" e "Sair".
   - Se não logado, mostre uma mensagem de boas-vindas e os botões de login.
   - Inclua o botão de alternância de tema em ambas as visualizações dentro desta modal.

**2. Crie a `settingsModal` Completa:**
   - No `index.html`, crie a estrutura da `settingsModal` com abas para "Perfil", "Segurança" e "Conta".
   - Em `index.tsx`, adicione a lógica para alternar entre as abas.
   - Implemente as funcionalidades de cada aba:
     - **Perfil:** Use `FileReader` para ler a imagem de avatar selecionada e exibir uma pré-visualização. Salve as alterações de nome/e-mail no `localStorage`.
     - **Segurança:** Simule a alteração de senha.
     - **Conta:** No clique do botão "Excluir Conta", reutilize a `confirmDeleteModal` para uma confirmação final antes de limpar todos os dados do usuário do `localStorage` e fazer logout.

---

### Passo 5: Construindo um Quiz Interativo (Modo Aprender)

Agora, um recurso mais complexo que requer avaliação de IA.

**1. Crie a UI do Modo Aprender:**
   - No `index.html`, adicione a estrutura para `#learnView`, incluindo a tela de configuração, a tela do quiz e a tela de resultados.

**2. Implemente a Geração do Quiz:**
   - Faça o botão "Iniciar" abrir a `exerciseConfigModal` para o usuário definir o número de questões e o tempo.
   - Após a configuração, chame a Gemini solicitando um JSON com as `questions`, cada uma com `question` e `answer`. Use `{ responseMimeType: 'application/json' }`.

**3. Implemente a Avaliação da Resposta e Relatório Final:**
   - Quando o usuário envia uma resposta, faça uma **segunda chamada à API Gemini** para avaliar a resposta e fornecer feedback.
   - No final do quiz, faça uma **terceira chamada à API Gemini**, enviando todos os registros de respostas (`currentQuizRecords`), e peça um relatório de desempenho detalhado em JSON, incluindo análise, pontos a reforçar e materiais de estudo.
   - Crie uma função para renderizar este relatório em HTML e exibi-lo na tela de resultados.

---

### Passo 6: Recursos Avançados de Gerenciamento e UX

Os toques finais que elevam a aplicação.

**1. Implemente o Sistema de Pausa/Continuação:**
   - Adicione a `pauseExitModal` ao HTML.
   - Faça o botão de voltar no cabeçalho abrir esta modal durante um exercício.
   - A ação "Pausar" deve salvar o estado atual do exercício (índice da questão, tempo, pontuação, etc.) em uma variável de estado.
   - Ao entrar em um modo de estudo, verifique se existe um estado pausado. Se sim, ofereça a opção de retomar o exercício com os dados salvos.

**2. Implemente a Edição de Conteúdo Salvo:**
   - Nas ações da biblioteca, a opção "Editar" deve abrir uma modal (`editExerciseModal`, `editCardSetModal`, etc.).
   - A modal deve ser preenchida com os dados existentes.
   - Permita que os usuários modifiquem, adicionem ou excluam itens.
   - Ao salvar, atualize o array de estado correspondente e o `localStorage`.

---

## Conclusão

Parabéns! Seguindo estas etapas, você reconstruiu a lógica de uma aplicação de estudos complexa. Você aprendeu não apenas a gerar conteúdo com a Gemini, mas também a:
- Estruturar uma aplicação web complexa com múltiplas visões e modais.
- Gerenciar o estado da aplicação, incluindo dados do usuário e progresso pausado.
- Utilizar a Web Speech API para melhorar a acessibilidade.
- Implementar funcionalidades CRUD completas para conteúdo gerado pelo usuário.
- Projetar uma experiência de usuário robusta com um painel de configurações completo e gerenciamento de conta.