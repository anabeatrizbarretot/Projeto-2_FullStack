import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const links = [
  ['/', 'Resumo'],
  ['/lancamentos', 'Lançamentos'],
  ['/categorias', 'Categorias'],
  ['/contas', 'Contas e cartões'],
  ['/relatorios', 'Relatórios'],
  ['/faturas', 'Faturas'],
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">Finanças</div>
        <nav aria-label="Navegação principal">
          {links.map(([destino, rotulo]) => (
            <NavLink key={destino} to={destino} end={destino === '/'}>
              {rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="usuario">
          <span>{usuario?.nome}</span>
          <button type="button" className="btn-link" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
