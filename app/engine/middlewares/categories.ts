import {Category} from '../../models';

async function loadCategories(req, res, next) {
  if (req.categories) {
    next();
  }

  req.categories = Category;

  next();
}

module.exports = {
  loadCategories
};
