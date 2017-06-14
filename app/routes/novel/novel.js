const utils = require("../utils");
const router = require("express").Router();
const {Novel, User, categories} = require("../../models");

router.param('novel', async function(req, res, next, lnovel) {
  try {
    let novel = await Novel.findOne({slug: lnovel.toLowerCase()});

    if (!novel) {
      let message = lnovel[0] == lnovel[0].toLowerCase() ? "Page not found" : "Novel not found";
      throw new utils.HttpError(message, 404);
    }

    req.novel = novel;

    req.categoryName = cat => categories.find(x => x.shorthand == cat).name;

    next();
  } catch(err) {
    next(err);
  }
});

router.get('/:novel', async (req, res, next) => {
  try {
    var novel = req.novel;
    var author;

    await Promise.all([
      req.novel.getViews(),
      User.findById(novel.author.ref, User.basics())
    ]).then((values) => {
      author = values[1];
    });

    res.render('pages/novel/novel', {req, novel, author});
  } catch(err) {
    next(err);
  }
});

router.use("/", require("./add"));
router.use("/:novel/", require("./edit"));
router.use("/:novel/", require("./edit-image"));
router.use("/:novel/", require("./delete"));
router.use("/:novel/", require("./visibility"));
router.use("/:novel/", require("./social"));
router.use("/:novel/", require("../chapter/chapter"));

module.exports = router;
