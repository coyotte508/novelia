const co = require("co");
const User = require("../models/user")
const passport = require("passport");
const utils = require("./utils");
const router = require("express").Router();
const slug = require("slug");

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
  res.render('pages/profile', {user: req.user, req, slug});
});

router.param('user', function(req, res, next, user) {
  co(function*() {
    user = yield User.findByUrl(user);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    req.viewedUser = user;
    next();
  }).catch(err => next(err));
});

router.get('/u/:user', function(req, res, next) {
  co(function*() {
    var user = req.viewedUser;
    
    res.render('pages/user', {req, user, slug});
  }).catch((err) => next(err));
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;