// API real: conversa com o back-end (Node + Express).
// Os caminhos abaixo são uma PROPOSTA. Ajuste conforme as rotas do back-end.
import { getToken } from './session.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(caminho, { method = 'GET', body, blob = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status}`;
    try {
      const erro = await resposta.json();
      mensagem = erro.message || erro.erro || erro.error || mensagem;
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(mensagem);
  }
  if (blob) return resposta.blob();
  if (resposta.status === 204) return null;
  return resposta.json();
}

const query = (params) => {
  const texto = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return texto ? `?${texto}` : '';
};

const httpApi = {
  // ---------- autenticação ----------
  async login(email, senha) {
    const dados = await request('/auth/login', { method: 'POST', body: { email, senha } });
    return {
      token: dados.token,
      usuario: dados.usuario || dados.user || { email, nome: email.split('@')[0] },
    };
  },

  // ---------- dashboard ----------
  getDashboard: () => request('/dashboard'),

  // ---------- escolas ----------
  listEscolas: () => request('/escolas'),
  getEscola: (id) => request(`/escolas/${id}`),
  createEscola: (dados) => request('/escolas', { method: 'POST', body: dados }),
  updateEscola: (id, dados) => request(`/escolas/${id}`, { method: 'PUT', body: dados }),

  // ---------- alunos ----------
  listAlunos: (escolaId) => request(`/alunos${query({ escolaId })}`),
  getAluno: (id) => request(`/alunos/${id}`),
  createAluno: (dados) => request('/alunos', { method: 'POST', body: dados }),
  updateAluno: (id, dados) => request(`/alunos/${id}`, { method: 'PUT', body: dados }),
  deleteAluno: (id) => request(`/alunos/${id}`, { method: 'DELETE' }),

  // ---------- documentos ----------
  listDocumentos: (escolaId) => request(`/documentos${query({ escolaId })}`),
  // Espera que o back-end devolva o PDF da carta (gerado com PDFKit).
  async gerarCarta(dados) {
    const blob = await request('/documentos/carta-convite', { method: 'POST', body: dados, blob: true });
    return { documento: { arquivo: 'carta_convite.pdf' }, blob };
  },
};

export default httpApi;
