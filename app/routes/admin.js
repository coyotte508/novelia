const router = require("express").Router();
const utils = require("./utils");
const co = require("co");
const Novel = require("../models/novel");
const Chapter = require("../models/chapter");
const User = require("../models/user");
const limiter = require("mongo-limiter");

router.get("/admin", utils.isAdmin, (req, res) => {
  co(function *(){
    var [nbNovels, nbChapters, nbUsers, actions] = yield Promise.all([Novel.count(),Chapter.count(), User.count(), limiter.logs()]);

    var userIds = actions.map(x => x.user).filter(x => !x.includes(".") && !x.includes(":"));
    var users = yield User.find({_id: {$in: userIds}});
    var userD = {};
    users.forEach(x => userD[x.id] = x);

    actions.forEach(x => {
      if (x.user in userD) {
        x.userLink = userD[x.user].getLink();
        x.user = userD[x.user].displayName();
      }
    });

    var stats = {
      nbUsers, nbChapters, nbNovels
    };

    res.render("pages/admin", {actions, req, stats});
  })
});

module.exports = router;