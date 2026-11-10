
INSERT INTO usuarios (nome, email, cpf, senha_hash)
VALUES
('Ana Demonstração', 'ana.demo@email.com', '11111111111', 'hash_ficticio_ana'),
('João Demonstração', 'joao.demo@email.com', '22222222222', 'hash_ficticio_joao');

INSERT INTO categorias (usuario_id, nome, tipo)
VALUES
(1, 'Salário', 'entrada'),
(1, 'Alimentação', 'saida'),
(1, 'Transporte', 'saida'),
(1, 'Lazer', 'saida'),
(2, 'Salário', 'entrada'),
(2, 'Moradia', 'saida'),
(2, 'Alimentação', 'saida');

INSERT INTO fontes_destinos (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite)
VALUES
(1, 'Salário mensal', 'renda', NULL, NULL, NULL),
(1, 'Conta corrente', 'conta', NULL, NULL, NULL),
(1, 'Cartão principal', 'cartao_credito', 10, 17, 3000.00),
(2, 'Salário mensal', 'renda', NULL, NULL, NULL),
(2, 'Conta corrente', 'conta', NULL, NULL, NULL),
(2, 'Cartão de crédito', 'cartao_credito', 5, 12, 2000.00);

INSERT INTO lancamentos
(usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id)
VALUES
(1, 'entrada', 'Salário agosto', 2500.00, '2026-08-05', 1, 1),
(1, 'saida', 'Supermercado agosto', 350.00, '2026-08-08', 2, 2),
(1, 'saida', 'Transporte agosto', 120.00, '2026-08-12', 3, 2),
(1, 'entrada', 'Salário setembro', 2500.00, '2026-09-05', 1, 1),
(1, 'saida', 'Supermercado setembro', 420.00, '2026-09-08', 2, 2),
(1, 'saida', 'Cinema setembro', 80.00, '2026-09-15', 4, 3),
(1, 'entrada', 'Salário outubro', 2500.00, '2026-10-05', 1, 1),
(1, 'saida', 'Supermercado outubro', 390.00, '2026-10-08', 2, 2),
(1, 'saida', 'Transporte outubro', 150.00, '2026-10-12', 3, 2),
(2, 'entrada', 'Salário agosto', 3200.00, '2026-08-05', 5, 4),
(2, 'saida', 'Aluguel agosto', 900.00, '2026-08-10', 6, 5),
(2, 'saida', 'Mercado agosto', 450.00, '2026-08-12', 7, 5),
(2, 'entrada', 'Salário setembro', 3200.00, '2026-09-05', 5, 4),
(2, 'saida', 'Aluguel setembro', 900.00, '2026-09-10', 6, 5),
(2, 'saida', 'Mercado setembro', 500.00, '2026-09-12', 7, 5),
(2, 'entrada', 'Salário outubro', 3200.00, '2026-10-05', 5, 4),
(2, 'saida', 'Aluguel outubro', 900.00, '2026-10-10', 6, 5),
(2, 'saida', 'Mercado outubro', 480.00, '2026-10-12', 7, 5);
