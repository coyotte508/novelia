const router = require("express").Router();
const utils = require("../utils");
const {Novel, Chapter, User} = require("../../models");
const limiter = require("mongo-limiter");

router.get("/admin", utils.isAdmin, async (req, res, next) => {
  try {
    var [nbNovels, nbChapters, nbUsers, actions] = await Promise.all([Novel.count(),Chapter.count(), User.count(), limiter.logs()]);

    var userIds = actions.map(x => x.user).filter(x => !x.includes(".") && !x.includes(":"));
    var users = await User.find({_id: {$in: userIds}});
    var userD = {};
    users.forEach(x => userD[x.id] = x);

    actions.forEach(x => {
      if (typeof x.data === "object") x.data = JSON.stringify(x.data || "");
      if (x.user in userD) {
        x.userLink = userD[x.user].getLink();
        x.user = userD[x.user].displayName();
      }
    });

    var stats = {
      nbUsers, nbChapters, nbNovels
    };

    res.render("pages/admin", {actions, stats});
  } catch(err) {
    next(err);
  }
});

router.use("/", require("./novels"));
router.use("/", require("./users"));

module.exports = router;