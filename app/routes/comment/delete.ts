import * as utils from '../utils';
import limiter from 'mongo-limiter';
import Router from 'express-promise-router';

const router = Router();

router.get('/delete', utils.canTouchComment, async (req, res) => {
  limiter.action(req.user.id, "deletecomment", {author: req.comment.author.link, type: req.comment.sourceType, source: req.comment.source});
  req.comment.remove();
  res.redirect('back');
});

export default router;
