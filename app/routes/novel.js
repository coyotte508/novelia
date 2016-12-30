const val = require("validator");
const co = require("co");
const Novel = require("../models/novel");
const User = require("../models/user");
const utils = require("./utils");
const router = require("express").Router();

router.get('/addnovel', utils.isLoggedIn, (req, res) => {
  res.render('pages/addnovel', {req, message: ""});
});

router.post('/addnovel', utils.isLoggedIn, (req, res) => {
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
      yield req.user.update({$push: {"novels": {title: title, ref: novel.id, slug: novel.classySlug()}}});

      console.log("saved");

      // req.flash('addnovelMessage', "New novel added (sort of)");
      res.redirect(novel.getLink());
    } catch (err) {
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