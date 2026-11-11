import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Field from '../components/Field.jsx';
import useAsync from '../hooks/useAsync.js';
import api from '../services/api.js';
import { SERIES, SITUACOES_ALUNO } from '../constants.js';
import { today } from '../utils/format.js';

export default function AlunoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    escolaId: params.get('escolaId') || '',
    serie: '6º ano',
    dataEntrada: today(),
    situacao: 'Ativo',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const escolas = useAsync(() => api.listEscolas(), []);
  const aluno = useAsync(() => (editando ? api.getAluno(id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    if (aluno.data) {
      const a = aluno.data;
      setForm({
        nome: a.nome,
        escolaId: String(a.escolaId),
        serie: a.serie,
        dataEntrada: a.dataEntrada,
        situacao: a.situacao,
      });
    }
  }, [aluno.data]);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const opcoesEscola = [
    { value: '', label: 'Selecione a escola' },
    ...(escolas.data || []).map((e) => ({ value: String(e.id), label: e.nome })),
  ];

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) return setErro('Informe o nome do aluno.');
    if (!form.escolaId) return setErro('Selecione a escola do aluno.');
    setErro('');
    setSalvando(true);
    try {
      if (editando) await api.updateAluno(id, form);
      else await api.createAluno(form);
      navigate(`/escolas/${form.escolaId}`);
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar o aluno.');
    } finally {
      setSalvando(false);
    }
  }

  const titulo = editando ? 'Editar aluno' : 'Novo aluno';

  return (
    <Layout title={titulo}>
      <div className="breadcrumb">
        <Link to="/alunos">Alunos</Link> / {titulo}
      </div>
      {(aluno.error || escolas.error) && <p className="error">{aluno.error || escolas.error}</p>}

      {editando && aluno.loading && !aluno.data ? (
        <p className="empty">Carregando…</p>
      ) : (
      <form className="stack" onSubmit={salvar} style={{ maxWidth: 720 }}>
        {erro && <p className="error" role="alert">{erro}</p>}
        <section className="card">
          <div className="card-header">Dados do aluno</div>
          <div className="card-body">
            <div className="form-row">
              <Field label="Nome completo" name="nome" value={form.nome} onChange={set('nome')} placeholder="Nome do aluno" required />
            </div>
            <div className="form-row">
              <Field label="Escola" name="escolaId" options={opcoesEscola} value={form.escolaId} onChange={set('escolaId')} />
              <Field label="Ano / série" name="serie" options={SERIES} value={form.serie} onChange={set('serie')} />
            </div>
            <div className="form-row">
              <Field label="Data de entrada no projeto" name="dataEntrada" type="date" value={form.dataEntrada} onChange={set('dataEntrada')} />
              {editando && (
                <Field label="Situação" name="situacao" options={SITUACOES_ALUNO} value={form.situacao} onChange={set('situacao')} />
              )}
            </div>
            <div className="notice">
              Por se tratar de menores de idade, o sistema coleta apenas os dados necessários ao controle do projeto (LGPD).
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar aluno'}
              </button>
            </div>
          </div>
        </section>
      </form>
      )}
    </Layout>
  );
}
