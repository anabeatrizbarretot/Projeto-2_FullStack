
import express from 'express';
import autenticar from '../middlewares/auth.middleware.js';
import { buscarDadosFaturas } from '../models/faturas.model.js';
import { calcularFatura } from '../models/calcularFatura.js';

const router = express.Router();

router.use(autenticar);

function formatarData(ano, mes, dia) {
  const primeiro = new Date(
    Date.UTC(ano, mes - 1, 1)
  );

  const anoAjustado = primeiro.getUTCFullYear();
  const mesAjustado = primeiro.getUTCMonth() + 1;

  const ultimoDia = new Date(
    Date.UTC(anoAjustado, mesAjustado, 0)
  ).getUTCDate();

  const diaAjustado = Math.min(dia, ultimoDia);

  return (
    `${String(anoAjustado).padStart(4, '0')}-` +
    `${String(mesAjustado).padStart(2, '0')}-` +
    `${String(diaAjustado).padStart(2, '0')}`
  );
}

function detalhesFechamento(cartao, ano, mes) {
  const fechamento = formatarData(
    ano,
    mes,
    cartao.diaFechamento
  );

  const mesVencimento =
    cartao.diaVencimento > cartao.diaFechamento
      ? mes
      : mes + 1;

  const vencimento = formatarData(
    ano,
    mesVencimento,
    cartao.diaVencimento
  );

  return {
    referencia: vencimento.slice(0, 7),
    fechamento,
    vencimento
  };
}

router.get('/faturas', async (req, res, next) => {
  const meses = req.query.meses === undefined
    ? 3
    : Number(req.query.meses);

  if (
    !Number.isInteger(meses) ||
    meses < 1 ||
    meses > 12
  ) {
    return res.status(400).json({
      erro: 'Informe de 1 a 12 meses futuros.',
      campos: {
        meses: 'Informe um número inteiro entre 1 e 12.'
      }
    });
  }

  try {

    const {
      cartoes,
      lancamentos,
      hoje
    } = await buscarDadosFaturas(req.usuario.id);

    const anoAtual = Number(hoje.slice(0, 4));
    const mesAtual = Number(hoje.slice(5, 7));

    const resposta = cartoes.map(cartao => {

      const fechamentoDesteMes = formatarData(
        anoAtual,
        mesAtual,
        cartao.diaFechamento
      );

      const deslocamento =
        fechamentoDesteMes <= hoje ? 1 : 0;

      const faturas = [];
      const porReferencia = new Map();

      for (let i = 0; i <= meses; i++) {
        const dataMes = new Date(
          Date.UTC(
            anoAtual,
            mesAtual - 1 + deslocamento + i,
            1
          )
        );

        const fatura = {
          ...detalhesFechamento(
            cartao,
            dataMes.getUTCFullYear(),
            dataMes.getUTCMonth() + 1
          ),
          totalCentavos: 0,
          lancamentos: []
        };

        faturas.push(fatura);

        porReferencia.set(
          fatura.referencia,
          fatura
        );
      }

      let utilizadoCentavos = 0;

      for (const lancamento of lancamentos) {
        if (lancamento.cartaoId !== cartao.id) {
          continue;
        }

        const dataOriginal =
          lancamento.dataCompra || lancamento.data;

        const numeroParcela = lancamento.dataCompra
          ? lancamento.parcelaAtual
          : 1;

        const faturaCalculada = calcularFatura(
          dataOriginal,
          cartao,
          numeroParcela
        );

        const centavos = Math.round(
          Number(lancamento.valor) * 100
        );

        if (faturaCalculada.vencimento >= hoje) {
          utilizadoCentavos += centavos;
        }

        const faturaDestino = porReferencia.get(
          faturaCalculada.referencia
        );

        if (!faturaDestino) {
          continue;
        }

        faturaDestino.totalCentavos += centavos;

        faturaDestino.lancamentos.push({
          id: lancamento.id,
          descricao: lancamento.descricao,
          valor: centavos / 100,
          parcelaAtual: lancamento.parcelaAtual,
          totalParcelas: lancamento.totalParcelas
        });
      }

      const limite = Number(cartao.limite);

      const limiteUtilizado =
        utilizadoCentavos / 100;

      const limiteDisponivel = Number(
        (limite - limiteUtilizado).toFixed(2)
      );

      return {
        cartaoId: cartao.id,
        nome: cartao.nome,
        limite,
        limiteUtilizado,
        limiteDisponivel,
        faturas: faturas.map(
          ({ totalCentavos, ...fatura }) => ({
            ...fatura,
            total: totalCentavos / 100
          })
        )
      };
    });

    return res.status(200).json(resposta);

  } catch (erro) {
    next(erro);
  }
});

export default router;
