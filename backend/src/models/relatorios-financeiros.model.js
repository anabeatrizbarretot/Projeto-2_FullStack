
import pool from '../config/database.js';

export async function consultarCategoriasPorPeriodo(
  usuarioId,
  periodo
) {
  const consulta = await pool.query(
    `SELECT
       c.id,
       c.nome,
       c.tipo,
       COALESCE(
         SUM(l.valor) FILTER (
           WHERE l.data BETWEEN $2::date AND $3::date
         ), 0
       ) AS total,
       COALESCE(
         SUM(l.valor) FILTER (
           WHERE l.data BETWEEN $4::date AND $5::date
         ), 0
       ) AS "periodoAnterior"
     FROM categorias c
     LEFT JOIN lancamentos l
       ON l.categoria_id = c.id
       AND l.usuario_id = $1
       AND l.data BETWEEN $4::date AND $3::date
     WHERE c.usuario_id = $1
     GROUP BY c.id, c.nome, c.tipo
     HAVING COUNT(l.id) FILTER (
       WHERE l.data BETWEEN $2::date AND $3::date
     ) > 0
     ORDER BY total DESC, c.nome ASC`,
    [
      usuarioId,
      periodo.inicio,
      periodo.fim,
      periodo.anteriorInicio,
      periodo.anteriorFim
    ]
  );

  return consulta.rows;
}

export async function consultarFontesDestinosPorPeriodo(
  usuarioId,
  periodo
) {
  const consulta = await pool.query(
    `SELECT
       f.id,
       f.nome,
       f.tipo,
       COALESCE(
         SUM(l.valor) FILTER (
           WHERE l.tipo = 'entrada'
         ), 0
       ) AS entradas,
       COALESCE(
         SUM(l.valor) FILTER (
           WHERE l.tipo = 'saida'
         ), 0
       ) AS saidas
     FROM fontes_destinos f
     JOIN lancamentos l
       ON l.fonte_destino_id = f.id
       AND l.usuario_id = $1
       AND l.data BETWEEN $2::date AND $3::date
     WHERE f.usuario_id = $1
     GROUP BY f.id, f.nome, f.tipo
     ORDER BY f.nome ASC`,
    [
      usuarioId,
      periodo.inicio,
      periodo.fim
    ]
  );

  return consulta.rows;
}
