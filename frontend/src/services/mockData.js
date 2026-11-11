// Dados ilustrativos, iguais aos usados no protótipo do Figma.

const rep = (nome, cargo, n) => ({
  nome,
  cargo,
  telefone: `(43) 9000-000${n}`,
  email: `${nome.split(' ')[0].toLowerCase()}@escola.edu.br`,
});

export const escolasSeed = [
  { id: 1, nome: 'Escola Municipal Monteiro Lobato', tipo: 'Escola pública', situacao: 'Ativa', cidade: 'Cornélio Procópio', endereco: 'Rua das Flores, 120', telefone: '(43) 3000-0001', email: 'contato@monteirolobato.edu.br', representante: rep('Marta Souza', 'Diretora', 1) },
  { id: 2, nome: 'Colégio Estadual Dom Pedro II', tipo: 'Escola pública', situacao: 'Em convênio', cidade: 'Bandeirantes', endereco: 'Av. Brasil, 450', telefone: '(43) 3000-0002', email: 'contato@dompedro2.edu.br', representante: rep('João Ribeiro', 'Vice-diretor', 2) },
  { id: 3, nome: 'ONG Futuro Digital', tipo: 'ONG', situacao: 'Ativa', cidade: 'Cornélio Procópio', endereco: 'Rua São Paulo, 88', telefone: '(43) 3000-0003', email: 'contato@futurodigital.org.br', representante: rep('Carla Mendes', 'Coordenadora', 3) },
  { id: 4, nome: 'Creche Pequenos Passos', tipo: 'Creche', situacao: 'Pendente', cidade: 'Santa Mariana', endereco: 'Rua Paraná, 15', telefone: '(43) 3000-0004', email: 'contato@pequenospassos.org.br', representante: rep('Paulo Andrade', 'Diretor', 4) },
  { id: 5, nome: 'Escola Estadual Prof. Ana Maria', tipo: 'Escola pública', situacao: 'Em convênio', cidade: 'Cornélio Procópio', endereco: 'Rua Minas Gerais, 300', telefone: '(43) 3000-0005', email: 'contato@anamaria.edu.br', representante: rep('Fernanda Lima', 'Diretora', 5) },
  { id: 6, nome: 'Escola Municipal Santos Dumont', tipo: 'Escola pública', situacao: 'Inativa', cidade: 'Bandeirantes', endereco: 'Rua Goiás, 77', telefone: '(43) 3000-0006', email: 'contato@santosdumont.edu.br', representante: rep('Ricardo Alves', 'Diretor', 6) },
];

export const alunosSeed = [
  { id: 1, nome: 'Ana Clara Ferreira', escolaId: 1, serie: '6º ano', dataEntrada: '2026-03-12', situacao: 'Ativo' },
  { id: 2, nome: 'Bruno Henrique Costa', escolaId: 1, serie: '7º ano', dataEntrada: '2026-03-12', situacao: 'Ativo' },
  { id: 3, nome: 'Camila Oliveira', escolaId: 1, serie: '5º ano', dataEntrada: '2026-04-25', situacao: 'Ativo' },
  { id: 4, nome: 'Davi Lucas Martins', escolaId: 1, serie: '8º ano', dataEntrada: '2026-04-25', situacao: 'Ativo' },
  { id: 5, nome: 'Eduarda Ramos', escolaId: 1, serie: '6º ano', dataEntrada: '2026-08-10', situacao: 'Inativo' },
  { id: 6, nome: 'Felipe Antunes', escolaId: 2, serie: '9º ano', dataEntrada: '2026-03-20', situacao: 'Ativo' },
  { id: 7, nome: 'Gabriela Torres', escolaId: 2, serie: '8º ano', dataEntrada: '2026-03-20', situacao: 'Ativo' },
  { id: 8, nome: 'Heitor Nunes', escolaId: 3, serie: '7º ano', dataEntrada: '2026-05-05', situacao: 'Ativo' },
  { id: 9, nome: 'Isabela Rocha', escolaId: 3, serie: '6º ano', dataEntrada: '2026-05-05', situacao: 'Ativo' },
  { id: 10, nome: 'João Pedro Lima', escolaId: 4, serie: '2º ano', dataEntrada: '2026-06-01', situacao: 'Ativo' },
  { id: 11, nome: 'Larissa Duarte', escolaId: 5, serie: '9º ano', dataEntrada: '2026-04-02', situacao: 'Ativo' },
  { id: 12, nome: 'Miguel Cardoso', escolaId: 5, serie: '8º ano', dataEntrada: '2026-04-02', situacao: 'Ativo' },
];

export const documentosSeed = [
  { id: 1, tipo: 'Carta convite', escolaId: 1, data: '2026-09-02', status: 'Assinado', arquivo: 'carta_convite_monteiro_lobato.pdf' },
  { id: 2, tipo: 'Convênio', escolaId: 2, data: '2026-08-18', status: 'Assinado', arquivo: 'convenio_dom_pedro_ii.pdf' },
  { id: 3, tipo: 'Carta convite', escolaId: 3, data: '2026-09-29', status: 'Enviado', arquivo: 'carta_convite_futuro_digital.pdf' },
  { id: 4, tipo: 'Convênio', escolaId: 5, data: '2026-09-21', status: 'Enviado', arquivo: 'convenio_ana_maria.pdf' },
  { id: 5, tipo: 'Carta convite', escolaId: 4, data: '2026-10-05', status: 'Pendente', arquivo: '' },
];
