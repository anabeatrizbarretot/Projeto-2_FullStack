import { useCallback, useEffect, useState } from 'react';

// Executa uma função assíncrona e devolve { data, loading, error, reload }.
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let vivo = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn()
      .then((data) => vivo && setState({ data, loading: false, error: '' }))
      .catch((e) => vivo && setState({ data: null, loading: false, error: e.message || 'Erro inesperado.' }));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
