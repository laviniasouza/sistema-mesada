const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
var connection = require('../config/dbconn');

module.exports = function(passport) {

    passport.use(new localStrategy({
        
        usernameField: 'email', passwordField: "senha"}, (email, senha, done) => {

            if(!email || !senha )
                return done(null, false, {message: "Todos os campos são necessários!"});

            connection.query("select * from usuario where email = ?", [email], function(err, rows) {

                if (err) 
                    return done(console.log(err));

                if(!rows.length)
                    return done(null, false, {message: "Este usuário não existe!"});     

                bcrypt.compare(senha, rows[0].senha, (erro, batem) => {
                        
                    if(batem)
                        return done(null, rows[0])
                    else
                        return done(null, false, {message: "Senha incorreta"});
                });
            });
        }
    ));

    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
}