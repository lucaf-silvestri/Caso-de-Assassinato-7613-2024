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

async function cadastrarUsuario() {
    const nome = document.getElementById('nome').value;
    const senha1 = document.getElementById('senha1').value;
    const senha2 = document.getElementById('senha2').value;
    const avatar = document.getElementById('avatar').value; // Adicione um campo de input para avatar
    const qrcode = document.getElementById('qrcode').value; // Adicione um campo de input para QR Code

    if (!nome || !senha1 || !senha2 || !avatar || !qrcode) {
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
            body: JSON.stringify({ nome, senha: senha1, avatar, qrcode })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            document.getElementById('mensagem').innerText = "Usuário cadastrado com sucesso!";
            // Redirecionar para outra página após o cadastro
            window.location.href = 'avatar.html'; // ou outra página
        } else {
            document.getElementById('mensagem').innerText = dados.mensagem || 'Erro ao cadastrar!';
        }
    } catch (erro) {
        document.getElementById('mensagem').innerText = "Erro ao conectar ao servidor!";
    }
}

