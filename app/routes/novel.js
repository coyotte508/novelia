const val = require("validator");
const co = require("co");
const Novel = require("../models/novel");
const User = require("../models/user");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("../../config/limits")

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

      if (yield limiter.attempt(req.user.id, 'addnovel', req.body.novelTitle)) {
        throw new Error(`You can only add ${limiter.limits().addnovel.limit} novels per day`);
      }

      if ((yield Novel.count({author: req.user.id}).limit(10)) >= 10) {
        throw new Error("You can only have 10 novels at most.");
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
      console.log(err);
      res.render('pages/addnovel', {req, message: err.message});
    }
  });
});

router.get('/nv/:novel', (req, res, next) => {
  co(function*() {
    var novel = yield Novel.findOne({slug: req.params.novel.toLowerCase()});
    
    assert404(res, novel, "Novel not found");

    var author = yield User.findById(novel.author); 

    res.render('pages/novel', {req, novel, author});
  }).catch((err) => next(err));
});

module.exports = router;