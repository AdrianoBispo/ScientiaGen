# ScientiaGen

Bem-vindo ao **ScientiaGen**, sua plataforma de estudos pessoal e inteligente, projetada para revolucionar a forma como você aprende. Potencializado pela avançada API Google Gemini, o ScientiaGen vai além dos métodos de estudo tradicionais, oferecendo um ecossistema completo de ferramentas interativas. Gere dinamicamente cartões de estudo, quizzes desafiadores e soluções passo a passo para qualquer tópico. Salve, edite e personalize todo o seu conteúdo em uma biblioteca pessoal, receba relatórios de desempenho detalhados e acelere seu aprendizado com o poder da IA.

![Captura de tela do aplicativo ScientiaGen](https://storage.googleapis.com/project-maker-media/364a66a7-f98b-4b13-a447-0624d7764d6c.gif)

## ✨ Recursos

### Múltiplos Modos de Estudo
- **Aprender:** Um modo de quiz com perguntas abertas onde a IA avalia a precisão das respostas do usuário.
- **Cartões (Flashcards):** Gera flashcards interativos e viráveis sobre qualquer tópico, com um visualizador focado para estudo imediato.
- **Combinar:** Um jogo de correspondência cronometrado onde os usuários arrastam e soltam termos para suas definições corretas.
- **Aprendizagem Guiada:** Fornece soluções passo a passo detalhadas para problemas ou perguntas complexas.
- **Misto:** Um quiz desafiador que combina perguntas de múltipla escolha, de preencher lacunas e abertas.

### Biblioteca Pessoal e Persistência
- **Autenticação de Usuário (Simulada):** Permite que os usuários "façam login" para acessar recursos personalizados.
- **Sua Biblioteca:** Uma área central para todo o conteúdo salvo do usuário, organizada em abas.
- **Histórico Abrangente:** Mantém um registro de todas as sessões de estudo, incluindo modo, tópico, pontuação e data.
- **Relatórios de Desempenho:** Após cada exercício, a IA gera um relatório estatístico com análise de desempenho, pontos a reforçar e materiais de estudo sugeridos.
- **Salvar Conteúdo:** Salve qualquer exercício, conjunto de cartões, relatório ou solução gerada na sua biblioteca para uso futuro.

### Acessibilidade e Experiência do Usuário
- **Integração com Web Speech API:** Ouça os termos, definições, soluções e relatórios com a funcionalidade de texto para fala, tornando o estudo mais dinâmico e acessível.
- **Barra Lateral Dinâmica:** Uma interface limpa com uma barra lateral que se expande elegantemente ao passar o mouse.
- **Configuração de Exercícios:** Personalize as sessões de estudo definindo o número de questões e o limite de tempo.
- **Pausar e Continuar:** Pause qualquer exercício e retome-o mais tarde exatamente de onde parou.
- **Temas Claro e Escuro:** Escolha o tema visual que preferir, disponível para todos os usuários.

### Gerenciamento de Conta e Conteúdo
- **Modal de Perfil de Usuário:** Acesse rapidamente as informações do seu perfil, configurações e a opção de sair.
- **Configurações Avançadas:**
  - **Editar Perfil:** Altere seu nome, e-mail e foto de perfil (com upload de imagem).
  - **Segurança:** Altere sua senha (simulado).
  - **Excluir Conta:** Opção segura para excluir permanentemente a conta e todos os dados associados.
- **Editor de Conteúdo Completo:**
    - **Exercícios:** Modifique exercícios salvos, edite perguntas/respostas e adicione ou remova itens.
    - **Conjuntos de Cartões:** Edite o nome do conjunto e adicione, modifique ou exclua cartões.
    - **Soluções:** Edite soluções usando um editor Markdown com pré-visualização em tempo real.
- **Download de Conteúdo:** Exporte soluções e relatórios nos formatos **Markdown**, **PDF** ou **DOC**.

## 🚀 Como Funciona

1.  **Escolha um Modo:** O usuário seleciona um dos cinco modos de estudo na tela inicial.
2.  **Configure e Gere:** O usuário configura a sessão (ex: número de questões, tempo) e a aplicação envia um prompt para a API Gemini, solicitando conteúdo estruturado em JSON.
3.  **Sessão Interativa:** A aplicação renderiza a interface específica do modo. O usuário pode interagir com o conteúdo e usar a função de texto para fala para ouvir as informações. Nos modos de quiz, a Gemini também avalia as respostas abertas.
4.  **Relatório e Salvamento:** Após a conclusão, um relatório detalhado é gerado. Se o usuário estiver logado, ele pode salvar o exercício, relatório, conjunto de cartões ou solução em sua biblioteca pessoal (`localStorage`).
5.  **Gerencie e Reutilize:** Na biblioteca, o usuário pode visualizar seu histórico, rejogar exercícios, editar qualquer conteúdo salvo ou baixar materiais para uso offline.

## 🛠️ Tecnologias Utilizadas

-   **Frontend:** HTML5, CSS3, TypeScript
-   **Modelo de IA:** API Google Gemini (`@google/genai`)
-   **APIs do Navegador:** Web Speech API (Text-to-Speech), `localStorage`
-   **Geração de Documentos:**
    -   `jspdf` & `html2canvas` para exportação de PDF.
    -   `marked` para análise e renderização de Markdown.
-   **Carregamento de Módulos:** ES Modules via `importmap` (não requer etapa de build).
-   **Estilização:** Variáveis CSS personalizadas para temas claro/escuro e layout responsivo.

## ⚙️ Como Começar

Para executar este projeto localmente, você precisará de um servidor web para servir os arquivos. Você não pode simplesmente abrir o `index.html` no seu navegador devido a restrições de segurança com módulos ES.

### Pré-requisitos

-   Um navegador web moderno (ex: Chrome, Firefox, Edge).
-   Uma chave de API do Google Gemini.

### Configuração Local

1.  **Clone o repositório:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Configure sua Chave de API:**
    Esta aplicação foi projetada para ser executada em um ambiente onde a variável `process.env.API_KEY` está disponível. Ao implantar ou executar localmente, garanta que esta variável de ambiente esteja configurada com sua chave de API do Google Gemini.

3.  **Sirva o projeto:**
    Use um servidor web local simples. Se você tiver o Node.js instalado, pode usar um pacote como o `http-server`:
    ```bash
    # Instale o http-server globalmente (se ainda não o fez)
    npm install -g http-server

    # Inicie o servidor a partir do diretório raiz do projeto
    http-server
    ```
    Em seguida, abra seu navegador e navegue para o endereço local fornecido (ex: `http://localhost:8080`).

## 📁 Estrutura de Arquivos

```
.
├── index.html        # Estrutura principal do HTML, incluindo todos os contêineres e modais
├── index.css         # Todos os estilos para o aplicativo, incluindo temas e layout
├── index.tsx         # Lógica principal da aplicação, estado, DOM e chamadas de API
├── metadata.json     # Nome e descrição do projeto
└── README.md         # Este arquivo
```

## 📄 Licença

Este projeto está licenciado sob a Licença Apache, Versão 2.0. Veja o `SPDX-License-Identifier: Apache-2.0` nos arquivos de código-fonte para mais detalhes.