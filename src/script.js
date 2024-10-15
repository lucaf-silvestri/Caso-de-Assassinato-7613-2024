// Banco de Dados

// CADASTRO:

function cadastrarUsuario() {
    const nome = document.getElementById('nome').value;
    const senha = document.getElementById('senha1').value;

    fetch('https://caso-de-assassinato-7613-2024-4n5n7e9qy.vercel.app/api/cadastrar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, senha }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro na requisição: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('mensagem').innerText = data.mensagem;
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('mensagem').innerText = 'Erro ao cadastrar usuário.';
    });
}

