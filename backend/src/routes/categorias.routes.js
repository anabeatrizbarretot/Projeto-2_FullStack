
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

function erroValidacao() {
  return {
    erro: 'Informe um nome válido e o tipo entrada ou saida.',
    campos: {
      nome: 'O nome deve conter de 1 a 60 caracteres.',
      tipo: 'O tipo deve ser entrada ou saida.'
    }
  };
}

router.post('/', async (req, res, next) => {
  const { nome, tipo } = req.body || {};

  if (!dadosValidos(nome, tipo)) {
    return res.status(400).json(erroValidacao());
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
        erro: 'Essa categoria já está cadastrada.',
        campos: {
          nome: 'Já existe uma categoria com esse nome e tipo.'
        }
      });
    }

    next(erro);
  }
});


router.get('/', async (req, res, next) => {
  try {
    const categorias = await listarCategorias(
      req.usuario.id
    );

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
      erro: 'ID da categoria inválido.'
    });
  }

  if (!dadosValidos(nome, tipo)) {
    return res.status(400).json(erroValidacao());
  }

  try {
    const categoria = await atualizarCategoria(
      id,
      req.usuario.id,
      nome.trim(),
      tipo
    );

    if (categoria?.alteracaoTipoBloqueada === true) {
      return res.status(409).json({
        erro: 'Não é possível alterar o tipo de uma categoria que possui lançamentos vinculados.'
      });
    }

    if (!categoria) {
      return res.status(404).json({
        erro: 'Categoria não encontrada.'
      });
    }

    return res.status(200).json({
      message: 'Categoria atualizada com sucesso!',
      categoria
    });

  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({
        erro: 'Já existe uma categoria com esse nome e tipo.',
        campos: {
          nome: 'Escolha outro nome para essa categoria.'
        }
      });
    }

    next(erro);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      erro: 'ID da categoria inválido.'
    });
  }

  try {
    const categoria = await excluirCategoria(
      id,
      req.usuario.id
    );

    if (!categoria) {
      return res.status(404).json({
        erro: 'Categoria não encontrada.'
      });
    }

    return res.status(200).json({
      message: 'Categoria excluída com sucesso!',
      categoria
    });

  } catch (erro) {
    if (erro.code === '23503') {
      return res.status(409).json({
        erro: 'Não é possível excluir uma categoria que possui lançamentos.'
      });
    }

    next(erro);
  }
});

export default router;
