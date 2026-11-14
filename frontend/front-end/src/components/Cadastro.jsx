import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lerErro } from '../services/api';
import { cpfValido, emailValido, mascaraCpf, senhaValida, soDigitos } from '../services/formatadores';
import { Campo } from './Ui';

const vazio = { nome: '', email: '', cpf: '', senha: '', confirmacao: '' };

export default function Cadastro() {
  const { token, cadastrar } = useAuth();
  const navegar = useNavigate();
  const [form, setForm] = useState(vazio);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  if (token) return <Navigate to="/" replace />;

  function mudar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined, geral: undefined }));
  }

  // A validação do servidor é a que vale; esta só melhora a experiência.
  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe seu nome.';
    if (!emailValido(form.email.trim())) e.email = 'Informe um e-mail válido.';
    if (!cpfValido(form.cpf)) e.cpf = 'CPF inválido. Confira os números.';
    if (!senhaValida(form.senha)) e.senha = 'Use pelo menos 8 caracteres, com letras e números.';
    if (form.confirmacao !== form.senha) e.confirmacao = 'As senhas não são iguais.';
    return e;
  }

  async function enviar(ev) {
    ev.preventDefault();
    const problemas = validar();
    setErros(problemas);
    if (Object.keys(problemas).length) return;

    setEnviando(true);
    try {
      await cadastrar({ nome: form.nome.trim(), email: form.email.trim().toLowerCase(), cpf: soDigitos(form.cpf), senha: form.senha });
      navegar('/login', { replace: true, state: { mensagem: 'Conta criada! Entre com seu e-mail e senha.' } });
    } catch (err) {
      const { mensagem, campos } = lerErro(err);
      // 409: a mensagem aparece junto ao campo duplicado (e-mail ou CPF)
      setErros(Object.keys(campos).length ? campos : { geral: mensagem });
      setEnviando(false);
    }
  }

  return (
    <div className="auth">
      <form className="auth-cartao" onSubmit={enviar} noValidate>
        <div className="marca marca-auth">Finanças</div>
        <h1>Criar conta</h1>
        {erros.geral && (
          <p className="aviso erro" role="alert">
            {erros.geral}
          </p>
        )}
        <Campo rotulo="Nome" erro={erros.nome}>
          <input autoComplete="name" value={form.nome} onChange={(e) => mudar('nome', e.target.value)} />
        </Campo>
        <Campo rotulo="E-mail" erro={erros.email}>
          <input type="email" autoComplete="email" value={form.email} onChange={(e) => mudar('email', e.target.value)} />
        </Campo>
        <Campo rotulo="CPF" erro={erros.cpf}>
          <input inputMode="numeric" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => mudar('cpf', mascaraCpf(e.target.value))} />
        </Campo>
        <Campo rotulo="Senha" erro={erros.senha} dica="Mínimo de 8 caracteres, com letras e números.">
          <input type="password" autoComplete="new-password" value={form.senha} onChange={(e) => mudar('senha', e.target.value)} />
        </Campo>
        <Campo rotulo="Confirmar senha" erro={erros.confirmacao}>
          <input type="password" autoComplete="new-password" value={form.confirmacao} onChange={(e) => mudar('confirmacao', e.target.value)} />
        </Campo>
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
        <p className="auth-rodape">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
