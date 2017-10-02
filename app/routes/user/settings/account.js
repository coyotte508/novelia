const assert = require("assert");
const limiter = require("mongo-limiter");
const val = require("validator");
const utils = require("../../utils");
const router = require("express").Router();

router.post('/settings/account', utils.isLoggedInAndNotSocial, async function(req, res) {
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
    res.render("pages/user/settings", {req, message: err.message, tab: "account", title: "Account settings"});
  }
});

module.exports = router;
