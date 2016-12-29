const val = require("validator");
const co = require("co");
const Novel = require("../models/novel");
const User = require("../models/user");
const utils = require("./utils");
const assert = require("assert");
const router = require("express").Router();

router.get('/newnovel', utils.isLoggedIn, (req, res) => {
  res.render('pages/newnovel', {req, message: req.flash('newnovelMessage')});
});

router.post('/newnovel', utils.isLoggedIn, (req, res) => {
  /* Todo: check if user can post new novel */
  co(function*() {
    try {
      var title = val.validateTitle(req.body.novelTitle);
      var description = val.validateDescription(req.body.novelDescription);

      var novel = new Novel();
      novel.title = title;
      novel.description = description;
      novel.author = req.user.id;

      yield novel.save();
      yield req.user.update({$push: {"novels": {title: title, id: novel.id, slug: novel.classySlug()}}});

      console.log("saved");

      // req.flash('newnovelMessage', "New novel added (sort of)");
      res.redirect('/nv/'+novel.classySlug());
    } catch (err) {
      console.log(err);

      res.render('pages/newnovel', {req, message: err.message});
    }
  });
});

router.get('/nv/:novel', (req, res) => {
  co(function*() {
    var novel, author;
    try {
      novel = yield Novel.findOne({slug: req.params.novel.toLowerCase()});
      author = yield User.findById(novel.author); 

      assert(novel, "Novel not found");

      res.render('pages/novel', {req, novel, author, message: ""});
    } catch(err) {
      console.log(err);
      novel = novel || {}, author = author || {};
      console.log(novel, author);
      res.render('pages/novel', {req, novel, author, message: err.message});
    }
  });
});

module.exports = router;