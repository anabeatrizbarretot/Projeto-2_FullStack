
# Back-end — Controle Financeiro Pessoal

## Responsável
João Miguel Dias — Back-end (Node.js/Express)

## Tecnologias
- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt
- express-rate-limit
- CORS
- dotenv

## Funcionalidades implementadas
- API REST
- Cadastro de usuários com validação de CPF e e-mail
- Senhas protegidas com bcrypt
- Login e autenticação JWT
- Criação automática de categorias e conta inicial
- Rotas protegidas por autenticação
- CRUD de categorias
- CRUD de fontes e destinos
- CRUD de lançamentos financeiros
- Compras parceladas no cartão de crédito
- Cálculo de faturas e vencimentos
- Relatórios financeiros
- Validações e tratamento de erros
- Limitação de tentativas de login

## Instalação

1. Instalar o Node.js e o PostgreSQL.
2. Abrir a pasta backend no terminal.
3. Executar:

npm install

4. Criar o arquivo .env com base no .env.example.
5. Criar o banco controle_financeiro.
6. Executar database/schema.sql no PostgreSQL.
7. Iniciar a API:

npm run dev

## Endereço da API

http://localhost:3000/api

## Autenticação

POST /api/auth/cadastro
POST /api/auth/login
GET /api/auth/me
GET /api/auth/perfil

## Categorias

POST /api/categorias
GET /api/categorias
PUT /api/categorias/:id
DELETE /api/categorias/:id

## Fontes e destinos

POST /api/fontes-destinos
GET /api/fontes-destinos
PUT /api/fontes-destinos/:id
DELETE /api/fontes-destinos/:id

## Lançamentos

POST /api/lancamentos
GET /api/lancamentos
GET /api/lancamentos/:id
PUT /api/lancamentos/:id
DELETE /api/lancamentos/:id

Exclusão de todas as parcelas:
DELETE /api/lancamentos/:id?todasParcelas=true

## Relatórios

GET /api/relatorios/categorias
GET /api/relatorios/fontes-destinos
GET /api/relatorios/faturas

Os relatórios financeiros recebem os filtros
inicio e fim no formato AAAA-MM-DD.

O relatório de faturas aceita o parâmetro meses.

## Segurança

As rotas privadas exigem o cabeçalho:

Authorization: Bearer TOKEN_JWT

Cada usuário acessa somente os próprios registros.

As consultas utilizam parâmetros SQL para
proteger contra SQL Injection.

As senhas são armazenadas como hashes bcrypt.

## Observações

O sistema deve utilizar o banco PostgreSQL
configurado no arquivo .env.

A integração com o front-end React deverá
respeitar os formatos de requisição e resposta
das rotas documentadas.
