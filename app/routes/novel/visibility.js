const limiter = require("mongo-limiter");
const utils = require("../utils");
const router = require("express").Router();
const {Chapter, User} = require("../../models");

router.all('/show', utils.canTouchNovel, async (req, res, next) => {
  try {
    var novel = req.novel;

    if (!(await limiter.attempt(req.user.id, 'shownovel', novel.title))) {
      throw new utils.HttpError(`You can only change your novels' viewable settings ${limiter.limits().shownovel.limit} times per hour`, 403);
    }

    Chapter.update({"novel.ref": novel.id}, {public: true}, {multi: true}).then();
    await novel.update({public: true});

    /* Update in user's list of novels */
    await User.where({_id: novel.author.ref, "novels.ref": novel.id}).update({$set: {"novels.$.public": true}}).exec();

    res.redirect(novel.getLink());
  } catch(err) {
    next(err);
  }
});

router.all('/hide', utils.canTouchNovel, async (req, res, next) => {
  try {
    var novel = req.novel;

    Chapter.update({"novel.ref": novel.id}, {public: false}, {multi: true}).then();
    await novel.update({public: false});

    /* Update in user's list of novels */
    await User.where({_id: novel.author.ref, "novels.ref": novel.id}).update({$set: {"novels.$.public": false}}).exec();

    res.redirect(novel.getLink());
  } catch(err) {
    next(err);
  }
});

module.exports = router;
