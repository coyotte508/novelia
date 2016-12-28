const _ = require("lodash");
const express = require("express");

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
}

module.exports = function(passport) {
  var router = express.Router();

  router.get("/", (req, res) => {
    res.render("pages/index", {error:null, req});
  });

  router.get("/login", (req, res) => {
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
    passport.authenticate('local-signup', {
      successRedirect : req.body.referrer || "/profile",
      failureRedirect : '/signup',
      failureFlash : true 
    })(req, res, next);
  });

  router.get('/profile', isLoggedIn, function(req, res) {
    res.render('pages/profile', {
      user: req.user,
      req
    });
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  // =====================================
  // GOOGLE ROUTES =======================
  // =====================================
  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

  // the callback after google has authenticated the user
  router.get('/auth/google/callback',
  passport.authenticate('google', {
          successRedirect : '/profile',
          failureRedirect : '/'
  }));

  return router;
};