
import express from 'express';

const router = express.Router();

router.post('/cadastro', (req, res) => {
  res.json({
    mensagem: 'Rota de cadastro funcionando!'
  });
});

export default router;
