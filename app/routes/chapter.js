const val = require("validator");
const co = require("co");
const assert = require("assert");
const toMarkdown = require("to-markdown");
const Novel = require("../models/novel");
const User = require("../models/user");
const Chapter = require("../models/chapter");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("../../config/limits");

router.get('/addchapter', utils.isLoggedIn, (req, res, next) => {
  co(function*() {
    var novel = req.novel;

    utils.assert403(novel.author == req.user.id, "You can only change your own novels");

    res.render('pages/addchapter', {req, novel, message: ""});  
  }).catch((err) => next(err));
});

router.post('/addchapter', utils.isLoggedIn, (req, res, next) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    var novel = req.novel;
    var prologue = (req.body.options||"").split(",").indexOf("prologue") != -1;
    try {
      utils.assert403(novel.author == req.user.id, "You can only change your own novels");
      utils.assert403(!(novel.prologue && prologue), "There is already a prologue, you can't add another one.");

      var title = val.validateTitle(req.body.chapterTitle);
      var content = val.validateChapter(req.body.chapterContent);
      var authorNote = val.validateDescription(req.body.authorNote);

      if (yield limiter.attempt(req.user.id, 'addchapter', title)) {
        throw new utils.HttpError(`You can only add ${limiter.limits().addchapter.limit} chapters per day`, 403);
      }

      var chapter = new Chapter();
      chapter.title = title;
      chapter.content = content;
      chapter.authorNote = authorNote;
      chapter.novel = {ref: novel.id, title: novel.title};
      chapter.number = prologue ? 0 : (novel.numChapters+1);

      yield chapter.save();

      if (prologue) {
        yield novel.update({prologue: true, "chapters.0.title": title, "chapters.0.ref": chapter.id});
      } else {
        yield novel.update({$inc: {"numChapters": 1}, $push: {"chapters": {title, ref: chapter.id}}});
      }

      console.log("saved chapter");

      // req.flash('addnovelMessage', "New novel added (sort of)");
      res.redirect(novel.getLink() + "/" + (prologue ? 0 : novel.numChapters + 1));
    } catch (err) {
      res.status(err.statusCode || 500);
      res.render('pages/addchapter', {req, novel: novel || {}, message: err.message});
    }
  }).catch((err) => next(err));
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
    res.render('pages/chapter', {req, novel: req.novel, chapter: req.chapter});
  }).catch((err) => next(err));
});

router.get('/:chapter(\\d+)/edit', utils.isLoggedIn, (req, res, next) => {
  co(function*() {
    var novel = req.novel;

    utils.assert403(novel.author == req.user.id, "You can only change your own novels");

    res.render('pages/editchapter', {req, novel, chapter: req.chapter, toMarkdown, message: ""});  
  }).catch((err) => next(err));
});


router.post('/:chapter(\\d+)/edit', utils.isLoggedIn, (req, res, next) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    var novel = req.novel;
    try {
      utils.assert403(novel.author == req.user.id, "You can only change your own novels");

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
      res.render('pages/editchapter', {req, novel: novel || {}, chapter: req.chapter, toMarkdown, message: err.message});
    }
  }).catch((err) => next(err));
});

router.all('/:chapter(\\d+)/delete', utils.isLoggedIn, (req, res, next) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    var novel = req.novel;
    var num = req.params.chapter;
    var chapter = req.chapter;
    utils.assert403(novel.author == req.user.id, "You can only delete your own novels");
    utils.assert403(novel.numChapters >= num, "You can only delete the last chapter");

    if (req.params.chapter == 0) {
      yield novel.update({prologue: false, "chapters.0.title": null, "chapters.0.ref": null});
    } else {
      yield novel.update({$inc: {"numChapters": -1}, $pull: {"chapters": {ref: chapter.id}}});
    }

    chapter.remove();

    res.redirect(novel.getLink());
  }).catch(err => next(err));
});

module.exports = router;