import * as assert from 'assert';
import limiter from 'mongo-limiter';
import val from '../../../config/validator';
import * as utils from '../../utils';
import Router from 'express-promise-router';

const router = Router();

router.post('/settings/account', utils.isLoggedInAndNotSocial, async (req, res) => {
  try {
    const user = req.user;
    const newPw = req.body.newPassword ? val.validatePassword(req.body.newPassword) : "";
    const email = val.validateEmail(req.body.email);

    assert(await limiter.attempt(req.user.id, "security"), "Too many security changes or attempts, wait 24 hours.");

    assert(await user.validPassword(req.body.password), "Wrong current password.");

    if (newPw) {
      await user.resetPassword(newPw);
    }

    if (email !== user.email()) {
      await user.changeEmail(email);
      user.sendConfirmationEmail();

      req.flash("profileMessage", "Details changed! A confirmation email was sent to your new email address.");
    } else {
      req.flash("profileMessage", "Details changed!");
    }

    res.redirect("/profile");
  } catch (err) {
    res.render("pages/user/settings", {req, message: err.message, tab: "account", title: "Account settings"});
  }
});

export default router;
