
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';

const app = express();

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    mensagem: 'API funcionando com sucesso!'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
