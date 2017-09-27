const limiter = require("mongo-limiter");
const val = require("validator");
const utils = require("../utils");
const router = require("express").Router();
const {Comment} = require("../../models");

/* Only make sure the user is logged in and then drop him down to comment */
router.get('/', utils.isLoggedIn, (req, res, next) => {
  try {
    return res.redirect(req.chapter.getLink() + "#comment");
  } catch(err) {
    next(err);
  }
});

router.post('/', utils.isLoggedIn, async (req, res, next) => {
  try {
    var content = val.validateComment(req.body.commentBody);

    if (!(await limiter.attempt(req.user.id, 'comment', req.novel.title + "-" + req.chapter.number))) {
      throw new utils.HttpError(`You can only leave ${limiter.limits().comment.limit} comments per hour`, 403);
    }

    var comment = new Comment();
    comment.source = req.chapter.id;
    comment.sourceType = "chapter";
    comment.author = {ref: req.user.id, name: req.user.displayName(), link: req.user.getLink()};
    comment.text = content;

    await comment.save();

    res.redirect(req.body.back || 'back');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
