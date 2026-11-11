import { relatoriosApi } from '../services/servicos';
import { useRequisicao } from '../services/useRequisicao';
import { dataBR, mesPorExtenso, moeda } from '../services/formatadores';
import { Estado, PaginaTitulo, Vazio } from './Ui';

export default function Faturas() {
  const { dados, carregando, erro, recarregar } = useRequisicao(() => relatoriosApi.faturas(3), []);

  return (
    <>
      <PaginaTitulo titulo="Faturas" subtitulo="A fatura atual e a previsão das próximas, com as parcelas futuras" />
      <Estado carregando={carregando} erro={erro} aoTentar={recarregar}>
        {dados && dados.length === 0 && (
          <section className="cartao">
            <Vazio titulo="Nenhum cartão de crédito cadastrado">Cadastre um cartão em Contas e cartões para ver as faturas.</Vazio>
          </section>
        )}
        {dados?.map((cartao) => (
          <Cartao key={cartao.cartaoId} cartao={cartao} />
        ))}
      </Estado>
    </>
  );
}

function Cartao({ cartao }) {
  const limite = Number(cartao.limite);
  const usado = Number(cartao.limiteUtilizado);
  const percentual = limite ? Math.min(100, (usado / limite) * 100) : 0;

  return (
    <section className="cartao fatura-cartao">
      <div className="cartao-topo">
        <h2>{cartao.nome}</h2>
        <span className="limite-texto">
          Disponível <b>{moeda(cartao.limiteDisponivel)}</b> de {moeda(limite)}
        </span>
      </div>
      <div className="barra" role="img" aria-label={`Limite utilizado: ${percentual.toFixed(0)}%`}>
        <i style={{ width: `${percentual}%` }} className={percentual > 80 ? 'alto' : ''} />
      </div>
      <small className="dica-campo">Limite utilizado: {moeda(usado)} (soma de todas as parcelas ainda não vencidas)</small>

      {cartao.faturas.length === 0 ? (
        <Vazio titulo="Sem faturas a vencer">Compras no cartão aparecem aqui.</Vazio>
      ) : (
        cartao.faturas.map((fatura, i) => (
          <details className="fatura" key={fatura.referencia} open={i === 0}>
            <summary>
              <span className="fatura-mes">
                {mesPorExtenso(fatura.referencia)}
                {i === 0 && <span className="badge">Atual</span>}
              </span>
              <span className="fatura-datas">
                Fecha em {dataBR(fatura.fechamento)} — vence em {dataBR(fatura.vencimento)}
              </span>
              <strong>{moeda(fatura.total)}</strong>
            </summary>
            <ul className="lista-simples">
              {fatura.lancamentos.map((l) => (
                <li key={l.id}>
                  <span>
                    {l.descricao}
                    {l.totalParcelas > 1 && (
                      <span className="badge">
                        {l.parcelaAtual}/{l.totalParcelas}
                      </span>
                    )}
                  </span>
                  <span>{moeda(l.valor)}</span>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </section>
  );
}
