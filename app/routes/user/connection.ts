import * as passport from 'passport';
import Router from 'express-promise-router';
import { Request } from '../../types';

const router = Router();

router.get("/login", async (req: Request, res) => {
  if (req.isAuthenticated()) {
    return res.redirect(req.user.link());
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

router.get('/logout', async (req: Request, res) => {
  req.logout();
  res.redirect('/');
  req.session.destroy(() => {});
});

export default router;
