
export function rotaNaoEncontrada(req, res) {
  return res.status(404).json({
    erro: 'Rota não encontrada.'
  });
}

export function tratarErros(erro, req, res, next) {
  if (res.headersSent) {
    return next(erro);
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({
      erro: 'JSON inválido.'
    });
  }

  if (erro.type === 'entity.too.large') {
    return res.status(413).json({
      erro: 'Requisição muito grande.'
    });
  }

  if (erro.code === '23505') {
    return res.status(409).json({
      erro: 'Registro duplicado.'
    });
  }

  if (erro.code === '23503') {
    return res.status(409).json({
      erro: 'Não é possível realizar a operação porque existem registros vinculados.'
    });
  }

  if (
    ['23502', '23514', '22P02', '22003'].includes(erro.code)
  ) {
    return res.status(400).json({
      erro: 'Dados inválidos.'
    });
  }

  console.error('Erro interno do servidor:', erro);

  return res.status(500).json({
    erro: 'Erro interno do servidor.'
  });
}
