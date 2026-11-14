# Front-end — Projeto 2 (Controle Financeiro)

SPA em React (Vite) que consome a API Express do back-end.

## Como rodar

```bash
cd frontend
npm install
cp .env.example .env     # ajuste VITE_API_URL se o back-end usar outra porta
npm run dev              # http://localhost:5173
```

### Modo mock (sem back-end)

Com `VITE_USAR_MOCK=true` no `.env`, o front usa uma API de mentira em memória
(`src/services/mock.js`), com 3 meses de lançamentos e uma compra parcelada no cartão.
Atalhos para testar erros: senha `errada123` no login (401); e-mail `repetido@exemplo.com`
ou CPF `529.982.247-25` no cadastro (409 junto ao campo).

## Estrutura

```
src/
├── components/   páginas e componentes (Login, Cadastro, Dashboard, Lancamentos,
│                 Categorias, FontesDestinos, Relatorios, Faturas, Layout, Ui...)
├── contexts/     AuthContext (usuário, token, login, logout, cadastrar)
└── services/     api.js (cliente HTTP único), servicos.js (uma função por rota),
                  formatadores.js (moeda, datas, máscaras, CPF), useRequisicao.js, mock.js
```

## Decisões

- **Cliente HTTP único** (`services/api.js`): adiciona `Authorization: Bearer <token>` e, ao receber
  401 fora do login/cadastro, executa o logout e a rota protegida leva ao login.
- **Token** guardado no `localStorage`, então sobrevive ao recarregamento da página.
- **Erros do servidor** no padrão `{ erro, campos }` aparecem junto aos campos (ex.: 409 de CPF/e-mail).
- **Valores monetários** são convertidos com `Number()` antes de exibir, pois o `pg` pode devolver `NUMERIC` como texto.
- Todos os totais, percentuais e faturas vêm calculados do back-end; o front só exibe.

## Bibliotecas (precisam de aprovação do professor)

`axios`, `react-router-dom`, `recharts`.

## Contrato esperado da API

Veja os formatos em `src/services/mock.js` (cada rota devolve o mesmo formato que o mock).
