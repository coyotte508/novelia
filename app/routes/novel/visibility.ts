const limiter = require("mongo-limiter");
const utils = require("../utils");
const router = require("express-promise-router")();
const {Chapter} = require("../../models");

router.all('/show', utils.canTouchNovel, async (req, res) => {
  var novel = req.novel;

  if (!(await limiter.attempt(req.user.id, 'shownovel', novel.title))) {
    throw new utils.HttpError(`You can only change your novels' viewable settings ${limiter.limits().shownovel.limit} times per hour`, 403);
  }

  Chapter.update({"novel.ref": novel.id}, {public: true}, {multi: true}).then();
  await novel.update({public: true});

  res.redirect(novel.getLink());
});

router.all('/hide', utils.canTouchNovel, async (req, res) => {
  var novel = req.novel;

  Chapter.update({"novel.ref": novel.id}, {public: false}, {multi: true}).then();
  await novel.update({public: false});

  res.redirect(novel.getLink());
});

export default router;
