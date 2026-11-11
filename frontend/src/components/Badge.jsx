const tons = {
  Ativa: 'green',
  Ativo: 'green',
  Assinado: 'green',
  'Em convênio': 'blue',
  Enviado: 'blue',
  Pendente: 'amber',
  Inativa: 'gray',
  Inativo: 'gray',
};

export default function Badge({ children }) {
  return <span className={`badge badge-${tons[children] || 'gray'}`}>{children}</span>;
}
