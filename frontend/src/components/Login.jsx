import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lerErro } from '../services/api';
import { Campo } from './Ui';

export default function Login() {
  const { token, login } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (token) return <Navigate to="/" replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (!form.email.trim() || !form.senha) {
      setErro('Informe o e-mail e a senha.');
      return;
    }
    setEnviando(true);
    try {
      await login(form.email.trim().toLowerCase(), form.senha);
      navegar('/', { replace: true });
    } catch (err) {
      setErro(lerErro(err).mensagem);
      setEnviando(false);
    }
  }

  return (
    <div className="auth">
      <form className="auth-cartao" onSubmit={enviar} noValidate>
        <div className="marca marca-auth">Finanças</div>
        <h1>Entrar</h1>
        {state?.mensagem && <p className="aviso sucesso">{state.mensagem}</p>}
        {erro && (
          <p className="aviso erro" role="alert">
            {erro}
          </p>
        )}
        <Campo rotulo="E-mail">
          <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Campo>
        <Campo rotulo="Senha">
          <input type="password" autoComplete="current-password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
        </Campo>
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="auth-rodape">
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </form>
    </div>
  );
}
