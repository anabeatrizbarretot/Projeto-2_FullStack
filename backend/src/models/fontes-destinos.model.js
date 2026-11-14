
import pool from '../config/database.js';

const campos = `
  id,
  nome,
  tipo,
  dia_fechamento AS "diaFechamento",
  dia_vencimento AS "diaVencimento",
  limite
`;

export async function criarFonteDestino(usuarioId, dados) {
  const resultado = await pool.query(
    `INSERT INTO fontes_destinos
     (
       usuario_id,
       nome,
       tipo,
       dia_fechamento,
       dia_vencimento,
       limite
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${campos}`,
    [
      usuarioId,
      dados.nome,
      dados.tipo,
      dados.diaFechamento,
      dados.diaVencimento,
      dados.limite
    ]
  );

  return resultado.rows[0];
}

export async function listarFontesDestinos(usuarioId) {
  const resultado = await pool.query(
    `SELECT ${campos}
     FROM fontes_destinos
     WHERE usuario_id = $1
     ORDER BY nome ASC`,
    [usuarioId]
  );

  return resultado.rows;
}

export async function atualizarFonteDestino(
  id,
  usuarioId,
  dados
) {
  const resultado = await pool.query(
    `UPDATE fontes_destinos
     SET nome = $1,
         tipo = $2,
         dia_fechamento = $3,
         dia_vencimento = $4,
         limite = $5
     WHERE id = $6 AND usuario_id = $7
     RETURNING ${campos}`,
    [
      dados.nome,
      dados.tipo,
      dados.diaFechamento,
      dados.diaVencimento,
      dados.limite,
      id,
      usuarioId
    ]
  );

  return resultado.rows[0];
}

export async function excluirFonteDestino(id, usuarioId) {
  const resultado = await pool.query(
    `DELETE FROM fontes_destinos
     WHERE id = $1 AND usuario_id = $2
     RETURNING id, nome, tipo`,
    [id, usuarioId]
  );

  return resultado.rows[0];
}
