const utils = require("../utils");
const router = require("express-promise-router")();
const {Novel, User, categories} = require("../../models");

router.use("/", require("./add"));

router.param('novel', async function(req, res, next, lnovel) {
  let novel = await Novel.findOne({slug: lnovel.toLowerCase()});

  if (!novel) {
    let message = lnovel[0] == lnovel[0].toLowerCase() ? "Page not found" : "Novel not found";
    throw new utils.HttpError(message, 404);
  }

  req.novel = novel;

  req.categoryName = cat => categories.find(x => x.shorthand == cat).name;

  next();
});

router.get('/:novel', async (req, res) => {
  var novel = req.novel;
  var author;

  await Promise.all([
    novel.loadChapters(),
    User.findById(novel.author.ref, User.basics())
  ]).then((values) => {
    author = values[1];
  });

  res.render('pages/novel/novel', {req, novel, author});
});

router.use("/:novel/", require("./edit"));
router.use("/:novel/", require("./edit-image"));
router.use("/:novel/", require("./delete"));
router.use("/:novel/", require("./visibility"));
router.use("/:novel/", require("./social"));
router.use("/:novel/", require("../chapter/chapter"));

module.exports = router;
