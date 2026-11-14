
import express from 'express';
import pool from '../config/database.js';
import autenticar from '../middlewares/auth.middleware.js';
import { calcularFatura } from '../utils/calcularFatura.js';

const router = express.Router();

router.use(autenticar);

router.get('/faturas', async (req, res) => {
  const meses = req.query.meses === undefined
    ? 3
    : Number(req.query.meses);

  if (
    !Number.isInteger(meses) ||
    meses < 1 ||
    meses > 12
  ) {
    return res.status(400).json({
      message: 'Informe de 1 a 12 faturas.'
    });
  }

  try {
    const usuarioId = req.usuario.id;

    const [cartoesResultado, lancamentosResultado, dataResultado] =
      await Promise.all([
        pool.query(
          `SELECT id, nome, limite,
                  dia_fechamento AS "diaFechamento",
                  dia_vencimento AS "diaVencimento"
           FROM fontes_destinos
           WHERE usuario_id = $1
             AND tipo = 'cartao_credito'
           ORDER BY nome`,
          [usuarioId]
        ),

        pool.query(
          `SELECT
             l.id,
             l.fonte_destino_id AS "cartaoId",
             l.descricao,
             l.valor,
             l.parcela_atual AS "parcelaAtual",
             l.total_parcelas AS "totalParcelas",
             l.grupo_parcelamento AS "grupoParcelamento",
             TO_CHAR(l.data, 'YYYY-MM-DD') AS data
           FROM lancamentos l
           JOIN fontes_destinos f
             ON f.id = l.fonte_destino_id
           WHERE l.usuario_id = $1
             AND f.usuario_id = $1
             AND f.tipo = 'cartao_credito'
             AND l.tipo = 'saida'
           ORDER BY l.data, l.id`,
          [usuarioId]
        ),

        pool.query(
          `SELECT TO_CHAR(
             CURRENT_DATE, 'YYYY-MM-DD'
           ) AS hoje`
        )
      ]);

    const hoje = dataResultado.rows[0].hoje;

      
    const datasOriginais = new Map();

    for (const lancamento of lancamentosResultado.rows) {
    if (
        lancamento.grupoParcelamento &&
        lancamento.parcelaAtual === 1
    ) {
        datasOriginais.set(
        lancamento.grupoParcelamento,
        lancamento.data
        );
    }
    }


    const resultado = cartoesResultado.rows.map(cartao => {
      const agrupadas = new Map();
      let utilizadoCentavos = 0;

      for (const lancamento of lancamentosResultado.rows) {
        if (lancamento.cartaoId !== cartao.id) {
          continue;
        }

        
    const dataOriginal = lancamento.grupoParcelamento
        ? datasOriginais.get(lancamento.grupoParcelamento)
        : null;

    const fatura = calcularFatura(
        dataOriginal ?? lancamento.data,
        cartao,
        dataOriginal ? lancamento.parcelaAtual : 1
    );


        if (fatura.vencimento < hoje) {
          continue;
        }

        const centavos = Math.round(
          Number(lancamento.valor) * 100
        );

        utilizadoCentavos += centavos;

        if (!agrupadas.has(fatura.referencia)) {
          agrupadas.set(fatura.referencia, {
            referencia: fatura.referencia,
            fechamento: fatura.fechamento,
            vencimento: fatura.vencimento,
            totalCentavos: 0,
            lancamentos: []
          });
        }

        const grupo = agrupadas.get(fatura.referencia);

        grupo.totalCentavos += centavos;

        grupo.lancamentos.push({
          id: lancamento.id,
          descricao: lancamento.descricao,
          valor: Number(lancamento.valor),
          parcelaAtual: lancamento.parcelaAtual,
          totalParcelas: lancamento.totalParcelas
        });
      }

      const faturas = Array.from(agrupadas.values())
        .sort((a, b) =>
          a.vencimento.localeCompare(b.vencimento)
        )
        .slice(0, meses)
        .map(fatura => ({
          referencia: fatura.referencia,
          fechamento: fatura.fechamento,
          vencimento: fatura.vencimento,
          total: fatura.totalCentavos / 100,
          lancamentos: fatura.lancamentos
        }));

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
        faturas
      };
    });

    return res.status(200).json(resultado);

  } catch (erro) {
    console.error('Erro ao consultar faturas:', erro);

    return res.status(500).json({
      message: 'Erro interno ao consultar faturas.'
    });
  }
});

export default router;
