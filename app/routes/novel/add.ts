import * as utils from '../utils';
import limiter from 'mongo-limiter';
import val from '../../config/validator';
import {Novel} from '../../models';

import Router from 'express-promise-router';

const router = Router();

router.get('/addnovel', utils.isLoggedIn, async (req, res) => {
  res.render('pages/novel/addnovel', {req, categories: req.categories, action: 'add'});
});

router.post('/addnovel', utils.isLoggedIn, async (req, res) => {
  try {
    const title = val.validateTitle(req.body.novelTitle);
    const description = val.validateDescription(req.body.novelDescription);
    const cats = val.validateCategories([req.body.novelCategory, req.body.novelCategory2], req.categories).map(x => x.shorthand);

    if (!(await limiter.attempt(req.user.id, 'addnovel', title))) {
      throw new utils.HttpError(`You can only add ${limiter.limits.addnovel.limit} novels per day`, 403);
    }

    if ((await Novel.count({"author.ref": req.user.id}).limit(10)) >= 10) {
      throw new utils.HttpError("You can only have 10 novels at most.", 403);
    }

    const novel = new Novel();
    novel.title = title;
    novel.description = description;
    novel.author = {ref: req.user.id, name: req.user.displayName, link: req.user.getLink()};
    novel.categories = cats;

    await novel.save();

    // req.flash('addnovelMessage', "New novel added (sort of)");
    res.redirect(novel.getLink());
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addnovel', {message: err.message, categories: req.categories, action: 'add'});
  }
});

export default router;
