
import express from 'express';
import autenticar from '../middlewares/auth.middleware.js';

import {
  adicionarMeses,
  buscarLancamentoPorId,
  listarLancamentos,
  criarLancamentos,
  atualizarLancamento,
  excluirLancamentos
} from '../models/lancamentos.model.js';

const router = express.Router();

router.use(autenticar);

function idValido(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function dataValida(data) {
  if (
    typeof data !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return false;
  }

  const [ano, mes, dia] = data.split('-').map(Number);

  if (ano < 100 || ano > 9999) {
    return false;
  }

  const d = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    d.getUTCFullYear() === ano &&
    d.getUTCMonth() + 1 === mes &&
    d.getUTCDate() === dia
  );
}

function valorEmCentavos(valor) {
  if (
    typeof valor !== 'number' ||
    !Number.isFinite(valor)
  ) {
    return null;
  }

  const centavos = Math.round(valor * 100);

  if (
    !Number.isSafeInteger(centavos) ||
    centavos < 1 ||
    centavos > 999999999999
  ) {
    return null;
  }

  return Math.abs(valor * 100 - centavos) <= 0.000001
    ? centavos
    : null;
}

function validarDados(corpo) {
  const {
    tipo,
    descricao,
    valor,
    data,
    categoriaId,
    fonteDestinoId
  } = corpo;

  const centavos = valorEmCentavos(valor);

  if (
    !['entrada', 'saida'].includes(tipo) ||
    typeof descricao !== 'string' ||
    !descricao.trim() ||
    descricao.trim().length > 120 ||
    !dataValida(data) ||
    !idValido(categoriaId) ||
    !idValido(fonteDestinoId) ||
    centavos === null
  ) {
    return {
      erro: 'Preencha os dados do lançamento corretamente.',
      campos: {
        tipo: 'Informe entrada ou saida.',
        descricao: 'Informe uma descrição de 1 a 120 caracteres.',
        valor: 'Informe um valor positivo com até duas casas decimais.',
        data: 'Informe uma data válida no formato AAAA-MM-DD.',
        categoriaId: 'Informe uma categoria válida.',
        fonteDestinoId: 'Informe uma fonte ou destino válido.'
      }
    };
  }

  return { centavos };
}

router.post('/', async (req, res, next) => {
  const corpo = req.body || {};

  const validacao = validarDados(corpo);

  if (validacao.erro) {
    return res.status(400).json({
      erro: validacao.erro,
      campos: validacao.campos
    });
  }

  const parcelas = corpo.totalParcelas === undefined
    ? 1
    : corpo.totalParcelas;

  if (
    !Number.isInteger(parcelas) ||
    parcelas < 1 ||
    parcelas > 48
  ) {
    return res.status(400).json({
      erro: 'Total de parcelas deve ser um número de 1 a 48.',
      campos: {
        totalParcelas: 'Informe um número inteiro entre 1 e 48.'
      }
    });
  }

  if (validacao.centavos < parcelas) {
    return res.status(400).json({
      erro: 'O valor é insuficiente para gerar parcelas positivas.',
      campos: {
        valor: 'O valor total deve permitir parcelas de pelo menos R$ 0,01.'
      }
    });
  }

  if (!dataValida(adicionarMeses(corpo.data, parcelas - 1))) {
    return res.status(400).json({
      erro: 'Data das parcelas fora do intervalo permitido.',
      campos: {
        data: 'Informe uma data que permita gerar todas as parcelas.'
      }
    });
  }

  try {
    const resultado = await criarLancamentos(
      req.usuario.id,
      corpo,
      validacao.centavos,
      parcelas
    );

    if (resultado.erro) {
      return res.status(400).json({
        erro: resultado.erro
      });
    }

    if (parcelas === 1) {
      return res.status(201).json({
        message: 'Lançamento cadastrado com sucesso!',
        lancamento: resultado.lancamentos[0]
      });
    }

    return res.status(201).json({
      message: 'Parcelas cadastradas com sucesso!',
      lancamentos: resultado.lancamentos
    });

  } catch (erro) {
    next(erro);
  }
});

router.get('/', async (req, res, next) => {
  const agora = new Date();

  const ano = agora.getFullYear();

  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, '0');

  const ultimo = new Date(
    ano,
    agora.getMonth() + 1,
    0
  ).getDate();

  const inicio = req.query.inicio === undefined
    ? `${ano}-${mes}-01`
    : req.query.inicio;

  const fim = req.query.fim === undefined
    ? `${ano}-${mes}-${ultimo}`
    : req.query.fim;

  const {
    tipo,
    categoriaId,
    fonteDestinoId
  } = req.query;

  const pagina = req.query.pagina === undefined
    ? 1
    : Number(req.query.pagina);

  const porPagina = 10;

  if (
    !dataValida(inicio) ||
    !dataValida(fim) ||
    inicio > fim ||
    (
      tipo !== undefined &&
      !['entrada', 'saida'].includes(tipo)
    ) ||
    (
      categoriaId !== undefined &&
      !idValido(Number(categoriaId))
    ) ||
    (
      fonteDestinoId !== undefined &&
      !idValido(Number(fonteDestinoId))
    ) ||
    !idValido(pagina)
  ) {
    return res.status(400).json({
      erro: 'Filtros inválidos.'
    });
  }

  try {
    const resultado = await listarLancamentos(
      req.usuario.id,
      {
        inicio,
        fim,
        tipo,
        categoriaId: categoriaId === undefined
          ? undefined
          : Number(categoriaId),
        fonteDestinoId: fonteDestinoId === undefined
          ? undefined
          : Number(fonteDestinoId),
        pagina,
        porPagina
      }
    );

    return res.status(200).json(resultado);

  } catch (erro) {
    next(erro);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({
      erro: 'ID inválido.'
    });
  }

  try {
    const lancamento = await buscarLancamentoPorId(
      id,
      req.usuario.id
    );

    if (!lancamento) {
      return res.status(404).json({
        erro: 'Lançamento não encontrado.'
      });
    }

    return res.status(200).json(lancamento);

  } catch (erro) {
    next(erro);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id);

  const corpo = req.body || {};

  if (!idValido(id)) {
    return res.status(400).json({
      erro: 'ID inválido.'
    });
  }

  const validacao = validarDados(corpo);

  if (validacao.erro) {
    return res.status(400).json({
      erro: validacao.erro,
      campos: validacao.campos
    });
  }

  try {
    const resultado = await atualizarLancamento(
      id,
      req.usuario.id,
      corpo,
      validacao.centavos
    );

    if (resultado.naoEncontrado) {
      return res.status(404).json({
        erro: 'Lançamento não encontrado.'
      });
    }

    if (resultado.erro) {
      return res.status(resultado.status || 400).json({
        erro: resultado.erro
      });
    }

    return res.status(200).json({
      message: 'Lançamento atualizado com sucesso!',
      lancamento: resultado.lancamento
    });

  } catch (erro) {
    next(erro);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({
      erro: 'ID inválido.'
    });
  }

  if (
    req.query.todasParcelas !== undefined &&
    !['true', 'false'].includes(req.query.todasParcelas)
  ) {
    return res.status(400).json({
      erro: 'Parâmetro todasParcelas inválido.'
    });
  }

  try {
    const resultado = await excluirLancamentos(
      id,
      req.usuario.id,
      req.query.todasParcelas === 'true'
    );

    if (!resultado) {
      return res.status(404).json({
        erro: 'Lançamento não encontrado.'
      });
    }

    return res.status(200).json({
      message: 'Lançamento(s) excluído(s) com sucesso!',
      quantidade: resultado.quantidade
    });

  } catch (erro) {
    next(erro);
  }
});

export default router;
