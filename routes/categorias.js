const express = require("express");
const router = express.Router();
const connection = require("../config/dbconn");
const {eResponsavel} = require("../helpers/autenticado_responsavel");
const {eAdmin} = require("../helpers/autenticado_admin");

//VALIDAÇÕES DOS CAMPOS
function validaCategoria(value) {
    var erros = [];

    if (!value.descricao || typeof value.descricao == undefined || value.descricao == null)
        erros.push({texto: "Descrição inválida"});

    return erros;
}

// Tela para mostrar categorias do admin
router.get('/admin', eAdmin, (req, res) => {

    connection.query("select * from categoria", function(error, rows) {
        
        if(error) {
            req.flash("error_msg", "Houve um erro interno "+ error);
            res.redirect("/inicio");
        }
        else
            res.render("categorias/categorias_admin", {categoria: rows});
    });
});

// Tela de cadastro de categorias do admin
router.get("/addcategoria_admin", eAdmin, (req, res) => {
    res.render("categorias/add_categoria_admin");
});

// Cadastrar nova categoria do admin
router.post("/novacategoria_admin", eAdmin, (req, res) => {
    
    // Validação dos campos
    var erros = validaCategoria(req.body);

    if (erros.length > 0)
        res.render("categorias/add_categoria_admin", {erros, erros});
    else {
        connection.query("select * from categoria where descricao = ?", [req.body.descricao], function(error, rows) {
            
            if(error) {
                req.flash("error_msg", "Houve um erro interno "+ error);
                res.redirect("/categorias/admin");
            }

            if(rows.length) { 
                req.flash("error_msg", "Já existe uma categoria com esse nome no nosso sistema");
                res.redirect("/categorias/addcategoria_admin");
            }
            else {
                //Grava categoria
                const sql = "INSERT INTO categoria(descricao) VALUES ?";
                const values = [
                    [req.body.descricao]
                ];

                connection.query(sql, [values], function (erro, results, fields) {

                    if(erro) {
                        req.flash("error_msg", "Houve um erro ao criar a categoria, tente novamente! "+ error);
                        res.redirect("/categorias/addcategoria_admin");
                    }

                    req.flash("success_msg", "Categoria criada com sucesso!");
                    res.redirect("/categorias/admin");
                });
            }
        });
    }
});

// Botão de editar categoria, redireciona para página de edição do admin
router.get("/editarcategoria_admin/:id", eAdmin, (req, res) => {

    connection.query("select * from categoria where id = ?", [req.params.id], function(error, rows) {

        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar categoria "+ error);
            res.redirect("/categorias/admin");
        }
        else
            res.render("categorias/edit_categoria_admin", {categoria: rows});
    }); 
});

// Editar categoria do admin
router.post("/editarcategoria_admin", eAdmin, (req, res) => {

    connection.query("select * from categoria where id = ?", [req.body.id], function(error, rows) {
       
        var erros = validaCategoria(req.body);

        if (erros.length > 0)
            res.render("categorias/edit_categoria_admin", {categoria: rows, erros: erros});
        else {
            const sql = "UPDATE categoria SET descricao = ? WHERE id = ?";
            const values = [
                req.body.descricao, req.body.id
            ];
                    
            connection.query(sql, values, function (err, results, fields) {

                if(err) {
                    req.flash("error_msg", "Houve um erro interno ao salvar a edição da categoria "+ err);
                    res.redirect("/categorias/admin");
                }
                else {
                    req.flash("success_msg", "Categoria editada com sucesso!");
                    res.redirect("/categorias/admin");
                }
            });
        }
    });
});

// Deletar categoria do admin
router.post("/deletarcategoria_admin", eAdmin, (req, res) => {

    connection.query("select * from solicitacao where id_categoria = ? and id_usuario_pai = ?", [req.body.id, req.user.id], function(erros, rows) {
        
        if(erros) {
            req.flash("error_msg", "Houve um erro interno "+ erros);
            res.redirect("/categorias/admin");
        }

        else if(rows.length > 0) { 
            req.flash("error_msg", "Já existe uma solicitação dessa categoria! Impossível excluir!");
            res.redirect("/categorias/admin");
        }
        else {

            connection.query("select * from categoria where id = ? and id = 1", [req.body.id], function(error, categoriageral) {
            
                if(categoriageral.length > 0) { 
                    req.flash("error_msg", "A categoria geral não pode ser excluída!");
                    res.redirect("/categorias/admin");
                }
                else {

                    connection.query("delete from categoria where id = ?", [req.body.id], function(erro, result) {

                        if (erro) {
                            req.flash("error_msg", "Houve um erro ao deletar a categoria "+ erro);
                            res.redirect("/categorias/admin");
                        }
                        else {
                            req.flash("success_msg", "Categoria deletada com sucesso!");
                            res.redirect("/categorias/admin");
                        }
                    })
                }
            })
        }
    });
});

// Tela para mostrar categorias do responsavel
router.get('/responsavel', eResponsavel, (req, res) => {

    connection.query("select * from categoria", function(error, rows) {
        
        if(error) {
            req.flash("error_msg", "Houve um erro interno "+ error);
            res.redirect("/inicio");
        }
        else
            res.render("categorias/categorias_responsavel", {categoria: rows});
    });
});

// Tela de cadastro de categorias do responsavel
router.get("/addcategoria_responsavel", eResponsavel, (req, res) => {
    res.render("categorias/add_categoria_responsavel");
});

// Cadastrar nova categoria do responsavel
router.post("/novacategoria_responsavel", eResponsavel, (req, res) => {
    
    // Validação dos campos
    var erros = validaCategoria(req.body);

    if (erros.length > 0)
        res.render("categorias/add_categoria_responsavel", {erros, erros});
    else {
        connection.query("select * from categoria where descricao = ?", [req.body.descricao], function(error, rows) {
            
            if(error) {
                req.flash("error_msg", "Houve um erro interno "+ error);
                res.redirect("/categorias/responsavel");
            }

            if(rows.length) { 
                req.flash("error_msg", "Já existe uma categoria com esse nome no nosso sistema");
                res.redirect("/categorias/addcategoria_responsavel");
            }
            else {
                //Grava categoria
                const sql = "INSERT INTO categoria(descricao) VALUES ?";
                const values = [
                    [req.body.descricao]
                ];

                connection.query(sql, [values], function (erro, results, fields) {

                    if(erro) {
                        req.flash("error_msg", "Houve um erro ao criar a categoria, tente novamente! "+ error);
                        res.redirect("/categorias/addcategoria_responsavel");
                    }

                    req.flash("success_msg", "Categoria criada com sucesso!");
                    res.redirect("/categorias/responsavel");
                });
            }
        });
    }
});

// Botão de editar categoria, redireciona para página de edição do responsavel
router.get("/editarcategoria_responsavel/:id", eResponsavel, (req, res) => {

    connection.query("select * from categoria where id = ?", [req.params.id], function(error, rows) {

        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar categoria "+ error);
            res.redirect("/categorias/responsavel");
        }
        else
            res.render("categorias/edit_categoria_responsavel", {categoria: rows});
    }); 
});

// Editar categoria do responsavel
router.post("/editarcategoria_responsavel", eResponsavel, (req, res) => {
    
    connection.query("select * from categoria where id = ?", [req.body.id], function(error, rows) {
       
        var erros = validaCategoria(req.body);

        if (erros.length > 0)
            res.render("categorias/edit_categoria_responsavel", {categoria: rows, erros: erros});
        else {
            const sql = "UPDATE categoria SET descricao = ? WHERE id = ?";
            const values = [
                req.body.descricao, req.body.id
            ];
                    
            connection.query(sql, values, function (err, results, fields) {

                if(err) {
                    req.flash("error_msg", "Houve um erro interno ao salvar a edição da categoria "+ err);
                    res.redirect("/categorias/responsavel");
                }
                else {
                    req.flash("success_msg", "Categoria editada com sucesso!");
                    res.redirect("/categorias/responsavel");
                }
            });
        }
    });
});

// Deletar categoria do responsavel
router.post("/deletarcategoria_responsavel", eResponsavel, (req, res) => {

    connection.query("select * from solicitacao where id_categoria = ? and id_usuario_pai = ?", [req.body.id, req.user.id], function(error, rows) {
            
        if(error) {
            req.flash("error_msg", "Houve um erro interno "+ error);
            res.redirect("/categorias/responsavel");
        }

        else if(rows.length > 0) { 
            req.flash("error_msg", "Já existe uma solicitação dessa categoria! Impossível excluir!");
            res.redirect("/categorias/responsavel");
        }
        else {

            connection.query("delete from categoria where id = ?", [req.body.id], function(erro, result) {

                if (erro) {
                    req.flash("error_msg", "Houve um erro ao deletar a categoria "+ erro);
                    res.redirect("/categorias/responsavel");
                }
                else {
                    req.flash("success_msg", "Categoria deletada com sucesso!");
                    res.redirect("/categorias/responsavel");
                }
            })
        }
    });
});

module.exports = router;