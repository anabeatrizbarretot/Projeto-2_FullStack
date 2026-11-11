import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import SearchBox from '../components/SearchBox.jsx';
import useAsync from '../hooks/useAsync.js';
import api from '../services/api.js';
import { SITUACOES_ESCOLA } from '../constants.js';

export default function Escolas() {
  const { data, loading, error } = useAsync(() => api.listEscolas(), []);
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('Todas');

  const todas = data || [];
  const termo = busca.trim().toLowerCase();
  const lista = todas.filter(
    (e) => e.nome.toLowerCase().includes(termo) && (situacao === 'Todas' || e.situacao === situacao)
  );

  return (
    <Layout title="Escolas">
      <div className="toolbar">
        <SearchBox value={busca} onChange={setBusca} placeholder="Buscar escola por nome" />
        <select
          className="input"
          aria-label="Filtrar por situação"
          value={situacao}
          onChange={(e) => setSituacao(e.target.value)}
        >
          {['Todas', ...SITUACOES_ESCOLA].map((s) => (
            <option key={s} value={s}>Situação: {s}</option>
          ))}
        </select>
        <span className="spacer" />
        <Link className="btn btn-primary" to="/escolas/nova">+ Nova escola</Link>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Escola</th>
                <th>Cidade</th>
                <th>Representante</th>
                <th>Alunos</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id}>
                  <td className="strong">{e.nome}</td>
                  <td>{e.cidade}</td>
                  <td>{e.representante?.nome || '—'}</td>
                  <td>{e.totalAlunos ?? '—'}</td>
                  <td><Badge>{e.situacao}</Badge></td>
                  <td>
                    <div className="actions">
                      <Link className="link" to={`/escolas/${e.id}`}>Ver</Link>
                      <Link className="link link-muted" to={`/escolas/${e.id}/editar`}>Editar</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && !data && (
                <tr><td colSpan={6} className="empty">Carregando…</td></tr>
              )}
              {!loading && lista.length === 0 && (
                <tr><td colSpan={6} className="empty">Nenhuma escola encontrada. Ajuste a busca ou cadastre uma nova escola.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">Mostrando {lista.length} de {todas.length} escolas</div>
      </section>
    </Layout>
  );
}
