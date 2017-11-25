const val = require("validator");
const limit = require("mongo-limiter");
const router = require("express").Router();
const utils = require("../../utils");

router.post('/settings/profile', utils.isLoggedIn, async function(req, res) {
  try {
    req.user.bio = val.validateDescription(req.body.bio);

    await limit.action(req.user.id, "update-profile");
    await req.user.save();

    res.redirect("/profile"); 
  } catch(err) {
    res.render("pages/user/settings", {req, message: err.message, tab: "profile", title: "Public profile"});
  }
});

module.exports = router;
