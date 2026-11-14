
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
    `UPDATE categorias
     SET nome = $1, tipo = $2
     WHERE id = $3 AND usuario_id = $4
     RETURNING id, nome, tipo`,
    [nome, tipo, id, usuarioId]
  );

  return resultado.rows[0];
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
