
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import fontesDestinosRoutes from './routes/fontes-destinos.routes.js';
import lancamentosRoutes from './routes/lancamentos.routes.js';
import relatoriosRoutes from './routes/relatorios.routes.js';
import relatoriosFinanceirosRoutes from './routes/relatorios-financeiros.routes.js';
import {
  rotaNaoEncontrada,
  tratarErros
} from './middlewares/erros.middleware.js';

const app = express();

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use('/api/auth', authRoutes);

app.use('/api/categorias', categoriasRoutes);

app.use('/api/fontes-destinos', fontesDestinosRoutes);

app.use('/api/lancamentos', lancamentosRoutes);

app.use('/api/relatorios', relatoriosRoutes);

app.use('/api/relatorios', relatoriosFinanceirosRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    mensagem: 'API funcionando com sucesso!'
  });
});

app.use(rotaNaoEncontrada);
app.use(tratarErros);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
