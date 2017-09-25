const utils = require("../utils");
const router = require("express").Router();

/* Only make sure the user is logged in and then drop him down to comment */
router.get('/', utils.isLoggedIn, (req, res, next) => {
  try {
    return res.redirect(req.chapter.getLink() + "#comment");
  } catch(err) {
    next(err);
  }
});

module.exports = router;
