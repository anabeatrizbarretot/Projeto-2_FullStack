
import express from 'express';
import pool from '../config/database.js';
import autenticar from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(autenticar);

router.post('/', async (req, res) => {
  const { nome, tipo } = req.body || {};

  if (
    typeof nome !== 'string' ||
    !nome.trim() ||
    nome.trim().length > 60 ||
    !['entrada', 'saida'].includes(tipo)
  ) {
    return res.status(400).json({
      message: 'Informe um nome válido e o tipo entrada ou saida.'
    });
  }

  try {
    const usuarioId = req.usuario.id;

    const resultado = await pool.query(
      `INSERT INTO categorias (usuario_id, nome, tipo)
       VALUES ($1, $2, $3)
       RETURNING id, nome, tipo`,
      [usuarioId, nome.trim(), tipo]
    );

    return res.status(201).json(resultado.rows[0]);

  } catch (erro) {

    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'Essa categoria já está cadastrada.'
      });
    }

    console.error('Erro ao cadastrar categoria:', erro);

    return res.status(500).json({
      message: 'Erro interno ao cadastrar categoria.'
    });
  }
});


router.get('/', async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const resultado = await pool.query(
      `SELECT id, nome, tipo
       FROM categorias
       WHERE usuario_id = $1
       ORDER BY nome ASC`,
      [usuarioId]
    );

    return res.status(200).json(resultado.rows);

  } catch (erro) {
    console.error('Erro ao listar categorias:', erro);

    return res.status(500).json({
      message: 'Erro interno ao listar categorias.'
    });
  }
});

export default router;
