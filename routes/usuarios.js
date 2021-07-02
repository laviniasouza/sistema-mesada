const express = require("express");
const router = express.Router();
const passport = require("passport");
const connection = require("../config/dbconn");
const bcrypt = require("bcryptjs");
const {eAdmin} = require("../helpers/autenticado_admin");

//VALIDAÇÕES DOS CAMPOS
function validaUsuario(value) {
    var erros = [];

    if (!value.nome || typeof value.nome == undefined || value.nome == null)
        erros.push({texto: "Nome inválido"});

    if (!value.email || typeof value.email == undefined || value.email == null)
        erros.push({texto: "Email inválido"});

    if (!value.senha || typeof value.senha == undefined || value.senha == null)
        erros.push({texto: "Senha inválida"});

    if (value.senha.length < 4)
        erros.push({texto: "Senha muito curta"});

    if (value.senha != value.senha2)
        erros.push({texto: "As senhas não correspondem, tente novamente!"});

    return erros;
}

// Tela de login
router.get("/login", (req, res) => {
    res.render("usuarios/login");
});

// Logar
router.post("/login", (req, res, next) => {

    passport.authenticate("local", {
        successRedirect: "/inicio",
        failureRedirect: "/",
        failureFlash: true
    })(req, res, next)
});

// Deslogar
router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

// Esqueceu sua senha
router.get("/esqueceu_senha", (req, res) => {    
    req.flash("esqueceu_senha", "Esqueceu sua senha? Entre em contato com o suporte técnico! (xx) xxxxx-xxxx");
    res.redirect("/");
});

// Tela de cadastro de administrador/pai
router.get("/addadmin", (req, res) => {
    res.render("usuarios/add_admin");
});

// Cadastrar novo administrador/pai
router.post("/novoadmin", (req, res) => {
    
    // Validação dos campos
    var erros = validaUsuario(req.body);

    if (erros.length > 0)
        res.render("usuarios/add_admin", {erros, erros});
    else {
        connection.query("select * from usuario where email = ?", [req.body.email], function(error, rows) {
            
            if(error) {
                req.flash("error_msg", "Houve um erro interno "+ error);
                res.redirect("/");
            }

            if(rows.length > 0) { 
                req.flash("error_msg", "Já existe uma conta com este usuário no nosso sistema");
                res.redirect("/usuarios/addadmin");
            }
            else {
                //Criptografa senha
                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(req.body.senha, salt, (erro, hash) => {

                        if(erro) {
                            console.log("Erro na criptografia "+ erro);
                            req.flash("error_msg", "Houve um erro interno "+ err);
                            res.redirect("/");
                        }
                    
                        var senha = hash; //senha do usuario recebe hash, encriptado

                        //Grava usuário
                        const sql = "INSERT INTO usuario(parent, tipo, perfil, nome, email, senha) VALUES ?";
                        const values = [
                            [0, 1, 'responsavel', req.body.nome, req.body.email, senha]
                        ];

                        connection.query(sql, [values], function (error, results, fields) {

                            if(error) {
                                req.flash("error_msg", "Houve um erro ao criar o usuário, tente novamente! "+ error);
                                res.redirect("/usuarios/addadmin");
                            }

                            req.flash("success_msg", "Usuário criado com sucesso!");
                            res.redirect("/");
                        });
                    });
                });
            }
        });
    }
});

// Botão minha conta, redireciona para página do administrador/pai
router.get("/admin", eAdmin, (req, res) => {

    connection.query("select * from usuario where id = ?", [req.user.id], function(error, rows) {

        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar os dados "+ error);
            res.redirect("/inicio");
        }
        else
            res.render("usuarios/admin", {usuario: rows});
    }); 
});

// Botão de editar administrador/pai, redireciona para página de edição
router.get("/editaradmin/:id", eAdmin, (req, res) => {

    connection.query("select * from usuario where id = ?", [req.params.id], function(error, rows) {

        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar os dados "+ error);
            res.redirect("/usuarios/admin");
        }
        else
            res.render("usuarios/edit_admin", {usuario: rows});
    }); 
});

// Editar administrador/pai
router.post("/editaradmin", eAdmin, (req, res) => {
    
    connection.query("select * from usuario where id = ?", [req.body.id], function(error, rows) {
       
        var erros = validaUsuario(req.body);

        if (erros.length > 0)
            res.render("usuarios/admin", {usuario: rows, erros: erros});
        else {

            //Encriptação da senha
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(req.body.senha, salt, (erro, hash) => {
                    
                    if(erro) {
                        req.flash("error_msg", "Houve um erro durante o salvamento "+ erro);
                        res.redirect("/usuarios/admin");
                    }

                    var senha = hash; //senha do usuario recebe hash, encriptado

                    const sql = "UPDATE usuario SET nome = ?, email = ?, senha = ? WHERE id = ?";
                    const values = [
                        req.body.nome, req.body.email, senha, req.body.id
                    ];
                    
                    connection.query(sql, values, function (err, results, fields) {

                        if(err) {
                            req.flash("error_msg", "Houve um erro interno ao salvar a edição "+ err);
                            res.redirect("/usuarios/admin");
                        }
                        else {
                            req.flash("success_msg", "Sua conta foi editada com sucesso!");
                            res.redirect("/usuarios/login");
                        }
                    });
                });
            });
        }
    });
});

// Deletar administrador/pai
router.post("/deletaradmin", eAdmin, (req, res) => {

    connection.query("delete from usuario where id = ?", [req.body.id], function(error, result) {

        if (error) {
            req.flash("error_msg", "Houve um erro ao deletar o conta "+ err);
            res.redirect("/usuarios/admin");
        }
        else {
            req.flash("success_msg", "Conta deletada com sucesso!");
            res.redirect("/usuarios/login");
        }
    })
});

// Tela para mostrar dependentes/filhos
router.get('/dependentes', eAdmin, (req, res) => {

    connection.query("select * from usuario where perfil = 'dependente' and parent = ? order by nome", [req.user.id], function(error, rows) {
    
        if(error) {
            req.flash("error_msg", "Houve um erro interno "+ error);
            res.redirect("/inicio");
        }
        else
            res.render("usuarios/dependentes", {usuario: rows});
    });
});

// Tela de cadastro de dependentes/filhos
router.get("/adddependente", eAdmin, (req, res) => {
    res.render("usuarios/add_dependente");
});

// Cadastrar novo dependente/filho
router.post("/novodependente", eAdmin, (req, res) => {
    
    // Validação dos campos
    var erros = validaUsuario(req.body);

    if (erros.length > 0)
        res.render("usuarios/add_dependente", {erros, erros});
    else {
        connection.query("select * from usuario where email = ?", [req.body.email], function(error, rows) {
            
            if(error) {
                req.flash("error_msg", "Houve um erro interno "+ error);
                res.redirect("/");
            }

            if(rows.length > 0) { 
                req.flash("error_msg", "Já existe uma conta com este usuário no nosso sistema");
                res.redirect("/usuarios/adddependente");
            }
            else {
                //Criptografa senha
                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(req.body.senha, salt, (erro, hash) => {

                        if(erro) {
                            req.flash("error_msg", "Houve um erro interno "+ erro);
                            res.redirect("/");
                        }
                    
                        var senha = hash; //senha do usuario recebe hash, encriptado

                        //Grava usuário
                        const sql = "INSERT INTO usuario(parent, tipo, perfil, nome, email, senha) VALUES ?";
                        const values = [
                            [req.user.id, 2, "dependente", req.body.nome, req.body.email, senha]
                        ];

                        connection.query(sql, [values], function (erro, results, fields) {

                            if(erro) {
                                req.flash("error_msg", "Houve um erro ao criar o dependente, tente novamente! "+ error);
                                res.redirect("/usuarios/adddependente");
                            }

                            req.flash("success_msg", "Dependente criado com sucesso!");
                            res.redirect("/usuarios/dependentes");
                        });
                    });
                });
            }
        });
    }
});

// Botão de editar dependente/filho, redireciona para página de edição
router.get("/editardependente/:id", eAdmin, (req, res) => {

    connection.query("select * from usuario where id = ?", [req.params.id], function(error, rows) {

        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar dependente "+ error);
            res.redirect("/usuarios/dependentes");
        }
        else
            res.render("usuarios/edit_dependente", {usuario: rows});
    }); 
});

// Editar dependente/filho
router.post("/editardependente", eAdmin, (req, res) => {
    
    connection.query("select * from usuario where id = ?", [req.body.id], function(error, rows) {
       
        var erros = validaUsuario(req.body);

        if (erros.length > 0)
            res.render("usuarios/edit_dependente", {usuario: rows, erros: erros});
        else {

            //Encriptação da senha
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(req.body.senha, salt, (erro, hash) => {
                    
                    if(erro) {
                        req.flash("error_msg", "Houve um erro durante o salvamento do dependente "+ erro);
                        res.redirect("/usuarios/dependentes");
                    }

                    var senha = hash; //senha do usuario recebe hash, encriptado

                    const sql = "UPDATE usuario SET nome = ?, email = ?, senha = ? WHERE id = ?";
                    const values = [
                        req.body.nome, req.body.email, senha, req.body.id
                    ];
                    
                    connection.query(sql, values, function (err, results, fields) {

                        if(err) {
                            req.flash("error_msg", "Houve um erro interno ao salvar a edição do dependente "+ err);
                            res.redirect("/usuarios/dependentes");
                        }
                        else {
                            req.flash("success_msg", "Dependente editado com sucesso!");
                            res.redirect("/usuarios/dependentes");
                        }
                    });
                });
            });
        }
    });
});

// Deletar dependente/filho
router.post("/deletardependente", eAdmin, (req, res) => {

    connection.query("delete from usuario where id = ?", [req.body.id], function(error, result) {

        if (error) {
            req.flash("error_msg", "Houve um erro ao deletar o dependente "+ err);
            res.redirect("/usuarios/dependentes");
        }
        else {
            req.flash("success_msg", "Dependente deletado com sucesso!");
            res.redirect("/usuarios/dependentes");
        }
    })
});

// Tela para mostrar outros responsáveis
router.get('/responsaveis', eAdmin, (req, res) => {

    connection.query("select * from usuario where tipo = '2' and perfil = 'responsavel' and parent = ? order by nome", [req.user.id], function(error, rows) {
        
        if(error) {
            req.flash("error_msg", "Houve um erro interno "+ error);
            res.redirect("/inicio");
        }
        else
            res.render("usuarios/responsaveis", {usuario: rows});
    });
});

// Tela de cadastro de responsáveis
router.get("/addresponsavel", eAdmin, (req, res) => {
    res.render("usuarios/add_responsavel");
});

// Cadastrar novo responsável
router.post("/novoresponsavel", eAdmin, (req, res) => {
    
    // Validação dos campos
    var erros = validaUsuario(req.body);

    if (erros.length > 0)
        res.render("usuarios/add_responsavel", {erros, erros});
    else {
        connection.query("select * from usuario where email = ?", [req.body.email], function(error, rows) {
            
            if(error) {
                req.flash("error_msg", "Houve um erro interno "+ error);
                res.redirect("/");
            }

            if(rows.length > 0) { 
                req.flash("error_msg", "Já existe uma conta com este usuário no nosso sistema");
                res.redirect("/usuarios/addresponsavel");
            }
            else {
                //Criptografa senha
                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(req.body.senha, salt, (erro, hash) => {

                        if(erro) {
                            req.flash("error_msg", "Houve um erro interno "+ erro);
                            res.redirect("/");
                        }
                    
                        var senha = hash; //senha do usuario recebe hash, encriptado

                        //Grava usuário
                        const sql = "INSERT INTO usuario(parent, tipo, perfil, nome, email, senha) VALUES ?";
                        const values = [
                            [req.user.id, 2, "responsavel", req.body.nome, req.body.email, senha]
                        ];

                        connection.query(sql, [values], function (erro, results, fields) {

                            if(erro) {
                                req.flash("error_msg", "Houve um erro ao criar o responsável, tente novamente! "+ error);
                                res.redirect("/usuarios/addresponsavel");
                            }

                            req.flash("success_msg", "Responsável criado com sucesso!");
                            res.redirect("/usuarios/responsaveis");
                        });
                    });
                });
            }
        });
    }
});

// Botão de editar responsável, redireciona para página de edição
router.get("/editarresponsavel/:id", eAdmin, (req, res) => {

    connection.query("select * from usuario where id = ?", [req.params.id], function(error, rows) {

        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar responsável "+ error);
            res.redirect("/usuarios/responsaveis");
        }
        else
            res.render("usuarios/edit_responsavel", {usuario: rows});
    }); 
});

// Editar responsável
router.post("/editarresponsavel", eAdmin, (req, res) => {
    
    connection.query("select * from usuario where id = ?", [req.body.id], function(error, rows) {
       
        var erros = validaUsuario(req.body);

        if (erros.length > 0)
            res.render("usuarios/edit_responsavel", {usuario: rows, erros: erros});
        else {

            //Encriptação da senha
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(req.body.senha, salt, (erro, hash) => {
                    
                    if(erro) {
                        req.flash("error_msg", "Houve um erro durante o salvamento do responsavel "+ erro);
                        res.redirect("/usuarios/responsaveis");
                    }

                    var senha = hash; //senha do usuario recebe hash, encriptado

                    const sql = "UPDATE usuario SET nome = ?, email = ?, senha = ? WHERE id = ?";
                    const values = [
                        req.body.nome, req.body.email, senha, req.body.id
                    ];
                    
                    connection.query(sql, values, function (err, results, fields) {

                        if(err) {
                            req.flash("error_msg", "Houve um erro interno ao salvar a edição do responsavel "+ err);
                            res.redirect("/usuarios/responsaveis");
                        }
                        else {
                            req.flash("success_msg", "Responsável editado com sucesso!");
                            res.redirect("/usuarios/responsaveis");
                        }
                    });
                });
            });
        }
    });
});

// Deletar responsável
router.post("/deletarresponsavel", eAdmin, (req, res) => {

    connection.query("delete from usuario where id = ?", [req.body.id], function(error, result) {

        if (error) {
            req.flash("error_msg", "Houve um erro ao deletar o responsável "+ err);
            res.redirect("/usuarios/responsaveis");
        }
        else {
            req.flash("success_msg", "Responsável deletado com sucesso!");
            res.redirect("/usuarios/responsaveis");
        }
    })
});

module.exports = router;