// API de mentira em memória, usada só quando VITE_USAR_MOCK=true.
// Serve para desenvolver as telas antes de o back-end ficar pronto.
// Atalhos para testar erros:
//   login com senha "errada123"          -> 401
//   cadastro com e-mail repetido@exemplo.com -> 409 no campo e-mail
//   cadastro com CPF 529.982.247-25      -> 409 no campo CPF
import { dataISO, fimDoMes, inicioDoMes } from './formatadores';

const r2 = (n) => Math.round(n * 100) / 100;
let seq = 1000;
const hoje = new Date();
const dia = (mesesAtras, d) => dataISO(new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, d));

const bd = {
  usuario: { id: 1, nome: 'Lívia Pontes', email: 'livia@exemplo.com' },
  categorias: [
    { id: 1, nome: 'Salário', tipo: 'entrada' },
    { id: 2, nome: 'Freelance', tipo: 'entrada' },
    { id: 3, nome: 'Alimentação', tipo: 'saida' },
    { id: 4, nome: 'Moradia', tipo: 'saida' },
    { id: 5, nome: 'Mobilidade', tipo: 'saida' },
    { id: 6, nome: 'Lazer', tipo: 'saida' },
    { id: 7, nome: 'Saúde', tipo: 'saida' },
    { id: 8, nome: 'Educação', tipo: 'saida' },
  ],
  fontes: [
    { id: 1, nome: 'Salário', tipo: 'renda' },
    { id: 2, nome: 'Conta corrente', tipo: 'conta' },
    { id: 3, nome: 'Nubank', tipo: 'cartao_credito', diaFechamento: 3, diaVencimento: 10, limite: 8000 },
    { id: 4, nome: 'Visa crédito', tipo: 'cartao_credito', diaFechamento: 25, diaVencimento: 5, limite: 5000 },
  ],
  lancamentos: [],
};

const cat = (id) => bd.categorias.find((c) => c.id === id);
const fonte = (id) => bd.fontes.find((f) => f.id === id);

function lanc(tipo, descricao, valor, data, categoriaId, fonteDestinoId, extra = {}) {
  return { id: ++seq, tipo, descricao, valor, data, categoriaId, fonteDestinoId, parcelaAtual: 1, totalParcelas: 1, grupoParcelamento: null, ...extra };
}

// Divide em centavos; a diferença de arredondamento vai para a primeira parcela.
function criarParcelas(base, total) {
  const centavos = Math.round(base.valor * 100);
  const parte = Math.floor(centavos / total);
  const grupo = total > 1 ? crypto.randomUUID() : null;
  return Array.from({ length: total }, (_, i) =>
    lanc(base.tipo, base.descricao, (i === 0 ? centavos - parte * (total - 1) : parte) / 100, base.data, base.categoriaId, base.fonteDestinoId, {
      parcelaAtual: i + 1,
      totalParcelas: total,
      grupoParcelamento: grupo,
    })
  );
}

for (let m = 0; m < 3; m++) {
  bd.lancamentos.push(
    lanc('entrada', 'Salário', 4500, dia(m, 5), 1, 1),
    lanc('saida', 'Aluguel', 1500, dia(m, 8), 4, 2),
    lanc('saida', 'Mercado', 620 - m * 40, dia(m, 12), 3, 3),
    lanc('saida', 'Transporte por app', 180 + m * 25, dia(m, 15), 5, 3),
    lanc('saida', 'Cinema e jantar', 210, dia(m, 20), 6, 4)
  );
}
bd.lancamentos.push(...criarParcelas({ tipo: 'saida', descricao: 'Notebook', valor: 3600, data: dia(1, 10), categoriaId: 8, fonteDestinoId: 3 }, 3));

function expandir(l) {
  const { categoriaId, fonteDestinoId, ...resto } = l;
  return { ...resto, categoria: { id: categoriaId, nome: cat(categoriaId)?.nome }, fonteDestino: { id: fonteDestinoId, nome: fonte(fonteDestinoId)?.nome } };
}

const falha = (status, erro, campos) => {
  throw { status, data: { erro, ...(campos ? { campos } : {}) } };
};

// ---------- fatura (regra de fechamento do enunciado) ----------
const ultimoDia = (a, m) => new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
const dataSegura = (a, m, d) => {
  const ano = a + Math.floor(m / 12);
  const mes = ((m % 12) + 12) % 12;
  return new Date(Date.UTC(ano, mes, Math.min(d, ultimoDia(ano, mes))));
};
function calcularFatura(dataCompra, cartao, parcela = 1) {
  const [ano, mes, d] = dataCompra.split('-').map(Number);
  const m = mes - 1;
  const fechamentoDoMes = Math.min(cartao.diaFechamento, ultimoDia(ano, m));
  let mesFechamento = d < fechamentoDoMes ? m : m + 1;
  mesFechamento += parcela - 1;
  const fechamento = dataSegura(ano, mesFechamento, cartao.diaFechamento);
  const mesVencimento = cartao.diaVencimento > cartao.diaFechamento ? mesFechamento : mesFechamento + 1;
  const vencimento = dataSegura(ano, mesVencimento, cartao.diaVencimento);
  const iso = (x) => x.toISOString().slice(0, 10);
  return { referencia: iso(vencimento).slice(0, 7), fechamento: iso(fechamento), vencimento: iso(vencimento) };
}

// ---------- validações ----------
function validarLancamento(c) {
  const campos = {};
  const categoria = cat(Number(c.categoriaId));
  const origem = fonte(Number(c.fonteDestinoId));
  if (!c.descricao?.trim()) campos.descricao = 'Informe a descrição.';
  if (!(Number(c.valor) > 0)) campos.valor = 'O valor deve ser maior que zero.';
  if (!c.data) campos.data = 'Informe a data.';
  if (!categoria) campos.categoriaId = 'Categoria não encontrada.';
  else if (categoria.tipo !== c.tipo) {
    const nome = (t) => (t === 'entrada' ? 'entrada' : 'saída');
    campos.categoriaId = `A categoria informada é de ${nome(categoria.tipo)}, mas o lançamento é de ${nome(c.tipo)}.`;
  }
  if (!origem) campos.fonteDestinoId = 'Conta não encontrada.';
  if (Object.keys(campos).length) falha(400, 'Dados inválidos.', campos);
  return { tipo: c.tipo, descricao: c.descricao.trim(), valor: Number(c.valor), data: c.data, categoriaId: categoria.id, fonteDestinoId: origem.id };
}

function validarFonte(c) {
  const campos = {};
  if (!c.nome?.trim()) campos.nome = 'Informe o nome.';
  if (c.tipo === 'cartao_credito') {
    if (!c.diaFechamento) campos.diaFechamento = 'Informe o dia de fechamento.';
    if (!c.diaVencimento) campos.diaVencimento = 'Informe o dia de vencimento.';
    if (!c.limite) campos.limite = 'Informe o limite.';
  }
  if (Object.keys(campos).length) falha(400, 'Dados inválidos.', campos);
  const base = { nome: c.nome.trim(), tipo: c.tipo };
  return c.tipo === 'cartao_credito' ? { ...base, diaFechamento: c.diaFechamento, diaVencimento: c.diaVencimento, limite: c.limite } : base;
}

// ---------- relatórios ----------
const DIA_MS = 86400000;
const dentro = (l, ini, fim) => l.data >= ini && l.data <= fim;
function periodoAnterior(ini, fim) {
  const dias = (Date.parse(fim) - Date.parse(ini)) / DIA_MS + 1;
  const fimAnt = new Date(Date.parse(ini) - DIA_MS);
  const iniAnt = new Date(fimAnt.getTime() - (dias - 1) * DIA_MS);
  return [iniAnt.toISOString().slice(0, 10), fimAnt.toISOString().slice(0, 10)];
}
function totaisPorCategoria(tipo, ini, fim) {
  const mapa = new Map();
  bd.lancamentos
    .filter((l) => l.tipo === tipo && dentro(l, ini, fim))
    .forEach((l) => mapa.set(l.categoriaId, r2((mapa.get(l.categoriaId) ?? 0) + l.valor)));
  return mapa;
}
function montarRelatorio(tipo, ini, fim) {
  const atual = totaisPorCategoria(tipo, ini, fim);
  const [iniAnt, fimAnt] = periodoAnterior(ini, fim);
  const anterior = totaisPorCategoria(tipo, iniAnt, fimAnt);
  const total = r2([...atual.values()].reduce((s, v) => s + v, 0));
  const lista = [...atual.entries()]
    .map(([id, t]) => ({ id, nome: cat(id).nome, total: t, percentual: total ? r2((t / total) * 100) : 0, periodoAnterior: anterior.get(id) ?? 0 }))
    .sort((a, b) => b.total - a.total);
  return { total, lista };
}

// ---------- rotas ----------
const rotas = [];
const rota = (metodo, caminho, fn, publica = false) =>
  rotas.push({ metodo, publica, re: new RegExp(`^${caminho.replace(':id', '(\\d+)')}$`), fn });

rota('post', '/auth/login', ({ corpo }) => {
  if (!corpo.email || !corpo.senha) falha(400, 'Dados inválidos.');
  if (corpo.senha === 'errada123') falha(401, 'E-mail ou senha inválidos.');
  return [200, { token: 'token-mock', usuario: bd.usuario }];
}, true);

rota('post', '/auth/cadastro', ({ corpo }) => {
  if (corpo.email === 'repetido@exemplo.com') falha(409, 'Usuário já cadastrado.', { email: 'Já existe um usuário com este e-mail.' });
  if (corpo.cpf === '52998224725') falha(409, 'Usuário já cadastrado.', { cpf: 'Já existe um usuário com este CPF.' });
  return [201, { id: ++seq, nome: corpo.nome, email: corpo.email }];
}, true);

rota('get', '/auth/me', () => [200, bd.usuario]);

rota('get', '/categorias', () => [200, bd.categorias]);
rota('post', '/categorias', ({ corpo }) => {
  const nome = corpo.nome?.trim();
  if (!nome) falha(400, 'Dados inválidos.', { nome: 'Informe o nome.' });
  if (bd.categorias.some((c) => c.tipo === corpo.tipo && c.nome.toLowerCase() === nome.toLowerCase()))
    falha(409, 'Categoria já existe.', { nome: 'Já existe uma categoria com este nome neste tipo.' });
  const nova = { id: ++seq, nome, tipo: corpo.tipo };
  bd.categorias.push(nova);
  return [201, nova];
});
rota('put', '/categorias/:id', ({ id, corpo }) => {
  const c = cat(id);
  if (!c) falha(404, 'Categoria não encontrada.');
  Object.assign(c, { nome: corpo.nome.trim(), tipo: corpo.tipo });
  return [200, c];
});
rota('delete', '/categorias/:id', ({ id }) => {
  if (bd.lancamentos.some((l) => l.categoriaId === id)) falha(409, 'Esta categoria tem lançamentos e não pode ser excluída.');
  bd.categorias = bd.categorias.filter((c) => c.id !== id);
  return [204, null];
});

rota('get', '/fontes-destinos', () => [200, bd.fontes]);
rota('post', '/fontes-destinos', ({ corpo }) => {
  const dados = validarFonte(corpo);
  if (bd.fontes.some((f) => f.nome.toLowerCase() === dados.nome.toLowerCase())) falha(409, 'Conta já existe.', { nome: 'Já existe uma conta com este nome.' });
  const nova = { id: ++seq, ...dados };
  bd.fontes.push(nova);
  return [201, nova];
});
rota('put', '/fontes-destinos/:id', ({ id, corpo }) => {
  const f = fonte(id);
  if (!f) falha(404, 'Conta não encontrada.');
  bd.fontes = bd.fontes.map((x) => (x.id === id ? { id, ...validarFonte(corpo) } : x));
  return [200, fonte(id)];
});
rota('delete', '/fontes-destinos/:id', ({ id }) => {
  if (bd.lancamentos.some((l) => l.fonteDestinoId === id)) falha(409, 'Esta conta tem lançamentos e não pode ser excluída.');
  bd.fontes = bd.fontes.filter((f) => f.id !== id);
  return [204, null];
});

const POR_PAGINA = 8;
rota('get', '/lancamentos', ({ params }) => {
  const { inicio, fim, tipo, categoriaId, fonteDestinoId, pagina = 1 } = params;
  const filtrados = bd.lancamentos
    .filter((l) => (!inicio || l.data >= inicio) && (!fim || l.data <= fim) && (!tipo || l.tipo === tipo))
    .filter((l) => (!categoriaId || l.categoriaId === Number(categoriaId)) && (!fonteDestinoId || l.fonteDestinoId === Number(fonteDestinoId)))
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
  const soma = (t) => r2(filtrados.filter((l) => l.tipo === t).reduce((s, l) => s + l.valor, 0));
  const totais = { entradas: soma('entrada'), saidas: soma('saida') };
  totais.saldo = r2(totais.entradas - totais.saidas);
  const p = Number(pagina);
  return [200, { itens: filtrados.slice((p - 1) * POR_PAGINA, p * POR_PAGINA).map(expandir), pagina: p, totalPaginas: Math.max(1, Math.ceil(filtrados.length / POR_PAGINA)), totais }];
});
rota('post', '/lancamentos', ({ corpo }) => {
  const dados = validarLancamento(corpo);
  const cartao = dados.tipo === 'saida' && fonte(dados.fonteDestinoId).tipo === 'cartao_credito';
  const total = cartao ? Math.min(48, Math.max(1, Number(corpo.totalParcelas) || 1)) : 1;
  const criados = criarParcelas(dados, total);
  bd.lancamentos.push(...criados);
  return [201, criados.map(expandir)];
});
rota('get', '/lancamentos/:id', ({ id }) => {
  const l = bd.lancamentos.find((x) => x.id === id);
  if (!l) falha(404, 'Lançamento não encontrado.');
  return [200, expandir(l)];
});
rota('put', '/lancamentos/:id', ({ id, corpo }) => {
  const l = bd.lancamentos.find((x) => x.id === id);
  if (!l) falha(404, 'Lançamento não encontrado.');
  Object.assign(l, validarLancamento(corpo));
  return [200, expandir(l)];
});
rota('delete', '/lancamentos/:id', ({ id, params }) => {
  const l = bd.lancamentos.find((x) => x.id === id);
  if (!l) falha(404, 'Lançamento não encontrado.');
  const todas = String(params.todasParcelas) === 'true' && l.grupoParcelamento;
  bd.lancamentos = bd.lancamentos.filter((x) => (todas ? x.grupoParcelamento !== l.grupoParcelamento : x.id !== id));
  return [204, null];
});

rota('get', '/relatorios/categorias', ({ params }) => {
  const { inicio = inicioDoMes(), fim = fimDoMes() } = params;
  const saidas = montarRelatorio('saida', inicio, fim);
  const entradas = montarRelatorio('entrada', inicio, fim);
  return [200, { periodo: { inicio, fim }, totalSaidas: saidas.total, totalEntradas: entradas.total, categorias: saidas.lista, entradas: entradas.lista }];
});

rota('get', '/relatorios/fontes-destinos', ({ params }) => {
  const { inicio = inicioDoMes(), fim = fimDoMes() } = params;
  const lista = bd.fontes
    .map((f) => {
      const ls = bd.lancamentos.filter((l) => l.fonteDestinoId === f.id && dentro(l, inicio, fim));
      const soma = (t) => r2(ls.filter((l) => l.tipo === t).reduce((s, l) => s + l.valor, 0));
      const entradas = soma('entrada');
      const saidas = soma('saida');
      return { id: f.id, nome: f.nome, tipo: f.tipo, entradas, saidas, saldo: r2(entradas - saidas) };
    })
    .filter((f) => f.entradas || f.saidas);
  return [200, lista];
});

rota('get', '/relatorios/faturas', ({ params }) => {
  const meses = Number(params.meses ?? 3);
  const hojeIso = dataISO(new Date());
  const cartoes = bd.fontes
    .filter((f) => f.tipo === 'cartao_credito')
    .map((cartao) => {
      const itens = bd.lancamentos
        .filter((l) => l.fonteDestinoId === cartao.id && l.tipo === 'saida')
        .map((l) => ({ l, f: calcularFatura(l.data, cartao, l.parcelaAtual) }));
      const mapa = new Map();
      itens.forEach(({ l, f }) => {
        const atual = mapa.get(f.referencia) ?? { ...f, total: 0, lancamentos: [] };
        atual.total = r2(atual.total + l.valor);
        atual.lancamentos.push({ id: l.id, descricao: l.descricao, parcelaAtual: l.parcelaAtual, totalParcelas: l.totalParcelas, valor: l.valor });
        mapa.set(f.referencia, atual);
      });
      const faturas = [...mapa.values()].filter((f) => f.fechamento >= hojeIso).sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, meses + 1);
      const utilizado = r2(itens.filter(({ f }) => f.vencimento >= hojeIso).reduce((s, { l }) => s + l.valor, 0));
      return { cartaoId: cartao.id, nome: cartao.nome, limite: cartao.limite, limiteUtilizado: utilizado, limiteDisponivel: r2(cartao.limite - utilizado), faturas };
    });
  return [200, cartoes];
});

// ---------- adaptador do axios ----------
function erroHttp(config, status, data) {
  const erro = new Error(`Request failed with status code ${status}`);
  erro.config = config;
  erro.response = { status, data, headers: {}, config };
  return erro;
}

export async function adaptadorMock(config) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const metodo = (config.method ?? 'get').toLowerCase();
  const caminho = config.url.split('?')[0];
  const corpo = typeof config.data === 'string' ? JSON.parse(config.data) : {};
  const params = config.params ?? {};

  for (const r of rotas) {
    if (r.metodo !== metodo) continue;
    const achou = caminho.match(r.re);
    if (!achou) continue;
    if (!r.publica && !config.headers?.Authorization) throw erroHttp(config, 401, { erro: 'Token não informado.' });
    try {
      const [status, data] = r.fn({ corpo, params, id: achou[1] ? Number(achou[1]) : null });
      return { data, status, statusText: 'OK', headers: {}, config };
    } catch (e) {
      if (e.status) throw erroHttp(config, e.status, e.data);
      throw e;
    }
  }
  throw erroHttp(config, 404, { erro: 'Rota não encontrada no mock.' });
}
