
export function rotaNaoEncontrada(req, res) {
  return res.status(404).json({
    message: 'Rota não encontrada.'
  });
}

export function tratarErros(erro, req, res, next) {
  if (res.headersSent) {
    return next(erro);
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'JSON inválido.'
    });
  }

  if (erro.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Requisição muito grande.'
    });
  }

  if (erro.code === '23505') {
    return res.status(409).json({
      message: 'Registro duplicado.'
    });
  }

  if (erro.code === '23503') {
    return res.status(409).json({
      message: 'Registro vinculado a outros dados.'
    });
  }

  if (['23502', '23514', '22P02', '22003'].includes(erro.code)) {
    return res.status(400).json({
      message: 'Dados inválidos.'
    });
  }

  console.error('Erro interno:', erro);

  return res.status(500).json({
    message: 'Erro interno do servidor.'
  });
}
