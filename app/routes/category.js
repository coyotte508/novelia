const router = require("express").Router();
const Category = require("../models/category");
const Chapter = require("../models/chapter");

router.param('category', async function(req, res, next, category) {
  try {
    req.category = await Category.find(category);

    next();
  } catch(err) {
    next(err);
  }
});

router.get("/category/:category", async (req, res, next) => {
  try {
    let latest = await Chapter.latestUpdates({
      categories: req.category.shorthand
    });

    res.render("pages/category", {req, latest});
  } catch (err) {
    next(err);
  }
});

module.exports = router;