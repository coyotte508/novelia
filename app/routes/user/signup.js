const utils = require("../utils");
const router = require("express").Router();
const passport = require("passport");
const limiter = require("mongo-limiter");

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
  res.render('pages/user/signup', {message: req.flash('signupMessage')});
});

router.post('/signup', utils.isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local-signup', {
    successRedirect : req.body.referrer || "/profile",
    failureRedirect : '/signup',
    failureFlash : true
  })(req, res, next);
});


module.exports = router;
