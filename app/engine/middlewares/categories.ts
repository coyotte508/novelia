import {Category} from '../../models';

export async function loadCategories(req, res, next) {
  if (req.categories) {
    next();
  }

  req.categories = Category;

  next();
}
