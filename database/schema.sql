CREATE DATABASE IF NOT EXISTS orion_prime
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE orion_prime;

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

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

SELECT id, nome, email, senha_hash FROM usuarios;