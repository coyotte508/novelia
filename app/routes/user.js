const co = require("co");
const User = require("../models/user")
const passport = require("passport");
const utils = require("./utils");
const router = require("express").Router();
const slug = require("slug");
const val = require("validator");
const limiter = require("mongo-limiter");
const config = require('../../config/general');
const sendmail = require("sendmail")();

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

router.get("/goldfish", utils.isNotLoggedIn, (req, res) => {
  res.render('pages/forget', {message: req.flash('forgetMessage'), req});
});

router.post('/goldfish', (req, res, next) => {
  return co(function*() {
    var email = val.validateEmail(req.body.email);

    if (!(yield limiter.attempt(req.ip, 'forgetip', email)) || !(yield limiter.attempt(email, 'forget', email))) {
      throw new Error("Max number of attempts reached.");
    }

    var user = yield User.findOne().or([
      {'local.email': email},
      {'google.email': email}
    ]);

    // check to see if theres already a user with that email
    if (user && user.local.email != email) {
      throw new Error("This email is linked to a social account, log in using the social button!");
    }

    if (!user) {
      throw new Error("No such user found");
    }

    yield user.generateResetLink();

    sendmail({
      from: config.noreply,
      to: email,
      subject: 'Forgotten password',
      html: `<p>A password reset was requested for your account ${user.local.username}, click <a href='http://www.${config.domain}/reset?key=${user.resetKey()}'>this link</a></p> to proceed with it.

<p>If you didn't request a password reset, then just ignore this email.</p>`,
    });

    res.render('pages/forget', {message: `A mail has been sent to ${email}, with a link to reset the password.` , req});
  }).catch(err => {
    res.render('pages/forget', {message: err.message, req});
  });
});

router.get('/reset', utils.isNotLoggedIn, (req, res) => {
  res.render("pages/reset", {message: req.flash('resetMessage'), req});
});

router.post('/reset', utils.isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local-reset', {
    successRedirect : "/profile",
    failureRedirect : req.originalUrl,
    failureFlash : true 
  })(req, res, next);
});

router.get("/signup", utils.isNotLoggedIn, (req, res) => {
  res.render('pages/signup', {message: req.flash('signupMessage'), req});
});

router.post('/signup', utils.isNotLoggedIn, (req, res, next) => {
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
  req.session.destroy();
});

module.exports = router;