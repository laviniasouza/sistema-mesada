const express = require("express");
const router = express.Router();
const connection = require("../config/dbconn");
const {eResponsavel} = require("../helpers/autenticado_responsavel");
const {eAdmin} = require("../helpers/autenticado_admin");

//VALIDAÇÕES DOS CAMPOS
function validaAvaliacao(value) {
    var erros = [];

    if (!value.justificativa || typeof value.justificativa == undefined || value.justificativa == null)
        erros.push({texto: "Justificativa inválida"});

    return erros;
}

// Tela para mostrar solicitacoes do pai / admin
router.get('/admin', eAdmin, (req, res) => {

    const sql = "select s.id, s.descricao as descricao_conta, s.data as data_emissao, s.data_necessidade, s.valor, "+
                "CASE s.situacao "+
                "WHEN 1 THEN 'EM ABERTO' "+
                "WHEN 2 THEN '' "+
                "END AS situacao, "+

                "CASE sa.tipo "+
                "WHEN NULL THEN '' "+
                "WHEN 1 THEN 'APROVADO' "+
                "WHEN 2 THEN 'NÃO APROVADO' "+
                "END AS avaliacao, "+

                "u.nome as nome_filho "+

                "from solicitacao as s "+  
                "inner join usuario as u on u.id = s.id_usuario_filho and u.tipo = 2 "+
                "left join solicitacao_avaliacao as sa on sa.id_solicitacao = s.id "+

                "where s.id_usuario_pai = ? "+
                "order by s.data desc ";

    connection.query(sql, [req.user.id], function(error, rows) {
        if(error) {
            req.flash("error_msg", "Houve um erro interno "+ error);
            res.redirect("/inicio");
        }
        else
            res.render("solicitacoes_pai/solicitacoes_admin", {solicitacoes: rows});
    });
});

// Botão do admin visualizar solicitação, redireciona para página de visualização
router.get('/visualizarsolicitacao_admin/:id', eAdmin, (req, res) => {

    const sql = "select s.id, s.descricao as descricao_conta, s.data, s.data_necessidade, "+
                "s.valor, "+

                "CASE s.situacao "+
                "WHEN 1 THEN 'EM ABERTO' "+
                "WHEN 2 THEN 'CONCLUÍDA' "+
                "END AS situacao, "+

                "CASE sa.tipo "+
                "WHEN NULL THEN '' "+
                "WHEN 1 THEN ' - APROVADO' "+
                "WHEN 2 THEN ' - NÃO APROVADO' "+
                "END AS avaliacao, "+

                "sa.justificativa, "+

                "CASE sa.observacao "+
                "WHEN '' THEN 'SEM OBSERVAÇÃO' "+
                "ELSE sa.observacao "+
                "END AS observacao, "+

                "u.nome as nome_filho "+

                "from solicitacao as s "+
                "inner join usuario as u on u.id = s.id_usuario_filho and u.tipo = 2 "+
                "left join solicitacao_avaliacao as sa on sa.id_solicitacao = s.id "+

                "where s.id = ? ";

    connection.query(sql, [req.params.id], function(error, rows) {
        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar solicitação "+ error);
            res.redirect("/solicitacoes_pai/admin");
        }
        else
            res.render("solicitacoes_pai/visualiza_solicitacao_admin", {solicitacoes: rows});
    });
});

// Botão de aprovar solicitação, redireciona para página de aprovação do pai / admin
router.get("/aprovarsolicitacao_admin/:id", eAdmin, (req, res) => {

    connection.query("select * from solicitacao where id = ? and situacao = 1", [req.params.id], function(erros, rows) {

        if(erros) {
            req.flash("error_msg", "Houve um erro ao buscar solicitacao "+ erros);
            res.redirect("/solicitacoes_pai/admin");
        }
        else{
            if (rows.length == 0) {
                req.flash("error_msg", "A solicitação já foi avaliada ");
                res.redirect("/solicitacoes_pai/admin");
            }
            else {

                const sql = "select id as id_categoria, descricao as nome_categoria "+
                            "from categoria ";

                connection.query(sql, function(error, rowscategoria) {
                
                    if(error) {
                        req.flash("error_msg", "Houve um erro ao buscar solicitacao "+ error);
                        res.redirect("/solicitacoes_pai/admin");
                    }
                    else
                        res.render("solicitacoes_pai/aprova_solicitacao_admin", {solicitacao: rows, categorias: rowscategoria });
                });
            }
        }
    }); 
});

// Aprovar solicitação pai / admin
router.post("/aprovarsolicitacao_admin", eAdmin, (req, res) => {
    
    var erros = validaAvaliacao(req.body);

    if (erros.length > 0)
        res.render("solicitacoes_pai/aprova_solicitacao_admin", {solicitacao: rows, erros: erros});
    else {

        console.log(req.body)
        // Atualiza situação da solicitação para 2 - Concluída
        connection.query("UPDATE solicitacao SET situacao = 2, id_categoria = ? where id = ?", [req.body.id_categoria, req.body.id], function(erros, rows) {
            
            if(erros) {
                req.flash("error_msg", "Houve um erro na aprovação "+ erros);
                res.redirect("/solicitacoes_pai/aprovarsolicitacao_admin");
            }
        }); 

        //Grava avaliação
        const sql = "INSERT INTO solicitacao_avaliacao(id_solicitacao, id_responsavel, tipo, justificativa, observacao) "+
                    "VALUES ?";
        const values = [
            [req.body.id, req.user.id, 1, req.body.justificativa, req.body.observacao]
        ];

        connection.query(sql, [values], function (erro, results, fields) {

            if(erro) {
                req.flash("error_msg", "Houve um erro na aprovação, tente novamente! "+ error);
                res.redirect("/solicitacoes_pai/aprovarsolicitacao_admin");
            }

            req.flash("success_msg", "Solicitação aprovada com sucesso!");
            res.redirect("/solicitacoes_pai/admin");
        });
    }
});

// Botão de recusar solicitação, redireciona para página de aprovação do pai / admin
router.get("/recusarsolicitacao_admin/:id", eAdmin, (req, res) => {

    connection.query("select * from solicitacao where id = ? and situacao = 1", [req.params.id], function(erros, rows) {

        if(erros) {
            req.flash("error_msg", "Houve um erro ao buscar solicitação "+ erros);
            res.redirect("/solicitacoes_pai/admin");
        }
        else{
            if (rows.length == 0) {
                req.flash("error_msg", "A solicitação já foi avaliada ");
                res.redirect("/solicitacoes_pai/admin");
            }
            else {
                const sql = "select id as id_categoria, descricao as nome_categoria "+
                            "from categoria ";

                connection.query(sql, function(error, rowscategoria) {
                
                    if(error) {
                        req.flash("error_msg", "Houve um erro ao buscar solicitacao "+ error);
                        res.redirect("/solicitacoes_pai/admin");
                    }
                    else
                        res.render("solicitacoes_pai/recusa_solicitacao_admin", {solicitacao: rows, categorias: rowscategoria });
                });
            }
        }
    }); 
});

// Recusar solicitação pai / admin
router.post("/recusarsolicitacao_admin", eAdmin, (req, res) => {
    
    var erros = validaAvaliacao(req.body);

    if (erros.length > 0)
        res.render("solicitacoes_pai/recusa_solicitacao_admin", {solicitacao: rows, erros: erros});
    else {

        // Atualiza situação da solicitação para 2 - Concluída
        connection.query("UPDATE solicitacao SET situacao = 2, id_categoria = ? where id = ?", [req.body.id_categoria, req.body.id], function(erros, rows) {
            
            if(erros) {
                req.flash("error_msg", "Houve um erro "+ erros);
                res.redirect("/solicitacoes_pai/recusarsolicitacao_admin");
            }
        }); 

        //Grava avaliação
        const sql = "INSERT INTO solicitacao_avaliacao(id_solicitacao, id_responsavel, tipo, justificativa, observacao) "+
                    "VALUES ?";
        const values = [
            [req.body.id, req.user.id, 2, req.body.justificativa, req.body.observacao]
        ];

        connection.query(sql, [values], function (erro, results, fields) {

            if(erro) {
                req.flash("error_msg", "Houve um erro, tente novamente! "+ error);
                res.redirect("/solicitacoes_pai/recusarsolicitacao_admin");
            }

            req.flash("success_msg", "Solicitação recusada com sucesso!");
            res.redirect("/solicitacoes_pai/admin");
        });
    }
});

// Tela para mostrar solicitacoes do pai / responsavel
router.get('/responsavel', eResponsavel, (req, res) => {

    const sql = "select s.id, s.descricao as descricao_conta, s.data as data_emissao, s.data_necessidade, s.valor, "+
                "CASE s.situacao "+
                "WHEN 1 THEN 'EM ABERTO' "+
                "WHEN 2 THEN '' "+
                "END AS situacao, "+

                "CASE sa.tipo "+
                "WHEN NULL THEN '' "+
                "WHEN 1 THEN 'APROVADO' "+
                "WHEN 2 THEN 'NÃO APROVADO' "+
                "END AS avaliacao, "+

                "u.nome as nome_filho "+

                "from solicitacao as s "+  
                "inner join usuario as u on u.id = s.id_usuario_filho and u.tipo = 2 "+
                "left join solicitacao_avaliacao as sa on sa.id_solicitacao = s.id "+

                "where s.id_usuario_pai = ? "+
                "order by s.data desc ";

    connection.query(sql, [req.user.parent], function(error, rows) {
        if(error) {
            req.flash("error_msg", "Houve um erro interno "+ error);
            res.redirect("/inicio");
        }
        else
            res.render("solicitacoes_pai/solicitacoes_responsavel", {solicitacoes: rows});
    });
});

// Botão do responsável visualizar solicitacao, redireciona para página de visualização
router.get('/visualizarsolicitacao_responsavel/:id', eResponsavel, (req, res) => {

    const sql = "select s.id, s.descricao as descricao_conta, s.data, s.data_necessidade, s.valor, "+
                "CASE s.situacao "+
                "WHEN 1 THEN 'EM ABERTO' "+
                "WHEN 2 THEN 'CONCLUÍDA' "+
                "END AS situacao, "+

                "CASE sa.tipo "+
                "WHEN NULL THEN '' "+
                "WHEN 1 THEN ' - APROVADO' "+
                "WHEN 2 THEN ' - NÃO APROVADO' "+
                "END AS avaliacao, "+

                "sa.justificativa, "+

                "CASE sa.observacao "+
                "WHEN '' THEN 'SEM OBSERVAÇÃO' "+
                "ELSE sa.observacao "+
                "END AS observacao, "+

                "u.nome as nome_filho "+

                "from solicitacao as s "+
                "inner join usuario as u on u.id = s.id_usuario_filho and u.tipo = 2 "+
                "left join solicitacao_avaliacao as sa on sa.id_solicitacao = s.id "+

                "where s.id = ? ";

    connection.query(sql, [req.params.id], function(error, rows) {
        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar solicitação "+ error);
            res.redirect("/solicitacoes_pai");
        }
        else
            res.render("solicitacoes_pai/visualiza_solicitacao_responsavel", {solicitacoes: rows});
    });
});

// Botão de aprovar solicitação, redireciona para página de aprovação do pai / responsavel
router.get("/aprovarsolicitacao_responsavel/:id", eResponsavel, (req, res) => {

    connection.query("select * from solicitacao where id = ? and situacao = 1", [req.params.id], function(erros, rows) {

        if(erros) {
            req.flash("error_msg", "Houve um erro ao buscar solicitacao "+ erros);
            res.redirect("/solicitacoes_pai/responsavel");
        }
        else{
            if (rows.length == 0) {
                req.flash("error_msg", "A solicitação já foi avaliada ");
                res.redirect("/solicitacoes_pai/responsavel");
            }
            else {
                const sql = "select id as id_categoria, descricao as nome_categoria "+
                            "from categoria ";

                connection.query(sql, function(error, rowscategoria) {
                
                    if(error) {
                        req.flash("error_msg", "Houve um erro ao buscar solicitacao "+ error);
                        res.redirect("/solicitacoes_pai/responsavel");
                    }
                    else
                        res.render("solicitacoes_pai/aprova_solicitacao_responsavel", {solicitacao: rows, categorias: rowscategoria });
                });
            }
        }
    }); 
});

// Aprovar solicitação pai / responsavel
router.post("/aprovarsolicitacao_responsavel", eResponsavel, (req, res) => {
    
    var erros = validaAvaliacao(req.body);

    if (erros.length > 0)
        res.render("solicitacoes_pai/aprova_solicitacao_responsavel", {solicitacao: rows, erros: erros});
    else {
            
        // Atualiza situação da solicitação para 2 - Concluída
        connection.query("UPDATE solicitacao SET situacao = 2, id_categoria = ? where id = ?", [req.body.id_categoria, req.body.id], function(erros, rows) {
            
            if(erros) {
                req.flash("error_msg", "Houve um erro na aprovação "+ erros);
                res.redirect("/solicitacoes_pai/aprovarsolicitacao_responsavel");
            }
        }); 

        //Grava aprovação
        const sql = "INSERT INTO solicitacao_avaliacao(id_solicitacao, id_responsavel, tipo, justificativa, observacao) "+
                    "VALUES ?";
        const values = [
            [req.body.id, req.user.id, 1, req.body.justificativa, req.body.observacao]
        ];

        connection.query(sql, [values], function (erro, results, fields) {

            if(erro) {
                req.flash("error_msg", "Houve um erro na aprovação, tente novamente! "+ error);
                res.redirect("/solicitacoes_pai/aprovarsolicitacao_responsavel");
            }

            req.flash("success_msg", "Solicitação aprovada com sucesso!");
            res.redirect("/solicitacoes_pai/responsavel");
        });
    }
});

// Botão de recusar solicitação, redireciona para página de aprovação do pai / responsavel
router.get("/recusarsolicitacao_responsavel/:id", eResponsavel, (req, res) => {

    connection.query("select * from solicitacao where id = ? and situacao = 1", [req.params.id], function(erros, rows) {

        if(erros) {
            req.flash("error_msg", "Houve um erro ao buscar solicitação "+ erros);
            res.redirect("/solicitacoes_pai/responsavel");
        }
        else{
            if (rows.length == 0) {
                req.flash("error_msg", "A solicitação já foi avaliada ");
                res.redirect("/solicitacoes_pai/responsavel");
            }
            else {
                const sql = "select id as id_categoria, descricao as nome_categoria "+
                            "from categoria ";

                connection.query(sql, function(error, rowscategoria) {
                
                    if(error) {
                        req.flash("error_msg", "Houve um erro ao buscar solicitacao "+ error);
                        res.redirect("/solicitacoes_pai/responsavel");
                    }
                    else
                        res.render("solicitacoes_pai/recusa_solicitacao_responsavel", {solicitacao: rows, categorias: rowscategoria });
                });
            }
        }
    }); 
});

// Recusar solicitação pai / responsavel
router.post("/recusarsolicitacao_responsavel", eResponsavel, (req, res) => {
    
    var erros = validaAvaliacao(req.body);

    if (erros.length > 0)
        res.render("solicitacoes_pai/recusa_solicitacao_responsavel", {solicitacao: rows, erros: erros});
    else {
        
        // Atualiza situação da solicitação para 2 - Concluída
        connection.query("UPDATE solicitacao SET situacao = 2, id_categoria = ? where id = ?", [req.body.id_categoria, req.body.id], function(erros, rows) {
            
            if(erros) {
                req.flash("error_msg", "Houve um erro "+ erros);
                res.redirect("/solicitacoes_pai/recusarsolicitacao_responsavel");
            }
        }); 

        //Grava avaliação
        const sql = "INSERT INTO solicitacao_avaliacao(id_solicitacao, id_responsavel, tipo, justificativa, observacao) "+
                    "VALUES ?";
        const values = [
            [req.body.id, req.user.id, 2, req.body.justificativa, req.body.observacao]
        ];

        connection.query(sql, [values], function (erro, results, fields) {

            if(erro) {
                req.flash("error_msg", "Houve um erro, tente novamente! "+ error);
                res.redirect("/solicitacoes_pai/recusarsolicitacao_responsavel");
            }

            req.flash("success_msg", "Solicitação recusada com sucesso!");
            res.redirect("/solicitacoes_pai/responsavel");
        });
    }
});

module.exports = router;