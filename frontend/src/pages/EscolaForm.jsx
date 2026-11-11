import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Field from '../components/Field.jsx';
import useAsync from '../hooks/useAsync.js';
import api from '../services/api.js';
import { SITUACOES_ESCOLA, TIPOS_ESCOLA } from '../constants.js';

const vazio = {
  nome: '',
  tipo: 'Escola pública',
  situacao: 'Ativa',
  cidade: 'Cornélio Procópio',
  endereco: '',
  telefone: '',
  email: '',
  representante: { nome: '', cargo: '', telefone: '', email: '' },
};

export default function EscolaForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const { data, loading, error } = useAsync(() => (editando ? api.getEscola(id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    if (data) {
      setForm({ ...vazio, ...data, representante: { ...vazio.representante, ...(data.representante || {}) } });
    }
  }, [data]);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const setRep = (campo) => (e) =>
    setForm((f) => ({ ...f, representante: { ...f.representante, [campo]: e.target.value } }));

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setErro('Informe o nome da escola.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const { totalAlunos, ...dados } = form;
      if (editando) await api.updateEscola(id, dados);
      else await api.createEscola(dados);
      navigate(editando ? `/escolas/${id}` : '/escolas');
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar a escola.');
    } finally {
      setSalvando(false);
    }
  }

  const titulo = editando ? 'Editar escola' : 'Nova escola';

  return (
    <Layout title={titulo}>
      <div className="breadcrumb">
        <Link to="/escolas">Escolas</Link> / {titulo}
      </div>
      {error && <p className="error">{error}</p>}
      {loading && editando && !data ? (
        <p className="empty">Carregando…</p>
      ) : (
        <form className="stack" onSubmit={salvar}>
          {erro && <p className="error" role="alert">{erro}</p>}

          <section className="card">
            <div className="card-header">Dados da escola</div>
            <div className="card-body">
              <div className="form-row">
                <Field label="Nome da escola" name="nome" value={form.nome} onChange={set('nome')} placeholder="Ex.: Escola Municipal Monteiro Lobato" required />
              </div>
              <div className="form-row">
                <Field label="Tipo" name="tipo" options={TIPOS_ESCOLA} value={form.tipo} onChange={set('tipo')} />
                <Field label="Situação" name="situacao" options={SITUACOES_ESCOLA} value={form.situacao} onChange={set('situacao')} />
              </div>
              <div className="form-row">
                <Field label="Cidade" name="cidade" value={form.cidade} onChange={set('cidade')} />
                <Field label="Endereço" name="endereco" value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, bairro" />
              </div>
              <div className="form-row">
                <Field label="Telefone" name="telefone" value={form.telefone} onChange={set('telefone')} placeholder="(43) 0000-0000" />
                <Field label="E-mail" name="email" type="email" value={form.email} onChange={set('email')} placeholder="contato@escola.edu.br" />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header">Representante da escola</div>
            <div className="card-body">
              <div className="form-row">
                <Field label="Nome do representante" name="representante_nome" value={form.representante.nome} onChange={setRep('nome')} placeholder="Nome completo" />
                <Field label="Cargo" name="representante_cargo" value={form.representante.cargo} onChange={setRep('cargo')} placeholder="Ex.: Diretor(a)" />
              </div>
              <div className="form-row">
                <Field label="Telefone" name="representante_telefone" value={form.representante.telefone} onChange={setRep('telefone')} placeholder="(43) 0000-0000" />
                <Field label="E-mail" name="representante_email" type="email" value={form.representante.email} onChange={setRep('email')} placeholder="representante@escola.edu.br" />
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(editando ? `/escolas/${id}` : '/escolas')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar escola'}
            </button>
          </div>
        </form>
      )}
    </Layout>
  );
}
