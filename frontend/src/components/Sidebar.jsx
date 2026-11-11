import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const itens = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/escolas', label: 'Escolas', icon: 'school' },
  { to: '/alunos', label: 'Alunos', icon: 'users' },
  { to: '/documentos', label: 'Documentos', icon: 'file' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">E</div>
        <div>
          <div className="brand-title">ELLP</div>
          <div className="brand-sub">Controle de escolas</div>
        </div>
      </div>
      <nav className="nav">
        {itens.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon name={i.icon} />
            {i.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="nav-item" onClick={logout}>
          <Icon name="logout" />
          Sair
        </button>
      </div>
    </aside>
  );
}
