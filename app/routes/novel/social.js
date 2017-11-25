const limiter = require("mongo-limiter");
const utils = require("../utils");
const router = require("express-promise-router")();
const locks = require("mongo-locks");
const {User} = require("../../models");

router.all('/follow', utils.isLoggedIn, async (req, res, next) => {
  var free = () => {};
  try {
    var novel = req.novel;

    if (!(await limiter.attempt(req.user.id, 'follow', novel.title))) {
      throw new utils.HttpError(`You can only follow ${limiter.limits().follow.limit} times per hour`, 403);
    }

    try {
      free = await locks.lock("followNovel", req.user.id, novel.id);

      var user = await User.findById(req.user.id); //Force update after lock

      await user.followNovel({ref: novel.id, title: novel.title});
      await novel.update({$inc: {follows: 1}});
    } catch (err) {
      console.error(err);
    }

    res.redirect(req.get('Referrer') || novel.getLink());
  } catch(err) {
    next(err);
  } finally {
    free();
  }
});

router.all('/unfollow', utils.isLoggedIn, async (req, res, next) => {
  var free = () => {};
  try {
    var novel = req.novel;

    try {
      free = await locks.lock("followNovel", req.user.id, novel.id);

      var user = await User.findById(req.user.id); //Force update after lock

      await user.unfollowNovel(novel.id);
      await novel.update({$inc: {follows: -1}});
    } catch (err) {
      console.error(err);
    }

    res.redirect(req.get('Referrer') || novel.getLink());
  } catch(err) {
    next(err);
  } finally {
    free();
  }
});

module.exports = router;
