const http = require('http');
const path = require('path');
const express = require('express');
const fs = require("fs");
const jwt = require('jsonwebtoken');
const session = require('express-session');

const app = express();
const server = http.createServer(app);

// Configuração do JWT
const JWT_SECRET = 'seu_jwt_secret_aqui'; // Substitua pelo seu JWT secret

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "abc",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mude para true se usar HTTPS
}));

app.set('port', process.env.PORT || 3000);

// Middleware para proteger rotas
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Proteger rotas com o middleware de autenticação
app.use('/Cadastro/*', authenticateToken, (req, res, next) => {
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(app.get('port'), () => {
    console.log('Server na porta', app.get('port'));
});

// Seção de login
app.post('/login', (req, res) => {
    const usuarioscad = fs.readFileSync('./usuarios.json');
    const usuariosparse = JSON.parse(usuarioscad);

    var nome = req.body.nomes;
    var senha = req.body.senha;
    var cpf = req.body.cpf;

    for (var umUsuario of usuariosparse) {
        if (nome === umUsuario.nome && senha === umUsuario.senha && cpf === umUsuario.cpf) {
            // Gera o token JWT
            const token = jwt.sign({ nome: umUsuario.nome }, JWT_SECRET, { expiresIn: '1h' });
            // Armazena o token no localStorage (ou cookie) no frontend
            res.json({ message: 'Conectado', token }); // Envia o token no resposta
            return;
        }
    }
    res.status(401).send('Falhou');
});

// Área de cadastro
app.post('/cadastro', (req, res) => {
    const usuarioscad = fs.readFileSync('./usuarios.json');
    const usuariosparse = JSON.parse(usuarioscad);

    var nomescad = req.body.nomescad;
    var senhacad = req.body.senhacad;
    var cpfcad = req.body.cpfcad;

    const datauser = {
        nome: nomescad,
        senha: senhacad,
        cpf: cpfcad
    };

    usuariosparse.push(datauser);

    fs.writeFile('./usuarios.json', JSON.stringify(usuariosparse, null, 4), (error) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Erro ao salvar usuário');
        }
        res.send('Usuário cadastrado com sucesso');
    });
});