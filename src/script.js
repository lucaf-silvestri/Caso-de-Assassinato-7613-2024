// Banco de Dados

// CADASTRO:

let nomeCadastro;

function cadastrarUsuario() {
    const nome = document.getElementById('nome').value.toLowerCase();
    const senha = document.getElementById('senha1').value;
    localStorage.setItem('nomeCadastro', nome);

    fetch('https://5xwp6h-3000.csb.app/cadastrarUsuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, senha }),
    })
        .then(response => {
            if (!response.ok) {
                // Tentar obter a mensagem de erro do servidor
                return response.json().then(errorData => {
                    throw new Error(errorData.mensagem || 'Erro na requisição.');
                });
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('mensagem').innerText = data.mensagem;
            window.location.href = 'avatar.html';
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('mensagem').innerText = error.message || 'Erro ao cadastrar usuário.';
        });
}

function obterNomeDoToken(token) {
    const payloadBase64 = token.split('.')[1];
    const payloadDecoded = atob(payloadBase64);
    const payload = JSON.parse(payloadDecoded);
    return payload.nome;
}

function alterarAvatar(av) {
    const avatar = av;
    const token = localStorage.getItem("token");
    let nomeCadastro = localStorage.getItem('nomeCadastro');

    // Verificar se o nomeCadastro está definido
    if (!nomeCadastro) {
        // Verificar se o usuário está logado (se o token existe)

        if (token) {
            // O usuário está logado, obter o nome do token
            const nomeUsuario = obterNomeDoToken(token);
            nomeCadastro = nomeUsuario;
        } else {
            window.location.href = 'index.html';
        }
    }

    fetch('https://5xwp6h-3000.csb.app/alterarAvatar', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome: nomeCadastro, avatar: avatar }),
    })
        .then(response => {
            // Tenta verificar o tipo de resposta
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            } else {
                return response.text();
            }
        })
        .then(data => {
            if (typeof data === 'object') {
                document.getElementById('mensagemAvatar').innerText = data.mensagem || 'Avatar alterado com sucesso!';
            }
            else {
                document.getElementById('mensagemAvatar').innerText = data; // Para respostas de texto simples
            }
            localStorage.removeItem('nomeCadastro');

            if (token) {
                window.location.href = 'home.html';
            }
            else {
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('mensagemAvatar').innerText = error.message || 'Erro ao alterar avatar.';
        });

}

function login() {
    const nome = document.getElementById('nome').value.toLowerCase();
    const senha = document.getElementById('senha1').value;
    const paginaPreLogin = localStorage.getItem('paginaPreLogin');

    fetch('https://5xwp6h-3000.csb.app/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, senha }),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.mensagem || 'Erro na requisição.');
                });
            }
            return response.json();
        })
        .then(data => {
            // Se o login for bem-sucedido, armazene o token, avatar e id no localStorage
            localStorage.setItem('token', data.token);     // Armazena o token JWT
            localStorage.setItem('avatar', data.avatar);   // Armazena o avatar
            localStorage.setItem('usuarioId', data.id);    // Armazena o ID do usuário
            localStorage.setItem('pontos', data.pontos);
            localStorage.setItem('qrcodes', data.qrcodes);
            localStorage.setItem('nome', data.nome);

            document.getElementById('mensagem').innerText = 'Login bem-sucedido!';
            if (paginaPreLogin != '' && paginaPreLogin != null && paginaPreLogin != undefined) {
                window.location.href = paginaPreLogin;
            } else {
                console.log("Caminho inexistente, redirecionando para a home.")
                window.location.href = "home.html";
            }

        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('mensagem').innerText = error.message || 'Erro ao fazer login.';
        });
}

function atualizarAvatar() {
    // Pega o token e o ID armazenados (assumindo que foram armazenados no login)
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('usuarioId');
    console.log("Chegou 3");

    if (!token || !userId) {
        console.error('Usuário não está autenticado ou ID do usuário não encontrado.');
        return;
    }

    // Faz uma solicitação para buscar as informações do usuário (incluindo avatar, pontos e QR codes)
    fetch(`https://5xwp6h-3000.csb.app/dadosUsuario/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados do usuário.');
            }
            return response.json();
        })
        .then(data => {
            if (window.location.pathname.includes("home.html")) {
                console.log("foi")
                const avatarUrl = data.avatar || 'jigsaw.png';
                document.getElementById('profile-img').src = 'img/' + avatarUrl;

                const pontos = data.pontos || 0;
                document.getElementById('pontos').textContent = pontos;

                const qrcodes = data.qrcodes || 0;
                document.getElementById('qrcodes').textContent = qrcodes;

                const nome = data.nome || "Player";
                document.getElementById('h1').textContent = "Bem-vindo, " + nome + "! Encontre pistas e leia os QR CODEs para somar pontos";
            }
            else if (window.location.pathname.includes("homequiz.html") || window.location.pathname.includes("homepuzzle.html")) {
                console.log("foi")
                const avatarUrl = data.avatar || 'jigsaw.png';
                document.getElementById('profile-img').src = 'img/' + avatarUrl;

                const nome = data.nome || "Player";
                document.getElementById('h1').textContent = "Bem-vindo, " + nome + "! Parece que você encontrou uma pista";
            }
            else if (window.location.pathname.includes("quizerro.html") || window.location.pathname.includes("quizacerto.html")) {
                const avatarUrl = data.avatar || 'jigsaw.png';
                document.getElementById('profile-img').src = 'img/' + avatarUrl;

                const pontos = data.pontos || 0;
                document.getElementById('pontos').textContent = pontos;
            }
            else {
                const avatarUrl = data.avatar || 'jigsaw.png';
                document.getElementById('profile-img').src = 'img/' + avatarUrl;
            }

        })
        .catch(error => {
            console.error('Erro:', error);
        });
}

// Função para verificar se o usuário está logado
function verificarLogin() {
    const token = localStorage.getItem('token');
    console.log("Chegou 1")

    if (!token) {
        localStorage.setItem('paginaPreLogin', window.location.pathname);
        window.location.href = 'index.html';
        return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now();
    const expirationTime = payload.exp * 1000;
    if (now >= expirationTime) {
        localStorage.setItem('paginaPreLogin', window.location.pathname);
        window.location.href = 'index.html';
        return;
    }
}

// Função para atualizar o nome do usuário
function atualizarNome() {
    const novoNome = document.getElementById("nome").value;
    const token = localStorage.getItem("token");

    if (!token) {
        console.log("Usuário não está logado.");
        window.location.href = 'index.html'; // Redireciona para login se não houver token
        return;
    }

    // Configura os dados da requisição
    const dados = {
        nome: novoNome
    };

    // Faz a requisição PUT ao servidor para atualizar o nome
    fetch("https://5xwp6h-3000.csb.app/atualizar-nome", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Adiciona o token no header
        },
        body: JSON.stringify(dados) // Converte os dados para JSON
    })
        .then(response => response.json())
        .then(data => {
            if (data.mensagem) {
                console.log(data.mensagem); // Exibe mensagem de sucesso ou erro

                // Redireciona para a home.html se a atualização for bem-sucedida
                window.location.href = 'home.html';
            } else {
                console.log("Erro ao tentar atualizar o nome.");
            }
        })
        .catch(error => {
            console.error("Erro:", error);
            console.log("Ocorreu um erro ao atualizar o nome.");
        });
}

// Função para atualizar a senha do usuário
function atualizarSenha() {
    const novaSenha = document.getElementById("senha").value;
    const token = localStorage.getItem("token");

    if (!token) {
        console.log("Usuário não está logado.");
        window.location.href = 'index.html';
        return;
    }

    const dados = {
        novaSenha: novaSenha
    };

    fetch("https://5xwp6h-3000.csb.app/atualizar-senha", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(dados)
    })
        .then(response => response.json())
        .then(data => {
            if (data.mensagem) {
                console.log(data.mensagem); // Exibe mensagem de sucesso ou erro

                // Redireciona para a home.html se a atualização for bem-sucedida
                window.location.href = 'home.html';
            } else {
                console.log("Erro ao tentar atualizar a senha.");
            }
        })
        .catch(error => {
            console.error("Erro:", error);
            console.log("Ocorreu um erro ao atualizar a senha.");
        });
}

function deslogar() {
    localStorage.clear();
    window.location.href = "index.html";
}

async function redirecionarQRCode() {
    localStorage.removeItem('sequenciaQuiz');
    localStorage.setItem('sequenciaQuiz', 0);
    let sequenciaQuiz = parseInt(localStorage.getItem('sequenciaQuiz') + 1);
    localStorage.setItem('sequenciaQuiz', sequenciaQuiz);

    if (sequenciaQuiz != 1) {
        voltarHome()
    }
    else {
        await somar(10);
        const token = localStorage.getItem('token');
        const userId = obterIdDoUsuarioPeloToken(token);

        const response = await fetch(`https://5xwp6h-3000.csb.app/buscarQrcodes/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar QR codes.');
        }

        const data = await response.json();
        let qrCodesAtual = data.qrcodes;

        const novosQRCodes = qrCodesAtual + 1;

        const updateResponse = await fetch(`https://5xwp6h-3000.csb.app/atualizarQRCodes/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ qrcodes: novosQRCodes })
        });

        if (!updateResponse.ok) {
            throw new Error('Erro ao atualizar QR codes.');
        }

        const randomNum = Math.floor(Math.random() * 2) + 1;

        if (randomNum === 1) {
            window.location.href = "homepuzzle.html";
        } else {
            window.location.href = "homequiz.html";
        }
    }
}

async function somar(quantidade) {
    const token = localStorage.getItem('token');
    const userId = obterIdDoUsuarioPeloToken(token);

    const response = await fetch(`https://5xwp6h-3000.csb.app/buscarPontos/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar Pontos.');
    }

    const data = await response.json();
    let pontosAtual = data.pontos;

    const novosPontos = pontosAtual + quantidade;

    const updateResponse = await fetch(`https://5xwp6h-3000.csb.app/atualizarPontos/${userId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pontos: novosPontos })
    });

    if (!updateResponse.ok) {
        throw new Error('Erro ao atualizar Pontos.');
    }
}

function obterIdDoUsuarioPeloToken(token) {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = atob(payloadBase64);
    const payload = JSON.parse(decodedPayload);
    return payload.id;
}

// Função para buscar a quantidade de perguntas
async function fetchQuestionCount() {
    try {
        const response = await fetch('https://5xwp6h-3000.csb.app/contarPerguntas');
        if (!response.ok) throw new Error('Erro ao buscar a quantidade de perguntas.');

        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error(error);
    }
}

// Função para buscar a pergunta pelo ID
async function fetchQuestionById(id) {
    try {
        const response = await fetch(`https://5xwp6h-3000.csb.app/buscarPergunta/${id}`); // Altera a URL para o novo endpoint
        if (!response.ok) throw new Error('Erro ao buscar a pergunta.');
        const questionData = await response.json();
        return questionData;
    } catch (error) {
        console.error(error);
    }
}

async function loadQuestion() {
    let sequenciaQuiz = parseInt(localStorage.getItem('sequenciaQuiz') + 1);
    localStorage.setItem('sequenciaQuiz', sequenciaQuiz);

    if (sequenciaQuiz != 11) {
        voltarHome();
    }
    else {
        const questionCount = await fetchQuestionCount();

        if (questionCount) {
            const randomId = Math.floor(Math.random() * questionCount) + 1;
            const question = await fetchQuestionById(randomId);

            if (question) {
                document.querySelector('.pergunta').textContent = question.texto;
                initQuiz(randomId);
            }
        }
    }
}

async function fetchAnswersByQuestionId(questionId) {
    try {
        const response = await fetch('https://5xwp6h-3000.csb.app/obterRespostas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_pergunta: questionId })
        });

        if (!response.ok) throw new Error('Erro ao buscar as respostas.');

        const answers = await response.json();
        return answers;
    } catch (error) {
        console.error(error);
    }
}

function updateQuizUI(answers) {
    const buttonGrid = document.querySelector('.button-grid');
    buttonGrid.innerHTML = '';

    answers.forEach(answer => {
        const button = document.createElement('button');
        button.className = 'grid-button';
        button.textContent = answer.texto;

        button.addEventListener('click', () => {
            testAnswer(answer);
        });
        buttonGrid.appendChild(button);
    });
}

async function testAnswer(answer) {
    if (answer.correta) {
        await somar(5);
        window.location.href = 'quizacerto.html';
    } else {
        await somar(-5);
        window.location.href = 'quizerro.html';
    }
}

async function initQuiz(id) {
    const questionId = id;
    const answers = await fetchAnswersByQuestionId(questionId);

    if (answers) {
        updateQuizUI(answers);
    } else {
        console.error('Nenhuma resposta encontrada.');
    }
}

function voltarHome() {
    window.location.href = 'home.html';
}

window.onload = function () {
    const botaoCadastrar = document.querySelector("#trocarnome .botao-cadastrar");
    const paginasSemVerificacao = ['cadastro.html', 'login.html', 'index.html', 'avatar.html'];
    const currentPage = window.location.pathname.split("/").pop();
    atualizarAvatar();

    console.log(window.location.pathname)
    if (window.location.pathname !== '/' && window.location.pathname !== '') {
        if (!paginasSemVerificacao.some(pagina => window.location.pathname.includes(pagina))) {

            verificarLogin();
            if (currentPage === "qrcode.html") {
                redirecionarQRCode();
            }
            else if (currentPage === "quiz.html") {
                loadQuestion();
            }
        }
    }

    if (botaoCadastrar) {
        botaoCadastrar.addEventListener("click", atualizarNome);
    }
};












