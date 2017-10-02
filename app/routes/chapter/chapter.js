const {Chapter, Comment} = require("../../models");
const utils = require("../utils");
const router = require("express").Router();
const viewcounter = require("../../engine/viewcounter");

router.param('chapter', async function(req, res, next, chapterNum) {
  try {
    var novel = req.novel;
    var chap = parseInt(chapterNum);

    req.chapter = await Chapter.findOne({"novel.ref": novel.id, "number": chap});

    utils.assert404(req.chapter, "Chapter not found");

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
