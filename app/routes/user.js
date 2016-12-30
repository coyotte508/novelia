const co = require("co");
const User = require("../models/user")
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

router.get('/u/:name', function(req, res) {
  co(function*() {
    try {
      var user = yield User.findByUrl(req.params.name);
      
      assert404(res, user, "User not found");

      res.render('pages/user', {req, user, message: ""});
    } catch (err) {
      novel = novel || {}, author = author || {};
      res.statusCode = res.statusCode == 200 ? 500 : res.statusCode;

      res.render('pages/user', {req, user, message: err.message});
    }
  });
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;