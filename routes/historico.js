const express = require("express");
const router = express.Router();
const connection = require("../config/dbconn");
const {eResponsavel} = require("../helpers/autenticado_responsavel");
const {eAdmin} = require("../helpers/autenticado_admin");

// Tela para mostrar historico do admin
router.get('/historico_admin', eAdmin, (req, res) => {

    const sql = "select sum(s.valor) as valortotal, "+
                "min(s.data) as data_inicial, max(s.data) as data_final "+

                "from solicitacao as s "+

                "where s.id_usuario_pai = ? "+                
                "order by s.data "+
                "limit 1 ";

    connection.query(sql, [req.user.id], function(erros, rows) {

        if(erros) {
            req.flash("error_msg", "Houve um erro interno "+ erros);
            res.redirect("/inicio");
        }
        else {

            const sqlfilho = "select u.nome as nome_filho, "+
                "sum(s.valor) as valor_filho "+

                "from solicitacao as s "+  
                "inner join usuario as u on u.id = s.id_usuario_filho and u.tipo = 2 "+

                "where s.id_usuario_pai = ? "+
                "group by u.nome "+
                "order by s.data ";

            connection.query(sqlfilho, [req.user.id], function(error, rowsfilho) {

                if(error) {
                    req.flash("error_msg", "Houve um erro "+ error);
                    res.redirect("/inicio");
                }
                else {

                    const sqlcategoria = "select c.descricao as nome_categoria, "+
                    "sum(s.valor) as valor_categoria "+

                    "from solicitacao as s "+  
                    "inner join categoria as c on c.id = s.id_categoria "+

                    "where s.id_usuario_pai = ? "+
                    "group by c.descricao "+
                    "order by s.data ";

                    connection.query(sqlcategoria, [req.user.id], function(erro, rowscategoria) {
                        if(erro) {
                            req.flash("error_msg", "Houve um erro "+ erro);
                            res.redirect("/inicio");
                        }
                        else {
                            res.render("historico/historico_admin", {historico: rows, filho: rowsfilho, categoria: rowscategoria });
                        }
                    });
                }
            });
        }
    });
});

// Tela para mostrar historico do responsavel
router.get('/historico_responsavel', eResponsavel, (req, res) => {

    const sql = "select sum(s.valor) as valortotal, "+
                "min(s.data) as data_inicial, max(s.data) as data_final "+

                "from solicitacao as s "+

                "where s.id_usuario_pai = ? "+
                "order by s.data ";
                "limit 1 ";

    connection.query(sql, [req.user.parent], function(erros, rows) {

        if(erros) {
            req.flash("error_msg", "Houve um erro interno "+ erros);
            res.redirect("/inicio");
        }
        else {

            const sqlfilho = "select u.nome as nome_filho, "+
                "sum(s.valor) as valor_filho "+

                "from solicitacao as s "+  
                "inner join usuario as u on u.id = s.id_usuario_filho and u.tipo = 2 "+

                "where s.id_usuario_pai = ? "+
                "group by u.nome "+
                "order by s.data ";

            connection.query(sqlfilho, [req.user.parent], function(error, rowsfilho) {

                if(error) {
                    req.flash("error_msg", "Houve um erro "+ error);
                    res.redirect("/inicio");
                }
                else {
                    
                    const sqlcategoria = "select c.descricao as nome_categoria, "+
                    "sum(s.valor) as valor_categoria "+

                    "from solicitacao as s "+  
                    "inner join categoria as c on c.id = s.id_categoria "+

                    "where s.id_usuario_pai = ? "+
                    "group by c.descricao "+
                    "order by s.data ";

                    connection.query(sqlcategoria, [req.user.parent], function(erro, rowscategoria) {
                        if(erro) {
                            req.flash("error_msg", "Houve um erro "+ erro);
                            res.redirect("/inicio");
                        }
                        else {
                            res.render("historico/historico_responsavel", {historico: rows, filho: rowsfilho, categoria: rowscategoria });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;