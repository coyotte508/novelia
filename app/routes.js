const val = require("validator");
const express = require("express");
const configAuth = require("../config/auth");
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login?referrer='+req.url);
}

module.exports = function(passport) {
  var router = express.Router();

  router.get("/", (req, res) => {
    res.render("pages/index", {error:null, req});
  });

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

  router.get('/newnovel', isLoggedIn, (req, res) => {
    res.render('pages/newnovel', {req, message: req.flash('newnovelMessage')});
  });

  router.post('/newnovel', isLoggedIn, (req, res, next) => {
    /* Todo: check if user can post new novel */
    try {
      var title = val.validateTitle(req.body.novelTitle);
      var description = val.validateDescription(req.body.novelDescription);

      req.flash('newnovelMessage', "New novel added (sort of)");
      res.redirect('/newnovel');
    } catch (err) {
      req.flash('newnovelMessage', err.message);
      res.render('pages/newnovel', {req, message: req.flash('newnovelMessage')});
    }
  })

  // =====================================
  // GOOGLE ROUTES =======================
  // =====================================
  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  router.get('/auth/google', (req, res, next) => { 
    var f = passport.authenticate('google', { 
      scope : ['profile', 'email'],
      /* .get('host') to get port as well */
      callbackURL: "http://"+req.get('host')+configAuth.googleAuth.callbackURL
    });
    f (req,res,next); 
  });

  // the callback after google has authenticated the user
  router.get('/auth/google/callback',
    passport.authenticate('google', {
          successRedirect : '/profile',
          failureRedirect : '/'
  }));

  return router;
};