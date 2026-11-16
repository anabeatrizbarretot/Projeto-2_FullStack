
# 💰 Controle Financeiro Pessoal

Aplicação Full Stack desenvolvida para a disciplina de **Programação Web Full Stack**, da **Universidade Tecnológica Federal do Paraná (UTFPR)**, com o objetivo de facilitar o gerenciamento das finanças pessoais.

O sistema permite que os usuários registrem suas movimentações financeiras, organizem receitas e despesas, acompanhem seus gastos, gerenciem cartões de crédito e visualizem relatórios para auxiliar no controle do dinheiro.

## Sobre o projeto

O projeto consiste em uma aplicação web com interface desenvolvida em **React.js** e uma **API REST criada com Node.js e Express**, conectada a um banco de dados PostgreSQL para armazenar as informações dos usuários.

A aplicação foi desenvolvida com foco na organização financeira, segurança dos dados, facilidade de utilização e integração entre front-end, back-end e banco de dados.

Cada usuário possui suas próprias categorias, contas, cartões e lançamentos, garantindo a separação das informações financeiras.

## Funcionalidades

- Cadastro de usuários com validação de nome, e-mail, CPF e senha.
- Autenticação com JWT.
- Login e logout.
- Criação automática de categorias e conta corrente no cadastro.
- Registro de entradas e saídas financeiras.
- Gerenciamento de categorias.
- Gerenciamento de contas, fontes e destinos.
- Cadastro e gerenciamento de cartões de crédito.
- Cadastro de compras parceladas em até 48 vezes.
- Edição de lançamentos financeiros.
- Exclusão individual ou de todas as parcelas de uma compra.
- Dashboard com resumo financeiro mensal.
- Filtros de lançamentos por período, tipo, categoria e conta.
- Paginação dos lançamentos.
- Relatórios de gastos por categoria, com gráficos e percentuais.
- Comparação dos gastos com o período anterior.
- Relatórios de movimentações por fonte e destino.
- Previsão da fatura aberta e das próximas três faturas.
- Cálculo do limite utilizado e disponível dos cartões.
- Controle de saldo, receitas e despesas.
- Isolamento dos dados de cada usuário.
- Tratamento padronizado de erros da API.

## Tecnologias utilizadas

### Front-end

- React.js
- JavaScript
- HTML5
- CSS3
- Vite
- React Router
- Axios
- Recharts

### Back-end

- Node.js
- Express
- API REST
- JSON Web Token (JWT)
- bcrypt
- pg (driver PostgreSQL e pool de conexões)
- dotenv
- cors
- express-rate-limit

### Banco de dados

- PostgreSQL.
- pgAdmin 4 para administração e execução dos scripts SQL.
- Banco relacional com persistência real.
- Chaves primárias e estrangeiras para relacionar os registros.
- Restrições `UNIQUE`, `NOT NULL` e `CHECK`.
- Tipo `NUMERIC(12,2)` para valores monetários.
- Transações SQL para garantir a integridade dos parcelamentos.

## Estrutura do projeto

```text
Projeto-2_FullStack/
│
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── migrations/
│   │       └── 001_data_compra.sql
│   │
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   └── erros.middleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── auth.model.js
│   │   │   ├── categorias.model.js
│   │   │   ├── fontes-destinos.model.js
│   │   │   ├── lancamentos.model.js
│   │   │   ├── relatorios-financeiros.model.js
│   │   │   ├── faturas.model.js
│   │   │   └── calcularFatura.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── categorias.routes.js
│   │   │   ├── fontes-destinos.routes.js
│   │   │   ├── lancamentos.routes.js
│   │   │   ├── relatorios-financeiros.routes.js
│   │   │   └── relatorios.routes.js
│   │   │
│   │   └── server.js
│   │
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── README-BACKEND.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

A estrutura do back-end separa as responsabilidades:

- `config/`: conexão e configurações do banco de dados.
- `middlewares/`: autenticação JWT e tratamento de erros.
- `models/`: consultas SQL, persistência e regras de negócio.
- `routes/`: endpoints, validações e respostas HTTP.
- `server.js`: inicialização do Express e registro das rotas.

A função `calcularFatura.js` foi mantida em `models/` por representar uma regra de negócio, responsável pelo cálculo das datas de fechamento e vencimento dos cartões.

## Como executar o projeto

### Pré-requisitos

Para executar o projeto, é necessário possuir:

- Node.js e npm instalados.
- PostgreSQL instalado e em execução.
- pgAdmin 4 ou outro cliente PostgreSQL.
- Git para clonar o repositório.
- Um editor de código, como o Visual Studio Code.

### 1. Clone o repositório

Execute no terminal:

```bash
git clone https://github.com/anabeatrizbarretot/Projeto-2_FullStack.git
```

Entre na pasta principal:

```bash
cd Projeto-2_FullStack
```

### 2. Configure o back-end

#### Configuração do banco de dados

Primeiro, crie um banco PostgreSQL com o nome:

```text
controle_financeiro
```

No pgAdmin 4:

1. Conecte-se ao servidor PostgreSQL.
2. Clique com o botão direito em `Databases`.
3. Selecione `Create > Database`.
4. Informe o nome `controle_financeiro`.
5. Salve e abra o Query Tool desse banco.

Execute os scripts SQL na seguinte ordem:

**1º — Criar as tabelas**

Execute o conteúdo de:

```text
backend/database/schema.sql
```

O script cria as tabelas:

- `usuarios`
- `categorias`
- `fontes_destinos`
- `lancamentos`

**2º — Inserir os dados iniciais**

Execute o conteúdo de:

```text
backend/database/seed.sql
```

Esse arquivo insere usuários e lançamentos demonstrativos, permitindo testar o sistema imediatamente.

**Importante:** utilize o seed em um banco novo ou exclusivo para testes. Não o execute em um banco com dados reais sem avaliar o impacto.

#### Banco de demonstração

Opcionalmente, pode ser criado um banco separado chamado:

```text
controle_financeiro_demo
```

Nesse caso, execute `schema.sql` e depois `seed.sql` nesse banco.

O seed contém:

- Ana Demonstração — 12 lançamentos.
- João Demonstração — 9 lançamentos.
- Movimentações de agosto, setembro e outubro de 2026.
- Uma compra demonstrativa parcelada em três vezes.

Contas disponíveis exclusivamente no banco demonstrativo:

| Usuário | E-mail | Senha |
|---|---|---|
| Ana Demonstração | `ana.demo@example.com` | `DemoAna123!` |
| João Demonstração | `joao.demo@example.com` | `DemoJoao123!` |

Essas credenciais são fictícias, destinadas apenas à demonstração local. Não devem ser utilizadas em um ambiente de produção.

#### Migrações

O arquivo:

```text
backend/database/migrations/001_data_compra.sql
```

foi criado para adaptar bancos de versões anteriores do projeto à utilização da coluna `data_compra`.

Em uma instalação nova, o `schema.sql` já cria essa coluna. Portanto, não é necessário executar a migração novamente.

Em um banco antigo, confira a estrutura existente antes de aplicar a migração.

#### Instalar as dependências

Na pasta principal, execute:

```bash
cd backend
npm install
```

#### Configurar as variáveis de ambiente

Crie um arquivo chamado `.env` dentro da pasta `backend`, usando `.env.example` como referência.

Exemplo:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=controle_financeiro
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_DO_POSTGRESQL

JWT_SECRET=SUA_CHAVE_SECRETA
```

Substitua os valores de exemplo pelas configurações do seu ambiente.

Se estiver utilizando o banco demonstrativo, configure:

```env
DB_NAME=controle_financeiro_demo
```

O arquivo `.env` contém informações sensíveis e não deve ser enviado ao GitHub.

Somente o `.env.example`, com valores fictícios, deve ser versionado.

#### Iniciar o servidor

Na pasta `backend`, execute:

```bash
npm run dev
```

O servidor será iniciado, por padrão, na porta 3000.

A API ficará disponível em:

```text
http://localhost:3000
```

Para verificar se o servidor está respondendo, acesse:

```text
http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "mensagem": "API funcionando com sucesso!"
}
```

Essa rota verifica a disponibilidade do servidor. Para confirmar também a conexão com o banco, realize um login pela aplicação.

### 3. Configure o front-end

Abra outro terminal, mantendo o back-end em execução.

A partir da pasta principal do projeto:

```bash
cd frontend
npm install
```

Inicie o React:

```bash
npm run dev -- --port 5173 --strictPort
```

A aplicação estará disponível em:

```text
http://localhost:5173
```

O front-end utiliza a API disponível em:

```text
http://localhost:3000/api
```

Por padrão, o cliente HTTP já utiliza esse endereço.

Opcionalmente, a URL da API pode ser configurada por meio da variável de ambiente `VITE_API_URL`.

Para utilizar o back-end real, não ative o modo de simulação `VITE_USAR_MOCK=true`.

O back-end e o front-end precisam permanecer em execução simultaneamente.

#### Verificar a compilação

Na pasta `frontend`, execute:

```bash
npm run build
```

O Vite deverá gerar os arquivos de produção dentro da pasta `dist`.

### Observações sobre a execução

- Utilize a porta 3000 para o back-end.
- Utilize a porta 5173 para o React.
- O CORS da API está configurado para `http://localhost:5173`.
- Se o PostgreSQL não estiver iniciado, operações que dependem do banco poderão falhar.
- Depois de alterar as variáveis do `.env`, reinicie o servidor.
- O diretório `node_modules` é criado pelo npm e não precisa ser enviado ao GitHub.

## Segurança

O sistema utiliza autenticação por token **JWT** para proteger as rotas privadas.

As senhas são armazenadas por meio de **bcrypt**, com hash e salt, e não são retornadas nas respostas da API.

Cada usuário pode acessar somente seus próprios dados financeiros. As consultas utilizam a identificação obtida do token autenticado.

O projeto também implementa:

- Validação de CPF com dígitos verificadores.
- Normalização de e-mail e CPF no cadastro.
- Restrições de unicidade no PostgreSQL.
- Consultas SQL parametrizadas.
- Validação dos dados recebidos pelo servidor.
- Controle de acesso aos registros por usuário.
- CORS restrito à origem do front-end.
- Limitação de tentativas de login.
- Middleware centralizado de tratamento de erros.

As respostas de erro da API utilizam um padrão com a propriedade `erro` e, quando necessário, `campos`.

Exemplo:

```json
{
  "erro": "Dados inválidos.",
  "campos": {
    "valor": "Informe um valor positivo."
  }
}
```

Informações sensíveis, como credenciais do banco e chave JWT, ficam armazenadas no arquivo `.env`, que não deve ser versionado.

## Principais rotas da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Verificar o funcionamento da API |
| POST | `/api/auth/cadastro` | Cadastro de usuário |
| POST | `/api/auth/login` | Login e geração do JWT |
| GET | `/api/auth/me` | Dados do usuário autenticado |
| GET | `/api/auth/perfil` | Verificação de acesso autenticado |
| GET / POST | `/api/categorias` | Listar e criar categorias |
| PUT / DELETE | `/api/categorias/:id` | Editar e excluir categorias |
| GET / POST | `/api/fontes-destinos` | Listar e criar fontes e destinos |
| PUT / DELETE | `/api/fontes-destinos/:id` | Editar e excluir fontes e destinos |
| GET / POST | `/api/lancamentos` | Listar e criar lançamentos |
| GET | `/api/lancamentos/:id` | Consultar lançamento específico |
| PUT / DELETE | `/api/lancamentos/:id` | Editar e excluir lançamentos |
| GET | `/api/relatorios/categorias` | Relatório por categoria |
| GET | `/api/relatorios/fontes-destinos` | Relatório por fonte/destino |
| GET | `/api/relatorios/faturas` | Previsão das faturas |

As rotas financeiras exigem o cabeçalho:

```text
Authorization: Bearer TOKEN_JWT
```

A listagem de lançamentos aceita filtros como:

```text
/api/lancamentos?inicio=2026-08-01&fim=2026-10-31&pagina=1
```

Também é possível filtrar por `tipo`, `categoriaId` e `fonteDestinoId`.

Para excluir todas as parcelas de uma compra, pode-se utilizar:

```text
DELETE /api/lancamentos/:id?todasParcelas=true
```

Os relatórios por categoria e fonte/destino utilizam os parâmetros `inicio` e `fim`.

O relatório de faturas aceita o parâmetro `meses`, retornando por padrão a fatura aberta e as três próximas.

### Regras de parcelamento

As compras parceladas são cadastradas por meio de uma transação no PostgreSQL.

Cada parcela é armazenada como um lançamento individual, compartilhando o mesmo identificador `grupo_parcelamento`.

O sistema permite parcelamentos de 1 a 48 vezes, exclusivamente para saídas realizadas em cartões de crédito.

Os valores são divididos em centavos para evitar diferenças de arredondamento.

Por exemplo, uma compra de R$ 100,00 parcelada em três vezes gera:

- Primeira parcela: R$ 33,34.
- Segunda parcela: R$ 33,33.
- Terceira parcela: R$ 33,33.

**Total: R$ 100,00.**

A coluna `data_compra` preserva a data original da compra em todas as parcelas.

A coluna `data` representa a data correspondente a cada parcela na sequência mensal.

Essa separação permite manter o histórico do parcelamento e calcular corretamente as faturas, mesmo quando parcelas individuais são editadas ou excluídas.

### Cálculo das faturas

O cálculo das faturas considera:

- Data original da compra.
- Dia de fechamento do cartão.
- Dia de vencimento.
- Número da parcela.
- Quantidade total de parcelas.

Uma compra realizada no próprio dia do fechamento é considerada no próximo ciclo de faturamento.

O sistema trata meses com 28, 29, 30 e 31 dias, inclusive anos bissextos.

A tela de Faturas apresenta a fatura ainda aberta e a previsão das próximas três, com os lançamentos correspondentes.

O limite utilizado é calculado a partir das parcelas com vencimento ainda não ocorrido.

**Observação:** esse limite é uma estimativa baseada nas parcelas cadastradas. O sistema não possui controle individual de pagamento e baixa de faturas, portanto o valor apresentado não substitui o saldo oficial informado pela administradora do cartão.

## Desenvolvido por

- Ana Beatriz Barreto
- João Miguel Dias
- Lívia Pontes

Projeto acadêmico desenvolvido em grupo para a disciplina de Programação Web Full Stack.

**Universidade Tecnológica Federal do Paraná (UTFPR)**

## Objetivo acadêmico

Aplicar conhecimentos de desenvolvimento Full Stack, integração entre front-end e back-end, criação de APIs REST, persistência de dados, autenticação, segurança, validação de informações e organização de aplicações web.

O projeto também busca demonstrar a aplicação de regras de negócio no servidor, incluindo parcelamentos, cálculos de faturas e relatórios financeiros, além de boas práticas de organização do código e versionamento com Git.

---

**Controle Financeiro Pessoal — Organize suas finanças de forma simples e prática!**
