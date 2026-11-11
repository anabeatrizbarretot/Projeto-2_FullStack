import { createContext, useContext, useState } from 'react';
import api from '../services/api.js';
import { clearSession, getToken, getUser, setSession } from '../services/session.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => (getToken() ? getUser() : null));

  async function login(email, senha) {
    const { token, usuario: dados } = await api.login(email, senha);
    setSession(token, dados);
    setUsuario(dados);
  }

  function logout() {
    clearSession();
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
