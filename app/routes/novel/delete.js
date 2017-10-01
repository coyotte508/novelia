const utils = require("../utils");
const router = require("express").Router();
const limiter = require("mongo-limiter");
const {Chapter, Image} = require("../../models");

router.all('/delete', utils.canTouchNovel, async (req, res, next) => {
  try {
    var novel = req.novel;
    utils.assert403(novel.numChapters == 0, "You can only delete empty novels");

    limiter.action(req.user.id, "delnovel", novel.title);

    if (novel.image.ref) {
      try {
        let image = await Image.findById(novel.image.ref);
        await image.delete();
      } catch (err) {
        console.error(err);
      }
    }

    if (novel.prologue) {
      Chapter.findOneAndRemove(novel.chapters[0].ref).exec();
    }
    novel.remove();

    res.redirect("/profile");
  } catch(err) {
    next(err);
  }
});

module.exports = router;
