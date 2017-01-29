const val = require("validator");
const co = require("co");
const assert = require("assert");
const Novel = require("../models/novel");
const User = require("../models/user");
const Chapter = require("../models/chapter");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("mongo-limiter");
const locks = require("mongo-locks");
const viewcounter = require("../engine/viewcounter");

router.get('/addchapter', utils.canTouchNovel, (req, res, next) => {
  co(function*() {
    res.render('pages/addchapter', {req, novel: req.novel, message: "", action:"add"});  
  }).catch((err) => next(err));
});

router.post('/addchapter', utils.canTouchNovel, (req, res, next) => {
  /* Todo: check if user can post new novel */
  var free = ()=>{};
  co(function*() {
    var novel = req.novel;
    var prologue = (req.body.options||"").split(",").indexOf("prologue") != -1;
    var number = prologue ? 0 : (novel.numChapters+1);
    try {
      if (!(yield limiter.possible(req.user.id, 'addchapter'))) {
        throw new utils.HttpError(`You can only add ${limiter.limits().addchapter.limit} chapters per day`, 403);
      }

      var title = val.validateTitle(req.body.chapterTitle || (""+number));
      var content = val.validateChapter(req.body.chapterContent);
      var authorNote = val.validateDescription(req.body.authorNote);

      free = yield locks.lock("major-novel-change", novel.id);
      
      novel = yield Novel.findById(novel.id); //force refresh
      utils.assert403(!(novel.prologue && prologue), "There is already a prologue, you can't add another one.");

      var chapter = new Chapter();
      chapter.title = title;
      chapter.content = content;
      chapter.authorNote = authorNote;
      chapter.novel = {ref: novel.id, title: novel.title};
      chapter.number = prologue ? 0 : (novel.numChapters+1);
      chapter.public = novel.public;

      yield chapter.save();

      if (prologue) {
        yield novel.update({prologue: true, "chapters.0": {title, ref: chapter.id}});
      } else {
        yield novel.update({$inc: {"numChapters": 1}, $push: {"chapters": {title, ref: chapter.id}}});
      }

      limiter.action(req.user.id, "addchapter", {title, novel: novel.title});

      res.redirect(novel.getLink() + "/" + (prologue ? 0 : novel.numChapters + 1));
    } catch (err) {
      res.status(err.statusCode || 500);
      res.render('pages/addchapter', {req, novel: novel || {}, message: err.message, action: "add"});
    }
  }).catch(next).then(() => free(), () => free());
});

router.param('chapter', function(req, res, next, chapterNum) {
  co(function*() {
    var novel = req.novel;
    var chap = parseInt(chapterNum);
    utils.assert404(chap >= 0 && chap <= novel.chapters.length && novel.chapters[chap].title, "Chapter not found");

    if ( (chap == 0 && !novel.prologue) || chap < 0 || chap > novel.numChapters ) {
      throw new utils.HttpError("Chapter not found", 404);
    }

    req.chapter = yield Chapter.findOne(novel.chapters[chap].ref);

    assert(req.chapter, "Error while fetching chapter");

    next();
  }).catch(err => next(err));
});

router.get('/:chapter(\\d+)/', (req, res, next) => {
  co(function*() {
    viewcounter.addView(req);
    res.render('pages/chapter', {req, novel: req.novel, chapter: req.chapter});
  }).catch((err) => next(err));
});

router.get('/:chapter(\\d+)/edit',utils.canTouchNovel, (req, res, next) => {
  co(function*() {
    res.render('pages/addchapter', {req, novel: req.novel, chapter: req.chapter, val, message: "", action:"edit"});  
  }).catch((err) => next(err));
});


router.post('/:chapter(\\d+)/edit', utils.canTouchNovel, (req, res, next) => {
  co(function*() {
    var novel = req.novel;
    try {
      var title = val.validateTitle(req.body.chapterTitle);
      var content = val.validateChapter(req.body.chapterContent);
      var authorNote = val.validateDescription(req.body.authorNote);

      yield req.chapter.update({title, content, authorNote});

      var setOptions = {};
      setOptions["chapters."+req.params.chapter + ".title"] = title;
      novel.update(setOptions).exec();

      res.redirect(novel.getLink() + "/" + req.params.chapter);
    } catch (err) {
      res.status(err.statusCode || 500);
      res.render('pages/addchapter', {req, novel: novel || {}, chapter: req.chapter, val, message: err.message, action: "edit"});
    }
  }).catch((err) => next(err));
});

router.all('/:chapter(\\d+)/delete', utils.canTouchNovel, (req, res, next) => {
  var free = ()=>{};
  co(function*() {
    free = yield locks.lock("major-novel-change", req.novel.id);
    var novel = yield(Novel.findById(req.novel.id)); //force refresh

    var num = req.params.chapter;
    var chapter = req.chapter;
    utils.assert403(novel.numChapters >= num, "You can only delete the last chapter");

    if (num == 0) {
      yield novel.update({$inc: {"totalViews": -chapter.views}, prologue: false, "chapters.0": null});
    } else {
      yield novel.update({$inc: {"numChapters": -1, "totalViews": -chapter.views}, $pull: {"chapters": {ref: chapter.id}}});
    }

    limiter.action(req.user.id, "delchapter", {num, title, novel: novel.title});

    chapter.remove();

    res.redirect(novel.getLink());
  }).catch(next).then(() => free (), () => free() );
});

module.exports = router;