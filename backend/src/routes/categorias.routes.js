
import express from 'express';
import autenticar from '../middlewares/auth.middleware.js';

import {
  criarCategoria,
  listarCategorias,
  atualizarCategoria,
  excluirCategoria
} from '../models/categorias.model.js';

const router = express.Router();

router.use(autenticar);

function dadosValidos(nome, tipo) {
  return (
    typeof nome === 'string' &&
    nome.trim().length > 0 &&
    nome.trim().length <= 60 &&
    ['entrada', 'saida'].includes(tipo)
  );
}

router.post('/', async (req, res, next) => {
  const { nome, tipo } = req.body || {};

  if (!dadosValidos(nome, tipo)) {
    return res.status(400).json({
      message: 'Informe um nome válido e o tipo entrada ou saida.'
    });
  }

  try {
    const categoria = await criarCategoria(
      req.usuario.id,
      nome.trim(),
      tipo
    );

    return res.status(201).json(categoria);

  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'Essa categoria já está cadastrada.'
      });
    }

    next(erro);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const categorias = await listarCategorias(req.usuario.id);

    return res.status(200).json(categorias);

  } catch (erro) {
    next(erro);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  const { nome, tipo } = req.body || {};

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID da categoria inválido.'
    });
  }

  if (!dadosValidos(nome, tipo)) {
    return res.status(400).json({
      message: 'Informe um nome válido e o tipo entrada ou saida.'
    });
  }

  try {
    const categoria = await atualizarCategoria(
      id,
      req.usuario.id,
      nome.trim(),
      tipo
    );

    if (!categoria) {
      return res.status(404).json({
        message: 'Categoria não encontrada.'
      });
    }

    return res.status(200).json({
      message: 'Categoria atualizada com sucesso!',
      categoria
    });

  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'Já existe uma categoria com esse nome e tipo.'
      });
    }

    next(erro);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID da categoria inválido.'
    });
  }

  try {
    const categoria = await excluirCategoria(
      id,
      req.usuario.id
    );

    if (!categoria) {
      return res.status(404).json({
        message: 'Categoria não encontrada.'
      });
    }

    return res.status(200).json({
      message: 'Categoria excluída com sucesso!',
      categoria
    });

  } catch (erro) {
    if (erro.code === '23503') {
      return res.status(409).json({
        message: 'Não é possível excluir uma categoria que possui lançamentos.'
      });
    }

    next(erro);
  }
});

export default router;
