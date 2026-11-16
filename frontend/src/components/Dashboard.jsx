import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { lancamentosApi, relatoriosApi } from '../services/servicos';
import { useRequisicao } from '../services/useRequisicao';
import { dataBR, fimDoMes, inicioDoMes, moeda } from '../services/formatadores';
import { CORES_GRAFICO, Estado, PaginaTitulo, Vazio } from './Ui';

export default function Dashboard() {
  const { usuario } = useAuth();
  const inicio = inicioDoMes();
  const fim = fimDoMes();
  const { dados, carregando, erro, recarregar } = useRequisicao(
    () => Promise.all([lancamentosApi.listar({ inicio, fim, pagina: 1 }), relatoriosApi.categorias(inicio, fim)]),
    [inicio, fim]
  );
  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? '';

  return (
    <>
      <PaginaTitulo titulo={`Olá, ${primeiroNome}`} subtitulo={`Resumo de ${mes}`} />
      <Estado carregando={carregando} erro={erro} aoTentar={recarregar}>
        {dados && <Conteudo lancamentos={dados[0]} relatorio={dados[1]} />}
      </Estado>
    </>
  );
}

function Conteudo({ lancamentos, relatorio }) {
  const { totais, itens } = lancamentos;
  const saldo = Number(totais.saldo);
  const categorias = relatorio.categorias.map((c) => ({ ...c, total: Number(c.total), percentual: Number(c.percentual) }));

  return (
    <>
      <section className="cartao resumo">
        <div className="saldo">
          <span>Saldo do mês</span>
          <strong className={saldo < 0 ? 'negativo' : ''}>{moeda(saldo)}</strong>
        </div>
        <dl className="duplo">
          <div>
            <dt>Entradas</dt>
            <dd className="entrada">{moeda(totais.entradas)}</dd>
          </div>
          <div>
            <dt>Saídas</dt>
            <dd className="saida">{moeda(totais.saidas)}</dd>
          </div>
        </dl>
      </section>

      <div className="grade-2">
        <section className="cartao">
          <h2>Saídas por categoria</h2>
          {categorias.length === 0 ? (
            <Vazio titulo="Nenhuma saída neste mês">Registre um lançamento para ver o gráfico.</Vazio>
          ) : (
            <div className="grafico-legenda">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categorias} dataKey="total" nameKey="nome" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {categorias.map((c, i) => (
                      <Cell key={c.id} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => moeda(v)} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="legenda">
                {categorias.map((c, i) => (
                  <li key={c.id}>
                    <i style={{ background: CORES_GRAFICO[i % CORES_GRAFICO.length] }} />
                    <span>{c.nome}</span>
                    <b>{moeda(c.total)}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="cartao">
          <div className="cartao-topo">
            <h2>Últimos lançamentos</h2>
            <Link to="/lancamentos">Ver todos</Link>
          </div>
          {itens.length === 0 ? (
            <Vazio titulo="Nada por aqui ainda">Cadastre seu primeiro lançamento em Lançamentos.</Vazio>
          ) : (
            <ul className="lista-simples">
              {itens.slice(0, 5).map((l) => (
                <li key={l.id}>
                  <div>
                    <strong>{l.descricao}</strong>
                    <small>
                      {dataBR(l.data)} — {l.categoria?.nome}
                    </small>
                  </div>
                  <span className={`valor ${l.tipo}`}>
                    {l.tipo === 'saida' ? '−' : '+'} {moeda(l.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
