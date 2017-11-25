const utils = require("../utils");
const router = require("express-promise-router")();
//const limiter = require("mongo-limiter");
const val = require("validator");
const {categories} = require("../../models");

router.get('/edit', utils.canTouchNovel, async (req, res) => {
  res.render('pages/novel/addnovel', {novel: req.novel, categories, action:'edit'});
});

router.post('/edit', utils.canTouchNovel, async (req, res) => {
  try {
    var description = val.validateDescription(req.body.novelDescription);
    var cats = val.validateCategories([req.body.novelCategory, req.body.novelCategory2], categories).map(x => x.shorthand);

    await req.novel.update({description, categories: cats});

    res.redirect(req.novel.getLink());
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addnovel', {novel: req.novel, categories, message: err.message, action:'edit'});
  }
});

module.exports = router;
