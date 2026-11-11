// Ponto único de acesso à API. As telas só importam este arquivo.
// VITE_USE_MOCK=true  -> dados de demonstração (padrão)
// VITE_USE_MOCK=false -> back-end real
import mockApi from './mockApi.js';
import httpApi from './httpApi.js';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const api = USE_MOCK ? mockApi : httpApi;
export default api;
