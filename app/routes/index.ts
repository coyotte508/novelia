import Router from 'express-promise-router';

import {loadCategories} from "../engine/middlewares/categories";
import Chapter from '../models/chapter';

import admin from './admin/admin';
import auth from './auth';
import user from './user/user';
import category from './category';
import comment from './comment/comment';
import novel from './novel/novel';

const router = Router();

router.get("/", loadCategories, async (req, res) => {
  const latest = await Chapter.latestUpdates();
  // console.log(latest);
  res.render("pages/index", {error: null, latest, req});
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
