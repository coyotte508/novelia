import * as utils from '../utils';
import {Novel, User} from '../../models';
import Router from 'express-promise-router';
import {loadCategories} from "../../engine/middlewares/categories";

const router = Router();

import add from "./add";

router.use("/", add);

router.use(loadCategories);

router.param('novel', async (req, res, next, lnovel) => {
  const novel = await Novel.findOne({slug: lnovel.toLowerCase()});

  if (!novel) {
    const message = lnovel[0] === lnovel[0].toLowerCase() ? "Page not found" : "Novel not found";
    throw new utils.HttpError(message, 404);
  }

  req.novel = novel;

  req.categoryName = (cat: string) => req.categories.find(x => x.shorthand === cat).name;

  next();
});

router.get('/:novel', async (req, res) => {
  const novel = req.novel;
  let author;

  await Promise.all([
    novel.loadChapters(),
    User.findById(novel.author.ref, User.basics())
  ]).then((values) => {
    author = values[1];
  });

  res.render('pages/novel/novel', {req, novel, author});
});

import edit from './edit';
import editImage from './edit-image';
import _delete from './delete';
import visibility from './visibility';
import social from './social';
import chapter from '../chapter/chapter';

router.use("/:novel/", edit);
router.use("/:novel/", editImage);
router.use("/:novel/", _delete);
router.use("/:novel/", visibility);
router.use("/:novel/", social);
router.use("/:novel/", chapter);

export default router;
