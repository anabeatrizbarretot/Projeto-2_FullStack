
import { randomUUID } from 'node:crypto';
import pool from '../config/database.js';

const camposRetorno = `
  id, tipo, descricao, valor,
  TO_CHAR(data, 'YYYY-MM-DD') AS data,
  categoria_id AS "categoriaId",
  fonte_destino_id AS "fonteDestinoId",
  parcela_atual AS "parcelaAtual",
  total_parcelas AS "totalParcelas",
  grupo_parcelamento AS "grupoParcelamento",
  TO_CHAR(data_compra, 'YYYY-MM-DD') AS "dataCompra"
`;

const camposListagem = `
  l.id, l.tipo, l.descricao, l.valor,
  TO_CHAR(l.data, 'YYYY-MM-DD') AS data,
  l.parcela_atual AS "parcelaAtual",
  l.total_parcelas AS "totalParcelas",
  l.grupo_parcelamento AS "grupoParcelamento",
  TO_CHAR(l.data_compra, 'YYYY-MM-DD') AS "dataCompra",
  json_build_object('id', c.id, 'nome', c.nome, 'tipo', c.tipo) AS categoria,
  json_build_object('id', f.id, 'nome', f.nome, 'tipo', f.tipo) AS "fonteDestino"
`;

function formatar(row) {
  return { ...row, valor: Number(row.valor) };
}

export function adicionarMeses(data, quantidade) {
  const [ano, mes, dia] = data.split('-').map(Number);
  const primeiro = new Date(Date.UTC(ano, mes - 1 + quantidade, 1));
  const a = primeiro.getUTCFullYear();
  const m = primeiro.getUTCMonth() + 1;
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();

  return `${String(a).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
}

async function verificarVinculos(conexao, usuarioId, categoriaId, fonteDestinoId, tipo) {
  const resultado = await conexao.query(
    `SELECT c.tipo AS categoria_tipo, f.tipo AS fonte_tipo
     FROM categorias c
     JOIN fontes_destinos f ON f.id = $2 AND f.usuario_id = $3
     WHERE c.id = $1 AND c.usuario_id = $3`,
    [categoriaId, fonteDestinoId, usuarioId]
  );

  if (!resultado.rows.length) {
    return 'Categoria ou fonte/destino não pertence ao usuário.';
  }
  if (resultado.rows[0].categoria_tipo !== tipo) {
    return 'A categoria deve ser do mesmo tipo do lançamento.';
  }
  return { fonteTipo: resultado.rows[0].fonte_tipo };
}

export async function buscarLancamentoPorId(id, usuarioId) {
  const resultado = await pool.query(
    `SELECT ${camposListagem}
     FROM lancamentos l
     JOIN categorias c ON c.id = l.categoria_id
     JOIN fontes_destinos f ON f.id = l.fonte_destino_id
     WHERE l.id = $1 AND l.usuario_id = $2`,
    [id, usuarioId]
  );
  return resultado.rows[0] ? formatar(resultado.rows[0]) : null;
}

export async function listarLancamentos(usuarioId, filtros) {
  const { inicio, fim, tipo, categoriaId, fonteDestinoId, pagina, porPagina } = filtros;
  const parametros = [usuarioId, inicio, fim];
  const condicoes = ['l.usuario_id = $1', 'l.data >= $2', 'l.data <= $3'];

  if (tipo !== undefined) {
    parametros.push(tipo);
    condicoes.push(`l.tipo = $${parametros.length}`);
  }
  if (categoriaId !== undefined) {
    parametros.push(categoriaId);
    condicoes.push(`l.categoria_id = $${parametros.length}`);
  }
  if (fonteDestinoId !== undefined) {
    parametros.push(fonteDestinoId);
    condicoes.push(`l.fonte_destino_id = $${parametros.length}`);
  }

  const where = condicoes.join(' AND ');
  const resumo = await pool.query(
    `SELECT COUNT(*)::integer AS total,
       COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE 0 END), 0) AS entradas,
       COALESCE(SUM(CASE WHEN l.tipo = 'saida' THEN l.valor ELSE 0 END), 0) AS saidas
     FROM lancamentos l WHERE ${where}`,
    parametros
  );

  const resultado = await pool.query(
    `SELECT ${camposListagem}
     FROM lancamentos l
     JOIN categorias c ON c.id = l.categoria_id
     JOIN fontes_destinos f ON f.id = l.fonte_destino_id
     WHERE ${where}
     ORDER BY l.data DESC, l.id DESC
     LIMIT $${parametros.length + 1} OFFSET $${parametros.length + 2}`,
    [...parametros, porPagina, (pagina - 1) * porPagina]
  );

  const { total, entradas, saidas } = resumo.rows[0];
  const valorEntradas = Number(entradas);
  const valorSaidas = Number(saidas);
  return {
    itens: resultado.rows.map(formatar),
    pagina,
    porPagina,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    totais: {
      entradas: valorEntradas,
      saidas: valorSaidas,
      saldo: Number((valorEntradas - valorSaidas).toFixed(2))
    }
  };
}

export async function criarLancamentos(usuarioId, corpo, centavos, parcelas) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const vinculos = await verificarVinculos(
      client, usuarioId, corpo.categoriaId, corpo.fonteDestinoId, corpo.tipo
    );
    if (typeof vinculos === 'string') {
      await client.query('ROLLBACK');
      return { erro: vinculos };
    }
    if (parcelas > 1 && (corpo.tipo !== 'saida' || vinculos.fonteTipo !== 'cartao_credito')) {
      await client.query('ROLLBACK');
      return { erro: 'Parcelamento é permitido somente para saídas no cartão de crédito.' };
    }

    const grupo = parcelas > 1 ? randomUUID() : null;
    const base = Math.floor(centavos / parcelas);
    const sobra = centavos % parcelas;
    const lancamentos = [];

    for (let numero = 1; numero <= parcelas; numero++) {
      const valorParcela = base + (numero === 1 ? sobra : 0);
      const dataParcela = adicionarMeses(corpo.data, numero - 1);
      const resultado = await client.query(
        `INSERT INTO lancamentos
         (usuario_id, tipo, descricao, valor, data, categoria_id,
          fonte_destino_id, parcela_atual, total_parcelas,
          grupo_parcelamento, data_compra)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING ${camposRetorno}`,
        [
          usuarioId, corpo.tipo, corpo.descricao.trim(),
          (valorParcela / 100).toFixed(2), dataParcela,
          corpo.categoriaId, corpo.fonteDestinoId, numero,
          parcelas, grupo, corpo.data
        ]
      );
      lancamentos.push(formatar(resultado.rows[0]));
    }

    await client.query('COMMIT');
    return { lancamentos };
  } catch (erro) {
    await client.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    client.release();
  }
}

export async function atualizarLancamento(id, usuarioId, corpo, centavos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const atual = await client.query(
      `SELECT tipo, TO_CHAR(data, 'YYYY-MM-DD') AS data,
              fonte_destino_id AS "fonteDestinoId",
              grupo_parcelamento AS "grupoParcelamento"
       FROM lancamentos WHERE id = $1 AND usuario_id = $2 FOR UPDATE`,
      [id, usuarioId]
    );
    if (!atual.rows.length) {
      await client.query('ROLLBACK');
      return { naoEncontrado: true };
    }

    const anterior = atual.rows[0];
    if (anterior.grupoParcelamento && (
      corpo.tipo !== anterior.tipo ||
      corpo.data !== anterior.data ||
      corpo.fonteDestinoId !== anterior.fonteDestinoId
    )) {
      await client.query('ROLLBACK');
      return {
        erro: 'Em parcelas, altere somente descrição, valor ou categoria.',
        status: 409
      };
    }

    const vinculos = await verificarVinculos(
      client, usuarioId, corpo.categoriaId, corpo.fonteDestinoId, corpo.tipo
    );
    if (typeof vinculos === 'string') {
      await client.query('ROLLBACK');
      return { erro: vinculos, status: 400 };
    }

    const resultado = await client.query(
      `UPDATE lancamentos SET
         tipo = $1, descricao = $2, valor = $3, data = $4,
         categoria_id = $5, fonte_destino_id = $6,
         data_compra = CASE
           WHEN grupo_parcelamento IS NULL THEN $4::date
           ELSE data_compra
         END
       WHERE id = $7 AND usuario_id = $8
       RETURNING ${camposRetorno}`,
      [
        corpo.tipo, corpo.descricao.trim(),
        (centavos / 100).toFixed(2), corpo.data,
        corpo.categoriaId, corpo.fonteDestinoId, id, usuarioId
      ]
    );
    await client.query('COMMIT');
    return { lancamento: formatar(resultado.rows[0]) };
  } catch (erro) {
    await client.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    client.release();
  }
}

export async function excluirLancamentos(id, usuarioId, todasParcelas) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const consulta = await client.query(
      `SELECT grupo_parcelamento
       FROM lancamentos
       WHERE id = $1 AND usuario_id = $2 FOR UPDATE`,
      [id, usuarioId]
    );
    if (!consulta.rows.length) {
      await client.query('ROLLBACK');
      return null;
    }

    const grupo = consulta.rows[0].grupo_parcelamento;
    const resultado = todasParcelas && grupo
      ? await client.query(
          `DELETE FROM lancamentos
           WHERE usuario_id = $1 AND grupo_parcelamento = $2
           RETURNING id`,
          [usuarioId, grupo]
        )
      : await client.query(
          `DELETE FROM lancamentos
           WHERE usuario_id = $1 AND id = $2
           RETURNING id`,
          [usuarioId, id]
        );

    await client.query('COMMIT');
    return { quantidade: resultado.rowCount };
  } catch (erro) {
    await client.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    client.release();
  }
}
