
-- =============================================
-- RELATORIO 1: GASTOS POR CATEGORIA
-- =============================================

SELECT
    c.nome AS categoria,
    l.tipo,
    SUM(l.valor) AS total_gasto,
    COUNT(l.id) AS quantidade_lancamentos
FROM lancamentos l
INNER JOIN categorias c
    ON l.categoria_id = c.id
WHERE l.usuario_id = $1
  AND l.tipo = 'saida'
  AND l.data BETWEEN $2 AND $3
GROUP BY c.nome, l.tipo
ORDER BY total_gasto DESC;


-- =============================================
-- RELATORIO 2: MOVIMENTACOES POR CONTA
-- =============================================

SELECT
    fd.nome AS conta,
    fd.tipo AS tipo_conta,
    SUM(l.valor) AS total_movimentado,
    COUNT(l.id) AS quantidade_lancamentos
FROM lancamentos l
INNER JOIN fontes_destinos fd
    ON l.fonte_destino_id = fd.id
WHERE l.usuario_id = $1
  AND l.data BETWEEN $2 AND $3
GROUP BY fd.nome, fd.tipo
ORDER BY total_movimentado DESC;


-- =============================================
-- RELATORIO 3: PREVISAO DAS FATURAS
-- PROXIMAS QUATRO FATURAS POR CARTAO
-- =============================================

WITH lancamentos_cartao AS (
    SELECT
        fd.id AS cartao_id,
        fd.nome AS cartao,
        l.id AS lancamento_id,
        l.valor,
        l.data,
        fd.dia_fechamento,
        fd.dia_vencimento,

        CASE
            WHEN EXTRACT(DAY FROM l.data) <= fd.dia_fechamento
            THEN DATE_TRUNC('month', l.data)::date
            ELSE (
                DATE_TRUNC('month', l.data)
                + INTERVAL '1 month'
            )::date
        END AS mes_fechamento

    FROM lancamentos l
    INNER JOIN fontes_destinos fd
        ON l.fonte_destino_id = fd.id

    WHERE l.usuario_id = $1
      AND fd.tipo = 'cartao_credito'
      AND l.tipo = 'saida'
),

faturas AS (
    SELECT
        cartao_id,
        cartao,
        lancamento_id,
        valor,

        (
            mes_fechamento
            + INTERVAL '1 month'
            + (
                LEAST(
                    dia_vencimento,
                    EXTRACT(
                        DAY FROM (
                            mes_fechamento
                            + INTERVAL '2 months - 1 day'
                        )
                    )::integer
                ) - 1
            ) * INTERVAL '1 day'
        )::date AS vencimento

    FROM lancamentos_cartao
),

resumo AS (
    SELECT
        cartao_id,
        cartao,
        vencimento,
        SUM(valor) AS total_fatura,
        COUNT(lancamento_id) AS quantidade_lancamentos

    FROM faturas

    WHERE vencimento >= CURRENT_DATE

    GROUP BY
        cartao_id,
        cartao,
        vencimento
),

classificacao AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY cartao_id
            ORDER BY vencimento
        ) AS numero_fatura

    FROM resumo
)

SELECT
    cartao,
    vencimento,
    total_fatura,
    quantidade_lancamentos

FROM classificacao

WHERE numero_fatura <= 4

ORDER BY cartao, vencimento;
