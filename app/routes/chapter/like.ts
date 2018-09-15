import limiter from 'mongo-limiter';
import * as utils from '../utils';
import Router from 'express-promise-router';
import { Like, DailyCount } from '../../models';
import { Request } from '../../types';

const router = Router();

router.all('/like', utils.isLoggedIn, async (req: Request, res) => {
  if (!(await limiter.attempt(req.user.id, 'like', req.novel.title))) {
    throw new utils.HttpError(`You can only like ${limiter.limits.like.limit} times per hour`, 403);
  }

  await Like.create({source: req.chapter.id, sourceType: "chapter", author: req.user._id});
  await Promise.all([
    req.chapter.update({$inc: {likes: 1}}),
    req.novel.update({$inc: {totalLikes: 1}}),
    DailyCount.add("like-novel", req.novel.id)
  ]);
  
  res.redirect(req.get('Referrer') || req.chapter.getLink());

  req.novel.adjustDailyLikes().catch(console.error);
});

router.all('/unlike', utils.isLoggedIn, async (req: Request, res) => {
  const result: any = await Like.remove({source: req.chapter.id, sourceType: "chapter", author: req.user._id});

  if (result.n > 0) {
    await Promise.all([
      req.chapter.update({$inc: {likes: -1}}),
      req.novel.update({$inc: {totalLikes: -1}}),
      DailyCount.add("unlike-novel", req.novel.id)
    ]);
  }
  
  res.redirect(req.get('Referrer') || req.chapter.getLink());

  req.novel.adjustDailyLikes().catch(console.error);
});

export default router;
