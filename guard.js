'use strict';

/* Porteiro do projeto.html: sem login, volta pra tela de entrada. */
(function () {
  if (!window.Auth || !Auth.token()) {
    window.location.replace('login.html');
    return;
  }

  // Confere com o servidor se o token ainda vale (ele expira em 2h)
  fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + Auth.token() } })
    .then((resposta) => {
      if (resposta.status === 401) Auth.sair();
    })
    .catch(() => { /* servidor fora do ar: não derruba o usuário */ });

  document.addEventListener('DOMContentLoaded', () => {
    const botao = document.getElementById('btn-sair');
    if (!botao) return;
    const usuario = Auth.usuario();
    if (usuario) botao.title = 'Conectado como ' + usuario.nome;
    botao.addEventListener('click', () => Auth.sair());
  });
})();