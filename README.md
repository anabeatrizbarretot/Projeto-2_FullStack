# 💰 Controle Financeiro Pessoal

Aplicação Full Stack desenvolvida para a disciplina de **Programação Web Full Stack**, com o objetivo de facilitar o gerenciamento das finanças pessoais.

O sistema permite que os usuários registrem suas movimentações financeiras, organizem receitas e despesas, acompanhem seus gastos e visualizem relatórios para auxiliar no controle do dinheiro.

##  Sobre o projeto

O projeto consiste em uma aplicação web com interface desenvolvida em React.js e uma API REST criada com Node.js e Express, conectada a um banco de dados para armazenar as informações dos usuários.

A aplicação foi desenvolvida com foco na organização financeira, segurança dos dados e facilidade de utilização.

##  Funcionalidades

- Cadastro de usuários e autenticação com JWT.
- Login e logout.
- Registro de entradas e saídas financeiras.
- Gerenciamento de categorias.
- Gerenciamento de contas, fontes e destinos.
- Cadastro de compras parceladas no cartão de crédito.
- Dashboard com resumo financeiro mensal.
- Filtros de lançamentos por período, categoria e conta.
- Relatórios de gastos por categoria.
- Relatórios de movimentações por fonte e destino.
- Previsão de faturas dos cartões de crédito.
- Controle de saldo, receitas e despesas.
- Isolamento dos dados de cada usuário.

##  Tecnologias utilizadas

### Front-end
- React.js
- JavaScript
- HTML5
- CSS3
- Vite
- React Router

### Back-end
- Node.js
- Express
- API REST
- JSON Web Token (JWT)
- bcrypt

### Banco de dados
- Banco de dados relacional ou não relacional com persistência real.

##  Estrutura do projeto

```text
projeto2-financas/
├── backend/
│   ├── database/
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/
│   └── package.json
│
└── README.md
```

##  Como executar o projeto

### Pré-requisitos

- Node.js
- npm
- Banco de dados configurado

### 1. Clone o repositório

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd projeto2-financas
```

### 2. Configure o back-end

```bash
cd backend
npm install
```

Crie um arquivo `.env` baseado no `.env.example` e configure as variáveis de ambiente:

```env
PORT=3000
DATABASE_URL=sua_url_do_banco
JWT_SECRET=sua_chave_secreta
```

Configure o banco de dados utilizando os scripts disponíveis na pasta `database`.

Execute o seed, caso disponível, para inserir os dados iniciais.

Inicie o servidor:

```bash
npm run dev
```

### 3. Configure o front-end

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível no endereço informado pelo Vite, geralmente:

```text
http://localhost:5173
```

##  Segurança

O sistema utiliza autenticação por token JWT para proteger as rotas privadas.

As senhas são armazenadas utilizando hash, e cada usuário pode acessar somente seus próprios dados financeiros.

As informações sensíveis, como credenciais do banco de dados e chave JWT, são armazenadas em variáveis de ambiente.

##  Principais rotas da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/cadastro` | Cadastro de usuário |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Dados do usuário autenticado |
| GET / POST | `/api/categorias` | Listar e criar categorias |
| PUT / DELETE | `/api/categorias/:id` | Editar e excluir categorias |
| GET / POST | `/api/fontes-destinos` | Listar e criar contas |
| PUT / DELETE | `/api/fontes-destinos/:id` | Editar e excluir contas |
| GET / POST | `/api/lancamentos` | Listar e criar lançamentos |
| PUT / DELETE | `/api/lancamentos/:id` | Editar e excluir lançamentos |
| GET | `/api/relatorios/categorias` | Relatório por categoria |
| GET | `/api/relatorios/fontes-destinos` | Relatório por conta |
| GET | `/api/relatorios/faturas` | Previsão de faturas |
| GET | `/api/saude-financeira` | Indicadores financeiros |

*As rotas podem variar conforme a implementação final do projeto.*

## Desenvolvido por

- Ana Beatriz Barreto
- João Miguel Dias
- Lívia Pontes

Projeto acadêmico desenvolvido em grupo para a disciplina de Programação Web Full Stack.

**Universidade Tecnológica Federal do Paraná (UTFPR)**

##  Objetivo acadêmico

Aplicar conhecimentos de desenvolvimento Full Stack, integração entre front-end e back-end, criação de APIs REST, persistência de dados, autenticação, segurança e organização de aplicações web.

---

**Controle Financeiro Pessoal — Organize suas finanças de forma simples e prática!**
