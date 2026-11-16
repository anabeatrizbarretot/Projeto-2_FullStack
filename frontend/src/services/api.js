import axios from 'axios';
import { adaptadorMock } from './mock';

export const CHAVE_TOKEN = 'financas:token';
export const CHAVE_USUARIO = 'financas:usuario';

const usarMock = import.meta.env.VITE_USAR_MOCK === 'true';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  ...(usarMock ? { adapter: adaptadorMock } : {}),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CHAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let aoExpirar = null;
export function registrarAoExpirar(funcao) {
  aoExpirar = funcao;
}

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const url = erro.config?.url ?? '';
    const rotaDeAuth = url.includes('/auth/login') || url.includes('/auth/cadastro');
    if (erro.response?.status === 401 && !rotaDeAuth) aoExpirar?.();
    return Promise.reject(erro);
  }
);


export function lerErro(erro) {
  if (!erro.response) {
    return {
      mensagem: 'Não foi possível conectar ao servidor. Verifique se o back-end está rodando.',
      campos: {}
    };
  }

  const dados = erro.response.data;

  return {
    mensagem: dados?.message ?? dados?.erro ?? 'Ocorreu um erro inesperado.',
    campos: dados?.campos ?? {}
  };
}

export default api;
