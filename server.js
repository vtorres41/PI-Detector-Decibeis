'use strict';

require('dotenv').config();
if (!process.env.JWT_SECRET) {
  console.error('Defina JWT_SECRET no arquivo .env antes de iniciar.');
  process.exit(1);
}
const express = require('express');
const path = require('path');
const leiturasRouter = require('./src/routes/leituras');
const authRouter = require('./src/routes/auth');
const autenticar = require('./src/middleware/autenticar');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use('/api/auth', authRouter);
app.use('/api/leituras', autenticar, leiturasRouter);

app.get('/api/health', async (req, res) => {
  try {
    const { pool } = require('./src/database');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'conectado' });
  } catch (error) {
    res.status(503).json({ status: 'indisponivel', database: 'sem conexão' });
  }
});

app.use(express.static(ROOT, { index: 'index.html', extensions: ['html'] }));

app.use((req, res) => {
  res.status(404).send('Página não encontrada.');
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, 'body')) {
    return res.status(400).json({ error: 'O corpo da requisição contém JSON inválido.' });
  }
  console.error('Erro inesperado na aplicação:', error.message);
  return res.status(500).json({ error: 'Ocorreu um erro interno.' });
});

app.listen(PORT, () => {
  console.log(`Orion Prime disponível em http://localhost:${PORT}`);
  console.log('Para habilitar o histórico, configure o MySQL no arquivo .env.');
});
