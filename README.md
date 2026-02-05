# ScientiaGen

Bem-vindo ao **ScientiaGen**, sua plataforma de estudos pessoal e inteligente, projetada para revolucionar a forma como você aprende. Potencializado pela avançada API Google Gemini, o ScientiaGen vai além dos métodos de estudo tradicionais, oferecendo um ecossistema completo de ferramentas interativas. Gere dinamicamente cartões de estudo, quizzes desafiadores e soluções passo a passo para qualquer tópico. Salve, edite e personalize todo o seu conteúdo em uma biblioteca pessoal, receba relatórios de desempenho detalhados e acelere seu aprendizado com o poder da IA.

![Captura de tela do aplicativo ScientiaGen](https://storage.googleapis.com/project-maker-media/364a66a7-f98b-4b13-a447-0624d7764d6c.gif)

## ✨ Recursos

### Múltiplos Modos de Estudo
- **Aprender:** Um modo de quiz com perguntas abertas onde a IA avalia a precisão das respostas do usuário.
- **Testes:** Desafie-se com testes personalizados para avaliar seu aprendizado de forma estruturada.
- **Cartões (Flashcards):** Gera flashcards interativos e viráveis sobre qualquer tópico, com um visualizador focado para estudo imediato.
- **Combinar:** Um jogo de correspondência cronometrado onde os usuários arrastam e soltam termos para suas definições corretas.
- **Misto:** Um quiz desafiador que combina perguntas de múltipla escolha, de preencher lacunas e abertas.
- **Solução Guiada:** Fornece soluções passo a passo detalhadas para problemas ou perguntas complexas.

### Biblioteca Pessoal e Persistência
- **Autenticação com Firebase:** Sistema de autenticação real com suporte a login via Google.
- **Sua Biblioteca:** Uma área central para todo o conteúdo salvo do usuário, organizada em abas.
- **Histórico Abrangente:** Mantém um registro de todas as sessões de estudo, incluindo modo, tópico, pontuação e data.
- **Relatórios de Desempenho:** Após cada exercício, a IA gera um relatório estatístico com análise de desempenho, pontos a reforçar e materiais de estudo sugeridos.
- **Estatísticas:** Visualize seu progresso e desempenho ao longo do tempo.

### Acessibilidade e Experiência do Usuário
- **Integração com Web Speech API:** Ouça os termos, definições, soluções e relatórios com a funcionalidade de texto para fala.
- **Barra Lateral Dinâmica:** Interface limpa com navegação intuitiva entre os modos de estudo.
- **Importação de Planilhas:** Importe listas de exercícios via arquivos Excel/CSV.
- **Temas Claro e Escuro:** Escolha o tema visual que preferir, com persistência automática.

### Gerenciamento de Conta e Conteúdo
- **Download de Conteúdo:** Exporte soluções e relatórios nos formatos **Markdown**, **PDF** ou **DOC**.
- **Persistência na Nuvem:** Seus dados são sincronizados via Firebase Firestore.

## 🚀 Como Funciona

1. **Escolha um Modo:** O usuário seleciona um dos seis modos de estudo na tela inicial.
2. **Configure e Gere:** O usuário configura a sessão (ex: número de questões, tópico) e a aplicação envia um prompt para a API Gemini, solicitando conteúdo estruturado em JSON.
3. **Sessão Interativa:** A aplicação renderiza a interface específica do modo. O usuário pode interagir com o conteúdo e usar a função de texto para fala. Nos modos de quiz, a Gemini também avalia as respostas abertas.
4. **Relatório e Salvamento:** Após a conclusão, um relatório detalhado é gerado. O usuário pode acessar estatísticas do seu desempenho.
5. **Gerencie e Reutilize:** Na biblioteca, o usuário pode visualizar seu histórico, rejogar exercícios ou baixar materiais para uso offline.

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | React 19 |
| **Linguagem** | TypeScript |
| **Build** | Vite |
| **Estilização** | TailwindCSS 4 |
| **Roteamento** | React Router 7 |
| **Autenticação/DB** | Firebase (Auth + Firestore) |
| **IA** | Google Gemini API (`@google/genai`) |
| **Ícones** | Lucide React |
| **Carrossel** | Swiper |
| **Planilhas** | xlsx |
| **PDF** | jspdf + html2canvas |
| **Markdown** | marked |

## ⚙️ Como Começar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Uma chave de API do [Google Gemini](https://aistudio.google.com/app/apikey)
- Um projeto no [Firebase Console](https://console.firebase.google.com/)

### Configuração Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/AdrianoBispo/ScientiaGen.git
   cd ScientiaGen
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```env
   # Google Gemini API
   VITE_GEMINI_API_KEY=sua_chave_gemini_aqui

   # Firebase Configuration
   VITE_FIREBASE_API_KEY=sua_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_projeto
   VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:3000`.

5. **Build para produção:**
   ```bash
   npm run build
   npm run preview
   ```

## 📁 Estrutura do Projeto

```
ScientiaGen/
├── public/                   # Arquivos estáticos
├── src/
│   ├── components/
│   │   └── layout/           # Componentes de layout (Header, Sidebar, MainLayout)
│   ├── contexts/             # Contextos React (ThemeContext)
│   ├── features/             # Módulos de funcionalidade
│   │   ├── auth/             # Autenticação
│   │   ├── flashcards/       # Modo Cartões de Estudo
│   │   ├── guided/           # Modo Solução Guiada
│   │   ├── learn/            # Modo Aprender (Quiz)
│   │   ├── match/            # Modo Combinar
│   │   ├── mixed/            # Modo Misto
│   │   ├── statistics/       # Estatísticas
│   │   └── test-mode/        # Modo Testes
│   ├── hooks/                # Hooks customizados
│   ├── pages/                # Páginas principais
│   ├── services/             # Serviços (AI, Firebase, Persistência)
│   ├── utils/                # Utilitários
│   ├── App.tsx               # Componente raiz com rotas
│   ├── main.tsx              # Ponto de entrada
│   └── index.css             # Estilos globais
├── .env                      # Variáveis de ambiente (não versionado)
├── index.html                # HTML principal
├── package.json              # Dependências e scripts
├── tailwind.config.js        # Configuração do TailwindCSS
├── tsconfig.json             # Configuração do TypeScript
└── vite.config.ts            # Configuração do Vite
```

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Visualiza o build de produção |

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está licenciado sob a Licença Apache, Versão 2.0. Veja o `SPDX-License-Identifier: Apache-2.0` nos arquivos de código-fonte para mais detalhes.
