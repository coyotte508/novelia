const assert = require("assert");
const {Chapter, Comment} = require("../../models");
const utils = require("../utils");
const router = require("express").Router();
const viewcounter = require("../../engine/viewcounter");

router.param('chapter', async function(req, res, next, chapterNum) {
  try {
    var novel = req.novel;
    var chap = parseInt(chapterNum);
    utils.assert404(chap >= 0 && chap <= novel.chapters.length && novel.chapters[chap].title, "Chapter not found");

    if ( (chap == 0 && !novel.prologue) || chap < 0 || chap > novel.numChapters ) {
      throw new utils.HttpError("Chapter not found", 404);
    }

    req.chapter = await Chapter.findById(novel.chapters[chap].ref);

    assert(req.chapter, "Error while fetching chapter");

    next();
  } catch(err) {
    next(err);
  }
});

router.get('/:chapter(\\d+)/', async (req, res, next) => {
  try {
    viewcounter.addView(req);
    let comments = await Comment.commentsFor(req.chapter.id);
    res.render('pages/novel/chapter', {novel: req.novel, chapter: req.chapter, comments});
  } catch(err) {
    next(err);
  }
});

router.use("/", require("./add"));
router.use("/:chapter(\\d+)/", require("./edit"));
router.use("/:chapter(\\d+)/", require("./delete"));
router.use("/:chapter(\\d+)/comment", require("./comment"));

module.exports = router;
