import Sidebar from './Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ title, children }) {
  const { usuario } = useAuth();
  const nome = usuario?.nome || 'Usuário';
  const iniciais = nome
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="user-chip">
            <span className="avatar">{iniciais}</span>
            {nome}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
