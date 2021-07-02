module.exports = {
    eResponsavel: function(req, res, next){
        
        if(req.isAuthenticated() && req.user.perfil == 'responsavel'){ //se está autenticado e se for um responsável
            return next();
        }

        req.flash("error_msg", "Você precisa ser um Pai / Responsável!");
        res.redirect("/");
    }
}