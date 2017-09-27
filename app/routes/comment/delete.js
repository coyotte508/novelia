const utils = require("../utils");
const router = require("express").Router();
const limiter = require("mongo-limiter");
const {Comment} = require("../../models");

router.get('/delete', utils.canTouchComment, async (req, res, next) => {
  try {
    limiter.action(req.user.id, "deletecomment", {author: req.comment.author.link, type: req.comment.sourceType, source: req.comment.source});
    req.comment.remove();
    res.redirect('back');
  } catch(err) {
    next(err);
  }
});

module.exports = router;
