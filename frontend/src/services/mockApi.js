// API de demonstração: guarda tudo no navegador (localStorage).
// Serve para desenvolver e apresentar o front-end sem depender do back-end.
import { escolasSeed, alunosSeed, documentosSeed } from './mockData.js';
import { slug } from '../utils/format.js';

const KEY = 'ellp_mock_db_v1';
const clone = (v) => JSON.parse(JSON.stringify(v));

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* usa os dados iniciais */
  }
  return clone({ escolas: escolasSeed, alunos: alunosSeed, documentos: documentosSeed });
}

let db = load();

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* sem armazenamento disponível */
  }
};
const wait = (valor) => new Promise((resolve) => setTimeout(() => resolve(clone(valor)), 120));
const fail = (msg) => new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), 120));
const nextId = (lista) => lista.reduce((m, i) => Math.max(m, i.id), 0) + 1;
const same = (a, b) => String(a) === String(b);
const nomeEscola = (id) => db.escolas.find((e) => same(e.id, id))?.nome || '—';

const mockApi = {
  // ---------- autenticação ----------
  async login(email, senha) {
    if (email.trim().toLowerCase() === 'admin@ellp.edu.br' && senha === 'admin123') {
      return wait({ token: 'token-demonstracao', usuario: { id: 1, email, nome: 'Coordenação ELLP' } });
    }
    return fail('E-mail ou senha inválidos.');
  },

  // ---------- dashboard ----------
  async getDashboard() {
    const ativos = db.alunos.filter((a) => a.situacao === 'Ativo');
    const pendentes = db.documentos.filter((d) => d.status === 'Pendente');
    return wait({
      totalEscolas: db.escolas.length,
      escolasEmConvenio: db.escolas.filter((e) => e.situacao === 'Em convênio').length,
      totalAlunos: ativos.length,
      instituicoesComAlunos: new Set(ativos.map((a) => a.escolaId)).size,
      documentosPendentes: pendentes.length,
      cartasAEnviar: pendentes.filter((d) => d.tipo === 'Carta convite').length,
      ultimasEscolas: [...db.escolas].sort((a, b) => b.id - a.id).slice(0, 4),
    });
  },

  // ---------- escolas ----------
  async listEscolas() {
    return wait(
      db.escolas.map((e) => ({
        ...e,
        totalAlunos: db.alunos.filter((a) => same(a.escolaId, e.id) && a.situacao === 'Ativo').length,
      }))
    );
  },
  async getEscola(id) {
    const escola = db.escolas.find((e) => same(e.id, id));
    if (!escola) return fail('Escola não encontrada.');
    const totalAlunos = db.alunos.filter((a) => same(a.escolaId, id) && a.situacao === 'Ativo').length;
    return wait({ ...escola, totalAlunos });
  },
  async createEscola(dados) {
    const escola = { ...dados, id: nextId(db.escolas) };
    db.escolas.push(escola);
    save();
    return wait(escola);
  },
  async updateEscola(id, dados) {
    const i = db.escolas.findIndex((e) => same(e.id, id));
    if (i < 0) return fail('Escola não encontrada.');
    db.escolas[i] = { ...db.escolas[i], ...dados, id: db.escolas[i].id };
    save();
    return wait(db.escolas[i]);
  },

  // ---------- alunos ----------
  async listAlunos(escolaId) {
    const lista = db.alunos
      .filter((a) => !escolaId || same(a.escolaId, escolaId))
      .map((a) => ({ ...a, escolaNome: nomeEscola(a.escolaId) }));
    return wait(lista);
  },
  async getAluno(id) {
    const aluno = db.alunos.find((a) => same(a.id, id));
    return aluno ? wait(aluno) : fail('Aluno não encontrado.');
  },
  async createAluno(dados) {
    const aluno = { ...dados, id: nextId(db.alunos), escolaId: Number(dados.escolaId), situacao: dados.situacao || 'Ativo' };
    db.alunos.push(aluno);
    save();
    return wait(aluno);
  },
  async updateAluno(id, dados) {
    const i = db.alunos.findIndex((a) => same(a.id, id));
    if (i < 0) return fail('Aluno não encontrado.');
    db.alunos[i] = { ...db.alunos[i], ...dados, id: db.alunos[i].id, escolaId: Number(dados.escolaId) };
    save();
    return wait(db.alunos[i]);
  },
  async deleteAluno(id) {
    db.alunos = db.alunos.filter((a) => !same(a.id, id));
    save();
    return wait({ ok: true });
  },

  // ---------- documentos ----------
  async listDocumentos(escolaId) {
    const lista = db.documentos
      .filter((d) => !escolaId || same(d.escolaId, escolaId))
      .map((d) => ({ ...d, escolaNome: nomeEscola(d.escolaId) }))
      .sort((a, b) => b.data.localeCompare(a.data));
    return wait(lista);
  },
  // Registra a carta como "Pendente". No modo demonstração não há PDF real:
  // a tela usa a impressão do navegador ("Salvar como PDF").
  async gerarCarta({ escolaId, tipo, data }) {
    const documento = {
      id: nextId(db.documentos),
      tipo,
      escolaId: Number(escolaId),
      data,
      status: 'Pendente',
      arquivo: `${slug(tipo)}_${slug(nomeEscola(escolaId))}.pdf`,
    };
    db.documentos.push(documento);
    save();
    return wait({ documento, blob: null });
  },
};

export default mockApi;
