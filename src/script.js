// Banco de Dados

// CADASTRO:

let nomeCadastro;

function cadastrarUsuario() {
    const nome = document.getElementById('nome').value;
    const senha = document.getElementById('senha1').value;
    nomeCadastro = nome;
    localStorage.setItem('nomeCadastro', nomeCadastro);

    fetch('https://5xwp6h-5000.csb.app/cadastrarUsuario', {
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

function alterarAvatar(av) {
    const avatar = av;
    const nomeCadastro = localStorage.getItem('nomeCadastro');

    // Verificar se o nomeCadastro está definido
    if (!nomeCadastro) {
        document.getElementById('mensagemAvatar').innerText = 'Nome de usuário não encontrado. Cadastre-se primeiro.';
        return;
    }

    fetch('https://5xwp6h-5000.csb.app/alterarAvatar', {
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
                return response.json(); // Trata como JSON se for
            } else {
                return response.text(); // Trata como texto se não for JSON
            }
        })
        .then(data => {
            if (typeof data === 'object') {
                document.getElementById('mensagemAvatar').innerText = data.mensagem || 'Avatar alterado com sucesso!';
            } else {
                document.getElementById('mensagemAvatar').innerText = data; // Para respostas de texto simples
            }
            localStorage.removeItem('nomeCadastro');
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('mensagemAvatar').innerText = error.message || 'Erro ao alterar avatar.';
        });
}

function login() {
    const nome = document.getElementById('nome').value;
    const senha = document.getElementById('senha1').value;
    const paginaPreLogin = localStorage.getItem('paginaPreLogin');

    fetch('https://5xwp6h-5000.csb.app/login', {
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
            if (paginaPreLogin) {
                window.location.href = paginaPreLogin;
            } else {
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
    console.log("Chegou 3")

    if (!token || !userId) {
        console.error('Usuário não está autenticado ou ID do usuário não encontrado.');
        return;
    }

    // Faz uma solicitação para buscar as informações do usuário (incluindo avatar, pontos e QR codes)
    fetch(`https://5xwp6h-5000.csb.app/dadosUsuario/${userId}`, {
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
            // Atualiza a imagem do avatar
            const avatarUrl = data.avatar || 'default.png';
            document.getElementById('profile-img').src = 'img/' + avatarUrl;
            console.log("Chegou 4")
            // Atualiza os pontos
            const pontos = data.pontos || 0;
            document.getElementById('pontos').textContent = pontos;

            // Atualiza os QR codes
            const qrcodes = data.qrcodes || 0;
            document.getElementById('qrcodes').textContent = qrcodes;

            // Atualiza o nome
            const nome = data.nome || "Player";
            document.getElementById('h1').textContent = "Bem-vindo, " + nome + "! Encontre pistas e leia os QR CODEs para somar pontos";

        })
        .catch(error => {
            console.error('Erro:', error);
        });
}

// Função para verificar se o usuário está logado
function verificarLogin() {
    // Verifica se o token está armazenado no localStorage
    const token = localStorage.getItem('token');
    console.log("Chegou 1")

    if (!token) {
        // Se o token não estiver presente, redireciona para a página de login
        localStorage.setItem('paginaPreLogin', window.location.pathname);
        window.location.href = 'index.html';
        return;
    }

    // Decodifica o token para verificar a expiração
    const payload = JSON.parse(atob(token.split('.')[1])); // Decodifica o payload do JWT

    // Verifica a expiração do token de outra forma
    const now = Date.now();
    const expirationTime = payload.exp * 1000; // Converte para milissegundos

    // Verifica se o tempo atual é maior ou igual ao tempo de expiração
    if (now >= expirationTime) {
        // Se o token estiver expirado, redireciona para a página de login
        localStorage.setItem('paginaPreLogin', window.location.pathname);
        window.location.href = 'index.html';
        return;
    }
    console.log("Chegou 2")

    // Se o token for válido, chama a função para atualizar o avatar
    atualizarAvatar();
}

// Função para atualizar o nome do usuário
function atualizarNome() {
    const novoNome = document.getElementById("nome").value; // Pega o nome inserido pelo usuário
    const token = localStorage.getItem("token"); // Pega o token JWT do localStorage

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
    fetch("https://5xwp6h-5000.csb.app/atualizar-nome", {
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
    const novaSenha = document.getElementById("senha").value; // Pega a senha inserido pelo usuário
    const token = localStorage.getItem("token"); // Pega o token JWT do localStorage

    if (!token) {
        console.log("Usuário não está logado.");
        window.location.href = 'index.html'; // Redireciona para login se não houver token
        return;
    }

    // Configura os dados da requisição
    const dados = {
        senha: novaSenha
    };

    // Faz a requisição PUT ao servidor para atualizar a senha
    fetch("https://5xwp6h-5000.csb.app/atualizar-senha", {
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


window.onload = function () {
    const botaoCadastrar = document.querySelector("#trocarnome .botao-cadastrar");
    const botaoCadastrarSenha = document.querySelector("#trocarsenha .botao-cadastrar");
    const paginasSemVerificacao = ['cadastro.html', 'login.html', 'index.html', 'avatar.html'];
    if (!paginasSemVerificacao.some(pagina => window.location.pathname.includes(pagina))) {
        verificarLogin();
    }

    if (botaoCadastrar) {
        botaoCadastrar.addEventListener("click", atualizarNome);
    }
    else if (botaoCadastrarSenha) {
        botaoCadastrarSenha.addEventListener("click", atualizarSenha);
    }

};












