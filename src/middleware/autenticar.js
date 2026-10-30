'use strict';

const jwt = require('jsonwebtoken');

/** Barra quem não está logado: exige o token no cabeçalho Authorization. */
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Faça login para continuar.' });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: dados.id, nome: dados.nome, email: dados.email };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }
}

module.exports = autenticar;