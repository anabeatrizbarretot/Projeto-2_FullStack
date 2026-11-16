// Uma função por rota da API. Se o contrato mudar, o ajuste fica só aqui.
import api from './api';

const dados = (resposta) => resposta.data;
const limpar = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

export const authApi = {
  cadastrar: (corpo) => api.post('/auth/cadastro', corpo).then(dados),
  login: (corpo) => api.post('/auth/login', corpo).then(dados),
  eu: () => api.get('/auth/me').then(dados),
};

export const categoriasApi = {
  listar: () => api.get('/categorias').then(dados),
  criar: (corpo) => api.post('/categorias', corpo).then(dados),
  atualizar: (id, corpo) => api.put(`/categorias/${id}`, corpo).then(dados),
  excluir: (id) => api.delete(`/categorias/${id}`),
};

export const fontesApi = {
  listar: () => api.get('/fontes-destinos').then(dados),
  criar: (corpo) => api.post('/fontes-destinos', corpo).then(dados),
  atualizar: (id, corpo) => api.put(`/fontes-destinos/${id}`, corpo).then(dados),
  excluir: (id) => api.delete(`/fontes-destinos/${id}`),
};

export const lancamentosApi = {
  listar: (filtros) => api.get('/lancamentos', { params: limpar(filtros) }).then(dados),
  criar: (corpo) => api.post('/lancamentos', corpo).then(dados),
  atualizar: (id, corpo) => api.put(`/lancamentos/${id}`, corpo).then(dados),
  excluir: (id, todasParcelas = false) =>
    api.delete(`/lancamentos/${id}`, { params: todasParcelas ? { todasParcelas: true } : {} }),
};

export const relatoriosApi = {
  categorias: (inicio, fim) => api.get('/relatorios/categorias', { params: { inicio, fim } }).then(dados),
  fontesDestinos: (inicio, fim) => api.get('/relatorios/fontes-destinos', { params: { inicio, fim } }).then(dados),
  faturas: (meses = 3) => api.get('/relatorios/faturas', { params: { meses } }).then(dados),
};
