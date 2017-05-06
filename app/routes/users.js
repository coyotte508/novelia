const User = require("../models/user");
const router = require("express").Router();

router.get('/users', async (req, res, next) => {
  try {
    let users = await User.find({}, User.basics()).sort({_id: -1}).limit(50);

    res.render('pages/user/users', {users});
  } catch (err) {
    next(err);
  }
});

module.exports = router;