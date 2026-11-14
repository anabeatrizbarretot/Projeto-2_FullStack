
import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';
import autenticar from '../middlewares/auth.middleware.js';

const router = express.Router();

function validarCPF(cpf) {
  const numeros = cpf.replace(/\D/g, '');

  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
    return false;
  }

  function calcularDigito(quantidade) {
    let soma = 0;

    for (let i = 0; i < quantidade; i++) {
      soma += Number(numeros[i]) * (quantidade + 1 - i);
    }

    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  return calcularDigito(9) === Number(numeros[9]) &&
         calcularDigito(10) === Number(numeros[10]);
}

router.post('/cadastro', async (req, res) => {
  const { nome, email, cpf, senha } = req.body || {};

  if (
    typeof nome !== 'string' ||
    typeof email !== 'string' ||
    typeof cpf !== 'string' ||
    typeof senha !== 'string' ||
    !nome.trim() ||
    !email.trim() ||
    !cpf.trim() ||
    !senha
  ) {
    return res.status(400).json({
      message: 'Preencha todos os campos corretamente.'
    });
  }

  const nomeLimpo = nome.trim();
  const emailLimpo = email.trim().toLowerCase();
  const cpfLimpo = cpf.replace(/\D/g, '');

  if (nomeLimpo.length > 120) {
    return res.status(400).json({
      message: 'O nome deve ter até 120 caracteres.'
    });
  }

  if (
    emailLimpo.length > 160 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)
  ) {
    return res.status(400).json({
      message: 'E-mail inválido.'
    });
  }

  if (!validarCPF(cpfLimpo)) {
    return res.status(400).json({
      message: 'CPF inválido.'
    });
  }

  if (
    senha.length < 8 ||
    !/[A-Za-z]/.test(senha) ||
    !/\d/.test(senha)
  ) {
    return res.status(400).json({
      message: 'A senha deve ter pelo menos 8 caracteres, letras e números.'
    });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 12);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, cpf, senha_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, cpf, criado_em`,
      [nomeLimpo, emailLimpo, cpfLimpo, senhaHash]
    );

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      usuario: resultado.rows[0]
    });

  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({
        message: 'CPF ou e-mail já cadastrado.'
      });
    }

    console.error('Erro ao cadastrar usuário:', erro);

    return res.status(500).json({
      message: 'Erro interno ao cadastrar usuário.'
    });
  }
});


 // Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};

  // Verifica se os dados foram enviados
  if (
    typeof email !== 'string' ||
    typeof senha !== 'string' ||
    !email.trim() ||
    !senha
  ) {
    return res.status(400).json({
      message: 'Informe o e-mail e a senha.'
    });
  }

  try {
    // Procura o usuário pelo e-mail
    const resultado = await pool.query(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    const usuario = resultado.rows[0];

    // Verifica se o usuário existe
    if (!usuario) {
      return res.status(401).json({
        message: 'E-mail ou senha incorretos.'
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha_hash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        message: 'E-mail ou senha incorretos.'
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado.');
    }

    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });

  } catch (erro) {
    console.error('Erro ao realizar login:', erro);

    return res.status(500).json({
      message: 'Erro interno ao realizar login.'
    });
  }
});

router.get('/perfil', autenticar, (req, res) => {
  return res.json({
    message: 'Acesso autorizado!',
    usuarioId: req.usuario.id
  });
});


export default router;
