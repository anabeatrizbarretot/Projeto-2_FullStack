
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


router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nome, tipo } = req.body || {};

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID da categoria inválido.'
    });
  }

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
      `UPDATE categorias
       SET nome = $1, tipo = $2
       WHERE id = $3 AND usuario_id = $4
       RETURNING id, nome, tipo`,
      [nome.trim(), tipo, id, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        message: 'Categoria não encontrada.'
      });
    }

    return res.status(200).json({
      message: 'Categoria atualizada com sucesso!',
      categoria: resultado.rows[0]
    });

  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'Já existe uma categoria com esse nome e tipo.'
      });
    }

    console.error('Erro ao atualizar categoria:', erro);

    return res.status(500).json({
      message: 'Erro interno ao atualizar categoria.'
    });
  }
});


router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID da categoria inválido.'
    });
  }

  try {
    const usuarioId = req.usuario.id;

    const resultado = await pool.query(
      `DELETE FROM categorias
       WHERE id = $1 AND usuario_id = $2
       RETURNING id, nome, tipo`,
      [id, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        message: 'Categoria não encontrada.'
      });
    }

    return res.status(200).json({
      message: 'Categoria excluída com sucesso!',
      categoria: resultado.rows[0]
    });

  } catch (erro) {

    if (erro.code === '23503') {
      return res.status(409).json({
        message: 'Não é possível excluir uma categoria que possui lançamentos.'
      });
    }

    console.error('Erro ao excluir categoria:', erro);

    return res.status(500).json({
      message: 'Erro interno ao excluir categoria.'
    });
  }
});

export default router;
