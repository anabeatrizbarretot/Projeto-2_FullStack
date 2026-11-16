import { useState } from 'react';
import { lancamentosApi } from '../services/servicos';
import { lerErro } from '../services/api';
import { hojeISO, mascaraValor, moeda, numeroParaCampo, paraNumero } from '../services/formatadores';
import { Campo } from './Ui';

export default function FormLancamento({ inicial, categorias, fontes, aoSalvar, aoCancelar }) {
  const edicao = Boolean(inicial?.id);
  const [form, setForm] = useState({
    tipo: inicial?.tipo ?? 'saida',
    descricao: inicial?.descricao ?? '',
    valor: inicial?.valor ? numeroParaCampo(inicial.valor) : '',
    data: inicial?.data ? String(inicial.data).slice(0, 10) : hojeISO(),
    categoriaId: inicial?.categoria?.id ? String(inicial.categoria.id) : '',
    fonteDestinoId: inicial?.fonteDestino?.id ? String(inicial.fonteDestino.id) : '',
    totalParcelas: '1',
  });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const categoriasDoTipo = categorias.filter((c) => c.tipo === form.tipo);
  const fonteEscolhida = fontes.find((f) => String(f.id) === form.fonteDestinoId);
  const permiteParcelas = !edicao && form.tipo === 'saida' && fonteEscolhida?.tipo === 'cartao_credito';
  const parcelas = Number(form.totalParcelas) || 1;

  function mudar(campo, valor, extra = {}) {
    setForm((f) => ({ ...f, [campo]: valor, ...extra }));
    setErros((e) => ({ ...e, [campo]: undefined, geral: undefined }));
  }

  function validar() {
    const e = {};
    if (!form.descricao.trim()) e.descricao = 'Informe a descrição.';
    if (paraNumero(form.valor) <= 0) e.valor = 'O valor deve ser maior que zero.';
    if (!form.data) e.data = 'Informe a data.';
    if (!form.categoriaId) e.categoriaId = 'Escolha uma categoria.';
    if (!form.fonteDestinoId) e.fonteDestinoId = form.tipo === 'saida' ? 'Escolha o destino.' : 'Escolha a fonte.';
    if (permiteParcelas && (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 48)) e.totalParcelas = 'Use de 1 a 48 parcelas.';
    return e;
  }

  async function enviar(ev) {
    ev.preventDefault();
    const problemas = validar();
    setErros(problemas);
    if (Object.keys(problemas).length) return;

    const corpo = {
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor: paraNumero(form.valor),
      data: form.data,
      categoriaId: Number(form.categoriaId),
      fonteDestinoId: Number(form.fonteDestinoId),
      ...(permiteParcelas && parcelas > 1 ? { totalParcelas: parcelas } : {}),
    };

    setEnviando(true);
    try {
      if (edicao) await lancamentosApi.atualizar(inicial.id, corpo);
      else await lancamentosApi.criar(corpo);
      aoSalvar();
    } catch (err) {
      const { mensagem, campos } = lerErro(err);
      setErros(Object.keys(campos).length ? campos : { geral: mensagem });
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {erros.geral && (
        <p className="aviso erro" role="alert">
          {erros.geral}
        </p>
      )}

      <div className="segmentado" role="group" aria-label="Tipo do lançamento">
        {[
          ['saida', 'Saída'],
          ['entrada', 'Entrada'],
        ].map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            className={form.tipo === valor ? `ativo ${valor}` : ''}
            aria-pressed={form.tipo === valor}
            onClick={() => mudar('tipo', valor, { categoriaId: '', fonteDestinoId: '', totalParcelas: '1' })}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <Campo rotulo="Descrição" erro={erros.descricao}>
        <input value={form.descricao} maxLength={120} onChange={(e) => mudar('descricao', e.target.value)} />
      </Campo>

      <div className="linha-2">
        <Campo rotulo={permiteParcelas ? 'Valor total (R$)' : 'Valor (R$)'} erro={erros.valor}>
          <input inputMode="numeric" placeholder="0,00" value={form.valor} onChange={(e) => mudar('valor', mascaraValor(e.target.value))} />
        </Campo>
        <Campo rotulo="Data" erro={erros.data}>
          <input type="date" value={form.data} onChange={(e) => mudar('data', e.target.value)} />
        </Campo>
      </div>

      <div className="linha-2">
        <Campo rotulo="Categoria" erro={erros.categoriaId}>
          <select value={form.categoriaId} onChange={(e) => mudar('categoriaId', e.target.value)}>
            <option value="">Selecione…</option>
            {categoriasDoTipo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo={form.tipo === 'saida' ? 'Destino (de onde sai)' : 'Fonte (de onde vem)'} erro={erros.fonteDestinoId}>
          <select value={form.fonteDestinoId} onChange={(e) => mudar('fonteDestinoId', e.target.value, { totalParcelas: '1' })}>
            <option value="">Selecione…</option>
            {fontes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {permiteParcelas && (
        <Campo
          rotulo="Parcelas"
          erro={erros.totalParcelas}
          dica={parcelas > 1 ? `Serão ${parcelas} parcelas de cerca de ${moeda(paraNumero(form.valor) / parcelas)}.` : 'Deixe 1 para pagar à vista na fatura.'}
        >
          <input type="number" min="1" max="48" value={form.totalParcelas} onChange={(e) => mudar('totalParcelas', e.target.value)} />
        </Campo>
      )}

      <div className="acoes-form">
        <button type="button" className="btn" onClick={aoCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar lançamento'}
        </button>
      </div>
    </form>
  );
}
