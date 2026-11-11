import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { USE_MOCK } from '../services/api.js';

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err) {
      setErro(err.message || 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={enviar}>
        <div className="brand">
          <div className="brand-mark">E</div>
          <div className="brand-title">ELLP</div>
        </div>
        <div>
          <h1>Entrar no sistema</h1>
          <p className="login-sub">Controle de escolas participantes do ELLP</p>
        </div>
        {erro && <p className="error" role="alert">{erro}</p>}
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nome@utfpr.edu.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        {USE_MOCK && <p className="hint">Modo demonstração: admin@ellp.edu.br / admin123</p>}
      </form>
    </div>
  );
}
