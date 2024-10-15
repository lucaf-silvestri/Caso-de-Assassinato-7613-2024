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

let db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE,
    senha TEXT,
    avatar TEXT,
    pontos INTEGER DEFAULT 0,
    qrcode INTEGER DEFAULT 0
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Endpoint para cadastrar usuário
app.post('/api/cadastrar', (req, res) => {
    const { nome, senha } = req.body;

    // Verifica se o nome já existe
    db.get('SELECT * FROM users WHERE nome = ?', [nome], (err, row) => {
        if (err) {
            res.status(500).json({ mensagem: 'Erro no servidor.' });
            return;
        }
        if (row) {
            return res.status(400).json({ mensagem: 'Nome de usuário já existe.' });
        }

        // Insere o novo usuário no banco de dados
        db.run('INSERT INTO users (nome, senha) VALUES (?, ?)', [nome, senha], function (err) {
            if (err) {
                res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
                return;
            }
            res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
        });
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
