import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import useAsync from '../hooks/useAsync.js';
import api from '../services/api.js';
import { formatDate } from '../utils/format.js';

const ABAS = ['Dados', 'Representante', 'Alunos', 'Documentos'];

function Info({ rotulo, valor }) {
  return (
    <div>
      <div className="info-label">{rotulo}</div>
      <div className="info-value">{valor || '—'}</div>
    </div>
  );
}

export default function EscolaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aba, setAba] = useState('Alunos');
  const [erroAcao, setErroAcao] = useState('');

  const { data, loading, error, reload } = useAsync(async () => {
    const [escola, alunos, documentos] = await Promise.all([
      api.getEscola(id),
      api.listAlunos(id),
      api.listDocumentos(id),
    ]);
    return { escola, alunos, documentos };
  }, [id]);

  async function remover(aluno) {
    if (!window.confirm(`Remover o aluno ${aluno.nome}?`)) return;
    try {
      await api.deleteAluno(aluno.id);
      setErroAcao('');
      reload();
    } catch (e) {
      setErroAcao(e.message || 'Não foi possível remover o aluno.');
    }
  }

  if (error) {
    return (
      <Layout title="Detalhe da escola">
        <p className="error">{error}</p>
        <Link className="link" to="/escolas">Voltar para a lista de escolas</Link>
      </Layout>
    );
  }
  if (loading && !data) {
    return (
      <Layout title="Detalhe da escola">
        <p className="empty">Carregando…</p>
      </Layout>
    );
  }
  if (!data) return null;

  const { escola, alunos, documentos } = data;
  const rep = escola.representante || {};
  const ativos = alunos.filter((a) => a.situacao === 'Ativo').length;

  return (
    <Layout title="Detalhe da escola">
      <div className="breadcrumb">
        <Link to="/escolas">Escolas</Link> / {escola.nome}
      </div>

      <section className="card school-header">
        <div>
          <div className="school-title">
            <h2>{escola.nome}</h2>
            <Badge>{escola.situacao}</Badge>
          </div>
          <div className="school-meta">
            {escola.cidade} · Representante: {rep.nome || '—'} · {ativos} alunos atendidos
          </div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(`/escolas/${id}/editar`)}>
          Editar escola
        </button>
      </section>

      <div className="tabs" role="tablist">
        {ABAS.map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={aba === a}
            className={`tab${aba === a ? ' active' : ''}`}
            onClick={() => setAba(a)}
          >
            {a}
          </button>
        ))}
      </div>

      {erroAcao && <p className="error">{erroAcao}</p>}

      {aba === 'Dados' && (
        <section className="card">
          <div className="info-grid" style={{ paddingTop: 20 }}>
            <Info rotulo="Tipo" valor={escola.tipo} />
            <Info rotulo="Situação" valor={escola.situacao} />
            <Info rotulo="Cidade" valor={escola.cidade} />
            <Info rotulo="Endereço" valor={escola.endereco} />
            <Info rotulo="Telefone" valor={escola.telefone} />
            <Info rotulo="E-mail" valor={escola.email} />
          </div>
        </section>
      )}

      {aba === 'Representante' && (
        <section className="card">
          <div className="info-grid" style={{ paddingTop: 20 }}>
            <Info rotulo="Nome" valor={rep.nome} />
            <Info rotulo="Cargo" valor={rep.cargo} />
            <Info rotulo="Telefone" valor={rep.telefone} />
            <Info rotulo="E-mail" valor={rep.email} />
          </div>
        </section>
      )}

      {aba === 'Alunos' && (
        <section className="card">
          <div className="card-header">
            Alunos vinculados
            <Link className="btn btn-primary" to={`/alunos/novo?escolaId=${id}`}>+ Adicionar aluno</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Série</th>
                  <th>Data de entrada</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr key={a.id}>
                    <td className="strong">{a.nome}</td>
                    <td>{a.serie}</td>
                    <td>{formatDate(a.dataEntrada)}</td>
                    <td><Badge>{a.situacao}</Badge></td>
                    <td>
                      <div className="actions">
                        <Link className="link" to={`/alunos/${a.id}/editar`}>Editar</Link>
                        <button type="button" className="link link-muted" onClick={() => remover(a)}>Remover</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {alunos.length === 0 && (
                  <tr><td colSpan={5} className="empty">Nenhum aluno vinculado a esta escola. Use “Adicionar aluno” para cadastrar o primeiro.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {aba === 'Documentos' && (
        <section className="card">
          <div className="card-header">
            Documentos
            <Link className="btn btn-primary" to={`/documentos/carta?escolaId=${id}`}>Gerar carta convite</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Arquivo</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((d) => (
                  <tr key={d.id}>
                    <td className="strong">{d.tipo}</td>
                    <td>{formatDate(d.data)}</td>
                    <td><Badge>{d.status}</Badge></td>
                    <td>{d.arquivo ? <span className="file-name">{d.arquivo}</span> : '—'}</td>
                  </tr>
                ))}
                {documentos.length === 0 && (
                  <tr><td colSpan={4} className="empty">Nenhum documento registrado para esta escola.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </Layout>
  );
}
