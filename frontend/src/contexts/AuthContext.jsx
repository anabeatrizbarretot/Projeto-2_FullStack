import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CHAVE_TOKEN, CHAVE_USUARIO, registrarAoExpirar } from '../services/api';
import { authApi } from '../services/servicos';

const AuthContext = createContext(null);

function lerUsuarioSalvo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // O token fica no localStorage para sobreviver ao recarregamento da página.
  const [token, setToken] = useState(() => localStorage.getItem(CHAVE_TOKEN));
  const [usuario, setUsuario] = useState(lerUsuarioSalvo);

  const logout = useCallback(() => {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    setToken(null);
    setUsuario(null);
  }, []);

  // Quando a API responde 401 (token expirado), o cliente HTTP chama o logout.
  useEffect(() => {
    registrarAoExpirar(logout);
  }, [logout]);

  const login = useCallback(async (email, senha) => {
    const dados = await authApi.login({ email, senha });
    localStorage.setItem(CHAVE_TOKEN, dados.token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados.usuario));
    setToken(dados.token);
    setUsuario(dados.usuario);
  }, []);

  const cadastrar = useCallback((dados) => authApi.cadastrar(dados), []);

  const valor = useMemo(() => ({ token, usuario, login, logout, cadastrar }), [token, usuario, login, logout, cadastrar]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
