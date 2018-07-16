import * as utils from '../utils';
import Router from 'express-promise-router';

const router = Router();

router.get('/account', utils.isLoggedIn, (req, res) => {
  res.redirect('/settings/profile');
});

router.get('/settings/profile', utils.isLoggedIn, (req, res) => {
  res.render('pages/user/settings', {tab: 'profile', title: "Your profile"});
});

router.get('/settings/account', utils.isLoggedIn, (req, res) => {
  res.render('pages/user/settings', {tab: 'account', title: "Account settings", message: req.flash('securityMessage')});
});

import account from './settings/account';
import profile from './settings/profile';
router.use('/', account);
router.use('/', profile);

export default router;
