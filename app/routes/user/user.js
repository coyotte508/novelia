const {User} = require("../../models");
const utils = require("../utils");
const router = require("express-promise-router")();

router.get('/profile', utils.isLoggedIn, function(req, res) {
  res.redirect(req.user.getLink());
});

router.param('user', async function(req, res, next, user) {
  try {
    user = await User.findByUrl(user);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    req.viewedUser = user;
    next();
  } catch(err) {
    next(err);
  }
});

router.get('/u/:user', async function(req, res) {
  var user = req.viewedUser;

  await user.loadAuthoredNovels();

  res.render('pages/user/user', {u:user, message: req.flash('profileMessage')});
});

router.get('/u/:user/:tab(novels|library)', async function(req, res) {
  var user = req.viewedUser;
  
  await user.loadAuthoredNovels();

  res.render('pages/user/user', {u:user, message: req.flash('profileMessage')});
});

router.use("/", require("./connection"));
router.use("/", require("./resetpassword"));
router.use("/", require("./signup"));
router.use("/", require("./settings"));
router.use("/", require("./gold"));

module.exports = router;
