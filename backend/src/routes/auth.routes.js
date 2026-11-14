
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';

import autenticar from '../middlewares/auth.middleware.js';

import {
  cadastrarUsuario,
  buscarUsuarioPorEmail,
  buscarUsuarioPorId
} from '../models/auth.model.js';

const router = express.Router();

const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  }
});

function validarCPF(cpf) {
  const numeros = cpf.replace(/\D/g, '');

  if (
    numeros.length !== 11 ||
    /^(\d)\1{10}$/.test(numeros)
  ) {
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

  return (
    calcularDigito(9) === Number(numeros[9]) &&
    calcularDigito(10) === Number(numeros[10])
  );
}

// CADASTRO

router.post('/cadastro', async (req, res, next) => {
  const {
    nome,
    email,
    cpf,
    senha,
    confirmacao
  } = req.body || {};

  if (
    typeof nome !== 'string' ||
    typeof email !== 'string' ||
    typeof cpf !== 'string' ||
    typeof senha !== 'string' ||
    typeof confirmacao !== 'string' ||
    !nome.trim() ||
    !email.trim() ||
    !cpf.trim() ||
    !senha ||
    !confirmacao
  ) {
    return res.status(400).json({
      message: 'Preencha todos os campos obrigatórios.'
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
      message: 'E-mail inválido.',
      campos: {
        email: 'Informe um e-mail válido.'
      }
    });
  }

  if (!validarCPF(cpfLimpo)) {
    return res.status(400).json({
      message: 'CPF inválido.',
      campos: {
        cpf: 'Informe um CPF válido.'
      }
    });
  }

  if (
    senha.length < 8 ||
    !/[A-Za-z]/.test(senha) ||
    !/\d/.test(senha) ||
    Buffer.byteLength(senha, 'utf8') > 72
  ) {
    return res.status(400).json({
      message: 'A senha deve ter pelo menos 8 caracteres, letras e números, e até 72 bytes.'
    });
  }

  if (senha !== confirmacao) {
    return res.status(400).json({
      message: 'As senhas não coincidem.',
      campos: {
        confirmacao: 'As senhas não são iguais.'
      }
    });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await cadastrarUsuario({
      nome: nomeLimpo,
      email: emailLimpo,
      cpf: cpfLimpo,
      senhaHash
    });

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      usuario
    });

  } catch (erro) {
    if (erro.code === '23505') {
      const campo = erro.constraint?.includes('cpf')
        ? 'cpf'
        : 'email';

      const mensagem = campo === 'cpf'
        ? 'Este CPF já está cadastrado.'
        : 'Este e-mail já está cadastrado.';

      return res.status(409).json({
        message: mensagem,
        campos: {
          [campo]: mensagem
        }
      });
    }

    next(erro);
  }
});

// LOGIN

router.post('/login', limitarLogin, async (req, res, next) => {
  const { email, senha } = req.body || {};

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
    const usuario = await buscarUsuarioPorEmail(
      email.trim().toLowerCase()
    );

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
      {
        expiresIn: '2h',
        algorithm: 'HS256'
      }
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
    next(erro);
  }
});

// DADOS DO USUÁRIO AUTENTICADO

router.get('/me', autenticar, async (req, res, next) => {
  try {
    const usuario = await buscarUsuarioPorId(
      req.usuario.id
    );

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuário não encontrado.'
      });
    }

    return res.status(200).json(usuario);

  } catch (erro) {
    next(erro);
  }
});

// VERIFICAÇÃO DE ACESSO

router.get('/perfil', autenticar, (req, res) => {
  return res.status(200).json({
    message: 'Acesso autorizado!',
    usuarioId: req.usuario.id
  });
});

export default router;
