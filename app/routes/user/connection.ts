import * as passport from 'passport';
import Router from 'express-promise-router';

const router = Router();

router.get("/login", async (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect(req.user.getLink());
  }
  res.render('pages/user/login', {message: req.flash('loginMessage')});
});

router.post('/login', async (req, res, next) => {
  passport.authenticate('local-login', {
    successRedirect : req.body.referrer || "/profile",
    failureRedirect : '/login',
    failureFlash : true
  })(req, res, next);
});

router.get('/logout', async (req, res) => {
  req.logout();
  res.redirect('/');
  req.session.destroy(() => {});
});

export default router;
