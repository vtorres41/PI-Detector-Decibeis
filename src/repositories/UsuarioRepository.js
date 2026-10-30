'use strict';

const { pool } = require('../database');

/** Consultas SQL da tabela de usuários. */
class UsuarioRepository {
  async criar({ nome, email, senhaHash }) {
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );
    return { id: result.insertId, nome, email };
  }

  async buscarPorEmail(email) {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  }
}

module.exports = UsuarioRepository;