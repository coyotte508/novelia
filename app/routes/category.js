const router = require("express-promise-router")();
const Category = require("../models/category");
const Chapter = require("../models/chapter");

router.param('category', async function(req, res, next, category) {
  req.category = await Category.find(category);

  next();
});

router.get("/category/:category", async (req, res) => {
  let latest = await Chapter.latestUpdates({
    categories: req.category.shorthand
  });

  res.render("pages/category", {latest});
});

module.exports = router;