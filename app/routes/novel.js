const val = require("validator");
const co = require("co");
const Novel = require("../models/novel");
const User = require("../models/user");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("../../config/limits");

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
      novel.author = req.user.id;

      yield novel.save();
      yield req.user.update({$push: {"novels": {title: title, ref: novel.id, slug: novel.classySlug()}}});

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

    var author = yield User.findById(novel.author); 

    res.render('pages/novel', {req, novel, author});
  }).catch((err) => next(err));
});

router.get('/:novel/edit', utils.isLoggedIn, (req, res, next) => {
  co(function*() {
    var novel = req.novel;
    utils.assert403(novel.author == req.user.id, "You can only change your own novels");

    res.render('pages/editnovel', {req, novel, message: ""});
  }).catch((err) => next(err));
});

router.post('/:novel/edit', utils.isLoggedIn, (req, res) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    try {
      var novel = req.novel;
      utils.assert403(novel.author == req.user.id, "You can only change your own novels");
      var description = val.validateDescription(req.body.novelDescription);

      yield novel.update({description});

      res.redirect(novel.getLink());
    } catch (err) {
      res.status(err.statusCode || 500);
      res.render('pages/editnovel', {req, novel, message: err.message});
    }
  });
});

module.exports = router;