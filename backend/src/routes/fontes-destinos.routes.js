
import express from 'express';
import pool from '../config/database.js';
import autenticar from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(autenticar);

router.post('/', async (req, res) => {
  const {
    nome,
    tipo,
    diaFechamento,
    diaVencimento,
    limite
  } = req.body || {};

  if (
    typeof nome !== 'string' ||
    !nome.trim() ||
    nome.trim().length > 60 ||
    !['renda', 'conta', 'cartao_credito'].includes(tipo)
  ) {
    return res.status(400).json({
      message: 'Informe um nome e um tipo válido.'
    });
  }

  const cartao = tipo === 'cartao_credito';

  if (cartao) {
    const diaValido = (dia) =>
      Number.isInteger(dia) && dia >= 1 && dia <= 31;

    const limiteValido =
      typeof limite === 'number' &&
      Number.isFinite(limite) &&
      limite > 0 &&
      limite <= 9999999999.99 &&
      Math.abs(limite * 100 - Math.round(limite * 100)) < 0.000001;

    if (
      !diaValido(diaFechamento) ||
      !diaValido(diaVencimento) ||
      !limiteValido
    ) {
      return res.status(400).json({
        message: 'Informe os dias de fechamento e vencimento (1 a 31) e um limite válido.'
      });
    }
  }

  try {
    const usuarioId = req.usuario.id;

    // Insere a fonte ou destino no banco
    const resultado = await pool.query(
      `INSERT INTO fontes_destinos
       (usuario_id, nome, tipo, dia_fechamento,
        dia_vencimento, limite)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id, nome, tipo,
         dia_fechamento AS "diaFechamento",
         dia_vencimento AS "diaVencimento",
         limite`,
      [
        usuarioId,
        nome.trim(),
        tipo,
        cartao ? diaFechamento : null,
        cartao ? diaVencimento : null,
        cartao ? limite : null
      ]
    );

    const fonte = resultado.rows[0];

    return res.status(201).json({
      ...fonte,
      limite: fonte.limite === null
        ? null
        : Number(fonte.limite)
    });

  } catch (erro) {

    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'Já existe uma fonte ou destino com esse nome.'
      });
    }

    console.error('Erro ao cadastrar fonte/destino:', erro);

    return res.status(500).json({
      message: 'Erro interno ao cadastrar fonte ou destino.'
    });
  }
});


router.get('/', async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const resultado = await pool.query(
      `SELECT
         id,
         nome,
         tipo,
         dia_fechamento AS "diaFechamento",
         dia_vencimento AS "diaVencimento",
         limite
       FROM fontes_destinos
       WHERE usuario_id = $1
       ORDER BY nome ASC`,
      [usuarioId]
    );

    const fontesDestinos = resultado.rows.map(item => ({
      ...item,
      limite: item.limite === null
        ? null
        : Number(item.limite)
    }));

    return res.status(200).json(fontesDestinos);

  } catch (erro) {
    console.error('Erro ao listar fontes e destinos:', erro);

    return res.status(500).json({
      message: 'Erro interno ao listar fontes e destinos.'
    });
  }
});


router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  const {
    nome,
    tipo,
    diaFechamento,
    diaVencimento,
    limite
  } = req.body || {};

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID inválido.'
    });
  }

  if (
    typeof nome !== 'string' ||
    !nome.trim() ||
    nome.trim().length > 60 ||
    !['renda', 'conta', 'cartao_credito'].includes(tipo)
  ) {
    return res.status(400).json({
      message: 'Informe um nome e um tipo válido.'
    });
  }

  const cartao = tipo === 'cartao_credito';

  if (cartao) {
    const diaValido = (dia) =>
      Number.isInteger(dia) && dia >= 1 && dia <= 31;

    const limiteValido =
      typeof limite === 'number' &&
      Number.isFinite(limite) &&
      limite > 0 &&
      limite <= 9999999999.99 &&
      Math.abs(limite * 100 - Math.round(limite * 100)) < 0.000001;

    if (
      !diaValido(diaFechamento) ||
      !diaValido(diaVencimento) ||
      !limiteValido
    ) {
      return res.status(400).json({
        message: 'Informe os dias de fechamento, vencimento e um limite válido.'
      });
    }
  }

  try {
    const usuarioId = req.usuario.id;

    const resultado = await pool.query(
      `UPDATE fontes_destinos
       SET nome = $1,
           tipo = $2,
           dia_fechamento = $3,
           dia_vencimento = $4,
           limite = $5
       WHERE id = $6 AND usuario_id = $7
       RETURNING
         id, nome, tipo,
         dia_fechamento AS "diaFechamento",
         dia_vencimento AS "diaVencimento",
         limite`,
      [
        nome.trim(),
        tipo,
        cartao ? diaFechamento : null,
        cartao ? diaVencimento : null,
        cartao ? limite : null,
        id,
        usuarioId
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        message: 'Fonte ou destino não encontrado.'
      });
    }

    const fonte = resultado.rows[0];

    return res.status(200).json({
      message: 'Fonte ou destino atualizado com sucesso!',
      fonteDestino: {
        ...fonte,
        limite: fonte.limite === null
          ? null
          : Number(fonte.limite)
      }
    });

  } catch (erro) {

    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'Já existe uma fonte ou destino com esse nome.'
      });
    }

    console.error('Erro ao atualizar fonte/destino:', erro);

    return res.status(500).json({
      message: 'Erro interno ao atualizar fonte ou destino.'
    });
  }
});


router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID inválido.'
    });
  }

  try {
    const usuarioId = req.usuario.id;

    const resultado = await pool.query(
      `DELETE FROM fontes_destinos
       WHERE id = $1 AND usuario_id = $2
       RETURNING id, nome, tipo`,
      [id, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        message: 'Fonte ou destino não encontrado.'
      });
    }

    return res.status(200).json({
      message: 'Fonte ou destino excluído com sucesso!',
      fonteDestino: resultado.rows[0]
    });

  } catch (erro) {

    if (erro.code === '23503') {
      return res.status(409).json({
        message: 'Não é possível excluir uma conta ou fonte que possui lançamentos financeiros.'
      });
    }

    console.error('Erro ao excluir fonte/destino:', erro);

    return res.status(500).json({
      message: 'Erro interno ao excluir fonte ou destino.'
    });
  }
});



export default router;
