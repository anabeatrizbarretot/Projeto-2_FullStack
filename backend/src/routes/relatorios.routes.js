
import express from 'express';
import autenticar from '../middlewares/auth.middleware.js';
import { buscarDadosFaturas } from '../models/faturas.model.js';
import { calcularFatura } from '../utils/calcularFatura.js';

const router = express.Router();

router.use(autenticar);

function formatarData(ano, mes, dia) {
  const inicio = new Date(Date.UTC(ano, mes - 1, 1));
  const a = inicio.getUTCFullYear();
  const m = inicio.getUTCMonth() + 1;
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();

  return `${a}-${String(m).padStart(2, '0')}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
}

function detalhesMes(cartao, ano, mes) {
  const vencimento = formatarData(
    ano, mes, cartao.diaVencimento
  );

  const mesFechamento =
    cartao.diaVencimento > cartao.diaFechamento
      ? mes
      : mes - 1;

  const fechamento = formatarData(
    ano, mesFechamento, cartao.diaFechamento
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
      message: 'Informe de 1 a 12 meses futuros.'
    });
  }

  try {
    const { cartoes, lancamentos, hoje } =
      await buscarDadosFaturas(req.usuario.id);

    const anoAtual = Number(hoje.slice(0, 4));
    const mesAtual = Number(hoje.slice(5, 7));

    const resposta = cartoes.map(cartao => {
      const primeiroVencimento = detalhesMes(
        cartao, anoAtual, mesAtual
      ).vencimento;

      const deslocamento =
        primeiroVencimento < hoje ? 1 : 0;

      const faturas = [];
      const porReferencia = new Map();

      for (let i = 0; i <= meses; i++) {
        const inicio = new Date(
          Date.UTC(
            anoAtual,
            mesAtual - 1 + deslocamento + i,
            1
          )
        );

        const fatura = {
          ...detalhesMes(
            cartao,
            inicio.getUTCFullYear(),
            inicio.getUTCMonth() + 1
          ),
          totalCentavos: 0,
          lancamentos: []
        };

        faturas.push(fatura);
        porReferencia.set(fatura.referencia, fatura);
      }

      let utilizadoCentavos = 0;

      for (const lancamento of lancamentos) {
        if (lancamento.cartaoId !== cartao.id) {
          continue;
        }

        const compra =
          lancamento.dataCompra || lancamento.data;

        const parcela = lancamento.dataCompra
          ? lancamento.parcelaAtual
          : 1;

        const fatura = calcularFatura(
          compra,
          cartao,
          parcela
        );

        const centavos = Math.round(
          Number(lancamento.valor) * 100
        );

        if (fatura.vencimento >= hoje) {
          utilizadoCentavos += centavos;
        }

        const destino = porReferencia.get(
          fatura.referencia
        );

        if (!destino) {
          continue;
        }

        destino.totalCentavos += centavos;

        destino.lancamentos.push({
          id: lancamento.id,
          descricao: lancamento.descricao,
          valor: centavos / 100,
          parcelaAtual: lancamento.parcelaAtual,
          totalParcelas: lancamento.totalParcelas
        });
      }

      const limite = Number(cartao.limite);
      const limiteUtilizado = utilizadoCentavos / 100;

      return {
        cartaoId: cartao.id,
        nome: cartao.nome,
        limite,
        limiteUtilizado,
        limiteDisponivel: Number(
          (limite - limiteUtilizado).toFixed(2)
        ),
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
