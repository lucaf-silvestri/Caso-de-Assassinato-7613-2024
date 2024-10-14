export default function handler(req, res) {
    if (req.method === 'POST') {
        const { nome, senha } = req.body;

        if (!nome || !senha) {
            return res.status(400).json({ mensagem: 'Nome e senha são obrigatórios!' });
        }

        return res.status(200).json({ mensagem: 'Usuário cadastrado com sucesso!' });
    } else {
        res.status(405).json({ mensagem: 'Método não permitido!' });
    }
}
