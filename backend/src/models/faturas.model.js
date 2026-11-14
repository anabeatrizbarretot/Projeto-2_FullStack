
import pool from '../config/database.js';

export async function buscarDadosFaturas(usuarioId) {
  const [cartoes, lancamentos, dataAtual] = await Promise.all([
    pool.query(
      `SELECT id, nome, limite,
              dia_fechamento AS "diaFechamento",
              dia_vencimento AS "diaVencimento"
       FROM fontes_destinos
       WHERE usuario_id = $1 AND tipo = 'cartao_credito'
       ORDER BY nome`,
      [usuarioId]
    ),

    pool.query(
      `SELECT l.id, l.fonte_destino_id AS "cartaoId",
              l.descricao, l.valor,
              l.parcela_atual AS "parcelaAtual",
              l.total_parcelas AS "totalParcelas",
              l.grupo_parcelamento AS "grupoParcelamento",
              TO_CHAR(l.data, 'YYYY-MM-DD') AS data,
              TO_CHAR(l.data_compra, 'YYYY-MM-DD') AS "dataCompra"
       FROM lancamentos l
       JOIN fontes_destinos f ON f.id = l.fonte_destino_id
       WHERE l.usuario_id = $1
         AND f.usuario_id = $1
         AND f.tipo = 'cartao_credito'
         AND l.tipo = 'saida'
       ORDER BY l.data, l.id`,
      [usuarioId]
    ),

    pool.query(
      "SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS hoje"
    )
  ]);

  return {
    cartoes: cartoes.rows,
    lancamentos: lancamentos.rows,
    hoje: dataAtual.rows[0].hoje
  };
}
