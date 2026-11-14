
import pool from '../config/database.js';

const categoriasPadrao = [
  ['Salário', 'entrada'],
  ['Outros', 'entrada'],
  ['Alimentação', 'saida'],
  ['Moradia', 'saida'],
  ['Saúde', 'saida'],
  ['Mobilidade', 'saida'],
  ['Lazer', 'saida'],
  ['Educação', 'saida'],
  ['Outros', 'saida']
];

export async function cadastrarUsuario(dados) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resultado = await client.query(
      `INSERT INTO usuarios
       (nome, email, cpf, senha_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, cpf, criado_em`,
      [
        dados.nome,
        dados.email,
        dados.cpf,
        dados.senhaHash
      ]
    );

    const usuario = resultado.rows[0];

    for (const [nome, tipo] of categoriasPadrao) {
      await client.query(
        `INSERT INTO categorias
         (usuario_id, nome, tipo)
         VALUES ($1, $2, $3)`,
        [usuario.id, nome, tipo]
      );
    }

    await client.query(
      `INSERT INTO fontes_destinos
       (usuario_id, nome, tipo)
       VALUES ($1, $2, $3)`,
      [usuario.id, 'Conta corrente', 'conta']
    );

    await client.query('COMMIT');

    return usuario;

  } catch (erro) {
    await client.query('ROLLBACK').catch(() => {});
    throw erro;

  } finally {
    client.release();
  }
}

export async function buscarUsuarioPorEmail(email) {
  const resultado = await pool.query(
    `SELECT id, nome, email, senha_hash
     FROM usuarios
     WHERE email = $1`,
    [email]
  );

  return resultado.rows[0] || null;
}

export async function buscarUsuarioPorId(id) {
  const resultado = await pool.query(
    `SELECT id, nome, email, cpf, criado_em
     FROM usuarios
     WHERE id = $1`,
    [id]
  );

  return resultado.rows[0] || null;
}
