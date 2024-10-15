// cadastro.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Conectar ao banco de dados
let db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
        return;
    }
    console.log('Conectado ao banco de dados SQLite.');

    // Criar tabela após a conexão
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE,
        senha TEXT,
        avatar TEXT,
        pontos INTEGER DEFAULT 0,
        qrcode INTEGER DEFAULT 0
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar tabela:', err.message);
        }
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Endpoint para cadastrar usuário
app.post('/api/cadastrar', (req, res) => {
    const { nome, senha } = req.body;
    console.log('Recebido:', { nome, senha }); // Log para verificar os dados recebidos

    // Verificação de dados
    if (!nome || !senha) {
        return res.status(400).json({ mensagem: 'Nome e senha são obrigatórios.' });
    }

    // Verifica se o nome já existe
    db.get('SELECT * FROM users WHERE nome = ?', [nome], (err, row) => {
        if (err) {
            console.error('Erro ao verificar nome:', err); // Log do erro
            res.status(500).json({ mensagem: 'Erro no servidor.' });
            return;
        }
        if (row) {
            return res.status(400).json({ mensagem: 'Nome de usuário já existe.' });
        }

        // Insere o novo usuário no banco de dados
        db.run('INSERT INTO users (nome, senha) VALUES (?, ?)', [nome, senha], function (err) {
            if (err) {
                console.error('Erro ao cadastrar usuário:', err); // Log do erro
                res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
                return;
            }
            res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
        });
    });
});
