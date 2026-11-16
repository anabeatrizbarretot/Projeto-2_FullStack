
import pool from '../config/database.js';

export async function criarCategoria(usuarioId, nome, tipo) {
  const resultado = await pool.query(
    `INSERT INTO categorias (usuario_id, nome, tipo)
     VALUES ($1, $2, $3)
     RETURNING id, nome, tipo`,
    [usuarioId, nome, tipo]
  );

  return resultado.rows[0];
}

export async function listarCategorias(usuarioId) {
  const resultado = await pool.query(
    `SELECT id, nome, tipo
     FROM categorias
     WHERE usuario_id = $1
     ORDER BY nome ASC`,
    [usuarioId]
  );

  return resultado.rows;
}


export async function atualizarCategoria(
  id,
  usuarioId,
  nome,
  tipo
) {
  const resultado = await pool.query(
    `UPDATE categorias AS c
     SET nome = $1,
         tipo = $2
     WHERE c.id = $3
       AND c.usuario_id = $4
       AND (
         c.tipo = $2
         OR NOT EXISTS (
           SELECT 1
           FROM lancamentos AS l
           WHERE l.categoria_id = c.id
             AND l.usuario_id = $4
         )
       )
     RETURNING c.id, c.nome, c.tipo`,
    [nome, tipo, id, usuarioId]
  );

  if (resultado.rows.length > 0) {
    return resultado.rows[0];
  }

  const existe = await pool.query(
    `SELECT id
     FROM categorias
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  if (existe.rows.length === 0) {
    return null;
  }

  return {
    alteracaoTipoBloqueada: true
  };
}

export async function excluirCategoria(id, usuarioId) {
  const resultado = await pool.query(
    `DELETE FROM categorias
     WHERE id = $1 AND usuario_id = $2
     RETURNING id, nome, tipo`,
    [id, usuarioId]
  );

  return resultado.rows[0];
}
