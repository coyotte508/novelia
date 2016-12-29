const passport = require("passport");
const utils = require("./utils");
const router = require("express").Router();

router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  res.render('pages/login', {message: req.flash('loginMessage'), req});
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local-login', {
    successRedirect : req.body.referrer || "/profile",
    failureRedirect : '/login',
    failureFlash : true 
  })(req, res, next);
});

router.get("/signup", (req, res) => {
  res.render('pages/signup', {message: req.flash('signupMessage'), req});
});

router.post('/signup', (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  passport.authenticate('local-signup', {
    successRedirect : req.body.referrer || "/profile",
    failureRedirect : '/signup',
    failureFlash : true 
  })(req, res, next);
});

router.get('/profile', utils.isLoggedIn, function(req, res) {
  res.render('pages/profile', {user: req.user, req});
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;