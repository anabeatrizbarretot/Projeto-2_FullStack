
import express from 'express';
import pool from '../config/database.js';
import autenticar from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(autenticar);

// Cadastrar fonte ou destino
router.post('/', async (req, res) => {
  const {
    nome,
    tipo,
    diaFechamento,
    diaVencimento,
    limite
  } = req.body || {};

  // Valida nome e tipo
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

  // Valida informações obrigatórias do cartão
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

export default router;
