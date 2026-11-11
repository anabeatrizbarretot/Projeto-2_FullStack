import { useState } from 'react';
import { categoriasApi, fontesApi, lancamentosApi } from '../services/servicos';
import { useRequisicao } from '../services/useRequisicao';
import { lerErro } from '../services/api';
import { dataBR, fimDoMes, inicioDoMes, moeda } from '../services/formatadores';
import { Campo, Estado, Modal, PaginaTitulo, Vazio } from './Ui';
import FormLancamento from './FormLancamento';

export default function Lancamentos() {
  const [filtros, setFiltros] = useState({ inicio: inicioDoMes(), fim: fimDoMes(), tipo: '', categoriaId: '', fonteDestinoId: '' });
  const [pagina, setPagina] = useState(1);
  const [formAberto, setFormAberto] = useState(null); // null = fechado; {} = novo; objeto com id = editar
  const [excluindo, setExcluindo] = useState(null);
  const [erroExcluir, setErroExcluir] = useState('');

  const auxiliares = useRequisicao(() => Promise.all([categoriasApi.listar(), fontesApi.listar()]), []);
  const lista = useRequisicao(() => lancamentosApi.listar({ ...filtros, pagina }), [JSON.stringify(filtros), pagina]);
  const [categorias, fontes] = auxiliares.dados ?? [[], []];

  function mudarFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  }

  async function excluir(todasParcelas) {
    setErroExcluir('');
    try {
      await lancamentosApi.excluir(excluindo.id, todasParcelas);
      setExcluindo(null);
      lista.recarregar();
    } catch (err) {
      setErroExcluir(lerErro(err).mensagem);
    }
  }

  const dados = lista.dados;

  return (
    <>
      <PaginaTitulo titulo="Lançamentos" subtitulo="Entradas e saídas do período">
        <button type="button" className="btn btn-primario" disabled={!auxiliares.dados} onClick={() => setFormAberto({})}>
          Novo lançamento
        </button>
      </PaginaTitulo>

      <section className="cartao filtros">
        <Campo rotulo="De">
          <input type="date" value={filtros.inicio} onChange={(e) => mudarFiltro('inicio', e.target.value)} />
        </Campo>
        <Campo rotulo="Até">
          <input type="date" value={filtros.fim} onChange={(e) => mudarFiltro('fim', e.target.value)} />
        </Campo>
        <Campo rotulo="Tipo">
          <select value={filtros.tipo} onChange={(e) => mudarFiltro('tipo', e.target.value)}>
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </Campo>
        <Campo rotulo="Categoria">
          <select value={filtros.categoriaId} onChange={(e) => mudarFiltro('categoriaId', e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Conta">
          <select value={filtros.fonteDestinoId} onChange={(e) => mudarFiltro('fonteDestinoId', e.target.value)}>
            <option value="">Todas</option>
            {fontes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Campo>
      </section>

      <Estado carregando={lista.carregando} erro={lista.erro} aoTentar={lista.recarregar}>
        {dados && (
          <>
            <dl className="totais">
              <div>
                <dt>Entradas</dt>
                <dd className="entrada">{moeda(dados.totais.entradas)}</dd>
              </div>
              <div>
                <dt>Saídas</dt>
                <dd className="saida">{moeda(dados.totais.saidas)}</dd>
              </div>
              <div>
                <dt>Saldo</dt>
                <dd className={Number(dados.totais.saldo) < 0 ? 'saida' : ''}>{moeda(dados.totais.saldo)}</dd>
              </div>
            </dl>

            {dados.itens.length === 0 ? (
              <section className="cartao">
                <Vazio titulo="Nenhum lançamento neste período">Ajuste os filtros ou crie um novo lançamento.</Vazio>
              </section>
            ) : (
              <section className="cartao sem-padding">
                <div className="tabela-rolavel">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Conta</th>
                        <th className="num">Valor</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {dados.itens.map((l) => (
                        <tr key={l.id}>
                          <td>{dataBR(l.data)}</td>
                          <td>
                            {l.descricao}
                            {l.totalParcelas > 1 && <span className="badge">{l.parcelaAtual}/{l.totalParcelas}</span>}
                          </td>
                          <td>{l.categoria?.nome}</td>
                          <td>{l.fonteDestino?.nome}</td>
                          <td className={`num valor ${l.tipo}`}>
                            {l.tipo === 'saida' ? '−' : '+'} {moeda(l.valor)}
                          </td>
                          <td className="acoes">
                            <button type="button" className="btn-link" onClick={() => setFormAberto(l)}>
                              Editar
                            </button>
                            <button type="button" className="btn-link perigo" onClick={() => { setErroExcluir(''); setExcluindo(l); }}>
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <nav className="paginacao" aria-label="Paginação">
              <button type="button" className="btn" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                Anterior
              </button>
              <span>
                Página {dados.pagina} de {dados.totalPaginas}
              </span>
              <button type="button" className="btn" disabled={pagina >= dados.totalPaginas} onClick={() => setPagina(pagina + 1)}>
                Próxima
              </button>
            </nav>
          </>
        )}
      </Estado>

      {formAberto && (
        <Modal titulo={formAberto.id ? 'Editar lançamento' : 'Novo lançamento'} aoFechar={() => setFormAberto(null)}>
          <FormLancamento
            inicial={formAberto}
            categorias={categorias}
            fontes={fontes}
            aoCancelar={() => setFormAberto(null)}
            aoSalvar={() => {
              setFormAberto(null);
              lista.recarregar();
            }}
          />
        </Modal>
      )}

      {excluindo && (
        <Modal titulo="Excluir lançamento" aoFechar={() => setExcluindo(null)}>
          <p>
            Excluir <strong>{excluindo.descricao}</strong> ({moeda(excluindo.valor)})?
            {excluindo.totalParcelas > 1 && ` Esta é a parcela ${excluindo.parcelaAtual} de ${excluindo.totalParcelas}.`}
          </p>
          {erroExcluir && <p className="aviso erro" role="alert">{erroExcluir}</p>}
          <div className="acoes-form">
            <button type="button" className="btn" onClick={() => setExcluindo(null)}>
              Cancelar
            </button>
            {excluindo.totalParcelas > 1 ? (
              <>
                <button type="button" className="btn btn-perigo" onClick={() => excluir(false)}>
                  Só esta parcela
                </button>
                <button type="button" className="btn btn-perigo" onClick={() => excluir(true)}>
                  Todas as parcelas
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-perigo" onClick={() => excluir(false)}>
                Excluir
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
