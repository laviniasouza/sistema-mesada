//Criptografia da senha do usuário Administrador
const bcrypt = require("bcryptjs");

const connection = require("./dbconn");

connection.connect(function(err) {

    if(err) 
        return console.log(err);
    else
        console.log('Conectado!');
    
    //criaUsuario(connection);
    //addUsuario(connection);
    //criaCategoria(connection);
    //addCategoria(connection);
    //criaSolicitacao(connection);
    //criaSolicitacao_Avaliacao(connection);
});

function criaUsuario(conn) {

    const sql = "CREATE TABLE IF NOT EXISTS usuario (\n"+
                "id int NOT NULL AUTO_INCREMENT,\n"+
                "parent int,\n"+ //0 PARA PAI, ID DO PAI PARA FILHO
                "tipo int,\n"+  //1 - PAI, 2 - FILHO
                "perfil varchar(30) NOT NULL,\n"+ //"responsavel" - PAI OU SEGUNDO ADM, "dependente" - FILHO  
                "nome varchar(150) NOT NULL,\n"+
                "email varchar(150) NOT NULL,\n"+
                "senha varchar(200) NOT NULL,\n"+
                "PRIMARY KEY (id)\n"+
                ");";
    
    conn.query(sql, function (error, results, fields) {
        if(error) return console.log(error);
        console.log('Tabela de usuários criada com sucesso!');
    });
}

function addUsuario(conn) {

    bcrypt.genSalt(10, (erro, salt) => {
        bcrypt.hash("1598adm", salt, (erro, hash) => {
            if(erro) {
                console.log("Erro na criptografia "+erro);
            }

            var senha = hash; //senha do usuario recebe hash, encriptado

            const sql = "INSERT INTO usuario(parent, tipo, perfil, nome, email, senha) VALUES ?";

            const values = [
                ['0', '1', 'responsavel', 'Administrador', 'laviniasouza14-@hotmail.com', senha]
            ];

            conn.query(sql, [values], function (error, results, fields) {
                if(error) 
                    return console.log(error);

                console.log('Administrador criado com sucesso!');
                conn.end(); //fecha a conexão
            });
        });
    });
}

function criaCategoria(conn) {

    const sql = "CREATE TABLE IF NOT EXISTS categoria (\n"+
                "id int NOT NULL AUTO_INCREMENT,\n"+
                "descricao varchar(150) NOT NULL,\n"+
                "PRIMARY KEY (id)\n"+
                ");";
    
    conn.query(sql, function (error, results, fields) {
        if(error) return console.log(error);
        console.log('Tabela de categorias criada com sucesso!');
    });
}

function addCategoria(conn) {

    const sql = "INSERT INTO categoria(descricao) VALUES ?";

    const values = [
        ['Geral']
    ];

    conn.query(sql, [values], function (error, results, fields) {
        if(error) 
            return console.log(error);

        console.log('Categoria criada com sucesso!');
        conn.end(); //fecha a conexão
    });
}


function criaSolicitacao(conn) {

    const sql = "CREATE TABLE IF NOT EXISTS solicitacao (\n"+
                "id int NOT NULL AUTO_INCREMENT,\n"+
                "id_categoria int,\n"+
                "descricao varchar(1000) NOT NULL,\n"+
                "data datetime,\n"+
                "data_necessidade datetime,\n"+
                "valor decimal(10, 2),\n"+
                "situacao int,\n"+  //1 - EM ABERTO, 2 - CONCLUÍDA
                "id_usuario_pai int,\n"+
                "id_usuario_filho int,\n"+
                "PRIMARY KEY (id)\n"+       
                ");";
    
    conn.query(sql, function (error, results, fields) {
        if(error) return console.log(error);
        console.log('Tabela de solicitações criada com sucesso!');
    });
}

function criaSolicitacao_Avaliacao(conn) {

    const sql = "CREATE TABLE IF NOT EXISTS solicitacao_avaliacao (\n"+
                "id int NOT NULL AUTO_INCREMENT,\n"+
                "id_solicitacao int,\n"+
                "id_responsavel int,\n"+
                "tipo int,\n"+  //1 - APROVADA, 2 - RECUSADA
                "justificativa varchar(1000) NOT NULL,\n"+
                "observacao varchar(500),\n"+
                "PRIMARY KEY (id)\n"+
                ");";
    
    conn.query(sql, function (error, results, fields) {
        if(error) return console.log(error);
        console.log('Tabela de avaliação das solicitações criada com sucesso!');
    });
}