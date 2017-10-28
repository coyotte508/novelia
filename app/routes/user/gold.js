const router = require("express").Router();
const utils = require("../utils");

router.get('/account/gold', utils.isLoggedIn, (req, res) => {
  res.render('pages/user/gold');
});

module.exports = router;
