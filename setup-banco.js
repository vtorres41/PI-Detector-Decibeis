require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDB() {
  try {
    console.log('Conectando em:', process.env.DB_HOST);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    });

    console.log('Conectado! Criando tabelas...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS leituras (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        nivel_dbfs DECIMAL(5,1) NOT NULL,
        classificacao VARCHAR(30) NOT NULL,
        local_leitura VARCHAR(100) NOT NULL DEFAULT 'Local não informado',
        origem VARCHAR(100) NOT NULL DEFAULT 'Microfone do navegador',
        criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_leituras_criado_em (criado_em)
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_usuarios_email (email)
      ) ENGINE=InnoDB;
    `);

    console.log('TABELAS CRIADAS COM SUCESSO NA AIVEN!');
    await connection.end();
  } catch (err) {
    console.error('ERRO AO CRIAR TABELAS:', err.message);
  }
}

initDB();