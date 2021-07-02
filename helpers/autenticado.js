module.exports = {
    autenticado: function(req, res, next) {
        
        if(req.isAuthenticated()){ //se está autenticado
            return next();
        }
 
        req.flash("error_msg", "Você deve estar logado para entrar aqui");
        res.redirect("/");
    }
}