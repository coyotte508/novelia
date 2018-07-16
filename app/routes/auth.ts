import Router from 'express-promise-router';
import * as passport from 'passport';
import configAuth from '../config/auth';

const router = Router();

// =====================================
// GOOGLE ROUTES =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/google', (req, res, next) => {
  const f = passport.authenticate('google', {
    scope : ['profile', 'email'],
    /* .get('host') to get port as well */
    callbackURL: "http://" + req.get('host') + configAuth.googleAuth.callbackURL
  } as any);
  f (req, res, next);
});

// the callback after google has authenticated the user
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect : '/'
  }), async (req, res, next) => {
    const user = req.user;

    try {
      if (user.new) {
        await user.fillInSecurity(req.ip);
        await user.save();
      } else {
        await user.notifyLogin(req.ip);
      }
      return res.redirect("/profile");
    } catch (err) {
      next(err);
    }
  });

export default router;
