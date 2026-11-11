import { useEffect } from 'react';

export const COR_ENTRADA = '#1E8E5A';
export const COR_SAIDA = '#C83E5B';
export const CORES_GRAFICO = ['#4B34A0', '#F2A33A', '#1E8E5A', '#C83E5B', '#2B7FB8', '#8E5BC9', '#6B6384', '#D9822B'];

export function PaginaTitulo({ titulo, subtitulo, children }) {
  return (
    <header className="topo">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="subtitulo">{subtitulo}</p>}
      </div>
      {children && <div className="topo-acoes">{children}</div>}
    </header>
  );
}

export function Campo({ rotulo, erro, dica, children }) {
  return (
    <label className={`campo${erro ? ' com-erro' : ''}`}>
      <span className="rotulo-campo">{rotulo}</span>
      {children}
      {dica && !erro && <small className="dica-campo">{dica}</small>}
      {erro && <small className="erro-campo">{erro}</small>}
    </label>
  );
}

export function Carregando({ texto = 'Carregando…' }) {
  return (
    <p className="estado" role="status">
      {texto}
    </p>
  );
}

export function Vazio({ titulo, children }) {
  return (
    <div className="estado vazio">
      <strong>{titulo}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

export function MensagemErro({ texto, aoTentar }) {
  return (
    <div className="estado erro" role="alert">
      <p>{texto}</p>
      {aoTentar && (
        <button type="button" className="btn" onClick={aoTentar}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

// Mostra "carregando" ou "erro" e, quando está tudo certo, o conteúdo.
export function Estado({ carregando, erro, aoTentar, children }) {
  if (carregando) return <Carregando />;
  if (erro) return <MensagemErro texto={erro} aoTentar={aoTentar} />;
  return children;
}

export function Modal({ titulo, aoFechar, children }) {
  useEffect(() => {
    const aoApertar = (e) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [aoFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <header>
          <h2>{titulo}</h2>
          <button type="button" className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
