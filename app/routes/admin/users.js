const {User} = require("../../models");
const router = require("express-promise-router")();

router.get('/users', async (req, res) => {
  let users = await User.find({}, User.basics()).sort({_id: -1}).limit(50);

  res.render('pages/user/users', {users});
});

module.exports = router;
