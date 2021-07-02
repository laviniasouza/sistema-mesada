module.exports = {
    eAdmin: function(req, res, next){
        
        if(req.isAuthenticated() && req.user.tipo == 1){ //se está autenticado e se for administrador
            return next();
        }

        req.flash("error_msg", "Você precisa ser um Administrador!");
        res.redirect("/");
    }
}