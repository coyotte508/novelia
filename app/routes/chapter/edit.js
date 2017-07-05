const val = require("validator");
const utils = require("../utils");
const router = require("express").Router();

router.get('/edit',utils.canTouchNovel, (req, res, next) => {
  try {
    res.render('pages/novel/addchapter', {novel: req.novel, chapter: req.chapter,  action:"edit"});
  } catch(err) {
    next(err);
  }
});


router.post('/edit', utils.canTouchNovel, async (req, res) => {
  try {
    var novel = req.novel;
    var title = val.validateTitle(req.body.chapterTitle);
    var content = val.validateChapter(req.body.chapterContent);
    var authorNote = val.validateDescription(req.body.authorNote);

    await req.chapter.update({title, content, authorNote});

    var setOptions = {};
    setOptions["chapters."+req.params.chapter + ".title"] = title;
    novel.update(setOptions).exec();

    res.redirect(novel.getLink() + "/" + req.params.chapter);
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addchapter', {novel: novel || {}, chapter: req.chapter,  message: err.message, action: "edit"});
  }
});

module.exports = router;
