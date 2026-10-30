'use strict';

/* Na navbar da Orion Prime: ENTRAR vira SAIR quando a pessoa já está logada. */
document.addEventListener('DOMContentLoaded', () => {
  const link = document.getElementById('nav-login');
  if (!link || !window.Auth) return;
  const usuario = Auth.usuario();
  if (!usuario) return;

  link.textContent = 'SAIR';
  link.href = '#';
  link.title = 'Conectado como ' + usuario.nome;
  link.addEventListener('click', (evento) => {
    evento.preventDefault();
    Auth.sair();
  });
});