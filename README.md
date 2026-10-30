# Orion Prime — Site e protótipo do projeto

Projeto acadêmico com página institucional da Orion Prime e uma página separada para o **Identificador de Decibéis em Cidades para Auxiliar Pessoas com TEA e Problemas Auditivos**.

## Tecnologias escolhidas

- **HTML5, CSS3 e JavaScript:** interface web adaptável a computador e celular.
- **Node.js + Express:** servidor e API REST.
- **Orientação a objetos:** a classe `LeituraDecibeis` valida e classifica as leituras; `LeituraRepository` concentra o acesso ao banco.
- **MySQL:** histórico das leituras.
- **Web Audio API:** captura o áudio do microfone no navegador.
- **Preparação para nuvem:** configurações ficam em variáveis de ambiente e o servidor pode ser implantado em uma hospedagem compatível com Node.js. A implantação em nuvem ainda precisa ser feita.

O enunciado apresenta várias tecnologias separadas por “e/ou”. Este projeto escolhe uma combinação consistente, sem tentar usar Java, Node.js, Python, Kotlin, React Native, MySQL, PostgreSQL, Oracle e MongoDB todos ao mesmo tempo.

## Como abrir no VS Code

### 1. Instale o necessário

- **Node.js 18 ou superior:** https://nodejs.org/
- **MySQL Server** (opcional para visualizar as páginas; necessário para salvar o histórico): https://dev.mysql.com/downloads/mysql/
- **Visual Studio Code:** https://code.visualstudio.com/

### 2. Abra a pasta correta

Extraia o arquivo ZIP. No VS Code, acesse **Arquivo → Abrir Pasta** e selecione a pasta `orion-prime` — aquela que contém `index.html`, `projeto.html` e `package.json`.

### 3. Configure o banco MySQL

1. Abra o MySQL Workbench ou outro cliente MySQL.
2. Abra e execute todo o conteúdo de `database/schema.sql`.
3. Copie `.env.example`, na raiz do projeto, e renomeie a cópia para `.env`.
4. Edite `.env` com o usuário e a senha do seu MySQL. Exemplo local comum:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_do_mysql
DB_NAME=orion_prime
```

Se o usuário `root` não tiver senha no seu ambiente local, deixe `DB_PASSWORD=` vazio. Não publique o arquivo `.env` nem a senha.

### 4. Instale as dependências e inicie

No VS Code, vá a **Terminal → Novo Terminal**. Confirme que o terminal está dentro da pasta `orion-prime` e execute:

```bash
npm install
npm start
```

Quando aparecer `Orion Prime disponível em http://localhost:3000`, abra esse endereço no navegador.

- Página institucional: `http://localhost:3000/`
- Página do projeto: `http://localhost:3000/projeto.html`
- Verificação do servidor e banco: `http://localhost:3000/api/health`

Mantenha o terminal aberto enquanto usa o site. Para encerrar o servidor, pressione `Ctrl + C` no terminal.

### Se você ainda não instalou o MySQL

Você consegue ver a página institucional e a página do projeto iniciando o Node.js normalmente. Sem o banco, a captura do microfone ainda pode ser testada em `localhost`, mas o histórico não será salvo; a página exibirá uma mensagem explicando isso. Para habilitar o histórico, configure o MySQL e execute `database/schema.sql`.

## Onde colocar as fotos dos criadores

Os espaços das cinco fotos já estão preparados. Coloque uma foto de cada integrante na pasta `assets/fotos` usando exatamente estes nomes (formato JPG):

| Integrante | Arquivo |
|---|---|
| Júlio César dos Santos Lima | `julio-cesar.jpg` |
| Marcelo Nunes de Andrade | `marcelo-nunes.jpg` |
| Matheus Shimada Pereira | `matheus-shimada.jpg` |
| Victor de Torres Gomes | `victor-de-torres.jpg` |
| Vinicius Calixto Lopes | `vinicius-calixto.jpg` |

Se a foto não existir, o site mostra as iniciais como espaço reservado. As fotos são recortadas automaticamente para caber nos cartões; o ideal é usar retratos verticais nítidos.

## Como trocar o link do projeto

Na página principal, o banner azul já aponta para `projeto.html`, incluído neste pacote. Se futuramente o projeto for publicado em outro endereço, abra `index.html` e procure o link que contém `class="project-banner"`. Troque `href="projeto.html"` pela URL publicada, mantendo as demais partes do banner.

## Como funciona a medição

A página do projeto pede autorização para usar o microfone. A Web Audio API calcula o nível relativo do sinal em **dBFS** e mostra uma classificação visual. Ao clicar em **Encerrar e salvar**, a interface envia um registro à rota `POST /api/leituras`; a lista recente consulta `GET /api/leituras`.

**Limite importante:** dBFS é uma escala digital relativa, não uma medição de pressão sonora calibrada em dB SPL. O valor muda conforme o microfone, o ganho e a distância. Para medir ruído urbano com precisão, será necessário calibrar o sistema ou usar um sensor acústico apropriado. A integração com sensores IoT externos e a implantação real em nuvem ficam como evolução do protótipo.

## Estrutura de pastas

```text
orion-prime/
├── index.html
├── projeto.html
├── styles.css
├── script.js
├── project.js
├── server.js
├── package.json
├── .env.example
├── assets/
│   ├── orion-prime-logo.png
│   ├── projeto-identificador.png
│   └── fotos/
├── database/
│   └── schema.sql
└── src/
    ├── database.js
    ├── models/
    │   └── LeituraDecibeis.js
    ├── repositories/
    │   └── LeituraRepository.js
    └── routes/
        └── leituras.js
```

## Enviar o projeto ao GitHub

1. Crie um repositório vazio no GitHub com o nome `orion-prime`.
2. No terminal do VS Code, dentro desta pasta, execute:

```bash
git init
git add .
git commit -m "Versao inicial do projeto Orion Prime"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/orion-prime.git
git push -u origin main
```

3. Substitua `SEU-USUARIO` pelo seu usuário do GitHub. Se o Git pedir autenticação, conclua pelo método de login que ele apresentar.

O `.gitignore` evita enviar `node_modules` e `.env` ao repositório. Não coloque senhas reais no GitHub. **O GitHub Pages publica páginas estáticas, mas não executa o servidor Node.js nem o MySQL**; para demonstrar o histórico funcionando on-line, será necessário hospedar a aplicação Node.js e o banco em serviços compatíveis.
