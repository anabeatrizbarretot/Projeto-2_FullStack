# Documentação do Banco de Dados — Controle Financeiro

## 1. Visão geral

O projeto utiliza PostgreSQL como sistema de gerenciamento de banco de dados.

O banco de dados se chama `controle_financeiro` e é responsável por armazenar os usuários, categorias, contas, cartões de crédito e lançamentos financeiros.

A implementação do banco de dados e dos relatórios está sob responsabilidade de Ana Beatriz Barreto.

## 2. Estrutura de arquivos

Os arquivos relacionados ao banco de dados estão organizados da seguinte maneira:

```text
backend/
└── database/
    ├── README.md
    ├── schema.sql
    ├── seed.sql
    └── relatorios.sql
```

- `schema.sql`: criação das tabelas, relacionamentos e índices.
- `seed.sql`: inserção de dados fictícios para demonstração.
- `relatorios.sql`: consultas SQL utilizadas nos relatórios financeiros.
- `README.md`: documentação do banco de dados.

## 3. Tabelas do banco de dados

### usuarios

Armazena os dados dos usuários cadastrados.

Principais campos:
- `id`: identificador do usuário.
- `nome`: nome do usuário.
- `email`: e-mail único.
- `cpf`: CPF único.
- `senha_hash`: senha armazenada em formato de hash.
- `criado_em`: data de criação do cadastro.

### categorias

Armazena as categorias utilizadas para classificar os lançamentos.

Principais campos:
- `id`: identificador da categoria.
- `usuario_id`: usuário proprietário.
- `nome`: nome da categoria.
- `tipo`: entrada ou saída.

### fontes_destinos

Armazena as fontes de renda, contas bancárias e cartões de crédito.

Principais campos:
- `id`: identificador.
- `usuario_id`: usuário proprietário.
- `nome`: nome da conta ou cartão.
- `tipo`: renda, conta ou cartão de crédito.
- `dia_fechamento`: dia de fechamento do cartão.
- `dia_vencimento`: dia de vencimento do cartão.
- `limite`: limite do cartão de crédito.

### lancamentos

Armazena as movimentações financeiras dos usuários.

Principais campos:
- `id`: identificador do lançamento.
- `usuario_id`: usuário proprietário.
- `tipo`: entrada ou saída.
- `descricao`: descrição do lançamento.
- `valor`: valor monetário do lançamento.
- `data`: data da movimentação.
- `categoria_id`: categoria relacionada.
- `fonte_destino_id`: conta ou cartão relacionado.
- `parcela_atual`: número da parcela atual.
- `total_parcelas`: quantidade total de parcelas.
- `grupo_parcelamento`: identificador que agrupa as parcelas de uma mesma compra.
- `criado_em`: data de criação do registro.

## 4. Relacionamentos

- Um usuário pode possuir várias categorias.
- Um usuário pode possuir várias fontes e destinos.
- Um usuário pode possuir vários lançamentos.
- Uma categoria pode estar relacionada a vários lançamentos.
- Uma fonte ou destino pode estar relacionada a vários lançamentos.

As chaves estrangeiras garantem os relacionamentos entre as tabelas.

## 5. Relatórios financeiros

As consultas estão armazenadas no arquivo `relatorios.sql`.

### Relatório 1 — Gastos por categoria

Apresenta:
- Nome da categoria.
- Tipo do lançamento.
- Total gasto.
- Quantidade de lançamentos.

Parâmetros:
- `$1`: ID do usuário.
- `$2`: data inicial.
- `$3`: data final.

### Relatório 2 — Movimentações por conta

Apresenta:
- Nome da conta.
- Tipo da conta.
- Total movimentado.
- Quantidade de lançamentos.

Parâmetros:
- `$1`: ID do usuário.
- `$2`: data inicial.
- `$3`: data final.

### Relatório 3 — Previsão das faturas

Apresenta:
- Nome do cartão.
- Data de vencimento.
- Total da fatura.
- Quantidade de lançamentos.

Considera os dias de fechamento e vencimento cadastrados para cada cartão e apresenta até quatro próximas faturas com lançamentos.

Parâmetro:
- `$1`: ID do usuário.

**Observação:** a geração automática dos lançamentos de compras parceladas deverá ser implementada pelo back-end. Cada parcela deverá ser registrada individualmente, com seu respectivo valor, data e identificação do grupo de parcelamento.

### Relatório 4 — Saúde financeira

Apresenta:
- Total de entradas.
- Total de despesas.
- Saldo financeiro.
- Percentual da renda comprometida.

Parâmetros:
- `$1`: ID do usuário.
- `$2`: data inicial.
- `$3`: data final.

## 6. Integração com o back-end

As consultas SQL devem ser executadas pelo Node.js utilizando a biblioteca `pg`.

Exemplo de execução parametrizada:

```javascript
const resultado = await pool.query(
    `SELECT *
     FROM lancamentos
     WHERE usuario_id = $1`,
    [usuarioId]
);
```

Os parâmetros devem ser enviados por meio de arrays, evitando a concatenação direta de valores recebidos do usuário nas consultas SQL.

O back-end deverá:
- Identificar o usuário autenticado.
- Executar as consultas com os parâmetros correspondentes.
- Retornar os resultados em formato JSON para o front-end.
- Garantir que cada usuário consulte somente seus próprios dados.

## 7. Dados de demonstração

O arquivo `seed.sql` contém dados fictícios para testes e demonstrações.

Os dados já foram inseridos no banco de dados durante a preparação do projeto.

**Atenção:** os hashes de senha dos usuários de demonstração são valores fictícios e não devem ser utilizados para autenticação real.

## 8. Configuração da conexão

A conexão com PostgreSQL é realizada pelo arquivo:

`backend/src/config/database.js`

As configurações são armazenadas no arquivo `.env`, que não deve ser enviado ao GitHub.

Variáveis utilizadas:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=controle_financeiro
DB_USER=postgres
DB_PASSWORD=sua_senha_local
PORT=3000
JWT_SECRET=seu_segredo_local
```

O arquivo `.env.example` deverá conter apenas valores ilustrativos, nunca senhas ou segredos reais.

## 9. Testes realizados

Foram realizados testes de conexão entre Node.js e PostgreSQL.

Também foram executadas e verificadas as quatro consultas SQL:

1. Gastos por categoria.
2. Movimentações por conta.
3. Previsão das faturas dos cartões.
4. Saúde financeira.

Os testes utilizaram os dados disponíveis no banco de demonstração.

## 10. Responsabilidades da equipe

- Ana Beatriz Barreto: banco de dados, modelagem, relacionamentos, scripts SQL e relatórios financeiros.
- João Miguel Dias: back-end Node.js, Express, API, autenticação e integração com o banco de dados.
- Lívia Pontes: front-end React, interfaces, componentes e integração com a API.