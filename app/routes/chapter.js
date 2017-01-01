const val = require("validator");
const co = require("co");
const assert = require("assert");
const Novel = require("../models/novel");
const User = require("../models/user");
const Chapter = require("../models/chapter");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("../../config/limits");

router.get('/nv/:novel/addchapter', utils.isLoggedIn, (req, res, next) => {
  co(function*() {
    var novel = yield Novel.findOne({slug: req.params.novel.toLowerCase()}, "author title numChapters prologue");
    assert404(res, novel, "Novel not found");
    assert(novel.author == req.user.id, "You can only change your own novels");

    res.render('pages/addchapter', {req, novel, message: ""});  
  }).catch((err) => next(err));
});

router.post('/nv/:novel/addchapter', utils.isLoggedIn, (req, res, next) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    var novel;
    var prologue = req.body.options.split(",").indexOf("prologue") != -1;
    try {
      novel = yield Novel.findOne({slug: req.params.novel.toLowerCase()}, "author title numChapters prologue");
      assert404(res, novel, "Novel not found");
      assert(novel.author == req.user.id, "You can only change your own novels");
      assert(!(novel.prologue && prologue), "There is already a prologue, you can't add another one.");

      var title = val.validateTitle(req.body.chapterTitle);
      var content = val.validateChapter(req.body.chapterContent);
      var authorNote = val.validateDescription(req.body.authorNote);

      if (yield limiter.attempt(req.user.id, 'addchapter', title)) {
        throw new Error(`You can only add ${limiter.limits().addchapter.limit} chapters per day`);
      }

      var chapter = new Chapter();
      chapter.title = title;
      chapter.content = content;
      chapter.authorNote = authorNote;
      chapter.novel = {ref: novel.id};
      chapter.number = prologue ? 0 : novel.numChapters;

      yield chapter.save();

      if (prologue) {
        yield novel.update({prologue: true, $set: {"chapters.0": {title: title, ref: chapter.id}}});
      } else {
        yield novel.update({$inc: {"numChapters": 1}, $push: {"chapters": {title: title, ref: chapter.id}}});
      }

      console.log("saved chapter");

      // req.flash('addnovelMessage', "New novel added (sort of)");
      res.redirect(novel.getLink() + "/" + (prologue ? 0 : novel.numChapters + 1));
    } catch (err) {
      res.render('pages/addchapter', {req, novel: novel || {}, message: err.message});
    }
  }).catch((err) => next(err));
});

router.get('/nv/:novel/:chapter(\\d+)/', (req, res, next) => {
  co(function*() {
    var novel = yield Novel.findOne({slug: req.params.novel.toLowerCase()});
    assert404(res, novel, "Novel not found");
    var chap = parseInt(req.params.chapter);
    assert404(res, chap >= 0 && chap <= novel.chapters.length && novel.chapters[chap].title, "Chapter not found");
    var chapter = yield Chapter.findOne(novel.chapters[chap].ref);
    assert(chapter, "Error while fetching chapter");

    res.render('pages/chapter', {req, novel, chapter});
  }).catch((err) => next(err));
});

module.exports = router;