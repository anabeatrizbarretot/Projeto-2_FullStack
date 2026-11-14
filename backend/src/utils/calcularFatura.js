
function ultimoDiaDoMes(ano, mes) {
  return new Date(
    Date.UTC(ano, mes + 1, 0)
  ).getUTCDate();
}

function dataSegura(ano, mes, dia) {
  const base = new Date(Date.UTC(ano, mes, 1));

  const a = base.getUTCFullYear();
  const m = base.getUTCMonth();

  const diaFinal = Math.min(
    dia,
    ultimoDiaDoMes(a, m)
  );

  return new Date(Date.UTC(a, m, diaFinal));
}

export function calcularFatura(
  dataCompra,
  cartao,
  numeroParcela = 1
) {
  const [ano, mes, dia] = dataCompra
    .split('-')
    .map(Number);

  const mesInicial = mes - 1;

  const fechamentoDoMes = Math.min(
    cartao.diaFechamento,
    ultimoDiaDoMes(ano, mesInicial)
  );

  let mesFechamento =
    dia < fechamentoDoMes
      ? mesInicial
      : mesInicial + 1;

  mesFechamento += numeroParcela - 1;

  const fechamento = dataSegura(
    ano,
    mesFechamento,
    cartao.diaFechamento
  );

  const mesVencimento =
    cartao.diaVencimento > cartao.diaFechamento
      ? mesFechamento
      : mesFechamento + 1;

  const vencimento = dataSegura(
    ano,
    mesVencimento,
    cartao.diaVencimento
  );

  const formatar = (data) =>
    data.toISOString().slice(0, 10);

  return {
    referencia: formatar(vencimento).slice(0, 7),
    fechamento: formatar(fechamento),
    vencimento: formatar(vencimento)
  };
}
