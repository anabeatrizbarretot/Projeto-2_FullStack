import { useState } from 'react';
import { categoriasApi } from '../services/servicos';
import { useRequisicao } from '../services/useRequisicao';
import { lerErro } from '../services/api';
import { Campo, Estado, Modal, PaginaTitulo, Vazio } from './Ui';

export default function Categorias() {
  const { dados, carregando, erro, recarregar } = useRequisicao(() => categoriasApi.listar(), []);
  const [editando, setEditando] = useState(null); // {} = nova; objeto com id = editar
  const [excluindo, setExcluindo] = useState(null);
  const [erroExcluir, setErroExcluir] = useState('');

  async function excluir() {
    setErroExcluir('');
    try {
      await categoriasApi.excluir(excluindo.id);
      setExcluindo(null);
      recarregar();
    } catch (err) {
      // 409: categoria com lançamentos associados
      setErroExcluir(lerErro(err).mensagem);
    }
  }

  return (
    <>
      <PaginaTitulo titulo="Categorias" subtitulo="Organize suas entradas e saídas">
        <button type="button" className="btn btn-primario" onClick={() => setEditando({ tipo: 'saida' })}>
          Nova categoria
        </button>
      </PaginaTitulo>

      <Estado carregando={carregando} erro={erro} aoTentar={recarregar}>
        {dados && (
          <div className="grade-2">
            {[
              ['saida', 'Saídas'],
              ['entrada', 'Entradas'],
            ].map(([tipo, titulo]) => {
              const itens = dados.filter((c) => c.tipo === tipo);
              return (
                <section className="cartao" key={tipo}>
                  <h2>{titulo}</h2>
                  {itens.length === 0 ? (
                    <Vazio titulo={`Sem categorias de ${titulo.toLowerCase()}`}>Crie uma para começar a classificar.</Vazio>
                  ) : (
                    <ul className="lista-simples">
                      {itens.map((c) => (
                        <li key={c.id}>
                          <strong>{c.nome}</strong>
                          <span className="acoes">
                            <button type="button" className="btn-link" onClick={() => setEditando(c)}>
                              Editar
                            </button>
                            <button type="button" className="btn-link perigo" onClick={() => { setErroExcluir(''); setExcluindo(c); }}>
                              Excluir
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Estado>

      {editando && (
        <Modal titulo={editando.id ? 'Editar categoria' : 'Nova categoria'} aoFechar={() => setEditando(null)}>
          <FormCategoria
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
        <Modal titulo="Excluir categoria" aoFechar={() => setExcluindo(null)}>
          <p>
            Excluir a categoria <strong>{excluindo.nome}</strong>?
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

function FormCategoria({ inicial, aoSalvar, aoCancelar }) {
  const [form, setForm] = useState({ nome: inicial.nome ?? '', tipo: inicial.tipo ?? 'saida' });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(ev) {
    ev.preventDefault();
    if (!form.nome.trim()) {
      setErros({ nome: 'Informe o nome da categoria.' });
      return;
    }
    setEnviando(true);
    try {
      const corpo = { nome: form.nome.trim(), tipo: form.tipo };
      if (inicial.id) await categoriasApi.atualizar(inicial.id, corpo);
      else await categoriasApi.criar(corpo);
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
        <input value={form.nome} maxLength={60} onChange={(e) => { setForm({ ...form, nome: e.target.value }); setErros({}); }} />
      </Campo>
      <Campo rotulo="Tipo" erro={erros.tipo}>
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
      </Campo>
      <div className="acoes-form">
        <button type="button" className="btn" onClick={aoCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar categoria'}
        </button>
      </div>
    </form>
  );
}
