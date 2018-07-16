import * as utils from '../utils';
import * as passport from 'passport';
import limiter from 'mongo-limiter';
import Router from 'express-promise-router';

const router = Router();

router.all('/confirm', utils.isLoggedIn, async (req, res) => {
  const user = req.user;
  try {
    if (user.confirmed) {
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

    if (!user.confirmKey) {
      user.generateConfirmKey();
    }

    user.sendConfirmationEmail();

    req.flash("profileMessage", `Confirmation email sent to ${user.email}.`);
    res.redirect(user.getLink());
  } catch (err) {
    req.flash("profileMessage", err.message);
    res.redirect(user.getLink());
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

export default router;