
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173'
}));


app.get('/api/health', (req, res) => {
  res.json({
    mensagem: 'API funcionando com sucesso!'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
