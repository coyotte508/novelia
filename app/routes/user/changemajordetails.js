const assert = require("assert");
const limiter = require("mongo-limiter");
const val = require("validator");
const utils = require("../utils");
const router = require("express").Router();

router.get('/security', utils.isLoggedInAndNotSocial, function(req, res) {
  res.render("pages/user/security", {req, message: req.flash('securityMessage')});
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
    res.render("pages/user/security", {req, message: err.message});
  }
});


module.exports = router;
