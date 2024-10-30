// Novo servidor Node.js
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const crypto = require("crypto");

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require("cors");
app.use(cors());

// Banco de Dados
const sqlite3 = require("sqlite3").verbose();
const DBPATH = "dados.db";
const db = new sqlite3.Database(DBPATH, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
    process.exit(1);
  }
  console.log("Conectado ao banco de dados SQLite.");

  // Criar tabela usuarios
  db.run(
    `CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    avatar TEXT,
    pontos INTEGER NOT NULL DEFAULT 0,
    qrcodes INTEGER NOT NULL DEFAULT 0,
    pergunta1Feita BOOLEAN DEFAULT 0,
    pergunta2Feita BOOLEAN DEFAULT 0,
    pergunta3Feita BOOLEAN DEFAULT 0
  )`,
    (err) => {
      if (err) {
        console.error("Erro ao criar tabela usuarios:", err.message);
      } else {
        console.log("Tabela usuarios pronta.");
      }
    }
  );

  // Criar tabela perguntas
  db.run(
    `CREATE TABLE IF NOT EXISTS perguntas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      texto TEXT UNIQUE NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error("Erro ao criar tabela perguntas:", err.message);
      } else {
        console.log("Tabela perguntas pronta.");
      }
    }
  );

  // Criar tabela respostas
  db.run(
    `CREATE TABLE IF NOT EXISTS respostas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pergunta_id INTEGER NOT NULL,
      texto TEXT NOT NULL,
      correta BOOLEAN NOT NULL,
      FOREIGN KEY (pergunta_id) REFERENCES perguntas(id)
    )`,
    (err) => {
      if (err) {
        console.error("Erro ao criar tabela respostas:", err.message);
      } else {
        console.log("Tabela respostas pronta.");
      }
    }
  );
});

// Criar tabela puzzles
db.run(
  `CREATE TABLE IF NOT EXISTS puzzles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT UNIQUE,
    feito BOOLEAN DEFAULT 0
  )`,
  (err) => {
    if (err) {
      console.error("Erro ao criar tabela puzzles:", err.message);
    } else {
      console.log("Tabela puzzles pronta.");
    }
  }
);

// Criar tabela passosPuzzles
db.run(
  `CREATE TABLE IF NOT EXISTS passosPuzzles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    puzzle_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
  )`,
  (err) => {
    if (err) {
      console.error("Erro ao criar tabela passosPuzzles:", err.message);
    } else {
      console.log("Tabela passosPuzzles pronta.");
    }
  }
);

// Cria a tabela qrcodes
db.run(
  `CREATE TABLE IF NOT EXISTS qrcodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL
)`,
  (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Tabela qrcodes criada com sucesso.");
    }
  }
);

// Cria a tabela qrcodesUsers
db.run(
  `CREATE TABLE IF NOT EXISTS qrcodesUsers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  qrcodeId INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES usuarios(id),
  FOREIGN KEY (qrcodeId) REFERENCES qrcodes(id)
)`,
  (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Tabela qrcodesUsers criada com sucesso.");
    }
  }
);

// Criar tabela home
db.run(
  `CREATE TABLE IF NOT EXISTS home (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT UNIQUE NOT NULL
  )`,
  (err) => {
    if (err) {
      console.error("Erro ao criar tabela perguntas:", err.message);
    } else {
      console.log("Tabela perguntas pronta.");
    }
  }
);

// Endpoint para cadastrar um texto na tabela home
app.post("/home/cadastrar", (req, res) => {
  const { texto } = req.body;

  if (!texto) {
    return res.status(400).json({ error: "Texto é obrigatório." });
  }

  // Insere o texto na tabela home
  const sql = `INSERT INTO home (texto) VALUES (?)`;
  const params = [texto];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res
      .status(201)
      .json({ message: "Texto cadastrado com sucesso", id: this.lastID });
  });
});

// Endpoint para buscar todos os textos da tabela home
app.get("/home", (req, res) => {
  const sql = `SELECT * FROM home`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows); // Retorna todos os registros encontrados
  });
});

// Endpoint para alterar o texto de todas as entradas na tabela home
app.put("/home", (req, res) => {
  const { novoTexto } = req.body; // Obtém o novo texto do corpo da requisição

  // Verifica se o novo texto está definido
  if (typeof novoTexto === "undefined") {
    return res.status(400).json({ error: "Novo texto é obrigatório" });
  }

  // Atualiza o texto para todas as entradas
  const sql = `UPDATE home SET texto = ?`;
  const params = [novoTexto];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Verifica se alguma linha foi afetada
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ message: "Nenhuma entrada encontrada para atualizar" });
    }

    res.json({
      message: "Texto atualizado com sucesso",
      changes: this.changes,
    });
  });
});

// Endpoint para verificar se existe a entrada "homepos" na tabela home
app.get("/home/existe/:texto", (req, res) => {
  const texto = req.params.texto;

  const sql = `SELECT COUNT(*) AS count FROM home WHERE texto = ?`;
  const params = [texto];

  db.get(sql, params, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ existe: row.count > 0 }); // Retorna true se existir, false caso contrário
  });
});

// Cadastro de QR Codes
app.post("/cadastrarQrcode", (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ error: "Nome do QR Code é obrigatório." });
  }

  const query = `INSERT INTO qrcodes (nome) VALUES (?)`;
  db.run(query, [nome], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erro ao cadastrar QR Code: " + err.message });
    }
    res.status(201).json({
      message: "QR Code cadastrado com sucesso!",
      qrcodeId: this.lastID,
    });
  });
});

// Buscar todos os QR Codes
app.get("/buscarQrcodes", (req, res) => {
  db.all(`SELECT * FROM qrcodes`, [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

// Cadastro de QR Codes para Usuários
app.post("/cadastrarQrcodeUser", (req, res) => {
  const { userId, qrcodeId } = req.body;

  if (!userId || !qrcodeId) {
    return res
      .status(400)
      .json({ error: "userId e qrcodeId são obrigatórios." });
  }

  const query = `INSERT INTO qrcodesUsers (userId, qrcodeId) VALUES (?, ?)`;
  db.run(query, [userId, qrcodeId], function (err) {
    if (err) {
      return res.status(500).json({
        error: "Erro ao associar QR Code ao usuário: " + err.message,
      });
    }
    res.status(201).json({
      message: "QR Code associado ao usuário com sucesso!",
      qrcodeUserId: this.lastID,
    });
  });
});

// Buscar todos os QR Codes-Users
app.get("/buscarQrcodesUsers", (req, res) => {
  db.all(`SELECT * FROM qrcodesUsers`, [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

// Cadastro de puzzles
app.post("/cadastrarPuzzle", (req, res) => {
  const { titulo } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: "Título do puzzle é obrigatório." });
  }

  const query = `INSERT INTO puzzles (titulo) VALUES (?)`;
  db.run(query, [titulo], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erro ao cadastrar puzzle: " + err.message });
    }
    res.status(201).json({
      message: "Puzzle cadastrado com sucesso!",
      puzzleId: this.lastID,
    });
  });
});

// Cadastro de passosPuzzles
app.post("/cadastrarPassoPuzzle", (req, res) => {
  const { puzzle_id, texto } = req.body;

  if (!puzzle_id || !texto) {
    return res
      .status(400)
      .json({ error: "Puzzle ID e texto do passo são obrigatórios." });
  }

  const query = `INSERT INTO passosPuzzles (puzzle_id, texto) VALUES (?, ?)`;
  db.run(query, [puzzle_id, texto], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erro ao cadastrar passo do puzzle: " + err.message });
    }
    res.status(201).json({
      message: "Passo do puzzle cadastrado com sucesso!",
      passoId: this.lastID,
    });
  });
});

// Buscar todos os usuários
app.get("/buscarUsuarios", function (req, res) {
  db.all(`SELECT * FROM usuarios`, [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

// Buscar todas as perguntas
app.get("/buscarPerguntas", function (req, res) {
  db.all(`SELECT * FROM perguntas`, [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

// Buscar a quantidade total de perguntas
app.get("/contarPerguntas", function (req, res) {
  db.get(`SELECT COUNT(*) AS count FROM perguntas`, [], (err, row) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ count: row.count }); // Retorna o número de perguntas
    }
  });
});

// Buscar todas as respostas
app.get("/buscarRespostas", function (req, res) {
  db.all(`SELECT * FROM respostas`, [], (err, rows) => {
    // Corrigido para 'respostas'
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

// Rota para obter todas as respostas com base no id da pergunta
app.post("/obterRespostas", function (req, res) {
  const id_pergunta = req.body.id_pergunta;

  // Verificar se o id_pergunta foi fornecido e é um número
  if (typeof id_pergunta !== "number" || !id_pergunta) {
    return res
      .status(400)
      .send("id_pergunta é obrigatório e deve ser um número.");
  }

  db.all(
    "SELECT * FROM respostas WHERE pergunta_id = ?",
    [id_pergunta],
    function (err, rows) {
      if (err) {
        console.error("Erro ao obter as respostas:", err.message); // Log do erro
        return res.status(500).send("Erro ao obter as respostas.");
      }

      if (rows.length > 0) {
        return res.status(200).json(rows);
      } else {
        return res.status(404).send("Nenhuma resposta encontrada.");
      }
    }
  );
});

// Rota para buscar usuário por ID
app.get("/dadosUsuario/:id", function (req, res) {
  const id_usuario = req.params.id;
  db.get(
    "SELECT * FROM usuarios WHERE id = ?",
    [id_usuario],
    function (err, row) {
      if (err) {
        res.status(500).send("Erro ao obter usuário");
      } else {
        if (row) {
          res.status(200).json(row); // Retorna um objeto único
        } else {
          res.status(404).send("Nenhum usuário encontrado");
        }
      }
    }
  );
});

// Endpoint para cadastrar um usuário
app.post("/cadastrarUsuario", function (req, res) {
  // Garantir que o nome seja convertido para minúsculas corretamente
  const nome = req.body.nome ? req.body.nome.toLowerCase() : null;
  const senha = req.body.senha;
  const avatar = req.body.avatar || null;

  if (!nome || !senha) {
    return res.status(400).json({ mensagem: "Nome e senha são obrigatórios." });
  }

  // Hash da senha antes de armazenar
  const hash = crypto.createHash("sha256").update(senha).digest("hex");

  // Verificar se o nome já está registrado
  db.get("SELECT * FROM usuarios WHERE nome = ?", [nome], function (err, row) {
    if (err) {
      return res.status(500).json({ mensagem: "Erro ao verificar nome." });
    }
    if (row) {
      return res
        .status(400)
        .json({ mensagem: "Este nome já está registrado." });
    }

    // Inserir o novo usuário no banco de dados
    const sql = "INSERT INTO usuarios (nome, senha, avatar) VALUES (?, ?, ?)";
    db.run(sql, [nome, hash, avatar], function (err) {
      if (err) {
        return res.status(500).json({ mensagem: "Erro ao criar usuário." });
      }
      return res
        .status(201)
        .json({ mensagem: "Usuário registrado com sucesso." });
    });
  });
});

// Endpoint para cadastrar uma pergunta
app.post("/cadastrarPergunta", function (req, res) {
  const texto = req.body.texto;

  // Verificar se o texto da pergunta foi fornecido
  if (!texto) {
    return res
      .status(400)
      .json({ mensagem: "Texto da pergunta é obrigatório." });
  }

  // Verificar se a pergunta já existe no banco de dados
  db.get(
    "SELECT * FROM perguntas WHERE texto = ?",
    [texto],
    function (err, row) {
      if (err) {
        return res
          .status(500)
          .json({ mensagem: "Erro ao verificar texto.", erro: err.message });
      }
      if (row) {
        return res
          .status(400)
          .json({ mensagem: "Este texto já está registrado." });
      }

      // Inserir nova pergunta
      const sql = "INSERT INTO perguntas (texto) VALUES (?)";
      db.run(sql, [texto], function (err) {
        if (err) {
          return res
            .status(500)
            .json({ mensagem: "Erro ao criar pergunta.", erro: err.message });
        }
        return res
          .status(201)
          .json({ mensagem: "Pergunta registrada com sucesso." });
      });
    }
  );
});

// Cadastrar resposta
app.post("/cadastrarResposta", function (req, res) {
  const pergunta_id = req.body.pergunta_id;
  const texto = req.body.texto;
  const correta = req.body.correta;

  if (pergunta_id === undefined || !texto || correta === undefined) {
    return res
      .status(400)
      .send("pergunta_id, texto e correta são obrigatórios.");
  }

  const sql =
    "INSERT INTO respostas (pergunta_id, texto, correta) VALUES (?, ?, ?)";
  db.run(sql, [pergunta_id, texto, correta ? 1 : 0], function (err) {
    // Armazenar correta como 1 ou 0
    if (err) {
      res.status(500).send("Erro ao criar resposta");
    } else {
      res.status(201).send("Resposta registrada com sucesso");
    }
  });
});

const jwt = require("jsonwebtoken");

//Endpoint de login
app.post("/login", (req, res) => {
  let { nome, senha } = req.body;
  nome = nome.toLowerCase();

  const sql = "SELECT * FROM usuarios WHERE nome = ?";

  db.get(sql, [nome], (err, usuario) => {
    if (err) {
      return res
        .status(500)
        .json({ mensagem: "Erro ao acessar o banco de dados." });
    }

    if (!usuario) {
      return res
        .status(401)
        .json({ mensagem: "Nome de usuário ou senha incorretos." });
    }

    const hash = crypto.createHash("sha256").update(senha).digest("hex");

    if (hash === usuario.senha) {
      const token = jwt.sign(
        {
          id: usuario.id,
          avatar: usuario.avatar,
          pontos: usuario.pontos,
          qrcodes: usuario.qrcodes,
          nome: usuario.nome,
        },
        "sua_chave_secreta", // Chave secreta para assinatura do token
        { expiresIn: "30m" } // Tempo de expiração do token
      );

      // Retorna o token, avatar e id do usuário na resposta
      return res.json({
        mensagem: "Login bem-sucedido!",
        token: token, // Token JWT
        avatar: usuario.avatar, // Avatar do usuário
        id: usuario.id, // ID do usuário
        pontos: usuario.pontos,
        qrcodes: usuario.qrcodes,
        nome: usuario.nome,
      });
    } else {
      return res
        .status(401)
        .json({ mensagem: "Nome de usuário ou senha incorretos." });
    }
  });
});

// Deletar usuário
app.delete("/deletarUsuario", function (req, res) {
  const nome = req.body.nome;
  const senha = req.body.senha;

  // Verificar se o nome e a senha foram fornecidos
  if (!nome || !senha) {
    return res
      .status(400)
      .send("Nome e senha são obrigatórios para deletar a conta.");
  }

  const hash = crypto.createHash("sha256").update(senha).digest("hex");

  db.get(
    "SELECT * FROM usuarios WHERE nome = ? AND senha = ?",
    [nome, hash],
    function (err, row) {
      if (err) {
        return res.status(500).send("Erro ao consultar o banco de dados.");
      }
      if (!row) {
        // Usuário não encontrado ou credenciais incorretas
        return res.status(401).send("Nome ou senha incorretos.");
      }
      // Deletar o usuário do banco de dados
      const sql = "DELETE FROM usuarios WHERE nome = ?";
      db.run(sql, [nome], function (err) {
        if (err) {
          return res.status(500).send("Erro ao deletar a conta.");
        }
        return res.status(200).send("Conta deletada com sucesso.");
      });
    }
  );
});

// Deletar pergunta
app.delete("/deletarPergunta", function (req, res) {
  const id = req.body.id;

  if (!id) {
    return res.status(400).send("ID da pergunta é obrigatório.");
  }

  db.get("SELECT * FROM perguntas WHERE id = ?", [id], function (err, row) {
    if (err) {
      return res.status(500).send("Erro ao consultar o banco de dados.");
    } else {
      if (!row) {
        return res.status(404).send("ID incorreto.");
      } else {
        const sql = "DELETE FROM perguntas WHERE id = ?";
        db.run(sql, [id], function (err) {
          if (err) {
            return res.status(500).send("Erro ao deletar a pergunta.");
          } else {
            return res.status(200).send("Pergunta deletada com sucesso.");
          }
        });
      }
    }
  });
});

// Deletar resposta
app.delete("/deletarResposta", function (req, res) {
  const id = req.body.id;

  if (!id) {
    return res.status(400).send("ID da resposta é obrigatório.");
  }

  db.get("SELECT * FROM respostas WHERE id = ?", [id], function (err, row) {
    if (err) {
      return res.status(500).send("Erro ao consultar o banco de dados.");
    } else {
      if (!row) {
        return res.status(404).send("ID incorreto.");
      } else {
        const sql = "DELETE FROM respostas WHERE id = ?";
        db.run(sql, [id], function (err) {
          if (err) {
            return res.status(500).send("Erro ao deletar a resposta.");
          } else {
            return res.status(200).send("Resposta deletada com sucesso.");
          }
        });
      }
    }
  });
});

// Deletar passo de puzzle
app.delete("/deletarPassoPuzzle/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID do passo é obrigatório." });
  }

  const query = `DELETE FROM passosPuzzles WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erro ao deletar passo do puzzle: " + err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Passo não encontrado." });
    }
    res.status(200).json({ message: "Passo do puzzle deletado com sucesso!" });
  });
});

// Endpoint para buscar todos os puzzles
app.get("/buscarPuzzles", (req, res) => {
  db.all("SELECT * FROM puzzles", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Erro ao buscar puzzles." });
    } else {
      res.status(200).json(rows);
    }
  });
});

// Endpoint para buscar todos os passos dos puzzles
app.get("/buscarPassosPuzzle", (req, res) => {
  db.all("SELECT * FROM passosPuzzles", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Erro ao buscar passos dos puzzles." });
    } else {
      res.status(200).json(rows);
    }
  });
});

// Endpoint para atualizar apenas o avatar do usuário
app.put("/alterarAvatar", function (req, res) {
  const nome = req.body.nome; // Ou você pode usar 'id' se preferir
  const avatar = req.body.avatar;

  if (!nome || !avatar) {
    return res.status(400).send("Nome e avatar são obrigatórios.");
  }

  const sql = "UPDATE usuarios SET avatar = ? WHERE nome = ?";

  db.run(sql, [avatar, nome], function (err) {
    if (err) {
      return res.status(500).send("Erro ao atualizar avatar.");
    }

    if (this.changes === 0) {
      return res.status(404).send("Usuário não encontrado.");
    }

    res.status(200).send("Avatar atualizado com sucesso.");
  });
});

function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ mensagem: "Token não fornecido." });
  }

  const token = authHeader.split(" ")[1]; // Divide "Bearer token" e pega a parte do token

  if (!token) {
    return res.status(403).json({ mensagem: "Token malformado." });
  }

  jwt.verify(token, "sua_chave_secreta", (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ mensagem: "Falha na autenticação do token." });
    }

    req.usuarioId = decoded.id;
    next();
  });
}

// Endpoint para atualizar o nome do usuário
app.put("/atualizar-nome", verificarToken, (req, res) => {
  const { nome } = req.body; // Captura o novo nome do corpo da requisição
  const usuarioId = req.usuarioId; // ID do usuário extraído do token

  // Atualiza o nome no banco de dados
  const sql = "UPDATE usuarios SET nome = ? WHERE id = ?";
  db.run(sql, [nome, usuarioId], function (err) {
    if (err) {
      return res.status(500).json({ mensagem: "Erro ao atualizar o nome." });
    }

    return res.json({ mensagem: "Nome atualizado com sucesso!" });
  });
});

// Endpoint para atualizar a senha do usuário
app.put("/atualizar-senha", verificarToken, (req, res) => {
  const { novaSenha } = req.body; // Captura a nova senha do corpo da requisição
  const usuarioId = req.usuarioId; // ID do usuário extraído do token

  // Verifique se a nova senha foi fornecida
  if (!novaSenha) {
    return res.status(400).json({ mensagem: "Nova senha é obrigatória." });
  }

  // Cria um hash da nova senha usando SHA-256
  const novaSenhaHash = crypto
    .createHash("sha256")
    .update(novaSenha)
    .digest("hex");

  // Atualiza a senha diretamente
  const sqlAtualiza = "UPDATE usuarios SET senha = ? WHERE id = ?";

  db.run(sqlAtualiza, [novaSenhaHash, usuarioId], function (err) {
    if (err) {
      return res.status(500).json({ mensagem: "Erro ao atualizar a senha." });
    }

    return res.json({ mensagem: "Senha atualizada com sucesso!" });
  });
});

// Buscar pergunta pelo ID
app.get("/buscarPergunta/:id", function (req, res) {
  const id = req.params.id; // Pega o ID da URL

  db.get(`SELECT * FROM perguntas WHERE id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).send(err.message);
    } else if (!row) {
      res.status(404).send("Pergunta não encontrada.");
    } else {
      res.json(row);
    }
  });
});

// Buscar o número de pontos de um usuário pelo ID
app.get("/buscarPontos/:id", (req, res) => {
  const userId = req.params.id;

  db.get("SELECT pontos FROM usuarios WHERE id = ?", [userId], (err, row) => {
    if (err) {
      console.error("Erro ao buscar pontos:", err.message);
      res.status(500).send("Erro ao buscar pontos.");
    } else if (!row) {
      res.status(404).send("Usuário não encontrado.");
    } else {
      res.json({ pontos: row.pontos });
    }
  });
});

// Buscar o número de QR codes de um usuário pelo ID
app.get("/buscarQRCodes/:id", (req, res) => {
  const userId = req.params.id;

  db.get("SELECT qrcodes FROM usuarios WHERE id = ?", [userId], (err, row) => {
    if (err) {
      console.error("Erro ao buscar QR codes:", err.message);
      res.status(500).send("Erro ao buscar QR codes.");
    } else if (!row) {
      res.status(404).send("Usuário não encontrado.");
    } else {
      res.json({ qrcodes: row.qrcodes });
    }
  });
});

// Rota para verificar se já existe um QR Code cadastrado para o usuário
app.post("/verificarQrcodeUser", (req, res) => {
  const { qrcodeId, userId } = req.body; // Agora o userId vem do corpo da requisição

  if (!qrcodeId || !userId) {
    return res
      .status(400)
      .json({ error: "qrcodeId e userId são obrigatórios." });
  }

  // Consulta para verificar se já existe um registro na tabela qrcodesUsers
  const query = `SELECT * FROM qrcodesUsers WHERE userId = ? AND qrcodeId = ?`;
  db.get(query, [userId, qrcodeId], (err, row) => {
    if (err) {
      return res.status(500).json({
        error: "Erro ao verificar QR Code: " + err.message,
      });
    }

    if (row) {
      // Se já existe um registro, retornar que o QR Code está cadastrado
      res.json({ exists: true });
    } else {
      // Se não existe, retornar que o QR Code não está cadastrado
      res.json({ exists: false });
    }
  });
});

// Atualizar o número de pontos de um usuário pelo ID
app.put("/atualizarPontos/:id", (req, res) => {
  const userId = req.params.id;
  const novosPontos = req.body.pontos;

  db.run(
    "UPDATE usuarios SET pontos = ? WHERE id = ?",
    [novosPontos, userId],
    function (err) {
      if (err) {
        console.error("Erro ao atualizar pontos:", err.message);
        res.status(500).send("Erro ao atualizar pontos.");
      } else if (this.changes === 0) {
        res.status(404).send("Usuário não encontrado.");
      } else {
        res.send("Pontos atualizados com sucesso.");
      }
    }
  );
});

// Atualizar o número de QR codes de um usuário pelo ID
app.put("/atualizarQRCodes/:id", (req, res) => {
  const userId = req.params.id;
  const novosQRCodes = req.body.qrcodes;

  db.run(
    "UPDATE usuarios SET qrcodes = ? WHERE id = ?",
    [novosQRCodes, userId],
    function (err) {
      if (err) {
        console.error("Erro ao atualizar QR codes:", err.message);
        res.status(500).send("Erro ao atualizar QR codes.");
      } else if (this.changes === 0) {
        res.status(404).send("Usuário não encontrado.");
      } else {
        res.send("QR codes atualizados com sucesso.");
      }
    }
  );
});

// Rota para atualizar todos os puzzles, mudando "feito" de True para False
app.put("/resetPuzzles", (req, res) => {
  // Atualiza todos os puzzles onde "feito" é True (1), mudando para False (0)
  db.run("UPDATE puzzles SET feito = 0 WHERE feito = 1", function (err) {
    if (err) {
      return res.status(500).send("Erro ao resetar puzzles.");
    }

    // Verifica quantas linhas foram alteradas
    if (this.changes === 0) {
      return res.status(404).send("Nenhum puzzle foi atualizado.");
    }

    // Retorna o número de puzzles que foram resetados
    res.json({
      message: `${this.changes} puzzles foram resetados para 'feito = False'.`,
    });
  });
});

// Endpoint para contar a quantidade de puzzles com "feito" = False
app.get("/contarPuzzlesPendentes", (req, res) => {
  const query = `SELECT COUNT(*) AS count FROM puzzles WHERE feito = 0`;

  db.get(query, [], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Erro ao contar puzzles pendentes: " + err.message });
    }
    res.status(200).json({ puzzlesPendentes: row.count });
  });
});

// Rota para buscar o puzzle e seus passos com base no número aleatório
app.get("/getPuzzle", (req, res) => {
  // Busca todos os puzzles onde "feito" é False
  db.all("SELECT * FROM puzzles WHERE feito = 0", (err, puzzles) => {
    if (err) {
      return res.status(500).send("Erro ao buscar puzzles.");
    }

    if (puzzles.length === 0) {
      return res.status(404).send("Nenhum puzzle disponível.");
    }

    // Gera um número aleatório para escolher um puzzle entre os disponíveis
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];

    // Atualiza o campo "feito" para True no puzzle escolhido
    db.run(
      "UPDATE puzzles SET feito = 1 WHERE id = ?",
      [randomPuzzle.id],
      (err) => {
        if (err) {
          return res.status(500).send("Erro ao atualizar puzzle.");
        }

        // Agora busca todos os passos desse puzzle
        db.all(
          "SELECT * FROM passosPuzzles WHERE puzzle_id = ?",
          [randomPuzzle.id],
          (err, passos) => {
            if (err) {
              return res.status(500).send("Erro ao buscar passos.");
            }

            // Retorna o puzzle e seus passos
            res.json({ puzzle: randomPuzzle, passos });
          }
        );
      }
    );
  });
});

// Endpoint para atualizar o status das perguntas
app.put("/usuarios/perguntaTrue", (req, res) => {
  const { id, pergunta } = req.body;

  // Verifica se o id e a pergunta estão definidos
  if (typeof id === "undefined" || typeof pergunta === "undefined") {
    return res.status(400).json({ error: "ID e pergunta são obrigatórios" });
  }

  // Verifica se o id é um número e se a pergunta está entre 1 e 3
  if (isNaN(id) || isNaN(pergunta) || pergunta < 1 || pergunta > 3) {
    return res.status(400).json({
      error: "ID deve ser um número e pergunta deve ser um número entre 1 e 3",
    });
  }

  // Determina qual coluna atualizar com base no número da pergunta
  let coluna;
  switch (pergunta) {
    case 1:
      coluna = "pergunta1Feita";
      break;
    case 2:
      coluna = "pergunta2Feita";
      break;
    case 3:
      coluna = "pergunta3Feita";
      break;
    default:
      return res.status(400).json({ error: "Número da pergunta inválido" });
  }

  // Atualiza a coluna correspondente para True
  const sql = `UPDATE usuarios SET ${coluna} = ? WHERE id = ?`;
  const params = [true, id];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Verifica se alguma linha foi afetada
    if (this.changes === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({ message: "Atualização bem-sucedida", id, pergunta });
  });
});

// Endpoint para atualizar o status das perguntas
app.put("/usuarios/perguntaFalse", (req, res) => {
  const { id, pergunta } = req.body;

  // Verifica se o id e a pergunta estão definidos
  if (typeof id === "undefined" || typeof pergunta === "undefined") {
    return res.status(400).json({ error: "ID e pergunta são obrigatórios" });
  }

  // Verifica se o id é um número e se a pergunta está entre 1 e 3
  if (isNaN(id) || isNaN(pergunta) || pergunta < 1 || pergunta > 3) {
    return res.status(400).json({
      error: "ID deve ser um número e pergunta deve ser um número entre 1 e 3",
    });
  }

  // Determina qual coluna atualizar com base no número da pergunta
  let coluna;
  switch (pergunta) {
    case 1:
      coluna = "pergunta1Feita";
      break;
    case 2:
      coluna = "pergunta2Feita";
      break;
    case 3:
      coluna = "pergunta3Feita";
      break;
    default:
      return res.status(400).json({ error: "Número da pergunta inválido" });
  }

  // Atualiza a coluna correspondente para False
  const sql = `UPDATE usuarios SET ${coluna} = ? WHERE id = ?`;
  const params = [false, id];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Verifica se alguma linha foi afetada
    if (this.changes === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({ message: "Atualização bem-sucedida", id, pergunta });
  });
});

// Endpoint para verificar o status das perguntas de um usuário
app.get("/verificar-perguntas/:id", (req, res) => {
  const userId = req.params.id;

  const query = `SELECT pergunta1Feita, pergunta2Feita, pergunta3Feita FROM usuarios WHERE id = ?`;

  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error("Erro ao acessar o banco de dados:", err.message);
      res.status(500).json({ error: "Erro no servidor" });
      return;
    }

    if (!row) {
      res.status(404).json({ message: "Usuário não encontrado" });
      return;
    }

    res.json({
      pergunta1Feita: row.pergunta1Feita,
      pergunta2Feita: row.pergunta2Feita,
      pergunta3Feita: row.pergunta3Feita,
    });
  });
});

// Endpoint para buscar todos os usuários e seus pontos
app.get("/usuarios/ranking", (req, res) => {
  const sql = `SELECT id, nome, avatar, pontos FROM usuarios ORDER BY pontos DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
