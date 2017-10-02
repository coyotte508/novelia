const router = require("express").Router();
const utils = require("../utils");

router.get('/account', utils.isLoggedIn, (req, res) => {
  res.redirect('/settings/profile');
});

router.get('/settings/profile', utils.isLoggedIn, (req, res) => {
  res.render('pages/user/settings', {tab: 'profile', title: "Your profile"});
});

router.get('/settings/account', utils.isLoggedIn, (req, res) => {
  res.render('pages/user/settings', {tab: 'account', title: "Account settings", message: req.flash('securityMessage')});
});

router.use('/', require('./settings/account'));
router.use('/', require('./settings/profile'));

module.exports = router;
