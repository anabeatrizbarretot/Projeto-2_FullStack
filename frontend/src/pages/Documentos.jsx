import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import SearchBox from '../components/SearchBox.jsx';
import useAsync from '../hooks/useAsync.js';
import api from '../services/api.js';
import { STATUS_DOCUMENTO, TIPOS_DOCUMENTO } from '../constants.js';
import { formatDate } from '../utils/format.js';

export default function Documentos() {
  const { data, loading, error } = useAsync(() => api.listDocumentos(), []);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('Todos');
  const [status, setStatus] = useState('Todos');

  const todos = data || [];
  const termo = busca.trim().toLowerCase();
  const lista = todos.filter(
    (d) =>
      ((d.escolaNome || '').toLowerCase().includes(termo) || (d.arquivo || '').toLowerCase().includes(termo)) &&
      (tipo === 'Todos' || d.tipo === tipo) &&
      (status === 'Todos' || d.status === status)
  );

  return (
    <Layout title="Documentos">
      <div className="toolbar">
        <SearchBox value={busca} onChange={setBusca} placeholder="Buscar documento ou escola" />
        <select className="input" aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {['Todos', ...TIPOS_DOCUMENTO].map((t) => (
            <option key={t} value={t}>Tipo: {t}</option>
          ))}
        </select>
        <select className="input" aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {['Todos', ...STATUS_DOCUMENTO].map((s) => (
            <option key={s} value={s}>Status: {s}</option>
          ))}
        </select>
        <span className="spacer" />
        <Link className="btn btn-primary" to="/documentos/carta">Gerar carta convite</Link>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Escola</th>
                <th>Data</th>
                <th>Status</th>
                <th>Arquivo</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((d) => (
                <tr key={d.id}>
                  <td className="strong">{d.tipo}</td>
                  <td>{d.escolaNome || '—'}</td>
                  <td>{formatDate(d.data)}</td>
                  <td><Badge>{d.status}</Badge></td>
                  <td>{d.arquivo ? <span className="file-name">{d.arquivo}</span> : '—'}</td>
                </tr>
              ))}
              {loading && !data && <tr><td colSpan={5} className="empty">Carregando…</td></tr>}
              {!loading && lista.length === 0 && (
                <tr><td colSpan={5} className="empty">Nenhum documento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">Mostrando {lista.length} de {todos.length} documentos</div>
      </section>
    </Layout>
  );
}
