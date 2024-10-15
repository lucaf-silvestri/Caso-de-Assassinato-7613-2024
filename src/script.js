const profileImg = document.getElementById('profile-img');
const dropdownMenu = document.getElementById('dropdown-menu');

profileImg.addEventListener('click', function () {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
});
window.addEventListener('click', function (event) {
    if (!profileImg.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none';
    }
});

// Banco de Dados

// CADASTRO:

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
            window.location.href = 'avatar.html';
        } else {
            document.getElementById('mensagem').innerText = dados.mensagem || 'Erro ao cadastrar!';
        }
    } catch (erro) {
        document.getElementById('mensagem').innerText = "Erro ao conectar ao servidor!";
    }
}

