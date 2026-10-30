'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioRepository = require('../repositories/UsuarioRepository');
const autenticar = require('../middleware/autenticar');

const router = express.Router();
const repository = new UsuarioRepository();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

router.post('/cadastro', async (req, res) => {
  try {
    const nome = String((req.body && req.body.nome) || '').trim();
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const senha = String((req.body && req.body.senha) || '');

    if (nome.length < 2 || nome.length > 100) {
      return res.status(400).json({ error: 'Informe um nome com 2 a 100 caracteres.' });
    }
    if (!EMAIL_REGEX.test(email) || email.length > 150) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }
    if (senha.length < 8 || senha.length > 72) {
      return res.status(400).json({ error: 'A senha precisa ter de 8 a 72 caracteres.' });
    }

    if (await repository.buscarPorEmail(email)) {
      return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await repository.criar({ nome, email, senhaHash });
    return res.status(201).json({ token: gerarToken(usuario), usuario });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
    }
    console.error('Erro no cadastro:', error.message);
    return res.status(503).json({ error: 'Não foi possível cadastrar. Verifique o MySQL.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const senha = String((req.body && req.body.senha) || '');

    const registro = await repository.buscarPorEmail(email);
    const senhaOk = registro && (await bcrypt.compare(senha, registro.senha_hash));

    if (!senhaOk) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const usuario = { id: registro.id, nome: registro.nome, email: registro.email };
    return res.json({ token: gerarToken(usuario), usuario });
  } catch (error) {
    console.error('Erro no login:', error.message);
    return res.status(503).json({ error: 'Não foi possível entrar. Verifique o MySQL.' });
  }
});

router.get('/me', autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;