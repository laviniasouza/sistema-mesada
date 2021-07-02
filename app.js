// Carregando módulos
const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require("body-parser");
const app = express();
const categorias = require("./routes/categorias");
const historico = require("./routes/historico");
const solicitacoes_filho = require("./routes/solicitacoes_filho");
const solicitacoes_pai = require("./routes/solicitacoes_pai");
const usuarios = require("./routes/usuarios");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
require("./config/auth")(passport);
const {autenticado} = require("./helpers/autenticado");
const {eAdmin} = require("./helpers/autenticado_admin");
const connection = require("./config/dbconn");

//Configurações
// Sessão
    app.use(session({
        secret: "sistema_mesada",
        resave: true,
        saveUninitialized: true
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

// Middleware
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash("success_msg");
        res.locals.error_msg = req.flash("error_msg");
        res.locals.esqueceu_senha = req.flash("esqueceu_senha");
        res.locals.error = req.flash("error");
        res.locals.user = req.user || null;
        next();
    });

// Handlebars
    app.engine('handlebars', handlebars({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');

// MySQL
connection.connect(function (err) {
    if (err) 
        console.log("Erro ao se conectar:" +err);
    else
        console.log("Conectou!");
});

// Public
    app.use(express.static(path.join(__dirname, "public")));

// Rotas
    app.get('/', (req, res) => {
        res.render('usuarios/login');
    });

    // Body Parser
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    // Verifica se usuário é administrador principal, filho/dependente ou outro responsável
    app.get('/inicio', autenticado, (req, res) => {
        //Administrador
        if (req.user.tipo == 1)
        {
            connection.query("select * from usuario where id = ?", [req.user.id], function(error, rows) {

                if(error) {
                    req.flash("error_msg", "Houve um erro ao buscar os dados "+ error);
                    res.redirect("/");
                }
                else {

                    const sql = "select sum(s.valor) as valortotal "+

                                "from solicitacao as s "+  
                                "inner join usuario as u on u.id = s.id_usuario_filho and u.tipo = 2 "+

                                "where s.id_usuario_pai = ? "+
                                "order by s.data ";

                    connection.query(sql, [req.user.id], function(erros, rowshistorico) {

                        if(erros) {
                            req.flash("error_msg", "Houve um erro interno "+ erros);
                            res.redirect("/");
                        }
                        else {

                            const sqlsolicitacao = "SELECT * "+
                                "from solicitacao "+
                                "where id_usuario_pai = ? and situacao = 1 "+
                                "limit 1 ";

                            connection.query(sqlsolicitacao, [req.user.id], function(erro, rowssolicitacao) {

                                if(erro) {
                                    req.flash("error_msg", "Houve um erro interno "+ erro);
                                    res.redirect("/");
                                }
                                else {
                                    res.render('index_admin', {usuario: rows, historico: rowshistorico, solicitacao: rowssolicitacao });
                                }
                            });
                        }
                    });
                }                    
            }); 
        }
        //Responsável Secundário
        if (req.user.tipo == 2 && req.user.perfil == 'responsavel')
        {
            connection.query("select * from usuario where id = ?", [req.user.id], function(error, rows) {

                if(error) {
                    req.flash("error_msg", "Houve um erro ao buscar os dados "+ error);
                    res.redirect("/");
                }
                else {

                    const sql = "select sum(s.valor) as valortotal "+

                                "from solicitacao as s "+  
                                "inner join usuario as u on u.id = s.id_usuario_filho and u.tipo = 2 "+

                                "where s.id_usuario_pai = ? "+
                                "order by s.data ";

                    connection.query(sql, [req.user.parent], function(erros, rowshistorico) {

                        if(erros) {
                            req.flash("error_msg", "Houve um erro interno "+ erros);
                            res.redirect("/");
                        }
                        else {

                            const sqlsolicitacao = "SELECT * "+
                                "from solicitacao "+
                                "where id_usuario_pai = ? and situacao = 1 "+
                                "limit 1 ";

                            connection.query(sqlsolicitacao, [req.user.parent], function(erro, rowssolicitacao) {

                                if(erro) {
                                    req.flash("error_msg", "Houve um erro interno "+ erro);
                                    res.redirect("/");
                                }
                                else {
                                    res.render('index_responsavel', {usuario: rows, historico: rowshistorico, solicitacao: rowssolicitacao });
                                }
                            });
                        }
                    });
                }
            }); 
        }
        //Dependente
        if (req.user.tipo == 2 && req.user.perfil == 'dependente')
        {
            connection.query("select * from usuario where id = ?", [req.user.id], function(error, rows) {

                if(error) {
                    req.flash("error_msg", "Houve um erro ao buscar os dados "+ error);
                    res.redirect("/");
                }
                else
                res.render('index_dependente', {usuario: rows});
            }); 
        }
    });

    app.get("/404", autenticado, (req, res) => {
        res.send("Erro 404!");
    });

    app.use("/categorias", categorias);
    app.use("/historico", historico);
    app.use("/solicitacoes_filho", solicitacoes_filho);
    app.use("/solicitacoes_pai", solicitacoes_pai);
    app.use("/usuarios", usuarios);

// Outros
const PORT = process.env.PORT ||3000;
app.listen(PORT, () => {
console.log("Servidor rodando!");
});