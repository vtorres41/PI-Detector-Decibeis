'use strict';

(function () {
  const CHAVE = 'orionPrimeAuth';

  /** Guarda e consulta o login. Outras páginas também usam. */
  const Auth = {
    salvar(token, usuario, lembrar) {
      this.limpar();
      (lembrar ? localStorage : sessionStorage).setItem(CHAVE, JSON.stringify({ token, usuario }));
    },
    ler() {
      try {
        const bruto = localStorage.getItem(CHAVE) || sessionStorage.getItem(CHAVE);
        return bruto ? JSON.parse(bruto) : null;
      } catch (erro) {
        return null;
      }
    },
    token() {
      const dados = this.ler();
      return dados ? dados.token : null;
    },
    usuario() {
      const dados = this.ler();
      return dados ? dados.usuario : null;
    },
    limpar() {
      localStorage.removeItem(CHAVE);
      sessionStorage.removeItem(CHAVE);
    },
    sair() {
      this.limpar();
      window.location.href = 'login.html';
    }
  };

  window.Auth = Auth;

  // ---- daqui pra baixo, só roda na página de login ----
  const formEntrar = document.getElementById('form-entrar');
  if (!formEntrar) return;

  if (Auth.token()) {
    window.location.replace('projeto.html');
    return;
  }

  const formCadastro = document.getElementById('form-cadastro');
  const formularios = { entrar: formEntrar, cadastro: formCadastro };
  const abas = document.querySelectorAll('.auth-tab');
  const mensagem = document.getElementById('auth-mensagem');

  function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto || '';
    mensagem.className = texto ? 'auth-message is-' + (tipo || 'erro') : 'auth-message';
  }

  function trocarAba(nome) {
    abas.forEach((aba) => {
      const ativa = aba.dataset.aba === nome;
      aba.classList.toggle('is-active', ativa);
      aba.setAttribute('aria-selected', String(ativa));
    });
    Object.keys(formularios).forEach((chave) => {
      formularios[chave].hidden = chave !== nome;
    });
    mostrarMensagem('');
    formularios[nome].querySelector('input').focus();
  }

  abas.forEach((aba) => aba.addEventListener('click', () => trocarAba(aba.dataset.aba)));
  if (window.location.hash === '#cadastro') trocarAba('cadastro');

  document.querySelectorAll('.auth-toggle-senha').forEach((botao) => {
    botao.addEventListener('click', () => {
      const campo = botao.parentElement.querySelector('input');
      const mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      botao.firstElementChild.className = mostrar ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  });

  document.getElementById('esqueci-senha').addEventListener('click', () => {
    mostrarMensagem('A recuperação de senha ainda não está disponível nesta versão do protótipo.', 'info');
  });

  async function enviar(url, corpo, botao) {
    const textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Aguarde...';
    try {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.error || 'Não foi possível concluir.');
      return dados;
    } finally {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  }

  function textoDoErro(erro) {
    return erro instanceof TypeError
      ? 'Não foi possível conectar ao servidor. Ele está rodando?'
      : erro.message;
  }

  formEntrar.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const email = formEntrar.email.value.trim();
    const senha = formEntrar.senha.value;
    const lembrar = formEntrar.lembrar.checked;
    const botao = formEntrar.querySelector('button[type="submit"]');
    try {
      const dados = await enviar('/api/auth/login', { email, senha }, botao);
      Auth.salvar(dados.token, dados.usuario, lembrar);
      mostrarMensagem('Login realizado! Entrando...', 'ok');
      window.location.href = 'projeto.html';
    } catch (erro) {
      mostrarMensagem(textoDoErro(erro));
    }
  });

  formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const nome = formCadastro.nome.value.trim();
    const email = formCadastro.email.value.trim();
    const senha = formCadastro.senha.value;
    if (senha !== formCadastro.confirmar.value) {
      mostrarMensagem('As senhas não conferem.');
      return;
    }
    const botao = formCadastro.querySelector('button[type="submit"]');
    try {
      const dados = await enviar('/api/auth/cadastro', { nome, email, senha }, botao);
      Auth.salvar(dados.token, dados.usuario, false);
      mostrarMensagem('Conta criada! Entrando...', 'ok');
      window.location.href = 'projeto.html';
    } catch (erro) {
      mostrarMensagem(textoDoErro(erro));
    }
  });
})();