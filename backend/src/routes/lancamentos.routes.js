
import express from 'express';
import { randomUUID } from 'node:crypto';
import pool from '../config/database.js';
import autenticar from '../middlewares/auth.middleware.js';

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

  if (Math.abs(valor * 100 - centavos) > 0.000001) {
    return null;
  }

  return centavos;
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
      erro: 'Preencha tipo, descrição, valor positivo, data, categoria e fonte/destino corretamente.'
    };
  }

  return { centavos };
}

function adicionarMeses(data, quantidade) {
  const [ano, mes, dia] = data.split('-').map(Number);

  const primeiroDia = new Date(
    Date.UTC(ano, mes - 1 + quantidade, 1)
  );

  const a = primeiroDia.getUTCFullYear();
  const m = primeiroDia.getUTCMonth() + 1;

  const ultimoDia = new Date(
    Date.UTC(a, m, 0)
  ).getUTCDate();

  return (
    `${String(a).padStart(4, '0')}-` +
    `${String(m).padStart(2, '0')}-` +
    `${String(Math.min(dia, ultimoDia)).padStart(2, '0')}`
  );
}

async function verificarVinculos(
  conexao,
  usuarioId,
  categoriaId,
  fonteDestinoId,
  tipo
) {
  const resultado = await conexao.query(
    `SELECT
       c.tipo AS categoria_tipo,
       f.tipo AS fonte_tipo
     FROM categorias c
     JOIN fontes_destinos f
       ON f.id = $2 AND f.usuario_id = $3
     WHERE c.id = $1 AND c.usuario_id = $3`,
    [categoriaId, fonteDestinoId, usuarioId]
  );

  if (!resultado.rows.length) {
    return 'Categoria ou fonte/destino não pertence ao usuário.';
  }

  if (resultado.rows[0].categoria_tipo !== tipo) {
    return 'A categoria deve ser do mesmo tipo do lançamento.';
  }

  return {
    fonteTipo: resultado.rows[0].fonte_tipo
  };
}

const camposRetorno = `
  id,
  tipo,
  descricao,
  valor,
  TO_CHAR(data, 'YYYY-MM-DD') AS data,
  categoria_id AS "categoriaId",
  fonte_destino_id AS "fonteDestinoId",
  parcela_atual AS "parcelaAtual",
  total_parcelas AS "totalParcelas",
  grupo_parcelamento AS "grupoParcelamento"
  TO_CHAR(data_compra, 'YYYY-MM-DD') AS "dataCompra"
`;

const camposListagem = `
  l.id,
  l.tipo,
  l.descricao,
  l.valor,
  TO_CHAR(l.data, 'YYYY-MM-DD') AS data,
  l.parcela_atual AS "parcelaAtual",
  l.total_parcelas AS "totalParcelas",
  l.grupo_parcelamento AS "grupoParcelamento",
  TO_CHAR(l.data_compra, 'YYYY-MM-DD') AS "dataCompra",
  json_build_object(
    'id', c.id,
    'nome', c.nome,
    'tipo', c.tipo
  ) AS categoria,
  json_build_object(
    'id', f.id,
    'nome', f.nome,
    'tipo', f.tipo
  ) AS "fonteDestino"
`;

function formatar(row) {
  return {
    ...row,
    valor: Number(row.valor)
  };
}

router.post('/', async (req, res) => {
  const corpo = req.body || {};
  const validacao = validarDados(corpo);

  if (validacao.erro) {
    return res.status(400).json({
      message: validacao.erro
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
      message: 'Total de parcelas deve ser um número de 1 a 48.'
    });
  }

  if (validacao.centavos < parcelas) {
    return res.status(400).json({
      message: 'O valor é insuficiente para gerar parcelas positivas.'
    });
  }

  if (!dataValida(adicionarMeses(corpo.data, parcelas - 1))) {
    return res.status(400).json({
      message: 'Data das parcelas fora do intervalo permitido.'
    });
  }

  const usuarioId = req.usuario.id;
  let client;

  try {
    client = await pool.connect();

    await client.query('BEGIN');

    const vinculos = await verificarVinculos(
      client,
      usuarioId,
      corpo.categoriaId,
      corpo.fonteDestinoId,
      corpo.tipo
    );

    if (typeof vinculos === 'string') {
      await client.query('ROLLBACK');

      return res.status(400).json({
        message: vinculos
      });
    }

    if (
      parcelas > 1 &&
      (
        corpo.tipo !== 'saida' ||
        vinculos.fonteTipo !== 'cartao_credito'
      )
    ) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        message: 'Parcelamento é permitido somente para saídas no cartão de crédito.'
      });
    }

    const grupo = parcelas > 1 ? randomUUID() : null;
    const base = Math.floor(validacao.centavos / parcelas);
    const sobra = validacao.centavos % parcelas;
    const lancamentos = [];

    for (let numero = 1; numero <= parcelas; numero++) {
      const centavosParcela = base + (
        numero === 1 ? sobra : 0
      );

      const dataParcela = adicionarMeses(
        corpo.data,
        numero - 1
      );

      const resultado = await client.query(
        `INSERT INTO lancamentos
         (
           usuario_id,
           tipo,
           descricao,
           valor,
           data,
           categoria_id,
           fonte_destino_id,
           parcela_atual,
           total_parcelas,
           grupo_parcelamento
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING ${camposRetorno}`,
        [
          usuarioId,
          corpo.tipo,
          corpo.descricao.trim(),
          (centavosParcela / 100).toFixed(2),
          dataParcela,
          corpo.categoriaId,
          corpo.fonteDestinoId,
          numero,
          parcelas,
          grupo
        ]
      );

      lancamentos.push(formatar(resultado.rows[0]));
    }

    await client.query('COMMIT');

    if (parcelas === 1) {
      return res.status(201).json({
        message: 'Lançamento cadastrado com sucesso!',
        lancamento: lancamentos[0]
      });
    }

    return res.status(201).json({
      message: 'Parcelas cadastradas com sucesso!',
      lancamentos
    });

  } catch (erro) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Erro ao cadastrar lançamento:', erro);

    return res.status(500).json({
      message: 'Erro interno ao cadastrar lançamento.'
    });

  } finally {
    if (client) {
      client.release();
    }
  }
});

router.get('/', async (req, res) => {
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
      message: 'Filtros inválidos.'
    });
  }

  const parametros = [
    req.usuario.id,
    inicio,
    fim
  ];

  const condicoes = [
    'l.usuario_id = $1',
    'l.data >= $2',
    'l.data <= $3'
  ];

  if (tipo !== undefined) {
    parametros.push(tipo);

    condicoes.push(
      `l.tipo = $${parametros.length}`
    );
  }

  if (categoriaId !== undefined) {
    parametros.push(Number(categoriaId));

    condicoes.push(
      `l.categoria_id = $${parametros.length}`
    );
  }

  if (fonteDestinoId !== undefined) {
    parametros.push(Number(fonteDestinoId));

    condicoes.push(
      `l.fonte_destino_id = $${parametros.length}`
    );
  }

  const where = condicoes.join(' AND ');

  try {
    const resumo = await pool.query(
      `SELECT
         COUNT(*)::integer AS total,
         COALESCE(
           SUM(
             CASE
               WHEN l.tipo = 'entrada'
               THEN l.valor
               ELSE 0
             END
           ), 0
         ) AS entradas,
         COALESCE(
           SUM(
             CASE
               WHEN l.tipo = 'saida'
               THEN l.valor
               ELSE 0
             END
           ), 0
         ) AS saidas
       FROM lancamentos l
       WHERE ${where}`,
      parametros
    );

    const {
      total,
      entradas,
      saidas
    } = resumo.rows[0];

    const resultado = await pool.query(
      `SELECT ${camposListagem}
       FROM lancamentos l
       JOIN categorias c
         ON c.id = l.categoria_id
       JOIN fontes_destinos f
         ON f.id = l.fonte_destino_id
       WHERE ${where}
       ORDER BY l.data DESC, l.id DESC
       LIMIT $${parametros.length + 1}
       OFFSET $${parametros.length + 2}`,
      [
        ...parametros,
        porPagina,
        (pagina - 1) * porPagina
      ]
    );

    return res.status(200).json({
      itens: resultado.rows.map(formatar),
      pagina,
      porPagina,
      total,
      totalPaginas: Math.max(
        1,
        Math.ceil(total / porPagina)
      ),
      totais: {
        entradas: Number(entradas),
        saidas: Number(saidas),
        saldo: Number(
          (
            Number(entradas) -
            Number(saidas)
          ).toFixed(2)
        )
      }
    });

  } catch (erro) {
    console.error('Erro ao listar lançamentos:', erro);

    return res.status(500).json({
      message: 'Erro interno ao listar lançamentos.'
    });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({
      message: 'ID inválido.'
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT ${camposListagem}
       FROM lancamentos l
       JOIN categorias c
         ON c.id = l.categoria_id
       JOIN fontes_destinos f
         ON f.id = l.fonte_destino_id
       WHERE l.id = $1 AND l.usuario_id = $2`,
      [id, req.usuario.id]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        message: 'Lançamento não encontrado.'
      });
    }

    return res.status(200).json(
      formatar(resultado.rows[0])
    );

  } catch (erro) {
    console.error('Erro ao buscar lançamento:', erro);

    return res.status(500).json({
      message: 'Erro interno ao buscar lançamento.'
    });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const corpo = req.body || {};

  if (!idValido(id)) {
    return res.status(400).json({
      message: 'ID inválido.'
    });
  }

  const validacao = validarDados(corpo);

  if (validacao.erro) {
    return res.status(400).json({
      message: validacao.erro
    });
  }

  try {
    const vinculos = await verificarVinculos(
      pool,
      req.usuario.id,
      corpo.categoriaId,
      corpo.fonteDestinoId,
      corpo.tipo
    );

    if (typeof vinculos === 'string') {
      return res.status(400).json({
        message: vinculos
      });
    }

    const resultado = await pool.query(
      `UPDATE lancamentos
       SET
         tipo = $1,
         descricao = $2,
         valor = $3,
         data = $4,
         categoria_id = $5,
         fonte_destino_id = $6
       WHERE id = $7 AND usuario_id = $8
       RETURNING ${camposRetorno}`,
      [
        corpo.tipo,
        corpo.descricao.trim(),
        (validacao.centavos / 100).toFixed(2),
        corpo.data,
        corpo.categoriaId,
        corpo.fonteDestinoId,
        id,
        req.usuario.id
      ]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        message: 'Lançamento não encontrado.'
      });
    }

    return res.status(200).json({
      message: 'Lançamento atualizado com sucesso!',
      lancamento: formatar(resultado.rows[0])
    });

  } catch (erro) {
    console.error('Erro ao atualizar lançamento:', erro);

    return res.status(500).json({
      message: 'Erro interno ao atualizar lançamento.'
    });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({
      message: 'ID inválido.'
    });
  }

  if (
    req.query.todasParcelas !== undefined &&
    !['true', 'false'].includes(req.query.todasParcelas)
  ) {
    return res.status(400).json({
      message: 'Parâmetro todasParcelas inválido.'
    });
  }

  const todasParcelas =
    req.query.todasParcelas === 'true';

  try {
    const consulta = await pool.query(
      `SELECT grupo_parcelamento
       FROM lancamentos
       WHERE id = $1 AND usuario_id = $2`,
      [id, req.usuario.id]
    );

    if (!consulta.rows.length) {
      return res.status(404).json({
        message: 'Lançamento não encontrado.'
      });
    }

    const grupo = consulta.rows[0].grupo_parcelamento;

    let resultado;

    if (todasParcelas && grupo) {
      resultado = await pool.query(
        `DELETE FROM lancamentos
         WHERE usuario_id = $1
         AND grupo_parcelamento = $2
         RETURNING id`,
        [req.usuario.id, grupo]
      );

    } else {
      resultado = await pool.query(
        `DELETE FROM lancamentos
         WHERE usuario_id = $1 AND id = $2
         RETURNING id`,
        [req.usuario.id, id]
      );
    }

    return res.status(200).json({
      message: 'Lançamento(s) excluído(s) com sucesso!',
      quantidade: resultado.rowCount
    });

  } catch (erro) {
    console.error('Erro ao excluir lançamento:', erro);

    return res.status(500).json({
      message: 'Erro interno ao excluir lançamento.'
    });
  }
});

export default router;
