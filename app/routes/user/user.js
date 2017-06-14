const {User} = require("../../models");
const utils = require("../utils");
const router = require("express").Router();

router.get('/profile', utils.isLoggedIn, function(req, res) {
  res.render('pages/user/profile', {message: req.flash('profileMessage')});
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

router.get('/u/:user', function(req, res, next) {
  try {
    var user = req.viewedUser;

    res.render('pages/user/user', {u:user});
  } catch(err) {
    next(err);
  }
});

router.use("/", require("./changemajordetails"));
router.use("/", require("./connection"));
router.use("/", require("./resetpassword"));
router.use("/", require("./signup"));

module.exports = router;
