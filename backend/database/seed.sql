
BEGIN;

INSERT INTO usuarios (nome, email, cpf, senha_hash)
VALUES
(
  'Ana Demonstração',
  'ana.demo@example.com',
  '11122334400',
  '$2b$10$miGpga2ym0sty3RJ7479f.dhpb9iuMA3GRR3fv15wI0cXLRFPFFqW'
),
(
  'João Demonstração',
  'joao.demo@example.com',
  '55566677720',
  '$2b$10$Rg6GmF/P9p4PzdcKeGNRwurkFCngeeBRJu3/ZJRnF06cTHnw.Sa8W'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO categorias (usuario_id, nome, tipo)
SELECT u.id, c.nome, c.tipo
FROM usuarios u
CROSS JOIN (
  VALUES
    ('Salário', 'entrada'),
    ('Outros', 'entrada'),
    ('Alimentação', 'saida'),
    ('Moradia', 'saida'),
    ('Saúde', 'saida'),
    ('Mobilidade', 'saida'),
    ('Lazer', 'saida'),
    ('Educação', 'saida'),
    ('Outros', 'saida')
) AS c(nome, tipo)
WHERE u.email IN (
  'ana.demo@example.com',
  'joao.demo@example.com'
)
ON CONFLICT (usuario_id, nome, tipo) DO NOTHING;


INSERT INTO fontes_destinos (
  usuario_id,
  nome,
  tipo,
  dia_fechamento,
  dia_vencimento,
  limite
)
SELECT
  u.id,
  f.nome,
  f.tipo,
  f.dia_fechamento,
  f.dia_vencimento,
  f.limite
FROM (
  VALUES
    ('ana.demo@example.com', 'Salário mensal', 'renda', NULL, NULL, NULL),
    ('ana.demo@example.com', 'Conta corrente', 'conta', NULL, NULL, NULL),
    ('ana.demo@example.com', 'Cartão principal', 'cartao_credito', 10, 17, 3000.00),
    ('joao.demo@example.com', 'Salário mensal', 'renda', NULL, NULL, NULL),
    ('joao.demo@example.com', 'Conta corrente', 'conta', NULL, NULL, NULL),
    ('joao.demo@example.com', 'Cartão de crédito', 'cartao_credito', 5, 12, 2000.00)
) AS f(email, nome, tipo, dia_fechamento, dia_vencimento, limite)
JOIN usuarios u ON u.email = f.email
ON CONFLICT (usuario_id, nome) DO NOTHING;


WITH dados (
  email, tipo, descricao, valor, data,
  categoria, fonte, parcela_atual,
  total_parcelas, grupo, data_compra
) AS (
  VALUES

  ('ana.demo@example.com', 'entrada', 'Salário agosto', 2500.00, '2026-08-05', 'Salário', 'Salário mensal', 1, 1, NULL, '2026-08-05'),
  ('ana.demo@example.com', 'saida', 'Supermercado agosto', 350.00, '2026-08-08', 'Alimentação', 'Conta corrente', 1, 1, NULL, '2026-08-08'),
  ('ana.demo@example.com', 'saida', 'Transporte agosto', 120.00, '2026-08-12', 'Mobilidade', 'Conta corrente', 1, 1, NULL, '2026-08-12'),

  ('ana.demo@example.com', 'entrada', 'Salário setembro', 2500.00, '2026-09-05', 'Salário', 'Salário mensal', 1, 1, NULL, '2026-09-05'),
  ('ana.demo@example.com', 'saida', 'Supermercado setembro', 420.00, '2026-09-08', 'Alimentação', 'Conta corrente', 1, 1, NULL, '2026-09-08'),
  ('ana.demo@example.com', 'saida', 'Cinema setembro', 80.00, '2026-09-15', 'Lazer', 'Cartão principal', 1, 1, NULL, '2026-09-15'),

  ('ana.demo@example.com', 'entrada', 'Salário outubro', 2500.00, '2026-10-05', 'Salário', 'Salário mensal', 1, 1, NULL, '2026-10-05'),
  ('ana.demo@example.com', 'saida', 'Supermercado outubro', 390.00, '2026-10-08', 'Alimentação', 'Conta corrente', 1, 1, NULL, '2026-10-08'),
  ('ana.demo@example.com', 'saida', 'Transporte outubro', 150.00, '2026-10-12', 'Mobilidade', 'Conta corrente', 1, 1, NULL, '2026-10-12'),

  ('joao.demo@example.com', 'entrada', 'Salário agosto', 3200.00, '2026-08-05', 'Salário', 'Salário mensal', 1, 1, NULL, '2026-08-05'),
  ('joao.demo@example.com', 'saida', 'Aluguel agosto', 900.00, '2026-08-10', 'Moradia', 'Conta corrente', 1, 1, NULL, '2026-08-10'),
  ('joao.demo@example.com', 'saida', 'Mercado agosto', 450.00, '2026-08-12', 'Alimentação', 'Conta corrente', 1, 1, NULL, '2026-08-12'),

  ('joao.demo@example.com', 'entrada', 'Salário setembro', 3200.00, '2026-09-05', 'Salário', 'Salário mensal', 1, 1, NULL, '2026-09-05'),
  ('joao.demo@example.com', 'saida', 'Aluguel setembro', 900.00, '2026-09-10', 'Moradia', 'Conta corrente', 1, 1, NULL, '2026-09-10'),
  ('joao.demo@example.com', 'saida', 'Mercado setembro', 500.00, '2026-09-12', 'Alimentação', 'Conta corrente', 1, 1, NULL, '2026-09-12'),

  ('joao.demo@example.com', 'entrada', 'Salário outubro', 3200.00, '2026-10-05', 'Salário', 'Salário mensal', 1, 1, NULL, '2026-10-05'),
  ('joao.demo@example.com', 'saida', 'Aluguel outubro', 900.00, '2026-10-10', 'Moradia', 'Conta corrente', 1, 1, NULL, '2026-10-10'),
  ('joao.demo@example.com', 'saida', 'Mercado outubro', 480.00, '2026-10-12', 'Alimentação', 'Conta corrente', 1, 1, NULL, '2026-10-12'),

  ('ana.demo@example.com', 'saida', 'Compra demonstrativa 1/3', 100.00, '2026-11-15', 'Lazer', 'Cartão principal', 1, 3, '11111111-2222-4333-8444-555555555555', '2026-11-15'),
  ('ana.demo@example.com', 'saida', 'Compra demonstrativa 2/3', 100.00, '2026-12-15', 'Lazer', 'Cartão principal', 2, 3, '11111111-2222-4333-8444-555555555555', '2026-11-15'),
  ('ana.demo@example.com', 'saida', 'Compra demonstrativa 3/3', 100.00, '2027-01-15', 'Lazer', 'Cartão principal', 3, 3, '11111111-2222-4333-8444-555555555555', '2026-11-15')
)

INSERT INTO lancamentos (
  usuario_id,
  tipo,
  descricao,
  valor,
  data,
  categoria_id,
  fonte_destino_id,
  parcela_atual,
  total_parcelas,
  grupo_parcelamento,
  data_compra
)
SELECT
  u.id,
  d.tipo,
  d.descricao,
  d.valor,
  d.data::date,
  c.id,
  f.id,
  d.parcela_atual,
  d.total_parcelas,
  d.grupo::uuid,
  d.data_compra::date
FROM dados d
JOIN usuarios u
  ON u.email = d.email
JOIN categorias c
  ON c.usuario_id = u.id
  AND c.nome = d.categoria
  AND c.tipo = d.tipo
JOIN fontes_destinos f
  ON f.usuario_id = u.id
  AND f.nome = d.fonte
WHERE NOT EXISTS (
  SELECT 1
  FROM lancamentos l
  WHERE l.usuario_id = u.id
    AND l.descricao = d.descricao
    AND l.data = d.data::date
    AND l.parcela_atual = d.parcela_atual
);

COMMIT;
