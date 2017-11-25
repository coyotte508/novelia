const locks = require("mongo-locks");
const limiter = require("mongo-limiter");
const utils = require("../utils");
const router = require("express-promise-router")();
const {Novel} = require("../../models");

router.all('/delete', utils.canTouchNovel, async (req, res, next) => {
  var free = () => {};
  try {
    free = await locks.lock("major-novel-change", req.novel.id);
    var novel = await(Novel.findById(req.novel.id)); //force refresh

    var num = req.params.chapter;
    var chapter = req.chapter;

    await novel.deleteChapter(chapter);

    limiter.action(req.user.id, "delchapter", {num, chapter: chapter.title, novel: novel.title});

    chapter.remove();

    res.redirect(novel.getLink());
  } catch(err) {
    next(err);
  } finally {
    free();
  }
});

module.exports = router;
