const utils = require("../utils");
const router = require("express").Router();
const {Comment} = require("../../models");

router.param('comment', async (req, res, next, commentId) => {
  try {
    req.comment = await Comment.findById(commentId);

    if (!req.comment) {
      throw new utils.HttpError('Comment not found', 404);
    }

    next();
  } catch(err) {
    next(err);
  }
});

router.use('/comment/:comment', require('./delete'));

module.exports = router;
