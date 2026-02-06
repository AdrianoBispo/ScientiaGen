# ScientiaGen

Bem-vindo ao **ScientiaGen**, sua plataforma de estudos pessoal e inteligente, projetada para revolucionar a forma como você aprende. Potencializado pela avançada API Google Gemini, o ScientiaGen vai além dos métodos de estudo tradicionais, oferecendo um ecossistema completo de ferramentas interativas. Gere dinamicamente cartões de estudo, quizzes desafiadores e soluções passo a passo para qualquer tópico. Salve, edite e personalize todo o seu conteúdo em uma biblioteca pessoal, receba relatórios de desempenho detalhados e acelere seu aprendizado com o poder da IA.

![Captura de tela do aplicativo ScientiaGen](https://storage.googleapis.com/project-maker-media/364a66a7-f98b-4b13-a447-0624d7764d6c.gif)

## ✨ Recursos

### Múltiplos Modos de Estudo
- **Aprender:** Quiz com perguntas abertas onde a IA avalia a precisão das respostas do usuário em texto livre.
- **Testes:** Exames de múltipla escolha com 4 alternativas, explicações detalhadas e feedback imediato.
- **Cartões (Flashcards):** Flashcards interativos e viráveis sobre qualquer tópico, com gestos de swipe, atalhos de teclado (Espaço, Setas) e leitura por voz (Text-to-Speech).
- **Combinar:** Jogo de drag-and-drop cronometrado com revelação progressiva de pares (máximo 6 visíveis por vez).
- **Misto:** Quiz que combina perguntas de múltipla escolha, preencher lacunas e respostas abertas em uma única sessão.
- **Solução Guiada:** Soluções passo a passo para problemas complexos, com suporte a entrada por texto, upload de arquivos e captura por câmera. Exportável em PDF, DOC e Markdown.

### Criação Flexível de Conteúdo
- **Geração por IA:** Insira um tópico, escolha a dificuldade (fácil/médio/difícil) e a quantidade — a IA gera o conteúdo automaticamente.
- **Criação Manual:** Crie suas próprias perguntas, cartões ou soluções do zero.
- **Importação de Planilhas:** Importe listas de termos/definições via arquivos Excel, CSV ou ODS (`.xlsx`, `.xls`, `.csv`, `.ods`, `.xlsm`) nos modos Flashcards e Combinar. Auto-detecção de headers.

### Biblioteca Pessoal e Persistência
- **Autenticação com Firebase:** Login via Google ou cadastro com e-mail/senha, com medidor de força de senha e validação contra senhas comuns.
- **Persistência Inteligente:** Dados salvos em `localStorage` para visitantes e no Firebase Firestore para usuários autenticados, com fallback automático.
- **Migração Automática:** Ao fazer login pela primeira vez, os dados locais são migrados automaticamente para a nuvem (deduplicação por ID).
- **Exercícios Salvos:** Salve, edite, exclua e rejogue exercícios diretamente na página de cada modo.
- **Histórico Abrangente:** Registro de todas as sessões de estudo com modo, tópico, pontuação, tempo e data.
- **Relatórios Detalhados:** Modal de relatório com resultados por questão, barra de progresso e estatísticas de pontuação.

### Estatísticas e Progresso
- **Dashboard de Estatísticas:** Visão geral com total de exercícios, precisão média, sequência de dias (streak) e melhor precisão.
- **Gráfico de Atividade:** Visualização de sessões dos últimos 30 dias.
- **Distribuição por Modo:** Análise de uso por modo de estudo com porcentagem.
- **Tópicos Mais Estudados:** Ranking dos 10 tópicos mais frequentes.
- **Detalhes por Modo:** Cards com sessões, precisão média e melhor precisão para cada modo.

### Acessibilidade e Experiência do Usuário
- **Text-to-Speech:** Ouça termos, definições e soluções com a Web Speech API (`pt-BR`).
- **Navegação Adaptativa:** Sidebar colapsável no desktop, barra de navegação inferior no mobile.
- **Temas Claro e Escuro:** Alternância com persistência e detecção automática da preferência do sistema.
- **Configurações Personalizáveis:** Modal com abas para Perfil, Aparência (tema, animações), Exercícios (dificuldade e quantidade padrão) e Dados (limpeza de cache local).

### Exportação de Conteúdo
- **PDF:** Soluções formatadas com título, passos e cálculos em fonte monoespaçada.
- **DOC:** Arquivo formatado em HTML com renderização Markdown.
- **Markdown:** Texto puro em formato `.md`.

## 🚀 Como Funciona

1. **Escolha um Modo:** O usuário seleciona um dos seis modos de estudo na tela inicial (carrossel interativo).
2. **Configure e Gere:** O usuário configura a sessão (tópico, dificuldade, quantidade) e escolhe o método de criação (IA, manual ou importação). Para geração por IA, a aplicação envia a requisição para uma função serverless que se comunica com a API Gemini.
3. **Sessão Interativa:** A aplicação renderiza a interface específica do modo com rastreamento de tempo. O usuário interage com o conteúdo usando touch, teclado ou mouse.
4. **Conclusão e Relatório:** Ao finalizar, a tela de conclusão exibe pontuação, porcentagem, tempo gasto e mensagem de desempenho. O usuário pode salvar, jogar novamente ou voltar ao menu.
5. **Gerencie e Reutilize:** Na página de cada modo, o usuário visualiza exercícios salvos e histórico, podendo rejogar, editar ou excluir conteúdo.

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | React 19 |
| **Linguagem** | TypeScript |
| **Build** | Vite 6 |
| **Estilização** | Tailwind CSS 4 |
| **Roteamento** | React Router 7 |
| **Autenticação/DB** | Firebase (Auth + Firestore) |
| **IA** | Google Gemini API (`@google/genai`) |
| **Deploy** | Vercel (SPA + Serverless Functions) |
| **Ícones** | Lucide React |
| **Carrossel** | Swiper |
| **Planilhas** | xlsx (SheetJS) |
| **PDF** | jsPDF + html2canvas |
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
   # Google Gemini API (server-side — sem prefixo VITE_)
   GEMINI_API_KEY=sua_chave_gemini_aqui

   # Firebase Configuration (client-side — com prefixo VITE_)
   VITE_FIREBASE_API_KEY=sua_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_projeto
   VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
   ```

   > **Nota:** A chave `GEMINI_API_KEY` **não** possui o prefixo `VITE_` pois é consumida exclusivamente pela função serverless (`api/gemini.ts`), nunca exposta ao navegador.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:5173`.

5. **Build para produção:**
   ```bash
   npm run build
   npm run preview
   ```

### Deploy na Vercel

O projeto está configurado para deploy na **Vercel** com:
- **SPA Rewrites:** Todas as rotas redirecionadas para `index.html` ([vercel.json](vercel.json)).
- **Serverless Function:** A pasta `api/` contém a função `gemini.ts` que atua como proxy seguro para a API Gemini.
- **Variáveis de Ambiente:** Configure `GEMINI_API_KEY` e as variáveis `VITE_FIREBASE_*` no painel da Vercel.

## 🏗️ Arquitetura

### Proxy Serverless para IA

A aplicação utiliza um **proxy serverless** para comunicação com a API Gemini, garantindo que a chave de API nunca seja exposta ao cliente:

```
Cliente (React) → POST /api/gemini → Vercel Serverless Function → Google Gemini API
```

O serviço de IA no frontend (`src/services/ai.ts`) envia requisições para `/api/gemini`, que por sua vez utiliza `process.env.GEMINI_API_KEY` para autenticar com a API do Google. O modelo padrão utilizado é `gemini-2.5-flash`.

### Persistência Dual

```
Usuário Anônimo  → localStorage
Usuário Logado   → Firebase Firestore (com fallback para localStorage)
Primeiro Login   → Migração automática: localStorage → Firestore (deduplicação por ID)
```

## 📁 Estrutura do Projeto

```
ScientiaGen/
├── api/
│   └── gemini.ts             # Função serverless (proxy Gemini API)
├── src/
│   ├── components/
│   │   ├── exercises/        # Componentes de exercício (Setup, Completion, BackButton, HistoryReport)
│   │   └── layout/           # Layout (Header, Sidebar, MainLayout, SettingsModal, ExerciseLists)
│   ├── contexts/             # Contextos React (ThemeContext)
│   ├── features/             # Módulos de funcionalidade
│   │   ├── auth/             # Autenticação (LoginModal, RegisterModal, AuthContext)
│   │   ├── flashcards/       # Modo Cartões de Estudo
│   │   ├── guided/           # Modo Solução Guiada
│   │   ├── learn/            # Modo Aprender (Quiz)
│   │   ├── match/            # Modo Combinar
│   │   ├── mixed/            # Modo Misto
│   │   ├── statistics/       # Estatísticas (Dashboard, useStatistics hook)
│   │   └── test-mode/        # Modo Testes
│   ├── hooks/                # Hooks customizados (useLocalStorage, usePersistence)
│   ├── pages/                # Páginas principais (Home)
│   ├── services/             # Serviços (AI proxy, Firebase, Persistência dual)
│   ├── utils/                # Utilitários (passwordValidation, spreadsheetParser)
│   ├── App.tsx               # Componente raiz com rotas
│   ├── main.tsx              # Ponto de entrada
│   └── index.css             # Estilos globais
├── .env                      # Variáveis de ambiente (não versionado)
├── index.html                # HTML principal
├── package.json              # Dependências e scripts
├── vercel.json               # Configuração de deploy (Vercel)
├── tailwind.config.js        # Configuração do Tailwind CSS
├── tsconfig.json             # Configuração do TypeScript
└── vite.config.ts            # Configuração do Vite (alias @→src)
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
