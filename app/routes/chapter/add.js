const val = require("validator");
const limiter = require("mongo-limiter");
const locks = require("mongo-locks");
const utils = require("../utils");
const router = require("express-promise-router")();
const {Novel, Chapter} = require("../../models");

router.get('/addchapter', utils.canTouchNovel, async (req, res) => {
  res.render('pages/novel/addchapter', {novel: req.novel, message: "", action:"add"});
});

router.post('/addchapter', utils.canTouchNovel, async (req, res) => {
  /* Todo: check if user can post new novel */
  var free = ()=>{};
  try {
    var novel = req.novel;
    var prologue = (req.body.options||"").split(",").indexOf("prologue") != -1;
    var number = prologue ? 0 : (novel.numChapters+1);

    if (!(await limiter.possible(req.user.id, 'addchapter'))) {
      throw new utils.HttpError(`You can only add ${limiter.limits().addchapter.limit} chapters per day`, 403);
    }

    var title = val.validateTitle(req.body.chapterTitle || (""+number));
    var content = val.validateChapter(req.body.chapterContent);
    var authorNote = val.validateDescription(req.body.authorNote);

    free = await locks.lock("major-novel-change", novel.id);

    novel = await Novel.findById(novel.id); //force refresh
    utils.assert403(!(novel.prologue && prologue), "There is already a prologue, you can't add another one.");

    var chapter = new Chapter();
    chapter.title = title;
    chapter.content = content;
    chapter.authorNote = authorNote;
    chapter.novel = {ref: novel.id, title: novel.title};
    chapter.number = prologue ? 0 : (novel.numChapters+1);
    chapter.public = novel.public;

    await chapter.save();

    await novel.addChapter(chapter);

    limiter.action(req.user.id, "addchapter", {title, novel: novel.title});

    res.redirect(novel.getLink() + "/" + (prologue ? 0 : novel.numChapters + 1));
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addchapter', {novel: novel || {}, message: err.message, action: "add"});
  } finally {
    free();
  }
});

module.exports = router;
