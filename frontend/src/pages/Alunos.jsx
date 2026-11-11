import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import SearchBox from '../components/SearchBox.jsx';
import useAsync from '../hooks/useAsync.js';
import api from '../services/api.js';
import { formatDate } from '../utils/format.js';

export default function Alunos() {
  const { data, loading, error, reload } = useAsync(() => api.listAlunos(), []);
  const [busca, setBusca] = useState('');
  const [erroAcao, setErroAcao] = useState('');

  const todos = data || [];
  const termo = busca.trim().toLowerCase();
  const lista = todos.filter(
    (a) => a.nome.toLowerCase().includes(termo) || (a.escolaNome || '').toLowerCase().includes(termo)
  );

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

  return (
    <Layout title="Alunos">
      <div className="toolbar">
        <SearchBox value={busca} onChange={setBusca} placeholder="Buscar aluno ou escola" />
        <span className="spacer" />
        <Link className="btn btn-primary" to="/alunos/novo">+ Novo aluno</Link>
      </div>

      {(error || erroAcao) && <p className="error">{error || erroAcao}</p>}

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Escola</th>
                <th>Série</th>
                <th>Data de entrada</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id}>
                  <td className="strong">{a.nome}</td>
                  <td>{a.escolaNome || '—'}</td>
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
              {loading && !data && <tr><td colSpan={6} className="empty">Carregando…</td></tr>}
              {!loading && lista.length === 0 && (
                <tr><td colSpan={6} className="empty">Nenhum aluno encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">Mostrando {lista.length} de {todos.length} alunos</div>
      </section>
    </Layout>
  );
}
