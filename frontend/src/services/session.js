const TOKEN = 'ellp_token';
const USER = 'ellp_user';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN);
  } catch {
    return null;
  }
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER));
  } catch {
    return null;
  }
}

export function setSession(token, usuario) {
  try {
    localStorage.setItem(TOKEN, token);
    localStorage.setItem(USER, JSON.stringify(usuario));
  } catch {
    /* sem armazenamento disponível */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
  } catch {
    /* sem armazenamento disponível */
  }
}
