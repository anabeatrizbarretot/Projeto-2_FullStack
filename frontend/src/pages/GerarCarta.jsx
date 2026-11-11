import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Field from '../components/Field.jsx';
import useAsync from '../hooks/useAsync.js';
import api from '../services/api.js';
import { formatDateLong, today } from '../utils/format.js';

function Carta({ escola, data, assinatura }) {
  return (
    <article className="carta">
      <div className="kicker">Projeto de Extensão ELLP · UTFPR Cornélio Procópio</div>
      <h2>CARTA CONVITE</h2>
      <p>À direção da instituição {escola},</p>
      <p>
        Temos o prazer de convidar a instituição para participar das atividades do projeto de extensão ELLP, que
        aproxima crianças e adolescentes do ambiente universitário por meio de oficinas e atividades educativas.
      </p>
      <p>
        Esperamos contar com a participação da escola e colocamo-nos à disposição para esclarecer qualquer dúvida.
      </p>
      <p>Cornélio Procópio, {formatDateLong(data)}.</p>
      <p className="assinatura">{assinatura}</p>
    </article>
  );
}

export default function GerarCarta() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const escolas = useAsync(() => api.listEscolas(), []);
  const [form, setForm] = useState({
    escolaId: params.get('escolaId') || '',
    tipo: 'Carta convite',
    data: today(),
    assinatura: 'Coordenação do projeto ELLP',
  });
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [gerando, setGerando] = useState(false);

  const lista = escolas.data || [];
  const escola = lista.find((e) => String(e.id) === String(form.escolaId));
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const opcoesEscola = [
    { value: '', label: 'Selecione a escola' },
    ...lista.map((e) => ({ value: String(e.id), label: e.nome })),
  ];

  async function gerar() {
    if (!escola) {
      setErro('Selecione a escola para gerar a carta.');
      return;
    }
    setErro('');
    setOk('');
    setGerando(true);
    try {
      const { documento, blob } = await api.gerarCarta(form);
      if (blob) {
        // Back-end devolveu o PDF: baixa o arquivo.
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = documento?.arquivo || 'carta_convite.pdf';
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Modo demonstração: abre a impressão do navegador (escolha "Salvar como PDF").
        window.print();
      }
      setOk('Carta registrada com o status Pendente. Você pode acompanhá-la na lista de documentos.');
    } catch (e) {
      setErro(e.message || 'Não foi possível gerar a carta.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <Layout title="Gerar carta convite">
      <div className="breadcrumb">
        <Link to="/documentos">Documentos</Link> / Gerar carta convite
      </div>
      {escolas.error && <p className="error">{escolas.error}</p>}

      <div className="letter-layout">
        <section className="card">
          <div className="card-header">Dados da carta</div>
          <div className="card-body">
            {erro && <p className="error" role="alert">{erro}</p>}
            {ok && <p className="notice notice-ok" role="status">{ok}</p>}
            <Field label="Escola" name="escolaId" options={opcoesEscola} value={form.escolaId} onChange={set('escolaId')} />
            <Field label="Tipo de documento" name="tipo" options={['Carta convite']} value={form.tipo} onChange={set('tipo')} />
            <Field label="Data da carta" name="data" type="date" value={form.data} onChange={set('data')} />
            <Field label="Assinatura" name="assinatura" value={form.assinatura} onChange={set('assinatura')} />
            <button type="button" className="btn btn-primary btn-block" onClick={gerar} disabled={gerando}>
              {gerando ? 'Gerando…' : 'Gerar PDF'}
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => navigate(-1)}>
              Voltar
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Pré-visualização</div>
          <div className="paper-area">
            <Carta escola={escola ? escola.nome : '(escolha a escola)'} data={form.data} assinatura={form.assinatura} />
          </div>
        </section>
      </div>
    </Layout>
  );
}
