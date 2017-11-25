const {categories} = require("../../models");

async function loadCategories(req, res, next) {
  if (req.categories) {
    next();
  }

  req.categories = categories;

  next();
}

module.exports = {
  loadCategories
};
