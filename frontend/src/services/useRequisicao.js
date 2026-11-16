import { useEffect, useState } from 'react';
import { lerErro } from './api';

// Executa uma chamada à API e devolve { dados, carregando, erro, recarregar }.
// Refaz a chamada quando algum valor de `deps` muda.
export function useRequisicao(funcao, deps = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: '' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado((atual) => ({ ...atual, carregando: true, erro: '' }));
    funcao()
      .then((dados) => ativo && setEstado({ dados, carregando: false, erro: '' }))
      .catch((e) => ativo && setEstado({ dados: null, carregando: false, erro: lerErro(e).mensagem }));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tentativa]);

  return { ...estado, recarregar: () => setTentativa((t) => t + 1) };
}
