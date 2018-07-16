import {Category} from '../../models';

export async function loadCategories(req: Express.Request, res, next) {
  if (req.categories) {
    next();
  }

  req.categories = await Category.list();

  next();
}
