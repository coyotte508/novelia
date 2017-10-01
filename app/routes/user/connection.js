const passport = require("passport");
const router = require("express").Router();

router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect(req.user.getLink());
  }
  res.render('pages/user/login', {message: req.flash('loginMessage')});
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local-login', {
    successRedirect : req.body.referrer || "/profile",
    failureRedirect : '/login',
    failureFlash : true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
  req.session.destroy();
});

module.exports = router;
