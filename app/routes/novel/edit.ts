import * as utils from '../utils';
import val from '../../config/validator';

import Router from 'express-promise-router';

const router = Router();

router.get('/edit', utils.canTouchNovel, async (req, res) => {
  res.render('pages/novel/addnovel', {novel: req.novel, categories: req.categories, action: 'edit'});
});

router.post('/edit', utils.canTouchNovel, async (req, res) => {
  try {
    const description = val.validateDescription(req.body.novelDescription);
    const cats = val.validateCategories([req.body.novelCategory, req.body.novelCategory2], req.categories).map(x => x.shorthand);

    await req.novel.update({description, categories: cats});

    res.redirect(req.novel.link());
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addnovel', {novel: req.novel, categories: req.categories, message: err.message, action: 'edit'});
  }
});

export default router;
