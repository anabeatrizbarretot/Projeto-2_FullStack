# ELLP · Front-end

Interface web do **Sistema de Controle de Escolas Participantes do ELLP** (React + Vite), feita a partir do protótipo do Figma.

## Como executar

Pré-requisito: [Node.js](https://nodejs.org/) (versão LTS).

```bash
npm install
cp .env.example .env     # no Windows: copy .env.example .env
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

**Acesso de demonstração:** `admin@ellp.edu.br` / `admin123`

## Modo demonstração x back-end real

O front-end funciona de duas formas, controladas pelo arquivo `.env`:

| `VITE_USE_MOCK` | O que acontece |
| --- | --- |
| `true` (padrão) | Usa dados de exemplo guardados no navegador. Não precisa do back-end. |
| `false` | Conversa com o back-end em `VITE_API_URL` (padrão `http://localhost:3000`). |

Todas as telas falam apenas com `src/services/api.js`, então trocar de modo não exige mudar nenhuma tela.

### Ligando ao back-end

1. Coloque `VITE_USE_MOCK=false` no `.env`.
2. Confira o endereço em `VITE_API_URL`.
3. No back-end, libere o CORS para `http://localhost:5173` (pacote `cors` do Express).
4. Ajuste os caminhos em `src/services/httpApi.js` se as rotas do back-end forem diferentes.

Rotas que o front-end espera (**proposta**, combinar com quem faz o back-end):

| Ação | Método e caminho |
| --- | --- |
| Entrar | `POST /auth/login` com `{ email, senha }` e resposta `{ token, usuario }` |
| Dashboard | `GET /dashboard` |
| Escolas | `GET /escolas`, `GET /escolas/:id`, `POST /escolas`, `PUT /escolas/:id` |
| Alunos | `GET /alunos?escolaId=`, `GET /alunos/:id`, `POST /alunos`, `PUT /alunos/:id`, `DELETE /alunos/:id` |
| Documentos | `GET /documentos?escolaId=`, `POST /documentos/carta-convite` (devolve o PDF) |

As requisições autenticadas enviam o cabeçalho `Authorization: Bearer <token>`.

O dashboard espera: `totalEscolas`, `escolasEmConvenio`, `totalAlunos`, `instituicoesComAlunos`, `documentosPendentes`, `cartasAEnviar` e `ultimasEscolas` (lista de escolas). A lista de escolas pode trazer `totalAlunos` em cada item.

## Telas e rotas

| Tela do protótipo | Rota | Arquivo |
| --- | --- | --- |
| Login | `/login` | `src/pages/Login.jsx` |
| Início | `/` | `src/pages/Dashboard.jsx` |
| Lista de escolas | `/escolas` | `src/pages/Escolas.jsx` |
| Cadastro / edição de escola | `/escolas/nova`, `/escolas/:id/editar` | `src/pages/EscolaForm.jsx` |
| Detalhe da escola (abas) | `/escolas/:id` | `src/pages/EscolaDetalhe.jsx` |
| Lista de alunos | `/alunos` | `src/pages/Alunos.jsx` |
| Cadastro / edição de aluno | `/alunos/novo`, `/alunos/:id/editar` | `src/pages/AlunoForm.jsx` |
| Documentos | `/documentos` | `src/pages/Documentos.jsx` |
| Gerar carta convite | `/documentos/carta` | `src/pages/GerarCarta.jsx` |

Todas as rotas, exceto o login, exigem estar autenticado (`PrivateRoute`).

## Estrutura

```
src/
├── components/   # Layout, menu lateral, campos, etiquetas, cartões
├── context/      # AuthContext (login, logout e sessão)
├── hooks/        # useAsync (carregamento de dados)
├── pages/        # uma pasta de telas, uma tela por arquivo
├── services/     # api.js (seletor), mockApi.js, httpApi.js, mockData.js
├── styles/       # global.css (cores e estilos do protótipo)
├── utils/        # formatação de datas
├── App.jsx       # rotas
└── main.jsx
```

## Decisões

- **Visual:** cores, fonte (Inter) e componentes seguem o protótipo do Figma. As cores ficam nas variáveis do início de `src/styles/global.css`.
- **Carta convite:** com o back-end, o PDF gerado pelo PDFKit é baixado. No modo demonstração, o navegador abre a impressão (escolha "Salvar como PDF") e só a carta é impressa.
- **Dados de menores:** o cadastro de aluno pede apenas nome, escola, série e data de entrada (LGPD).
- **Sessão:** o token fica no `localStorage`.

## Ainda não feito

- Paginação das listas (hoje mostram todos os itens).
- Download dos arquivos já registrados na lista de documentos (depende de onde o back-end vai armazená-los).
- Tratamento de token expirado (hoje o usuário precisa sair e entrar de novo).
- Testes automatizados no projeto.
