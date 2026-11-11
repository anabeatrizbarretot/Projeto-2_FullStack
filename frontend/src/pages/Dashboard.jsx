import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/Badge.jsx';
import useAsync from '../hooks/useAsync.js';
import api from '../services/api.js';
import { plural } from '../utils/format.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(() => api.getDashboard(), []);

  return (
    <Layout title="Início">
      {error && <p className="error">{error}</p>}
      {loading && !data && <p className="empty">Carregando…</p>}
      {data && (
        <>
          <div className="stats">
            <StatCard label="Escolas participantes" value={data.totalEscolas} hint={`${data.escolasEmConvenio} em convênio`} />
            <StatCard label="Alunos atendidos" value={data.totalAlunos} hint={`Em ${plural(data.instituicoesComAlunos, 'instituição', 'instituições')}`} />
            <StatCard label="Documentos pendentes" value={data.documentosPendentes} hint={`${plural(data.cartasAEnviar, 'carta convite', 'cartas convite')} a enviar`} />
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-header">Últimas escolas cadastradas</div>
              {data.ultimasEscolas.length === 0 && <p className="empty">Nenhuma escola cadastrada ainda.</p>}
              {data.ultimasEscolas.map((e) => (
                <Link key={e.id} to={`/escolas/${e.id}`} className="list-item">
                  <div>
                    <div className="item-title">{e.nome}</div>
                    <div className="item-sub">{e.cidade}</div>
                  </div>
                  <Badge>{e.situacao}</Badge>
                </Link>
              ))}
            </section>

            <section className="card">
              <div className="card-header">Atalhos</div>
              <div className="card-body">
                <button type="button" className="btn btn-primary" onClick={() => navigate('/escolas/nova')}>+ Nova escola</button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/alunos/novo')}>Novo aluno</button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/documentos/carta')}>Gerar carta convite</button>
              </div>
            </section>
          </div>
        </>
      )}
    </Layout>
  );
}
