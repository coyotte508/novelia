import Router from 'express-promise-router';
import {Category, Chapter, Novel} from '../models';
import {Request} from '../types';

const router = Router();

router.param('category', async (req: Request, res, next, category: string) => {
  req.category = await Category.find(category);

  next();
});

router.get("/category/:category", async (req, res) => {
  const latest = await Chapter.latestUpdates({
    categories: req.category.shorthand
  });
  const dailyTop = await Novel.dailyTop({
    categories: req.category.shorthand
  });

  res.render("pages/category", {latest, dailyTop});
});

export default router;
