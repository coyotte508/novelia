import Router from 'express-promise-router';

import {loadCategories} from "../engine/middlewares/categories";
import Chapter from '../models/chapter';

import admin from './admin/admin';
import auth from './auth';
import user from './user/user';
import category from './category';
import comment from './comment/comment';
import novel from './novel/novel';
import images from './images';

const router = Router();

router.get("/", loadCategories, async (req, res) => {
  const latest = await Chapter.latestUpdates();

  const [best1, best30] = await Promise.all([Chapter.best(1), Chapter.best(30)]);

  res.render("pages/index", {error: null, latest, req, todayBest: best1, monthlyBest: best30});
});

router.get("/contact", (req, res) => {
  res.render("pages/static/contact", {error: null, req});
});

const modules = [
  admin,
  auth,
  user,
  category,
  comment,
  /* Last because of catch-all */
  novel
];

/* Aggregate routers */

router.use('/images', images);
for (const mod of modules) {
  router.use("/", mod);
}

router.use(function errorHandler(err, req, res, next) {
  console.log(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.statusCode || 500);
  res.render('pages/technical/' + res.statusCode, { req, err });
});

export default router;
