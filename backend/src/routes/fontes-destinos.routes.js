
import express from 'express';
import autenticar from '../middlewares/auth.middleware.js';

import {
  criarFonteDestino,
  listarFontesDestinos,
  atualizarFonteDestino,
  excluirFonteDestino
} from '../models/fontes-destinos.model.js';

const router = express.Router();

router.use(autenticar);

function validarDados(corpo) {
  const {
    nome,
    tipo,
    diaFechamento,
    diaVencimento,
    limite
  } = corpo;

  if (
    typeof nome !== 'string' ||
    !nome.trim() ||
    nome.trim().length > 60 ||
    !['renda', 'conta', 'cartao_credito'].includes(tipo)
  ) {
    return {
      erro: 'Informe um nome e um tipo válido.'
    };
  }

  const cartao = tipo === 'cartao_credito';

  if (cartao) {
    const diaValido = (dia) =>
      Number.isInteger(dia) &&
      dia >= 1 &&
      dia <= 31;

    const limiteValido =
      typeof limite === 'number' &&
      Number.isFinite(limite) &&
      limite > 0 &&
      limite <= 9999999999.99 &&
      Math.abs(
        limite * 100 - Math.round(limite * 100)
      ) < 0.000001;

    if (
      !diaValido(diaFechamento) ||
      !diaValido(diaVencimento) ||
      !limiteValido
    ) {
      return {
        erro: 'Informe dias de fechamento e vencimento de 1 a 31 e um limite válido.'
      };
    }
  }

  return {
    dados: {
      nome: nome.trim(),
      tipo,
      diaFechamento: cartao ? diaFechamento : null,
      diaVencimento: cartao ? diaVencimento : null,
      limite: cartao ? limite : null
    }
  };
}

function formatarFonte(fonte) {
  return {
    ...fonte,
    limite: fonte.limite === null
      ? null
      : Number(fonte.limite)
  };
}

router.post('/', async (req, res, next) => {
  const validacao = validarDados(req.body || {});

  if (validacao.erro) {
    return res.status(400).json({
      message: validacao.erro
    });
  }

  try {
    const fonte = await criarFonteDestino(
      req.usuario.id,
      validacao.dados
    );

    return res.status(201).json(
      formatarFonte(fonte)
    );

  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'Já existe uma fonte ou destino com esse nome.'
      });
    }

    next(erro);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const fontes = await listarFontesDestinos(
      req.usuario.id
    );

    return res.status(200).json(
      fontes.map(formatarFonte)
    );

  } catch (erro) {
    next(erro);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID inválido.'
    });
  }

  const validacao = validarDados(req.body || {});

  if (validacao.erro) {
    return res.status(400).json({
      message: validacao.erro
    });
  }

  try {
    const fonte = await atualizarFonteDestino(
      id,
      req.usuario.id,
      validacao.dados
    );

    if (!fonte) {
      return res.status(404).json({
        message: 'Fonte ou destino não encontrado.'
      });
    }

    return res.status(200).json({
      message: 'Fonte ou destino atualizado com sucesso!',
      fonteDestino: formatarFonte(fonte)
    });

  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'Já existe uma fonte ou destino com esse nome.'
      });
    }

    next(erro);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID inválido.'
    });
  }

  try {
    const fonte = await excluirFonteDestino(
      id,
      req.usuario.id
    );

    if (!fonte) {
      return res.status(404).json({
        message: 'Fonte ou destino não encontrado.'
      });
    }

    return res.status(200).json({
      message: 'Fonte ou destino excluído com sucesso!',
      fonteDestino: fonte
    });

  } catch (erro) {
    if (erro.code === '23503') {
      return res.status(409).json({
        message: 'Não é possível excluir uma conta ou fonte que possui lançamentos financeiros.'
      });
    }

    next(erro);
  }
});

export default router;
