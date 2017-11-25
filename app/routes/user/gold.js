const router = require("express-promise-router")();
const utils = require("../utils");

router.get('/account/gold', utils.isLoggedIn, async (req, res) => {
  res.render('pages/user/gold');
});

module.exports = router;
