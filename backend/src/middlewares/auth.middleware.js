
import jwt from 'jsonwebtoken';

function autenticar(req, res, next) {

  const autorizacao = req.headers.authorization;

  if (!autorizacao || !autorizacao.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token de autenticação não informado.'
    });
  }

  const token = autorizacao.slice(7);

  try {
    const dados = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );

    if (!Number.isSafeInteger(dados.id) || dados.id <= 0) {
      return res.status(401).json({
        message: 'Token inválido.'
      });
    }

    req.usuario = {
      id: dados.id
    };

    next();

  } catch (erro) {
    return res.status(401).json({
      message: 'Token inválido ou expirado.'
    });
  }
}

export default autenticar;
