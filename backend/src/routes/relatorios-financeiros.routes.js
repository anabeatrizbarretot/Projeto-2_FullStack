
import express from 'express';
import pool from '../config/database.js';
import autenticar from '../middlewares/auth.middleware.js';

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

  const formatar = (ms) =>
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

router.get('/categorias', async (req, res) => {
  const periodo = obterPeriodo(req);

  if (!periodo) {
    return res.status(400).json({
      message: 'Informe inicio e fim válidos (AAAA-MM-DD).'
    });
  }

  try {
    const consulta = await pool.query(
      `SELECT
         c.id,
         c.nome,
         c.tipo,
         COALESCE(
           SUM(l.valor) FILTER (
             WHERE l.data BETWEEN $2::date AND $3::date
           ), 0
         ) AS total,
         COALESCE(
           SUM(l.valor) FILTER (
             WHERE l.data BETWEEN $4::date AND $5::date
           ), 0
         ) AS "periodoAnterior"
       FROM categorias c
       LEFT JOIN lancamentos l
         ON l.categoria_id = c.id
         AND l.usuario_id = $1
         AND l.data BETWEEN $4::date AND $3::date
       WHERE c.usuario_id = $1
       GROUP BY c.id, c.nome, c.tipo
       HAVING COUNT(l.id) FILTER (
         WHERE l.data BETWEEN $2::date AND $3::date
       ) > 0
       ORDER BY total DESC, c.nome ASC`,
      [
        req.usuario.id,
        periodo.inicio,
        periodo.fim,
        periodo.anteriorInicio,
        periodo.anteriorFim
      ]
    );

    const linhas = consulta.rows.map(item => ({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
      total: Number(item.total),
      periodoAnterior: Number(item.periodoAnterior)
    }));

    const totalSaidas = linhas
      .filter(x => x.tipo === 'saida')
      .reduce((a, x) => a + x.total, 0);

    const totalEntradas = linhas
      .filter(x => x.tipo === 'entrada')
      .reduce((a, x) => a + x.total, 0);

    const adicionarPercentual = (itens, total) =>
      itens.map(x => ({
        id: x.id,
        nome: x.nome,
        total: x.total,
        percentual: total > 0
          ? Number((100 * x.total / total).toFixed(2))
          : 0,
        periodoAnterior: x.periodoAnterior
      }));

    return res.json({
      periodo: {
        inicio: periodo.inicio,
        fim: periodo.fim
      },
      periodoAnterior: {
        inicio: periodo.anteriorInicio,
        fim: periodo.anteriorFim
      },
      totalSaidas: Number(totalSaidas.toFixed(2)),
      totalEntradas: Number(totalEntradas.toFixed(2)),
      categorias: adicionarPercentual(
        linhas.filter(x => x.tipo === 'saida'),
        totalSaidas
      ),
      entradas: adicionarPercentual(
        linhas.filter(x => x.tipo === 'entrada'),
        totalEntradas
      )
    });

  } catch (erro) {
    console.error('Erro no relatório de categorias:', erro);

    return res.status(500).json({
      message: 'Erro interno ao consultar categorias.'
    });
  }
});

router.get('/fontes-destinos', async (req, res) => {
  const periodo = obterPeriodo(req);

  if (!periodo) {
    return res.status(400).json({
      message: 'Informe inicio e fim válidos (AAAA-MM-DD).'
    });
  }

  try {
    const consulta = await pool.query(
      `SELECT
         f.id,
         f.nome,
         f.tipo,
         COALESCE(
           SUM(l.valor) FILTER (
             WHERE l.tipo = 'entrada'
           ), 0
         ) AS entradas,
         COALESCE(
           SUM(l.valor) FILTER (
             WHERE l.tipo = 'saida'
           ), 0
         ) AS saidas
       FROM fontes_destinos f
       JOIN lancamentos l
         ON l.fonte_destino_id = f.id
         AND l.usuario_id = $1
         AND l.data BETWEEN $2::date AND $3::date
       WHERE f.usuario_id = $1
       GROUP BY f.id, f.nome, f.tipo
       ORDER BY f.nome ASC`,
      [
        req.usuario.id,
        periodo.inicio,
        periodo.fim
      ]
    );

    const resultado = consulta.rows.map(item => {
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

    return res.json(resultado);

  } catch (erro) {
    console.error('Erro no relatório de fontes/destinos:', erro);

    return res.status(500).json({
      message: 'Erro interno ao consultar fontes e destinos.'
    });
  }
});

export default router;
