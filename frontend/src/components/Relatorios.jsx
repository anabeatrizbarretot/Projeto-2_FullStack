import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { relatoriosApi } from '../services/servicos';
import { useRequisicao } from '../services/useRequisicao';
import { NOMES_TIPO_FONTE, fimDoMes, inicioDoMes, moeda } from '../services/formatadores';
import { COR_ENTRADA, COR_SAIDA, CORES_GRAFICO, Campo, Estado, PaginaTitulo, Vazio } from './Ui';

const nums = (lista, campos) => lista.map((item) => ({ ...item, ...Object.fromEntries(campos.map((c) => [c, Number(item[c])])) }));

function variacao(atual, anterior) {
  if (!anterior) return { texto: atual ? 'novo' : '—', sentido: 0 };
  const p = ((atual - anterior) / anterior) * 100;
  return { texto: `${p > 0 ? '+' : ''}${p.toFixed(1).replace('.', ',')}%`, sentido: Math.sign(p) };
}

export default function Relatorios() {
  const [aba, setAba] = useState('categorias');
  const [periodo, setPeriodo] = useState({ inicio: inicioDoMes(), fim: fimDoMes() });

  function mesAnterior() {
    const ref = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    setPeriodo({ inicio: inicioDoMes(ref), fim: fimDoMes(ref) });
  }

  return (
    <>
      <PaginaTitulo titulo="Relatórios" subtitulo="Para onde o dinheiro está indo" />

      <section className="cartao filtros">
        <Campo rotulo="De">
          <input type="date" value={periodo.inicio} onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })} />
        </Campo>
        <Campo rotulo="Até">
          <input type="date" value={periodo.fim} onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })} />
        </Campo>
        <div className="atalhos">
          <button type="button" className="btn" onClick={() => setPeriodo({ inicio: inicioDoMes(), fim: fimDoMes() })}>
            Este mês
          </button>
          <button type="button" className="btn" onClick={mesAnterior}>
            Mês anterior
          </button>
        </div>
      </section>

      <div className="abas" role="tablist">
        {[
          ['categorias', 'Por categoria'],
          ['contas', 'Por conta'],
        ].map(([id, rotulo]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'ativa' : ''} onClick={() => setAba(id)}>
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'categorias' ? <PorCategoria periodo={periodo} /> : <PorConta periodo={periodo} />}
    </>
  );
}

function TabelaCategorias({ titulo, itens, ruimSeSobe }) {
  return (
    <section className="cartao sem-padding">
      <h2 className="titulo-tabela">{titulo}</h2>
      <div className="tabela-rolavel">
        <table className="tabela">
          <thead>
            <tr>
              <th>Categoria</th>
              <th className="num">Total</th>
              <th className="num">% do total</th>
              <th className="num">Período anterior</th>
              <th className="num">Variação</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((c) => {
              const v = variacao(c.total, c.periodoAnterior);
              const ruim = v.sentido !== 0 && (v.sentido > 0) === ruimSeSobe;
              return (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td className="num">{moeda(c.total)}</td>
                  <td className="num">{c.percentual.toFixed(1).replace('.', ',')}%</td>
                  <td className="num">{moeda(c.periodoAnterior)}</td>
                  <td className={`num ${v.sentido === 0 ? '' : ruim ? 'saida' : 'entrada'}`}>{v.texto}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PorCategoria({ periodo }) {
  const { dados, carregando, erro, recarregar } = useRequisicao(() => relatoriosApi.categorias(periodo.inicio, periodo.fim), [periodo.inicio, periodo.fim]);
  const saidas = dados ? nums(dados.categorias, ['total', 'percentual', 'periodoAnterior']) : [];
  const entradas = dados?.entradas ? nums(dados.entradas, ['total', 'percentual', 'periodoAnterior']) : [];

  return (
    <Estado carregando={carregando} erro={erro} aoTentar={recarregar}>
      {dados && (saidas.length === 0 && entradas.length === 0 ? (
        <section className="cartao">
          <Vazio titulo="Sem movimentações neste período">Escolha outras datas para ver o relatório.</Vazio>
        </section>
      ) : (
        <>
          {saidas.length > 0 && (
            <>
              <section className="cartao">
                <h2>Saídas por categoria — {moeda(dados.totalSaidas)}</h2>
                <ResponsiveContainer width="100%" height={Math.max(180, saidas.length * 42)}>
                  <BarChart data={saidas} layout="vertical" margin={{ left: 16, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="nome" width={110} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => moeda(v)} cursor={{ fill: 'rgba(75,52,160,0.06)' }} />
                    <Bar dataKey="total" name="Total" fill={CORES_GRAFICO[0]} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
              <TabelaCategorias titulo="Saídas" itens={saidas} ruimSeSobe />
            </>
          )}
          {entradas.length > 0 && <TabelaCategorias titulo="Entradas" itens={entradas} ruimSeSobe={false} />}
        </>
      ))}
    </Estado>
  );
}

function PorConta({ periodo }) {
  const { dados, carregando, erro, recarregar } = useRequisicao(() => relatoriosApi.fontesDestinos(periodo.inicio, periodo.fim), [periodo.inicio, periodo.fim]);
  const lista = dados ? nums(dados, ['entradas', 'saidas', 'saldo']) : [];

  return (
    <Estado carregando={carregando} erro={erro} aoTentar={recarregar}>
      {dados && (lista.length === 0 ? (
        <section className="cartao">
          <Vazio titulo="Sem movimentações neste período">Escolha outras datas para ver o relatório.</Vazio>
        </section>
      ) : (
        <>
          <section className="cartao">
            <h2>Entradas e saídas por conta</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={lista}>
                <CartesianGrid vertical={false} stroke="#E3DEEE" />
                <XAxis dataKey="nome" tickLine={false} />
                <YAxis tickFormatter={(v) => moeda(v)} width={90} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => moeda(v)} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill={COR_ENTRADA} radius={[6, 6, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill={COR_SAIDA} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
          <section className="cartao sem-padding">
            <div className="tabela-rolavel">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Conta</th>
                    <th>Tipo</th>
                    <th className="num">Entradas</th>
                    <th className="num">Saídas</th>
                    <th className="num">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((f) => (
                    <tr key={f.id}>
                      <td>{f.nome}</td>
                      <td>{NOMES_TIPO_FONTE[f.tipo]}</td>
                      <td className="num entrada">{moeda(f.entradas)}</td>
                      <td className="num saida">{moeda(f.saidas)}</td>
                      <td className={`num ${f.saldo < 0 ? 'saida' : ''}`}>{f.tipo === 'conta' ? moeda(f.saldo) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ))}
    </Estado>
  );
}
