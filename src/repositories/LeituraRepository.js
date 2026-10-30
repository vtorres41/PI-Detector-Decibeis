'use strict';

const { pool } = require('../database');

/** Centraliza as consultas SQL usadas pelo restante da aplicação. */
class LeituraRepository {
  async criar(leitura) {
    const sql = `
      INSERT INTO leituras (nivel_dbfs, classificacao, local_leitura, origem)
      VALUES (?, ?, ?, ?)
    `;
    const values = [leitura.nivelDbfs, leitura.classificacao, leitura.local, leitura.origem];
    const [result] = await pool.execute(sql, values);
    const [rows] = await pool.execute(
      `SELECT id, nivel_dbfs, classificacao, local_leitura, origem, criado_em
       FROM leituras WHERE id = ? LIMIT 1`,
      [result.insertId]
    );
    return this.mapear(rows[0]);
  }

  async listar(limite = 10) {
    const safeLimit = Math.max(1, Math.min(50, Number.parseInt(limite, 10) || 10));
    const [rows] = await pool.query(
      `SELECT id, nivel_dbfs, classificacao, local_leitura, origem, criado_em
       FROM leituras ORDER BY criado_em DESC, id DESC LIMIT ${safeLimit}`
    );
    return rows.map((row) => this.mapear(row));
  }
    async buscarPorId(id) {
    const [rows] = await pool.execute(
      `SELECT id, nivel_dbfs, classificacao, local_leitura, origem, criado_em
       FROM leituras WHERE id = ? LIMIT 1`,
      [id]
    );
    return this.mapear(rows[0]);
  }

  async atualizar(id, leitura) {
    await pool.execute(
      `UPDATE leituras
       SET nivel_dbfs = ?, classificacao = ?, local_leitura = ?, origem = ?
       WHERE id = ?`,
      [leitura.nivelDbfs, leitura.classificacao, leitura.local, leitura.origem, id]
    );
    return this.buscarPorId(id);
  }

  async excluir(id) {
    const [result] = await pool.execute('DELETE FROM leituras WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  mapear(row) {
    if (!row) return null;
    return {
      id: row.id,
      nivelDbfs: Number(row.nivel_dbfs),
      classificacao: row.classificacao,
      local: row.local_leitura,
      origem: row.origem,
      criadoEm: row.criado_em
    };
  }
}

module.exports = LeituraRepository;
