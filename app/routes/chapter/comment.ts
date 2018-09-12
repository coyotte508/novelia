import limiter from 'mongo-limiter';
import val from '../../config/validator';
import * as utils from '../utils';
import {Comment} from '../../models';
import Router from 'express-promise-router';

const router = Router();

/* Only make sure the user is logged in and then drop him down to comment */
router.get('/', utils.isLoggedIn, async (req, res) => {
  return res.redirect(req.chapter.getLink() + "#comment");
});

router.post('/', utils.isLoggedIn, async (req, res) => {
  const content = val.validateComment(req.body.commentBody);

  if (!(await limiter.attempt(req.user.id, 'comment', req.novel.title + "-" + req.chapter.number))) {
    throw new utils.HttpError(`You can only leave ${limiter.limits.comment.limit} comments per hour`, 403);
  }

  const comment = new Comment();
  comment.source = req.chapter.id;
  comment.sourceType = "chapter";
  comment.author = {ref: req.user.id, name: req.user.displayName, link: req.user.link};
  comment.text = content;

  await comment.save();

  res.redirect(req.body.back || 'back');
});

export default router;
