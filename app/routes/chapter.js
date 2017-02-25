const val = require("validator");
const assert = require("assert");
const Novel = require("../models/novel");
const Chapter = require("../models/chapter");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("mongo-limiter");
const locks = require("mongo-locks");
const viewcounter = require("../engine/viewcounter");

router.get('/addchapter', utils.canTouchNovel, (req, res, next) => {
  try {
    res.render('pages/novel/addchapter', {req, novel: req.novel, message: "", action:"add"});  
  } catch(err) {
    next(err);
  }
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
    res.render('pages/novel/addchapter', {req, novel: novel || {}, message: err.message, action: "add"});
  }

  free();
});

router.param('chapter', async function(req, res, next, chapterNum) {
  try {
    var novel = req.novel;
    var chap = parseInt(chapterNum);
    utils.assert404(chap >= 0 && chap <= novel.chapters.length && novel.chapters[chap].title, "Chapter not found");

    if ( (chap == 0 && !novel.prologue) || chap < 0 || chap > novel.numChapters ) {
      throw new utils.HttpError("Chapter not found", 404);
    }

    req.chapter = await Chapter.findOne(novel.chapters[chap].ref);

    assert(req.chapter, "Error while fetching chapter");

    next();
  } catch(err) {
    next(err);
  }
});

router.get('/:chapter(\\d+)/', (req, res, next) => {
  try {
    viewcounter.addView(req);
    res.render('pages/novel/chapter', {req, novel: req.novel, chapter: req.chapter});
  } catch(err) {
    next(err);
  }
});

router.get('/:chapter(\\d+)/edit',utils.canTouchNovel, (req, res, next) => {
  try {
    res.render('pages/novel/addchapter', {req, novel: req.novel, chapter: req.chapter, val, message: "", action:"edit"});  
  } catch(err) {
    next(err);
  }
});


router.post('/:chapter(\\d+)/edit', utils.canTouchNovel, async (req, res) => {
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
    res.render('pages/novel/addchapter', {req, novel: novel || {}, chapter: req.chapter, val, message: err.message, action: "edit"});
  }
});

router.all('/:chapter(\\d+)/delete', utils.canTouchNovel, async (req, res, next) => {
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
  }

  free();
});

module.exports = router;