const {User} = require("../../models");
const utils = require("../utils");
const router = require("express").Router();

router.get('/profile', utils.isLoggedIn, function(req, res, next) {
  try {
    res.redirect(req.user.getLink());
  } catch(err) {
    next(err);
  }
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

router.get('/u/:user', async function(req, res, next) {
  try {
    var user = req.viewedUser;

    await user.loadAuthoredNovels();

    res.render('pages/user/user', {u:user, message: req.flash('profileMessage')});
  } catch(err) {
    next(err);
  }
});

router.use("/", require("./connection"));
router.use("/", require("./resetpassword"));
router.use("/", require("./signup"));
router.use("/", require("./settings"));
router.use("/", require("./gold"));

module.exports = router;
