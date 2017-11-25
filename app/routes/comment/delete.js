const utils = require("../utils");
const router = require("express-promise-router")();
const limiter = require("mongo-limiter");

router.get('/delete', utils.canTouchComment, async (req, res) => {
  limiter.action(req.user.id, "deletecomment", {author: req.comment.author.link, type: req.comment.sourceType, source: req.comment.source});
  req.comment.remove();
  res.redirect('back');
});

module.exports = router;
