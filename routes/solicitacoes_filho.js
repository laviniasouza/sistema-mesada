const express = require("express");
const router = express.Router();
const connection = require("../config/dbconn");
const {autenticado} = require("../helpers/autenticado");
const moment = require("moment");

//VALIDAÇÕES DOS CAMPOS
function validaSolicitacao(value) {
    var erros = [];

    if (!value.descricao || typeof value.descricao == undefined || value.descricao == null)
        erros.push({texto: "Preencha pra que você precisa do dinheiro"});

    if (!value.data_necessidade || typeof value.data_necessidade == undefined || value.data_necessidade == null)
        erros.push({texto: "Preencha qual dia você vai precisar do dinheiro"});

    if (!value.valor || typeof value.valor == undefined || value.valor == null)
        erros.push({texto: "Preencha de quanto dinheiro você precisa"});

    return erros;
}

// Tela para mostrar solicitações
router.get('/', autenticado, (req, res) => {

    const sql = "select s.id, s.descricao as descricao_conta, s.data, s.data_necessidade, s.valor, "+
                "CASE s.situacao "+
                "WHEN 1 THEN 'Ainda não viu :/' "+
                "WHEN 2 THEN '' "+
                "WHEN 3 THEN '' "+
                "END AS situacao, "+

                "CASE sa.tipo "+
                "WHEN NULL THEN '' "+
                "WHEN 1 THEN 'Disse sim :D' "+
                "WHEN 2 THEN 'Disse que não :(' "+
                "END AS avaliacao, "+

                "u.nome as nome_pai "+

                "from solicitacao as s "+
                "inner join usuario as u on u.id = s.id_usuario_pai and u.tipo = 1 "+
                "left join solicitacao_avaliacao as sa on sa.id_solicitacao = s.id "+

                "where s.id_usuario_filho = ? "+
                "order by s.data desc ";

    connection.query(sql, [req.user.id], function(error, rows) {        
        if(error) {
            req.flash("error_msg", "Houve um erro, avise o papai "+ error);
            res.redirect("/inicio");
        }
        else
            res.render("solicitacoes_filho/solicitacoes", {solicitacoes: rows});
    });
});

// Botão de visualizar solicitação, redireciona para página de visualização
router.get('/visualizarsolicitacao/:id', autenticado, (req, res) => {

    const sql = "select s.id, s.descricao as descricao_conta, s.data, s.data_necessidade, valor, "+
                "CASE s.situacao "+
                "WHEN 1 THEN 'AINDA NÃO VIU :/' "+
                "WHEN 2 THEN '' "+
                "END AS situacao, "+

                "CASE sa.tipo "+
                "WHEN NULL THEN '' "+
                "WHEN 1 THEN 'DISSE SIM :D' "+
                "WHEN 2 THEN 'DISSE QUE NÃO :(' "+
                "END AS avaliacao, "+

                "sa.justificativa, sa.observacao, "+
                "u.nome as nome_pai "+

                "from solicitacao as s "+
                "inner join usuario as u on u.id = s.id_usuario_pai and u.tipo = 1 "+
                "left join solicitacao_avaliacao as sa on sa.id_solicitacao = s.id "+

                "where s.id = ? ";

    connection.query(sql, [req.params.id], function(error, rows) {
        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar o pedido, avise o papai "+ error);
            res.redirect("/solicitacoes_filho");
        }
        else 
            res.render("solicitacoes_filho/visualiza_solicitacao", {solicitacoes: rows});
    });
});

// Tela de cadastro de solicitacao
router.get("/addsolicitacao", autenticado, (req, res) => {
    res.render("solicitacoes_filho/add_solicitacao");
});

// Cadastrar nova solicitacao
router.post("/novasolicitacao", autenticado, (req, res) => {
    
    // Validação dos campos
    var erros = validaSolicitacao(req.body);

    if (erros.length > 0)
        res.render("solicitacoes_filho/add_solicitacao", {erros, erros});
    else {
        
        //Grava solicitação
        const sql = "INSERT INTO solicitacao(id_categoria, descricao, data, data_necessidade, "+
                    "valor, situacao, id_usuario_pai, id_usuario_filho) VALUES ?";
                    
                    const values = [
                        [1, req.body.descricao, new Date, moment(req.body.data_necessidade).format('YYYY-MM-DD hh:mm:ss'),
                        req.body.valor, 1, req.user.parent, req.user.id]
                    ];

        connection.query(sql, [values], function (erro, results, fields) {

            if(erro) {
                req.flash("error_msg", "Houve um erro ao fazer o pedido, avise o papai! "+ error);
                res.redirect("/solicitacoes_filho/add_solicitacao");
            }

            req.flash("success_msg", "Seu pedido pro papai foi feito com sucesso!");
            res.redirect("/solicitacoes_filho");
        });
    }
});

// Botão de editar solicitação, redireciona para página de edição
router.get("/editarsolicitacao/:id", autenticado, (req, res) => {

    connection.query("select * from solicitacao where id = ? and situacao = 1", [req.params.id], function(error, rows) {

        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar o seu pedido, avise o papai "+ error);
            res.redirect("/solicitacoes_filho");
        }
        else{
            if (rows.length == 0) {
                req.flash("error_msg", "O papai já respondeu seu pedido, então você não pode mudar ele");
                res.redirect("/solicitacoes_filho");
            }
            else
                res.render("solicitacoes_filho/edit_solicitacao", {solicitacao: rows});
        }
    }); 
});

// Editar solicitação
router.post("/editarsolicitacao", autenticado, (req, res) => {
    
    connection.query("select * from solicitacao where id = ?", [req.body.id], function(error, rows) {
       
        var erros = validaSolicitacao(req.body);

        if (erros.length > 0)
            res.render("solicitacoes_filho/edit_solicitacao", {solicitacao: rows, erros: erros});
        else {

            const sql = "UPDATE solicitacao SET descricao = ?, data_necessidade = ?, valor = ? WHERE id = ?";
            const values = [
                req.body.descricao, req.body.data_necessidade, req.body.valor, req.body.id
            ];

            connection.query(sql, values, function (err, results, fields) {

                if(err) {
                    req.flash("error_msg", "Houve um erro interno ao salvar, avise o papai "+ err);
                    res.redirect("/solicitacoes_filho");
                }
                else {
                    req.flash("success_msg", "Seu pedido pro papai foi mudado com sucesso!");
                    res.redirect("/solicitacoes_filho");
                }
            });
        }
    });
});

// Deletar solicitação
router.post("/deletarsolicitacao", autenticado, (req, res) => {

    connection.query("select * from solicitacao where id = ? and situacao = 1", [req.body.id], function(error, rows) {

        if(error) {
            req.flash("error_msg", "Houve um erro ao buscar o seu pedido, avise o papai "+ error);
            res.redirect("/solicitacoes_filho");
        }
        else{
            if (rows.length == 0) {
                req.flash("error_msg", "O papai já respondeu seu pedido, então você não pode mudar ele");
                res.redirect("/solicitacoes_filho");
            }
            else{
                connection.query("delete from solicitacao where id = ?", [req.body.id], function(error, result) {

                    if (error) {
                        req.flash("error_msg", "Houve um erro ao apagar o pedido, avise o papai "+ err);
                        res.redirect("/solicitacoes_filho");
                    }
                    else {
                        req.flash("success_msg", "Seu pedido foi apagado com sucesso!");
                        res.redirect("/solicitacoes_filho");
                    }
                })
            }
        }
    });
});

module.exports = router;