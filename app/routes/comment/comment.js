const utils = require("../utils");
const router = require("express-promise-router")();
const {Comment} = require("../../models");

router.param('comment', async (req, res, next, commentId) => {
  req.comment = await Comment.findById(commentId);

  if (!req.comment) {
    throw new utils.HttpError('Comment not found', 404);
  }

  next();
});

router.use('/comment/:comment', require('./delete'));

module.exports = router;
