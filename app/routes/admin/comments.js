const {Comment} = require("../../models");
const router = require("express-promise-router")();

router.get('/comments', async (req, res) => {
  let admin = req.user && req.user.isAdmin();
  let filter = admin ? {} : {public: true};

  let comments = await Comment.find(filter).sort({_id: -1}).limit(50);

  res.render('pages/comment/comments', {comments});
});

module.exports = router;
