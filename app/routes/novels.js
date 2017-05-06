const Novel = require("../models/novel");
const router = require("express").Router();

router.get('/novels', async (req, res, next) => {
  try {
    let admin = req.user && req.user.isAdmin();
    let filter = admin ? {} : {public: true};

    let novels = await Novel.find(filter, "title latestChapter author numChapters").sort({_id: -1}).limit(50);

    res.render('pages/novel/novels', {novels});
  } catch (err) {
    next(err);
  }
});

module.exports = router;