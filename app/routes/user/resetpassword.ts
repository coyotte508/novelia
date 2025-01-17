import * as passport from 'passport';
import limiter from 'mongo-limiter';
import val from '../../config/validator';
import * as utils from '../utils';
import {User} from '../../models';
import Router from 'express-promise-router';

const router = Router();

router.get("/goldfish", utils.isNotLoggedIn, (req, res) => {
  res.render('pages/user/forget', {message: req.flash('forgetMessage'), req});
});

router.post('/goldfish', async (req, res) => {
  try {
    const email = val.validateEmail(req.body.email);

    if (!(await limiter.attempt(req.ip, 'forgetip', email))) {
      throw new Error(`Max number of attempts reached for your IP (${req.ip}), try again in 24 hours.`);
    }

    if (!(await limiter.attempt(email, 'forget', email))) {
      throw new Error(`Max number of attempts for ${email} reached, try again in 24 hours.`);
    }

    const user = await User.findOne().or([
      {'local.email': email},
      {'google.email': email}
    ]);

    // check to see if theres already a user with that email
    if (user && user.local.email !== email) {
      throw new Error("This email is linked to a social account, log in using the social button!");
    }

    if (!user) {
      throw new Error("No such user found");
    }

    await user.generateResetLink();
    await user.sendResetEmail();

    res.render('pages/user/forget', {message: `A mail has been sent to ${email}, with a link to reset the password.` , req});
  } catch (err) {
    res.render('pages/user/forget', {message: err.message});
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

export default router;
