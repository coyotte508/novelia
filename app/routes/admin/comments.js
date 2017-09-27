const {Comment} = require("../../models");
const router = require("express").Router();

router.get('/comments', async (req, res, next) => {
  try {
    let admin = req.user && req.user.isAdmin();
    let filter = admin ? {} : {public: true};

    let comments = await Comment.find(filter).sort({_id: -1}).limit(50);

    res.render('pages/comment/comments', {comments});
  } catch (err) {
    next(err);
  }
});

module.exports = router;
