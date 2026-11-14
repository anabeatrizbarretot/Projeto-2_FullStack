
import express from 'express';
import autenticar from '../middlewares/auth.middleware.js';

import {
  consultarCategoriasPorPeriodo,
  consultarFontesDestinosPorPeriodo
} from '../models/relatorios-financeiros.model.js';

const router = express.Router();

router.use(autenticar);

function dataValida(data) {
  if (
    typeof data !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return false;
  }

  const [ano, mes, dia] = data.split('-').map(Number);

  if (ano < 1000 || ano > 9999) {
    return false;
  }

  const d = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    d.getUTCFullYear() === ano &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia
  );
}

function obterPeriodo(req) {
  const { inicio, fim } = req.query;

  if (
    !dataValida(inicio) ||
    !dataValida(fim) ||
    inicio > fim
  ) {
    return null;
  }

  const [anoI, mesI, diaI] = inicio.split('-').map(Number);
  const [anoF, mesF, diaF] = fim.split('-').map(Number);

  const dataI = Date.UTC(anoI, mesI - 1, diaI);
  const dataF = Date.UTC(anoF, mesF - 1, diaF);

  const dias = Math.round(
    (dataF - dataI) / 86400000
  ) + 1;

  const formatar = ms =>
    new Date(ms).toISOString().slice(0, 10);

  const anteriorInicio = formatar(
    dataI - dias * 86400000
  );

  const anteriorFim = formatar(
    dataI - 86400000
  );

  if (
    !dataValida(anteriorInicio) ||
    !dataValida(anteriorFim)
  ) {
    return null;
  }

  return {
    inicio,
    fim,
    anteriorInicio,
    anteriorFim
  };
}

// RELATÓRIO POR CATEGORIAS

router.get('/categorias', async (req, res, next) => {
  const periodo = obterPeriodo(req);

  if (!periodo) {
    return res.status(400).json({
      message: 'Informe inicio e fim válidos (AAAA-MM-DD).'
    });
  }

  try {
    const dados = await consultarCategoriasPorPeriodo(
      req.usuario.id,
      periodo
    );

    const linhas = dados.map(item => ({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
      total: Number(item.total),
      periodoAnterior: Number(item.periodoAnterior)
    }));

    const totalSaidas = linhas
      .filter(item => item.tipo === 'saida')
      .reduce(
        (soma, item) => soma + item.total,
        0
      );

    const totalEntradas = linhas
      .filter(item => item.tipo === 'entrada')
      .reduce(
        (soma, item) => soma + item.total,
        0
      );

    const adicionarPercentual = (itens, total) =>
      itens.map(item => ({
        id: item.id,
        nome: item.nome,
        total: item.total,
        percentual: total > 0
          ? Number(
              (100 * item.total / total).toFixed(2)
            )
          : 0,
        periodoAnterior: item.periodoAnterior
      }));

    return res.status(200).json({
      periodo: {
        inicio: periodo.inicio,
        fim: periodo.fim
      },
      periodoAnterior: {
        inicio: periodo.anteriorInicio,
        fim: periodo.anteriorFim
      },
      totalSaidas: Number(
        totalSaidas.toFixed(2)
      ),
      totalEntradas: Number(
        totalEntradas.toFixed(2)
      ),
      categorias: adicionarPercentual(
        linhas.filter(item => item.tipo === 'saida'),
        totalSaidas
      ),
      entradas: adicionarPercentual(
        linhas.filter(item => item.tipo === 'entrada'),
        totalEntradas
      )
    });

  } catch (erro) {
    next(erro);
  }
});

// RELATÓRIO POR FONTES E DESTINOS

router.get('/fontes-destinos', async (req, res, next) => {
  const periodo = obterPeriodo(req);

  if (!periodo) {
    return res.status(400).json({
      message: 'Informe inicio e fim válidos (AAAA-MM-DD).'
    });
  }

  try {
    const dados = await consultarFontesDestinosPorPeriodo(
      req.usuario.id,
      periodo
    );

    const resultado = dados.map(item => {
      const entradas = Number(item.entradas);
      const saidas = Number(item.saidas);

      return {
        id: item.id,
        nome: item.nome,
        tipo: item.tipo,
        entradas,
        saidas,
        saldo: Number(
          (entradas - saidas).toFixed(2)
        )
      };
    });

    return res.status(200).json(resultado);

  } catch (erro) {
    next(erro);
  }
});

export default router;
