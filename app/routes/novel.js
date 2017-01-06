const val = require("validator");
const co = require("co");
const Novel = require("../models/novel");
const Chapter = require("../models/chapter");
const User = require("../models/user");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("mongo-limiter");
const locks = require("mongo-locks");

const mongoose = require("mongoose");

router.get('/addnovel', utils.isLoggedIn, (req, res) => {
  res.render('pages/addnovel', {req, message: ""});
});

router.post('/addnovel', utils.isLoggedIn, (req, res) => {
  co(function*() {
    try {
      var title = val.validateTitle(req.body.novelTitle);
      var description = val.validateDescription(req.body.novelDescription);

      if (!(yield limiter.attempt(req.user.id, 'addnovel', title))) {
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

    var author = yield User.findById(novel.author.ref, User.basics()); 

    res.render('pages/novel', {req, novel, author});
  }).catch((err) => next(err));
});

router.get('/:novel/edit', utils.canTouchNovel, (req, res, next) => {
  co(function*() {
    res.render('pages/editnovel', {req, novel: req.novel, val, message: ""});
  }).catch((err) => next(err));
});

router.post('/:novel/edit', utils.canTouchNovel, (req, res) => {
  co(function*() {
    try {
      var description = val.validateDescription(req.body.novelDescription);

      yield novel.update({description});

      res.redirect(req.novel.getLink());
    } catch (err) {
      res.status(err.statusCode || 500);
      res.render('pages/editnovel', {req, novel: req.novel, val, message: err.message});
    }
  });
});

router.all('/:novel/delete', utils.canTouchNovel, (req, res, next) => {
  co(function*() {
    var novel = req.novel;
    utils.assert403(novel.numChapters == 0, "You can only delete empty novels");

    //not using req.user since admin may in the future be able to delete others' novels
    yield User.where({_id: novel.author.ref}).update({$pull: {"novels": {ref: novel.id}}}).exec();

    if (novel.prologue) {
      Chapter.findOneAndRemove(novel.chapters[0].ref).exec();
    }
    novel.remove();

    res.redirect("/profile");
  }).catch(next);
});

router.all('/:novel/show', utils.canTouchNovel, (req, res, next) => {
  co(function*() {
    var novel = req.novel;

    if (!(yield limiter.attempt(req.user.id, 'shownovel', novel.title))) {
      throw new utils.HttpError(`You can only change your novels' viewable settings ${limiter.limits().shownovel.limit} times per hour`, 403);
    }

    Chapter.update({"novel.ref": novel.id}, {public: true}, {multi: true}).then();
    yield novel.update({public: true});

    res.redirect(novel.getLink());
  }).catch(err => next(err));
});

router.all('/:novel/hide', utils.canTouchNovel, (req, res, next) => {
  co(function*() {
    var novel = req.novel;

    Chapter.update({"novel.ref": novel.id}, {public: false}, {multi: true}).then();
    yield novel.update({public: false});

    res.redirect(novel.getLink());
  }).catch(err => next(err));
});

router.all('/:novel/like', utils.isLoggedIn, (req, res, next) => {
  var free = () => {};
  co(function*() {
    var novel = req.novel;

    if (!(yield limiter.attempt(req.user.id, 'like', novel.title))) {
      throw new utils.HttpError(`You can only like ${limiter.limits().like.limit} times per hour`, 403);
    }

    try {
      free = yield locks.lock("likeNovel", req.user.id, novel.id);

      var user = yield User.findById(req.user.id); //Force update after lock

      yield user.likeNovel({ref: novel.id, title: novel.title});
      yield novel.update({$inc: {likes: 1}});
    } catch (err) {
      console.error(err);
    }

    res.redirect(req.get('Referrer') || novel.getLink());
  }).catch(next).then(() => free(), () => free());
});

router.all('/:novel/unlike', utils.isLoggedIn, (req, res, next) => {
  var free = () => {};
  co(function*() {
    var novel = req.novel;

    try {
      free = yield locks.lock("likeNovel", req.user.id, novel.id);

      var user = yield User.findById(req.user.id); //Force update after lock

      yield user.unlikeNovel(novel.id);
      yield novel.update({$inc: {likes: -1}});
    } catch (err) {
      console.error(err);
    }

    res.redirect(req.get('Referrer') || novel.getLink());
  }).catch(next).then(() => free(), () => free());
});

router.all('/:novel/follow', utils.isLoggedIn, (req, res, next) => {
  var free = () => {};
  co(function*() {
    var novel = req.novel;

    if (!(yield limiter.attempt(req.user.id, 'follow', novel.title))) {
      throw new utils.HttpError(`You can only follow ${limiter.limits().follow.limit} times per hour`, 403);
    }

    try {
      free = yield locks.lock("followNovel", req.user.id, novel.id);

      var user = yield User.findById(req.user.id); //Force update after lock

      yield user.followNovel({ref: novel.id, title: novel.title});
      yield novel.update({$inc: {follows: 1}});
    } catch (err) {
      console.error(err);
    }

    res.redirect(req.get('Referrer') || novel.getLink());
  }).catch(next).then(() => free(), () => free());
});

router.all('/:novel/unfollow', utils.isLoggedIn, (req, res, next) => {
  var free = () => {};
  co(function*() {
    var novel = req.novel;

    try {
      free = yield locks.lock("followNovel", req.user.id, novel.id);

      var user = yield User.findById(req.user.id); //Force update after lock

      yield user.unfollowNovel(novel.id);
      yield novel.update({$inc: {follows: -1}});
    } catch (err) {
      console.error(err);
    }

    res.redirect(req.get('Referrer') || novel.getLink());
  }).catch(next).then(() => free(), () => free());
});


router.use("/:novel/", require("./chapter"));

module.exports = router;