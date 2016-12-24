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
    console.log("rending index");
    res.render("pages/index", {error:null});
  });

  router.get("/login", (req, res) => {
    res.render('pages/login', {message: req.flash('loginMessage')});
  });

  router.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile',
      failureRedirect : '/login',
      failureFlash : true 
  }));

  router.get("/signup", (req, res) => {
    res.render('pages/signup', {message: req.flash('signupMessage')});
  });

  router.post("/signup", passport.authenticate('local-signup', {
    successRedirect : '/profile',
    failureRedirect : '/signup',
    failureFlash : true
  }));

  router.get('/profile', isLoggedIn, function(req, res) {
    res.render('pages/profile', {
      user: req.user // get the user out of session and pass to template
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