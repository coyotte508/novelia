const val = require("validator");
const co = require("co");
const Novel = require("../models/novel");
const Chapter = require("../models/chapter");
const User = require("../models/user");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("../../config/limits");
const toMarkdown = require("to-markdown");

const mongoose = require("mongoose");

router.get('/addnovel', utils.isLoggedIn, (req, res) => {
  res.render('pages/addnovel', {req, message: ""});
});

router.post('/addnovel', utils.isLoggedIn, (req, res) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    try {
      var title = val.validateTitle(req.body.novelTitle);
      var description = val.validateDescription(req.body.novelDescription);

      if (yield limiter.attempt(req.user.id, 'addnovel', title)) {
        throw new utils.HttpError(`You can only add ${limiter.limits().addnovel.limit} novels per day`, 403);
      }

      if ((yield Novel.count({author: req.user.id}).limit(10)) >= 10) {
        throw new utils.HttpError("You can only have 10 novels at most.", 403);
      }

      var novel = new Novel();
      novel.title = title;
      novel.description = description;
      novel.author = {ref: req.user.id, name: req.user.displayName()};

      yield novel.save();
      yield req.user.update({$push: {"novels": {title, ref: novel.id, slug: novel.classySlug()}}});

      // req.flash('addnovelMessage', "New novel added (sort of)");
      res.redirect(novel.getLink());
    } catch (err) {
      res.status(err.statusCode || 500);
      res.render('pages/addnovel', {req, message: err.message});
    }
  });
});

router.param('novel', function(req, res, next, novel) {
  co(function*() {
    novel = yield Novel.findOne({slug: novel.toLowerCase()});

    if (!novel) {
      throw new utils.HttpError("Novel not found", 404);
    }

    req.novel = novel;

    next();
  }).catch(err => next(err));
});

router.get('/:novel', (req, res, next) => {
  co(function*() {
    var novel = req.novel;

    var author = yield User.findById(novel.author.ref); 

    res.render('pages/novel', {req, novel, author});
  }).catch((err) => next(err));
});

router.get('/:novel/edit', utils.canTouchNovel, (req, res, next) => {
  co(function*() {
    res.render('pages/editnovel', {req, novel: req.novel, toMarkdown, message: ""});
  }).catch((err) => next(err));
});

router.post('/:novel/edit', utils.canTouchNovel, (req, res) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    try {
      var description = val.validateDescription(req.body.novelDescription);

      yield novel.update({description});

      res.redirect(req.novel.getLink());
    } catch (err) {
      res.status(err.statusCode || 500);
      res.render('pages/editnovel', {req, novel: req.novel, toMarkdown, message: err.message});
    }
  });
});

router.all('/:novel/delete', utils.canTouchNovel, (req, res, next) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    var novel = req.novel;
    utils.assert403(novel.numChapters == 0, "You can only delete empty novels");

    //not using req.user since admin may in the future be able to delete others' novels
    yield User.findByIdAndUpdate(novel.author.ref, {$pull: {"novels": {ref: novel.id}}});

    if (novel.prologue) {
      Chapter.findOneAndRemove(novel.chapters[0].ref).exec();
    }
    novel.remove();

    res.redirect("/profile");
  }).catch(err => next(err));
});

router.all('/:novel/show', utils.canTouchNovel, (req, res, next) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    var novel = req.novel;

    yield novel.update({public: true});

    res.redirect(novel.getLink());
  }).catch(err => next(err));
});

router.all('/:novel/hide', utils.canTouchNovel, (req, res, next) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    var novel = req.novel;

    yield novel.update({public: false});

    res.redirect(novel.getLink());
  }).catch(err => next(err));
});

router.use("/:novel/", require("./chapter"));

module.exports = router;