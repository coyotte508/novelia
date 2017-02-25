const User = require("../models/user");
const passport = require("passport");
const utils = require("./utils");
const router = require("express").Router();
const slug = require("slug");
const val = require("validator");
const limiter = require("mongo-limiter");
const assert = require("assert");

router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  res.render('pages/user/login', {message: req.flash('loginMessage'), req});
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local-login', {
    successRedirect : req.body.referrer || "/profile",
    failureRedirect : '/login',
    failureFlash : true 
  })(req, res, next);
});

router.get("/goldfish", utils.isNotLoggedIn, (req, res) => {
  res.render('pages/user/forget', {message: req.flash('forgetMessage'), req});
});

router.post('/goldfish', async (req, res) => {
  try {
    var email = val.validateEmail(req.body.email);

    if (!(await limiter.attempt(req.ip, 'forgetip', email))) {
      throw new Error(`Max number of attempts reached for your IP (${req.ip}), try again in 24 hours.`);
    }

    if (!(await limiter.attempt(email, 'forget', email))) {
      throw new Error(`Max number of attempts for ${email} reached, try again in 24 hours.`);
    }

    var user = await User.findOne().or([
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

    await user.generateResetLink();
    await user.sendResetEmail();

    res.render('pages/user/forget', {message: `A mail has been sent to ${email}, with a link to reset the password.` , req});
  } catch(err) {
    res.render('pages/user/forget', {message: err.message, req});
  }
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

router.all('/confirm', utils.isLoggedIn, async (req, res) => {
  try {
    var user = req.user;

    if (user.confirmed()) {
      return res.redirect('/profile');
    }

    if (req.query && req.query.key) {
      await user.confirm(req.query.key);
      req.flash('profileMessage', 'You were successfully confirmed!');
      return res.redirect('/profile');
    }

    if (!(await limiter.attempt(user.id, "confirm"))) {
      throw new Error("Max number of confirmation emails sent, try again tomorrow.");
    }

    if (!user.confirmKey()) {
      user.generateConfirmKey();
    }

    user.sendConfirmationEmail();

    req.flash("profileMessage", `Confirmation email sent to ${user.email()}.`);
    res.redirect('/profile');
  } catch(err) {
    req.flash("profileMessage", err.message);
    res.redirect('/profile');
  }
});

router.get("/signup", utils.isNotLoggedIn, (req, res) => {
  res.render('pages/user/signup', {message: req.flash('signupMessage'), req});
});

router.post('/signup', utils.isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local-signup', {
    successRedirect : req.body.referrer || "/profile",
    failureRedirect : '/signup',
    failureFlash : true 
  })(req, res, next);
});

router.get('/profile', utils.isLoggedIn, function(req, res) {
  res.render('pages/user/profile', {user: req.user, req, slug, message: req.flash('profileMessage')});
});

router.get('/security', utils.isLoggedInAndNotSocial, function(req, res) {
  res.render("pages/user/security", {user: req.user, req, message: req.flash('securityMessage')});
});

router.post('/security', utils.isLoggedInAndNotSocial, async function(req, res) {
  try {
    var user = req.user;
    var newPw = req.body.newPassword ? val.validatePassword(req.body.newPassword) : "";
    var email = val.validateEmail(req.body.email);

    assert(await limiter.attempt(req.user.id, "security"), "Too many security changes or attempts, wait 24 hours.");

    assert(await user.validPassword(req.body.password), "Wrong current password.");

    if (newPw) {
      await user.resetPassword(newPw);
    }

    if (email != user.email()) {
      await user.changeEmail(email);
      user.sendConfirmationEmail();

      req.flash("profileMessage", "Details changed! A confirmation email was sent to your new email address.");
    } else {
      req.flash("profileMessage", "Details changed!");
    }

    res.redirect("/profile");
  } catch(err) {
    res.render("pages/user/security", {user: req.user, req, message: err.message});
  }
});

router.param('user', async function(req, res, next, user) {
  try {
    user = await User.findByUrl(user);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    req.viewedUser = user;
    next();
  } catch(err) {
    next(err);
  }
});

router.get('/u/:user', function(req, res, next) {
  try {
    var user = req.viewedUser;
    
    res.render('pages/user/user', {req, user, slug});
  } catch(err) {
    next(err);
  }
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
  req.session.destroy();
});

module.exports = router;