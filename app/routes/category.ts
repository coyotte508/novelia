import Router from 'express-promise-router';
import {Category, Chapter} from '../models';

const router = Router();

router.param('category', async (req: Express.Request, res, next, category: string) => {
  req.category = await Category.find(category);

  next();
});

router.get("/category/:category", async (req, res) => {
  const latest = await Chapter.latestUpdates({
    categories: req.category.shorthand
  });

  res.render("pages/category", {latest});
});

export default router;
