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
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

// Endpoint para login
app.post('/api/login', (req, res) => {
    const { nome, senha } = req.body;

    db.get('SELECT * FROM users WHERE nome = ? AND senha = ?', [nome, senha], (err, row) => {
        if (err) {
            res.status(500).json({ mensagem: 'Erro no servidor.' });
            return;
        }
        if (row) {
            res.status(200).json({ mensagem: 'Login bem-sucedido.' });
        } else {
            res.status(401).json({ mensagem: 'Nome de usuário ou senha incorretos.' });
        }
    });
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Fechar a conexão com o banco de dados ao encerrar o processo
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Conexão com o banco de dados fechada.');
        process.exit(0);
    });
});
