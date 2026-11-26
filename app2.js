const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const multer = require('multer');
const crypto = require('crypto');
const {Pool} = require('pg'); 
const app = express();

//caminho dos arquivos
const PastaPublica = path.join(__dirname, 'public');
const PastaDados = path.join(PastaPublica, 'dados');
const ArquivoUsuarios = path.join(PastaDados, 'usuarios.json');
const ArquivoSolicitacoes = path.join(PastaDados, 'solicitacoes.json');
const PastaAnexos = path.join(PastaDados, 'anexos');
//permisão de receber dados JSON do front-end
app.use(express.json());
//bloqueio do acesso publico a pasta dados
app.use('/dados', (req, res, next) => {
  res.sendStatus(404);
});


// A linha abaixo faz a mágica: ela entrega o HTML, CSS e JS da pasta 'public'
app.use(express.static(PastaPublica));
// Garante que a pasta de anexos exista
if (!fs.existsSync(PastaAnexos)) {
    fs.mkdirSync(PastaAnexos, { recursive: true });
}
// Garante que o arquivo de solicitações exista
if (!fs.existsSync(ArquivoSolicitacoes)) {
    fs.writeFileSync(ArquivoSolicitacoes, '[]', 'utf8');
}
//garantia que exista a usuarios.json
if (!fs.existsSync(PastaDados)) {
  fs.mkdirSync(PastaDados,{recursive: true});
}
if (!fs.existsSync(ArquivoUsuarios)) {
    fs.writeFileSync(ArquivoUsuarios, '[]', 'utf8');
}
// Lê os usuários cadastrados
function lerUsuarios() {
    return JSON.parse(fs.readFileSync(ArquivoUsuarios, 'utf8'));
}
// Salva os usuários no JSON
function salvarUsuarios(usuarios) {
    fs.writeFileSync(
        ArquivoUsuarios,
        JSON.stringify(usuarios, null, 2),
        'utf8'
    );
}
// Configuração dos arquivos enviados pelos clientes
const armazenamento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PastaAnexos);
    },
    filename: (req, file, cb) => {
        const extensao = path.extname(file.originalname);
        cb(null, crypto.randomUUID() + extensao);
    }
});
const upload = multer({
    storage: armazenamento,
    limits: {
        fileSize: 20 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const permitido =
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/');
        if (permitido) {
            cb(null, true);
        } else {
            cb(new Error('Envie somente fotos ou vídeos.'));
        }
    }
});
// Lê as solicitações
function lerSolicitacoes() {
    return JSON.parse(
        fs.readFileSync(ArquivoSolicitacoes, 'utf8')
    );
}

// Salva as solicitações
function salvarSolicitacoes(solicitacoes) {
    fs.writeFileSync(
        ArquivoSolicitacoes,
        JSON.stringify(solicitacoes, null, 2),
        'utf8'
    );
}
// Cadastro de cliente ou profissional
app.post('/cadastrar', async (req, res) => {
    try {
        const {
            tipo,
            nome,
            email,
            senha,
            documento,
            contato,
            servico
        } = req.body;

        if (
            !['cliente', 'prestador'].includes(tipo) ||
            !nome?.trim() ||
            !email?.trim() ||
            !senha ||
            !documento?.trim() ||
            !contato?.trim()
        ) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }

        if (tipo === 'prestador' && !servico?.trim()) {
            return res.status(400).json({
                mensagem: 'Informe o serviço oferecido.'
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                mensagem: 'A senha deve ter pelo menos 8 caracteres.'
            });
        }

        const usuarios = lerUsuarios();
        const emailNormalizado = email.trim().toLowerCase();

        const existente = usuarios.some(
            usuario => usuario.email === emailNormalizado
        );

        if (existente) {
            return res.status(409).json({
                mensagem: 'Este e-mail já está cadastrado.'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        const novoUsuario = {
            id: require('crypto').randomUUID(),
            tipo,
            nome: nome.trim(),
            email: emailNormalizado,
            senhaHash,
            documento: documento.trim(),
            contato: contato.trim(),
            servico: tipo === 'prestador' ? servico.trim() : null,
            criadoEm: new Date().toISOString()
        };

        usuarios.push(novoUsuario);
        salvarUsuarios(usuarios);

        return res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso!'
        });
    } catch (erro) {
        console.error('Erro ao cadastrar:', erro);

        return res.status(500).json({
            mensagem: 'Não foi possível concluir o cadastro.'
        });
    }
});

// Validação do login
app.post('/login', async (req, res) => {
    try {
        const { tipo, email, senha } = req.body;

        if (
            !['cliente', 'prestador'].includes(tipo) ||
            !email?.trim() ||
            !senha
        ) {
            return res.status(400).json({
                mensagem: 'Informe o tipo de conta, e-mail e senha.'
            });
        }

        const usuarios = lerUsuarios();
        const emailNormalizado = email.trim().toLowerCase();

        const usuario = usuarios.find(
            item =>
                item.email === emailNormalizado &&
                item.tipo === tipo
        );

        if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
            return res.status(401).json({
                mensagem: 'E-mail ou senha inválidos.'
            });
        }

        return res.json({
            mensagem: 'Login validado com sucesso!',
            usuario: {
                id: usuario.id,
                tipo: usuario.tipo,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (erro) {
        console.error('Erro no login:', erro);

        return res.status(500).json({
            mensagem: 'Não foi possível realizar o login.'
        });
    }
});
// Recebe uma nova solicitação de serviço
app.post('/solicitacoes', (req, res, next) => {
    upload.array('anexos', 5)(req, res, (erro) => {
        if (erro) {
            return res.status(400).json({
                mensagem: erro.message
            });
        }
        next();
    });
}, (req, res) => {
    try {
     const {
            clienteId,
            servico,
            descricao,
            localizacao
        } = req.body;
        // Verifica os campos obrigatórios
        if (
            !clienteId ||
            !servico?.trim() ||
            !descricao?.trim() ||
            !localizacao?.trim()
        ) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos da solicitação.'
            });
        }
        // Verifica se o cliente está cadastrado
        const usuarios = lerUsuarios();
        const cliente = usuarios.find(
            usuario =>
                usuario.id === clienteId &&
                usuario.tipo === 'cliente'
        );
        if (!cliente) {
            return res.status(401).json({
                mensagem: 'Cliente não identificado.'
            });
        }
        const solicitacoes = lerSolicitacoes();
        // Dados da nova solicitação
        const novaSolicitacao = {
            id: crypto.randomUUID(),
            clienteId: cliente.id,
            nomeCliente: cliente.nome,
            servico: servico.trim(),
            descricao: descricao.trim(),
            localizacao: localizacao.trim(),
            anexos: (req.files || []).map(arquivo => ({
                nomeOriginal: arquivo.originalname,
                nomeArquivo: arquivo.filename,
                tipo: arquivo.mimetype,
                tamanho: arquivo.size
            })),
            status: 'aberta',
            criadaEm: new Date().toISOString()
        };
        solicitacoes.push(novaSolicitacao);
        salvarSolicitacoes(solicitacoes);
        return res.status(201).json({
            mensagem: 'Solicitação enviada com sucesso!',
            id: novaSolicitacao.id
        });

    } catch (erro) {
        console.error('Erro ao salvar solicitação:', erro);
        return res.status(500).json({
            mensagem: 'Não foi possível enviar a solicitação.'
        });
    }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log("IJOB está online!");
  console.log(`Servidor iniciado na porta ${PORT}`);
});
