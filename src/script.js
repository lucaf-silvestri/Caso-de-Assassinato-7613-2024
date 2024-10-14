const profileImg = document.getElementById('profile-img');
const dropdownMenu = document.getElementById('dropdown-menu');

const sqlite3 = require('sqlite3').verbose();

// Conectar ao banco de dados (se não existir, ele será criado no caminho especificado)
let db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

// Criar uma tabela de usuários se ela não existir
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    senha TEXT,
    avatar TEXT,
    pontos INTEGER DEFAULT 0,
    qrcodes_lidos INTEGER DEFAULT 0
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Fechar a conexão com o banco de dados
db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conexão com o banco de dados fechada.');
});


profileImg.addEventListener('click', function () {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
});
window.addEventListener('click', function (event) {
    if (!profileImg.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none';
    }
});

async function login() {
    const nome = document.getElementById('nome').value;
    const senha = document.getElementById('senha1').value;

    if (!nome || !senha) {
        document.getElementById('mensagem').innerText = "Todos os campos são obrigatórios!";
        return;
    }

    try {
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            // Redirecionar para a página inicial após login bem-sucedido
            window.location.href = 'home.html';
        } else {
            document.getElementById('mensagem').innerText = dados.mensagem || 'Erro ao fazer login!';
        }
    } catch (erro) {
        document.getElementById('mensagem').innerText = "Erro ao conectar ao servidor!";
    }
}

async function cadastrarUsuario() {
    const nome = document.getElementById('nome').value;
    const senha1 = document.getElementById('senha1').value;
    const senha2 = document.getElementById('senha2').value;

    if (!nome || !senha1 || !senha2) {
        document.getElementById('mensagem').innerText = "Todos os campos são obrigatórios!";
        return;
    }

    if (senha1 !== senha2) {
        document.getElementById('mensagem').innerText = "As senhas não coincidem!";
        return;
    }

    try {
        const resposta = await fetch('/api/cadastrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, senha: senha1 })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            document.getElementById('mensagem').innerText = "Usuário cadastrado com sucesso!";
            // Redirecionar para outra página após o cadastro
            window.location.href = 'avatar.html';
        } else {
            document.getElementById('mensagem').innerText = dados.mensagem || 'Erro ao cadastrar!';
        }
    } catch (erro) {
        document.getElementById('mensagem').innerText = "Erro ao conectar ao servidor!";
    }
}
