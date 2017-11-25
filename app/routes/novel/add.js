const utils = require("../utils");
const router = require("express-promise-router")();
const limiter = require("mongo-limiter");
const val = require("validator");
const {Novel, categories} = require("../../models");

router.get('/addnovel', utils.isLoggedIn, async (req, res) => {
  res.render('pages/novel/addnovel', {req,categories, action:'add'});
});

router.post('/addnovel', utils.isLoggedIn, async (req, res) => {
  try {
    var title = val.validateTitle(req.body.novelTitle);
    var description = val.validateDescription(req.body.novelDescription);
    var cats = val.validateCategories([req.body.novelCategory, req.body.novelCategory2], categories).map(x => x.shorthand);

    if (!(await limiter.attempt(req.user.id, 'addnovel', title))) {
      throw new utils.HttpError(`You can only add ${limiter.limits().addnovel.limit} novels per day`, 403);
    }

    if ((await Novel.count({"author.ref": req.user.id}).limit(10)) >= 10) {
      throw new utils.HttpError("You can only have 10 novels at most.", 403);
    }

    var novel = new Novel();
    novel.title = title;
    novel.description = description;
    novel.author = {ref: req.user.id, name: req.user.displayName(), link: req.user.getLink()};
    novel.categories = cats;

    await novel.save();

    // req.flash('addnovelMessage', "New novel added (sort of)");
    res.redirect(novel.getLink());
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addnovel', {message: err.message, categories, action:'add'});
  }
});

module.exports = router;
