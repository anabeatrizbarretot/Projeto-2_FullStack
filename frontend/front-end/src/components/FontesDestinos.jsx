import { useState } from 'react';
import { fontesApi } from '../services/servicos';
import { useRequisicao } from '../services/useRequisicao';
import { lerErro } from '../services/api';
import { NOMES_TIPO_FONTE, mascaraValor, moeda, numeroParaCampo, paraNumero } from '../services/formatadores';
import { Campo, Estado, Modal, PaginaTitulo, Vazio } from './Ui';

export default function FontesDestinos() {
  const { dados, carregando, erro, recarregar } = useRequisicao(() => fontesApi.listar(), []);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [erroExcluir, setErroExcluir] = useState('');

  async function excluir() {
    setErroExcluir('');
    try {
      await fontesApi.excluir(excluindo.id);
      setExcluindo(null);
      recarregar();
    } catch (err) {
      setErroExcluir(lerErro(err).mensagem);
    }
  }

  return (
    <>
      <PaginaTitulo titulo="Contas e cartões" subtitulo="De onde o dinheiro vem e para onde ele vai">
        <button type="button" className="btn btn-primario" onClick={() => setEditando({ tipo: 'conta' })}>
          Nova conta
        </button>
      </PaginaTitulo>

      <Estado carregando={carregando} erro={erro} aoTentar={recarregar}>
        {dados && dados.length === 0 && (
          <section className="cartao">
            <Vazio titulo="Nenhuma conta cadastrada">Crie uma conta corrente, um cartão ou uma fonte de renda.</Vazio>
          </section>
        )}
        {dados && dados.length > 0 && (
          <div className="grade-3">
            {dados.map((f) => (
              <article className="cartao conta" key={f.id}>
                <span className="badge">{NOMES_TIPO_FONTE[f.tipo]}</span>
                <h2>{f.nome}</h2>
                {f.tipo === 'cartao_credito' && (
                  <dl className="detalhes">
                    <div>
                      <dt>Fecha</dt>
                      <dd>dia {f.diaFechamento}</dd>
                    </div>
                    <div>
                      <dt>Vence</dt>
                      <dd>dia {f.diaVencimento}</dd>
                    </div>
                    <div>
                      <dt>Limite</dt>
                      <dd>{moeda(f.limite)}</dd>
                    </div>
                  </dl>
                )}
                <span className="acoes">
                  <button type="button" className="btn-link" onClick={() => setEditando(f)}>
                    Editar
                  </button>
                  <button type="button" className="btn-link perigo" onClick={() => { setErroExcluir(''); setExcluindo(f); }}>
                    Excluir
                  </button>
                </span>
              </article>
            ))}
          </div>
        )}
      </Estado>

      {editando && (
        <Modal titulo={editando.id ? 'Editar conta' : 'Nova conta'} aoFechar={() => setEditando(null)}>
          <FormFonte
            inicial={editando}
            aoCancelar={() => setEditando(null)}
            aoSalvar={() => {
              setEditando(null);
              recarregar();
            }}
          />
        </Modal>
      )}

      {excluindo && (
        <Modal titulo="Excluir conta" aoFechar={() => setExcluindo(null)}>
          <p>
            Excluir <strong>{excluindo.nome}</strong>?
          </p>
          {erroExcluir && <p className="aviso erro" role="alert">{erroExcluir}</p>}
          <div className="acoes-form">
            <button type="button" className="btn" onClick={() => setExcluindo(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-perigo" onClick={excluir}>
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function FormFonte({ inicial, aoSalvar, aoCancelar }) {
  const [form, setForm] = useState({
    nome: inicial.nome ?? '',
    tipo: inicial.tipo ?? 'conta',
    diaFechamento: inicial.diaFechamento ? String(inicial.diaFechamento) : '',
    diaVencimento: inicial.diaVencimento ? String(inicial.diaVencimento) : '',
    limite: inicial.limite ? numeroParaCampo(inicial.limite) : '',
  });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const cartao = form.tipo === 'cartao_credito';

  function mudar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined, geral: undefined }));
  }

  const diaOk = (v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 31;

  async function enviar(ev) {
    ev.preventDefault();
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome.';
    if (cartao) {
      if (!diaOk(form.diaFechamento)) e.diaFechamento = 'Informe um dia de 1 a 31.';
      if (!diaOk(form.diaVencimento)) e.diaVencimento = 'Informe um dia de 1 a 31.';
      if (paraNumero(form.limite) <= 0) e.limite = 'Informe o limite do cartão.';
    }
    setErros(e);
    if (Object.keys(e).length) return;

    const corpo = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      ...(cartao ? { diaFechamento: Number(form.diaFechamento), diaVencimento: Number(form.diaVencimento), limite: paraNumero(form.limite) } : {}),
    };
    setEnviando(true);
    try {
      if (inicial.id) await fontesApi.atualizar(inicial.id, corpo);
      else await fontesApi.criar(corpo);
      aoSalvar();
    } catch (err) {
      const { mensagem, campos } = lerErro(err);
      setErros(Object.keys(campos).length ? campos : { geral: mensagem });
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {erros.geral && <p className="aviso erro" role="alert">{erros.geral}</p>}
      <Campo rotulo="Nome" erro={erros.nome}>
        <input value={form.nome} maxLength={60} onChange={(e) => mudar('nome', e.target.value)} />
      </Campo>
      <Campo rotulo="Tipo" erro={erros.tipo}>
        <select value={form.tipo} onChange={(e) => mudar('tipo', e.target.value)}>
          {Object.entries(NOMES_TIPO_FONTE).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </Campo>
      {cartao && (
        <>
          <div className="linha-2">
            <Campo rotulo="Dia de fechamento" erro={erros.diaFechamento}>
              <input type="number" min="1" max="31" value={form.diaFechamento} onChange={(e) => mudar('diaFechamento', e.target.value)} />
            </Campo>
            <Campo rotulo="Dia de vencimento" erro={erros.diaVencimento}>
              <input type="number" min="1" max="31" value={form.diaVencimento} onChange={(e) => mudar('diaVencimento', e.target.value)} />
            </Campo>
          </div>
          <Campo rotulo="Limite (R$)" erro={erros.limite}>
            <input inputMode="numeric" placeholder="0,00" value={form.limite} onChange={(e) => mudar('limite', mascaraValor(e.target.value))} />
          </Campo>
        </>
      )}
      <div className="acoes-form">
        <button type="button" className="btn" onClick={aoCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar conta'}
        </button>
      </div>
    </form>
  );
}
