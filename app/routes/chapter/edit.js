const val = require("validator");
const utils = require("../utils");
const router = require("express-promise-router")();

router.get('/edit', utils.canTouchNovel, async (req, res) => {
  res.render('pages/novel/addchapter', {novel: req.novel, chapter: req.chapter,  action:"edit"});
});


router.post('/edit', utils.canTouchNovel, async (req, res) => {
  try {
    var novel = req.novel;
    var title = val.validateTitle(req.body.chapterTitle);
    var content = val.validateChapter(req.body.chapterContent);
    var authorNote = val.validateDescription(req.body.authorNote);

    await req.chapter.update({title, content, authorNote});

    res.redirect(novel.getLink() + "/" + req.chapter.number);
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addchapter', {novel: novel || {}, chapter: req.chapter,  message: err.message, action: "edit"});
  }
});

module.exports = router;
