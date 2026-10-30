'use strict';

const express = require('express');
const LeituraDecibeis = require('../models/LeituraDecibeis');
const LeituraRepository = require('../repositories/LeituraRepository');

const router = express.Router();
const repository = new LeituraRepository();

router.get('/', async (req, res) => {
  try {
    const leituras = await repository.listar(req.query.limit);
    return res.json({ leituras });
  } catch (error) {
    console.error('Erro ao consultar leituras:', error.message);
    return res.status(503).json({ error: 'O histórico está indisponível. Verifique a conexão com o MySQL.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const leitura = new LeituraDecibeis({
      nivelDbfs: req.body && req.body.nivelDbfs,
      local: req.body && req.body.local,
      origem: req.body && req.body.origem
    });
    const registro = await repository.criar(leitura);
    return res.status(201).json({ mensagem: 'Leitura registrada.', leitura: registro });
  } catch (error) {
    if (error instanceof TypeError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Erro ao registrar leitura:', error.message);
    return res.status(503).json({ error: 'Não foi possível salvar. Verifique a conexão com o MySQL.' });
  }
});

function lerId(req) {
  const id = Number.parseInt(req.params.id, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/:id', async (req, res) => {
  const id = lerId(req);
  if (!id) return res.status(400).json({ error: 'Identificador inválido.' });
  try {
    const leitura = await repository.buscarPorId(id);
    if (!leitura) return res.status(404).json({ error: 'Leitura não encontrada.' });
    return res.json({ leitura });
  } catch (error) {
    console.error('Erro ao buscar leitura:', error.message);
    return res.status(503).json({ error: 'Não foi possível consultar. Verifique o MySQL.' });
  }
});

router.put('/:id', async (req, res) => {
  const id = lerId(req);
  if (!id) return res.status(400).json({ error: 'Identificador inválido.' });
  try {
    const existente = await repository.buscarPorId(id);
    if (!existente) return res.status(404).json({ error: 'Leitura não encontrada.' });

    const corpo = req.body || {};
    const leitura = new LeituraDecibeis({
      nivelDbfs: corpo.nivelDbfs !== undefined ? corpo.nivelDbfs : existente.nivelDbfs,
      local: corpo.local !== undefined ? corpo.local : existente.local,
      origem: corpo.origem !== undefined ? corpo.origem : existente.origem
    });
    const atualizada = await repository.atualizar(id, leitura);
    return res.json({ mensagem: 'Leitura atualizada.', leitura: atualizada });
  } catch (error) {
    if (error instanceof TypeError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Erro ao atualizar leitura:', error.message);
    return res.status(503).json({ error: 'Não foi possível atualizar. Verifique o MySQL.' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = lerId(req);
  if (!id) return res.status(400).json({ error: 'Identificador inválido.' });
  try {
    const excluida = await repository.excluir(id);
    if (!excluida) return res.status(404).json({ error: 'Leitura não encontrada.' });
    return res.json({ mensagem: 'Leitura excluída.' });
  } catch (error) {
    console.error('Erro ao excluir leitura:', error.message);
    return res.status(503).json({ error: 'Não foi possível excluir. Verifique o MySQL.' });
  }
});

module.exports = router;
