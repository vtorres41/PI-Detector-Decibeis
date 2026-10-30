'use strict';

/**
 * Representa uma leitura experimental capturada pelo microfone do navegador.
 * O valor é expresso em dBFS (escala digital relativa), não em dB SPL calibrado.
 */
class LeituraDecibeis {
  constructor({ nivelDbfs, local = 'Local não informado', origem = 'Microfone do navegador' }) {
    const parsedLevel = Number(nivelDbfs);
    if (!Number.isFinite(parsedLevel) || parsedLevel < -100 || parsedLevel > 0) {
      throw new TypeError('O nível precisa ser um número entre -100 e 0 dBFS.');
    }

    this.nivelDbfs = Math.round(parsedLevel * 10) / 10;
    this.local = String(local || 'Local não informado').trim().slice(0, 100) || 'Local não informado';
    this.origem = String(origem || 'Microfone do navegador').trim().slice(0, 100) || 'Microfone do navegador';
    this.classificacao = this.classificar();
  }

  classificar() {
    if (this.nivelDbfs > -25) return 'Sinal intenso';
    if (this.nivelDbfs > -45) return 'Sinal moderado';
    return 'Sinal baixo';
  }

  toRecord() {
    return {
      nivelDbfs: this.nivelDbfs,
      classificacao: this.classificacao,
      local: this.local,
      origem: this.origem
    };
  }
}

module.exports = LeituraDecibeis;
