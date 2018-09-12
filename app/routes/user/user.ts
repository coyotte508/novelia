import {User} from '../../models';
import * as utils from '../utils';
import Router from 'express-promise-router';
import { Request } from '../../types';

const router = Router();

router.get('/profile', utils.isLoggedIn, (req, res) => {
  res.redirect(req.user.link);
});

router.param('user', async (req: Request, res, next, param: string) => {
  const user = await User.findByUrl(param);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  req.viewedUser = user;
  next();
});

router.get('/u/:user', async (req: Request, res) => {
  const user = req.viewedUser;

  await user.loadAuthoredNovels();

  res.render('pages/user/user', {u: user, message: req.flash('profileMessage')});
});

router.get('/u/:user/:tab(novels|library)', async (req: Request, res) => {
  const user = req.viewedUser;

  await user.loadAuthoredNovels();

  res.render('pages/user/user', {u: user, message: req.flash('profileMessage')});
});

import connection from './connection';
import resetpassword from './resetpassword';
import signup from './signup';
import settings from './settings';
import gold from './gold';

router.use("/", connection);
router.use("/", resetpassword);
router.use("/", signup);
router.use("/", settings);
router.use("/", gold);

export default router;
