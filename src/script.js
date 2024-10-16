// Banco de Dados

// CADASTRO:

let nomeCadastro;

function cadastrarUsuario() {
    const nome = document.getElementById('nome').value.toLowerCase();
    const senha = document.getElementById('senha1').value;
    localStorage.setItem('nomeCadastro', nome);

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

// Função para decodificar o token JWT
function obterNomeDoToken(token) {
    // Aqui você pode usar uma biblioteca como jwt-decode para extrair o nome do token
    const payloadBase64 = token.split('.')[1]; // Pega a parte do payload do token
    const payloadDecoded = atob(payloadBase64); // Decodifica de Base64 para string
    const payload = JSON.parse(payloadDecoded); // Converte a string em objeto JSON
    return payload.nome; // Retorna o nome do usuário
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
            const avatarUrl = data.avatar || 'jigsaw.png';
            document.getElementById('profile-img').src = 'img/' + avatarUrl;

            const pontos = data.pontos || 0;
            document.getElementById('pontos').textContent = pontos;

            const qrcodes = data.qrcodes || 0;
            document.getElementById('qrcodes').textContent = qrcodes;

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
        localStorage.setItem('paginaPreLogin', window.location.pathname);
        window.location.href = 'index.html';
        return;
    }
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

    fetch("https://5xwp6h-5000.csb.app/atualizar-senha", {
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


window.onload = function () {
    const botaoCadastrar = document.querySelector("#trocarnome .botao-cadastrar");
    const paginasSemVerificacao = ['cadastro.html', 'login.html', 'index.html', 'avatar.html'];

    atualizarAvatar();

    console.log(window.location.pathname)
    if (window.location.pathname !== '/' && window.location.pathname !== '') {
        if (!paginasSemVerificacao.some(pagina => window.location.pathname.includes(pagina))) {

            verificarLogin();
        }
    }

    if (botaoCadastrar) {
        botaoCadastrar.addEventListener("click", atualizarNome);
    }
};












