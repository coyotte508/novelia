const {Novel} = require("../../models");
const router = require("express-promise-router")();

router.get('/novels', async (req, res) => {
  let admin = req.user && req.user.isAdmin();
  let filter = admin ? {} : {public: true};

  let novels = await Novel.find(filter, "title latestChapter author numChapters").sort({_id: -1}).limit(50);

  res.render('pages/novel/novels', {novels});
});

module.exports = router;
