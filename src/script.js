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
            // Se o login for bem-sucedido, armazenar o token
            localStorage.setItem('token', data.token);
            document.getElementById('mensagem').innerText = 'Login bem-sucedido!';

            // Redirecionar para a próxima página
            window.location.href = 'home.html';
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('mensagem').innerText = error.message || 'Erro ao fazer login.';
        });
}







