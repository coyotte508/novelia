const val = require("validator");
const Novel = require("../models/novel");
const Chapter = require("../models/chapter");
const User = require("../models/user");
const utils = require("./utils");
const router = require("express").Router();
const limiter = require("mongo-limiter");
const locks = require("mongo-locks");
const categories = require("../models/category").list();

router.get('/addnovel', utils.isLoggedIn, (req, res) => {
  res.render('pages/addnovel', {req, message: "", categories, action:'add'});
});

router.post('/addnovel', utils.isLoggedIn, async (req, res) => {
  try {
    var title = val.validateTitle(req.body.novelTitle);
    var description = val.validateDescription(req.body.novelDescription);
    var cats = val.validateCategories([req.body.novelCategory, req.body.novelCategory2], categories).map(x => x.shorthand);

    if (!(await limiter.attempt(req.user.id, 'addnovel', title))) {
      throw new utils.HttpError(`You can only add ${limiter.limits().addnovel.limit} novels per day`, 403);
    }

    if ((await Novel.count({author: req.user.id}).limit(10)) >= 10) {
      throw new utils.HttpError("You can only have 10 novels at most.", 403);
    }

    var novel = new Novel();
    novel.title = title;
    novel.description = description;
    novel.author = {ref: req.user.id, name: req.user.displayName(), link: req.user.getLink()};
    novel.categories = cats;

    await novel.save();
    await req.user.update({$push: {"novels": {title, ref: novel.id, slug: novel.classySlug()}}});

    // req.flash('addnovelMessage', "New novel added (sort of)");
    res.redirect(novel.getLink());
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/addnovel', {req, message: err.message, categories, action:'add'});
  }
});

router.param('novel', async function(req, res, next, novel) {
  try {
    novel = await Novel.findOne({slug: novel.toLowerCase()});

    if (!novel) {
      throw new utils.HttpError("Novel not found", 404);
    }

    req.novel = novel;

    req.categoryName = cat => categories.find(x => x.shorthand == cat).name;

    next();
  } catch(err) {
    next(err);
  }
});

router.get('/:novel', async (req, res, next) => {
  try {
    var novel = req.novel;
    var author;

    await Promise.all([
      req.novel.getViews(),
      User.findById(novel.author.ref, User.basics())
    ]).then((values) => {
      author = values[1];
    }); 

    res.render('pages/novel', {req, novel, author});
  } catch(err) { 
    next(err); 
  }
});

router.get('/:novel/edit', utils.canTouchNovel, (req, res, next) => {
  try {
    res.render('pages/addnovel', {req, novel: req.novel, categories, val, message: "", action:'edit'});
  } catch(err) {
    next(err);
  }
});

router.post('/:novel/edit', utils.canTouchNovel, async (req, res) => {
  try {
    var description = val.validateDescription(req.body.novelDescription);
    var cats = val.validateCategories([req.body.novelCategory, req.body.novelCategory2], categories).map(x => x.shorthand);

    await req.novel.update({description, categories: cats});

    res.redirect(req.novel.getLink());
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/addnovel', {req, novel: req.novel, categories, val, message: err.message, action:'edit'});
  }
});

router.all('/:novel/delete', utils.canTouchNovel, async (req, res, next) => {
  try {
    var novel = req.novel;
    utils.assert403(novel.numChapters == 0, "You can only delete empty novels");

    limiter.action(req.user.id, "delnovel", novel.title);

    //not using req.user since admin may in the future be able to delete others' novels
    await User.where({_id: novel.author.ref}).update({$pull: {"novels": {ref: novel.id}}}).exec();

    if (novel.prologue) {
      Chapter.findOneAndRemove(novel.chapters[0].ref).exec();
    }
    novel.remove();

    res.redirect("/profile");
  } catch(err) { 
    next(err); 
  }
});

router.all('/:novel/show', utils.canTouchNovel, async (req, res, next) => {
  try {
    var novel = req.novel;

    if (!(await limiter.attempt(req.user.id, 'shownovel', novel.title))) {
      throw new utils.HttpError(`You can only change your novels' viewable settings ${limiter.limits().shownovel.limit} times per hour`, 403);
    }

    Chapter.update({"novel.ref": novel.id}, {public: true}, {multi: true}).then();
    await novel.update({public: true});

    res.redirect(novel.getLink());
  } catch(err) {
    next(err);
  }
});

router.all('/:novel/hide', utils.canTouchNovel, async (req, res, next) => {
  try {
    var novel = req.novel;

    Chapter.update({"novel.ref": novel.id}, {public: false}, {multi: true}).then();
    await novel.update({public: false});

    res.redirect(novel.getLink());
  } catch(err) {
    next(err);
  }
});

router.all('/:novel/follow', utils.isLoggedIn, async (req, res, next) => {
  var free = () => {};
  try {
    var novel = req.novel;

    if (!(await limiter.attempt(req.user.id, 'follow', novel.title))) {
      throw new utils.HttpError(`You can only follow ${limiter.limits().follow.limit} times per hour`, 403);
    }

    try {
      free = await locks.lock("followNovel", req.user.id, novel.id);

      var user = await User.findById(req.user.id); //Force update after lock

      await user.followNovel({ref: novel.id, title: novel.title});
      await novel.update({$inc: {follows: 1}});
    } catch (err) {
      console.error(err);
    }

    res.redirect(req.get('Referrer') || novel.getLink());
  } catch(err) {
    next(err);
  }

  free();
});

router.all('/:novel/unfollow', utils.isLoggedIn, async (req, res, next) => {
  var free = () => {};
  try {
    var novel = req.novel;

    try {
      free = await locks.lock("followNovel", req.user.id, novel.id);

      var user = await User.findById(req.user.id); //Force update after lock

      await user.unfollowNovel(novel.id);
      await novel.update({$inc: {follows: -1}});
    } catch (err) {
      console.error(err);
    }

    res.redirect(req.get('Referrer') || novel.getLink());
  } catch(err) {
    next(err);
  }

  free();
});


router.use("/:novel/", require("./chapter"));

module.exports = router;